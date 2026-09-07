<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\HonorDetail;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Honor Engine per ARSITEKTUR.md section 6 / FLOW.md section 5.
 *
 * Formula: gross = rate_snapshot x volume; net = gross - tax - deduction.
 * Deterministic: same input always yields the same output. The rate
 * used is snapshotted onto honor_details so later master-rate changes
 * never alter historical transactions (ERD.md section 6 / BR-09).
 */
class HonorCalculationService
{
    public function __construct(private readonly BudgetService $budgetService) {}

    /**
     * @param  array<int, array{employee_id: int, honor_type_id: int, volume: int, tax_amount?: int, deduction_amount?: int, notes?: string|null}>  $items
     * @return array{items: Collection<int, HonorDetail>, gross_amount: int, tax_amount: int, deduction_amount: int, net_amount: int}
     */
    public function generateForActivity(Activity $activity, array $items): array
    {
        if (! in_array($activity->status, [Activity::DRAFT, Activity::REJECTED], true)) {
            throw new BusinessValidationException(
                'status',
                'Honor hanya dapat dihitung ulang selama kegiatan berstatus DRAFT/REJECTED. Data honor yang sudah disetujui bersifat final (financial snapshot).',
            );
        }

        return DB::transaction(function () use ($activity, $items) {
            $details = collect($items)->map(fn (array $item) => $this->upsertLine($activity, $item));

            $this->budgetService->recalculateCommitted($activity);

            return [
                'items' => $details,
                'gross_amount' => (int) $details->sum('gross_amount'),
                'tax_amount' => (int) $details->sum('tax_amount'),
                'deduction_amount' => (int) $details->sum('deduction_amount'),
                'net_amount' => (int) $details->sum('net_amount'),
            ];
        });
    }

    /**
     * @param  array{employee_id: int, honor_type_id: int, volume: int, tax_amount?: int, deduction_amount?: int, notes?: string|null}  $item
     */
    private function upsertLine(Activity $activity, array $item): HonorDetail
    {
        $member = $activity->members()->where('employee_id', $item['employee_id'])->first();

        if (! $member) {
            throw new BusinessValidationException(
                'employee_id',
                'Pegawai belum ditambahkan sebagai peserta kegiatan ini.',
            );
        }

        if (! $member->employee->isActive()) {
            throw new BusinessValidationException('employee_id', 'Pegawai tidak aktif.');
        }

        $volume = (int) $item['volume'];

        if ($volume <= 0) {
            throw new BusinessValidationException('volume', 'Volume harus lebih besar dari 0.');
        }

        /** @var HonorType|null $honorType */
        $honorType = HonorType::find($item['honor_type_id']);

        if (! $honorType || $honorType->status !== 'active') {
            throw new BusinessValidationException('honor_type_id', 'Jenis honor tidak aktif atau tidak ditemukan.');
        }

        $rate = HonorRate::query()
            ->activeFor($honorType->id, $activity->start_date->toDateString(), $activity->unit_id)
            ->first();

        if (! $rate) {
            throw new BusinessValidationException(
                'honor_type_id',
                "Tarif aktif untuk jenis honor \"{$honorType->name}\" tidak ditemukan pada periode kegiatan ini.",
            );
        }

        $tax = (int) ($item['tax_amount'] ?? 0);
        $deduction = (int) ($item['deduction_amount'] ?? 0);
        $gross = $rate->rate * $volume;
        $net = $gross - $tax - $deduction;

        if ($net < 0) {
            throw new BusinessValidationException('deduction_amount', 'Potongan tidak boleh melebihi honor kotor.');
        }

        return HonorDetail::updateOrCreate(
            ['activity_member_id' => $member->id, 'honor_type_id' => $honorType->id],
            [
                'activity_id' => $activity->id,
                'employee_id' => $member->employee_id,
                'rate_snapshot' => $rate->rate,
                'volume' => $volume,
                'unit_snapshot' => $honorType->unit,
                'gross_amount' => $gross,
                'tax_amount' => $tax,
                'deduction_amount' => $deduction,
                'net_amount' => $net,
                'notes' => $item['notes'] ?? null,
            ],
        );
    }
}
