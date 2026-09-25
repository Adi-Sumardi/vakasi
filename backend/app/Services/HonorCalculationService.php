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
     * @param  array<int, array{activity_member_id?: int|null, employee_id?: int|null, honor_type_id: int, volume: int, tax_amount?: int, deduction_amount?: int, notes?: string|null}>  $items
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

        $items = $this->resolveMembers($activity, $items);
        $this->assertNoDuplicateLines($items);

        return DB::transaction(function () use ($activity, $items) {
            $details = collect($items)
                ->map(fn (array $item) => $this->upsertLine($activity, $item))
                ->each->load(['employee', 'honorType', 'activityMember']);

            // A recalculation replaces the activity's honor set, it does
            // not merge into it. Without this, a line dropped from the
            // payload survived in honor_details, so the response total
            // (summed from $items) silently disagreed with what
            // BudgetService and PaymentService read back from the table.
            $activity->honorDetails()
                ->whereNotIn('id', $details->pluck('id'))
                ->delete();

            $activity->unsetRelation('honorDetails');

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
     * Two lines keyed on the same (member, honor type) pair would make
     * the second silently overwrite the first via updateOrCreate, and the
     * returned total would then double-count a line that exists only
     * once in the table.
     *
     * @param  array<int, array{activity_member_id: int, honor_type_id: int}>  $items
     */
    private function assertNoDuplicateLines(array $items): void
    {
        $keys = collect($items)->map(fn (array $item) => $item['activity_member_id'].':'.$item['honor_type_id']);

        if ($keys->count() !== $keys->unique()->count()) {
            throw new BusinessValidationException(
                'items',
                'Terdapat baris honor ganda untuk kombinasi peserta dan jenis honor yang sama.',
            );
        }
    }

    /**
     * Resolves every line to the activity_members row it pays. A line
     * given only an employee_id is accepted when that employee holds a
     * single role here; with several roles the caller must say which,
     * otherwise the honor would be booked against an arbitrary role.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function resolveMembers(Activity $activity, array $items): array
    {
        $members = $activity->members()->get();

        return array_map(function (array $item) use ($members) {
            if (! empty($item['activity_member_id'])) {
                $member = $members->firstWhere('id', (int) $item['activity_member_id']);

                if (! $member) {
                    throw new BusinessValidationException('activity_member_id', 'Peserta tidak terdaftar pada kegiatan ini.');
                }

                return ['activity_member_id' => $member->id] + $item;
            }

            $candidates = $members->where('employee_id', (int) $item['employee_id']);

            if ($candidates->isEmpty()) {
                throw new BusinessValidationException(
                    'employee_id',
                    'Pegawai belum ditambahkan sebagai peserta kegiatan ini.',
                );
            }

            if ($candidates->count() > 1) {
                throw new BusinessValidationException(
                    'activity_member_id',
                    'Pegawai memiliki lebih dari satu peran pada kegiatan ini; tentukan peran (activity_member_id) untuk setiap baris honor.',
                );
            }

            return ['activity_member_id' => $candidates->first()->id] + $item;
        }, $items);
    }

    /**
     * @param  array{activity_member_id: int, honor_type_id: int, volume: int, tax_amount?: int, deduction_amount?: int, notes?: string|null}  $item
     */
    private function upsertLine(Activity $activity, array $item): HonorDetail
    {
        $member = $activity->members()->with('employee')->findOrFail($item['activity_member_id']);

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
                'rate_decree_number_snapshot' => $rate->decree_number,
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
