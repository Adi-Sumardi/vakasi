<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\HonorDetail;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * CSV exports behind "Laporan & Export". Semicolon-separated with a
 * UTF-8 BOM, which is what Excel in an Indonesian locale opens straight
 * into columns. Amounts are plain integers so they stay summable.
 */
class ReportExportService
{
    public const TYPES = ['kegiatan', 'honor', 'anggaran', 'pencairan'];

    private const STATUS_LABEL = [
        'draft' => 'Draft',
        'submitted' => 'Menunggu Approval',
        'rejected' => 'Ditolak',
        'approved' => 'Disetujui',
    ];

    private const DISBURSEMENT_LABEL = [
        Activity::DISBURSEMENT_NOT_SENT => 'Belum terkirim',
        Activity::DISBURSEMENT_WAITING => 'Menunggu SDM',
        Activity::DISBURSEMENT_PROCESSING => 'Diproses',
        Activity::DISBURSEMENT_PAID => 'Dibayar',
        Activity::DISBURSEMENT_REJECTED => 'Ditolak SDM',
    ];

    /**
     * @param  array<string, mixed>  $filters
     */
    public function csv(string $type, array $filters, User $user): string
    {
        [$header, $rows] = match ($type) {
            'kegiatan' => $this->activities($filters, $user),
            'honor' => $this->honors($filters, $user),
            'anggaran' => $this->budget($filters, $user),
            'pencairan' => $this->disbursements($filters, $user),
        };

        $out = fopen('php://temp', 'r+');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, $header, ';', '"', '');

        foreach ($rows as $row) {
            fputcsv($out, $row, ';', '"', '');
        }

        rewind($out);
        $csv = stream_get_contents($out);
        fclose($out);

        return $csv;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<Activity>
     */
    private function activityQuery(array $filters, User $user): Builder
    {
        return Activity::query()
            ->visibleTo($user)
            ->when($filters['unit_id'] ?? null, fn (Builder $q, $v) => $q->where('unit_id', $v))
            ->when($filters['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('start_date', '>=', $v))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('start_date', '<=', $v));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: array<int, string>, 1: Collection<int, array<int, mixed>>}
     */
    private function activities(array $filters, User $user): array
    {
        $rows = $this->activityQuery($filters, $user)
            ->with(['unit', 'activityType', 'fundSource', 'creator'])
            ->withCount('members')
            ->withSum('honorDetails as honor_total', 'net_amount')
            ->orderBy('start_date')
            ->get()
            ->map(fn (Activity $a) => [
                $a->activity_code, $a->name, $a->unit?->name, $a->activityType?->name, $a->fundSource?->name,
                $a->start_date?->toDateString(), $a->end_date?->toDateString(),
                self::STATUS_LABEL[$a->status] ?? $a->status, $a->approval_document_number,
                $a->members_count, (int) $a->budget_amount, (int) $a->honor_total, $a->creator?->name,
            ]);

        return [[
            'Kode Kegiatan', 'Nama Kegiatan', 'Unit', 'Jenis Kegiatan', 'Sumber Dana', 'Mulai', 'Selesai',
            'Status', 'No. Persetujuan', 'Jumlah Panitia', 'Anggaran', 'Total Honor', 'Dibuat Oleh',
        ], $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: array<int, string>, 1: Collection<int, array<int, mixed>>}
     */
    private function honors(array $filters, User $user): array
    {
        $rows = HonorDetail::query()
            ->whereHas('activity', fn (Builder $a) => $a->mergeConstraintsFrom($this->activityQuery($filters, $user)))
            ->with(['activity.unit', 'employee', 'honorType', 'activityMember'])
            ->get()
            ->sortBy(fn (HonorDetail $d) => [$d->activity->start_date, $d->employee->name])
            ->map(fn (HonorDetail $d) => [
                $d->activity->activity_code, $d->activity->name, $d->activity->unit?->name,
                $d->activity->start_date?->toDateString(), self::STATUS_LABEL[$d->activity->status] ?? $d->activity->status,
                $d->employee->employee_code, $d->employee->name, $d->employee->nip, $d->activityMember?->role_name,
                $d->honorType?->name, $d->rate_decree_number_snapshot, (int) $d->rate_snapshot, (int) $d->volume,
                $d->unit_snapshot, (int) $d->net_amount, $d->employee->bank_name, $d->employee->bank_account_number,
            ])
            ->values();

        return [[
            'Kode Kegiatan', 'Nama Kegiatan', 'Unit', 'Tanggal', 'Status Kegiatan', 'Kode Pegawai', 'Nama Pegawai',
            'NIP', 'Peran', 'Jenis Honor', 'SK Tarif', 'Tarif', 'Volume', 'Satuan', 'Jumlah', 'Bank', 'No. Rekening',
        ], $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: array<int, string>, 1: Collection<int, array<int, mixed>>}
     */
    private function budget(array $filters, User $user): array
    {
        $rows = $this->activityQuery($filters, $user)
            ->with(['unit', 'fundSource', 'budget', 'disbursement.latestEvent'])
            ->orderBy('start_date')
            ->get()
            ->map(function (Activity $a) {
                $approved = (int) ($a->budget?->approved_amount ?? 0);
                $paid = $a->disbursement?->isPaid() ? (int) ($a->disbursement->approved_amount ?? $approved) : 0;

                return [
                    $a->activity_code, $a->name, $a->unit?->name, $a->fundSource?->name,
                    self::STATUS_LABEL[$a->status] ?? $a->status,
                    (int) $a->budget_amount, $approved, $paid, (int) $a->budget_amount - $approved,
                ];
            });

        return [[
            'Kode Kegiatan', 'Nama Kegiatan', 'Unit', 'Sumber Dana', 'Status', 'Pagu', 'Honor Disetujui',
            'Sudah Dibayar', 'Sisa Pagu',
        ], $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: array<int, string>, 1: Collection<int, array<int, mixed>>}
     */
    private function disbursements(array $filters, User $user): array
    {
        $rows = $this->activityQuery($filters, $user)
            ->where('status', Activity::APPROVED)
            ->with(['unit', 'budget', 'disbursement.latestEvent'])
            ->orderBy('approved_at')
            ->get()
            ->map(fn (Activity $a) => [
                $a->activity_code, $a->name, $a->unit?->name, $a->approved_at?->toDateString(),
                (int) ($a->budget?->approved_amount ?? 0),
                self::DISBURSEMENT_LABEL[$a->disbursementState()] ?? '-',
                $a->disbursement?->nomor_pengajuan, $a->disbursement?->current_stage, $a->disbursement?->no_voucher,
                $a->disbursement?->paid_at?->toDateString(),
            ]);

        return [[
            'Kode Kegiatan', 'Nama Kegiatan', 'Unit', 'Disetujui', 'Honor Disetujui', 'Status Pencairan',
            'No. Pengajuan Sianggar', 'Tahap Sianggar', 'No. Voucher', 'Tanggal Bayar',
        ], $rows];
    }
}
