<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\ActivityType;
use App\Models\Employee;
use App\Models\FundSource;
use App\Models\HonorDetail;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Models\Position;
use App\Models\Unit;
use App\Models\User;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * Permanent delete for master data entered by mistake. Anything already
 * in use is refused with a message saying where, because the records
 * pointing at it (employees, activities, calculated honor) are history
 * that must keep its meaning; those rows are deactivated instead.
 *
 * Some references would not even fail at the database: users.unit_id
 * and honor_rates.unit_id are nullOnDelete, so deleting a unit would
 * silently widen a TU account to the whole yayasan and turn a
 * unit-specific tariff into the general one. They are checked here.
 */
class MasterDataDeletionService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function delete(Model $record, User $actor): void
    {
        $usages = array_filter($this->usages($record));

        if ($usages !== []) {
            $where = collect($usages)->map(fn (int $count, string $label) => "{$count} {$label}")->implode(', ');

            throw new BusinessValidationException(
                'record',
                "Tidak dapat dihapus karena masih dipakai oleh {$where}. Nonaktifkan saja agar tidak bisa dipilih lagi.",
            );
        }

        $snapshot = $record->toArray();

        $record->delete();

        if ($record instanceof HonorRate && $record->decree_file_path) {
            Storage::disk('local')->delete($record->decree_file_path);
        }

        $this->auditService->logModel('master_data.deleted', $record, $snapshot, ['deleted_by' => $actor->id]);
    }

    /**
     * @return array<string, int> label => number of records using it
     */
    public function usages(Model $record): array
    {
        return match (true) {
            $record instanceof Unit => [
                'pegawai' => Employee::where('unit_id', $record->id)->count(),
                'kegiatan' => Activity::withTrashed()->where('unit_id', $record->id)->count(),
                'tarif khusus unit' => HonorRate::where('unit_id', $record->id)->count(),
                'akun pengguna' => User::where('unit_id', $record->id)->count(),
            ],
            $record instanceof Position => [
                'pegawai' => Employee::where('position_id', $record->id)->count(),
            ],
            $record instanceof ActivityType => [
                'kegiatan' => Activity::withTrashed()->where('activity_type_id', $record->id)->count(),
            ],
            $record instanceof FundSource => [
                'kegiatan' => Activity::withTrashed()->where('fund_source_id', $record->id)->count(),
            ],
            $record instanceof HonorType => [
                'tarif' => HonorRate::where('honor_type_id', $record->id)->count(),
                'baris honor' => HonorDetail::where('honor_type_id', $record->id)->count(),
            ],
            // A rate is "used" once any honor line was calculated with it:
            // the line keeps the amount (rate_snapshot), but the rate row is
            // what shows which tariff and SK it came from.
            $record instanceof HonorRate => [
                'baris honor' => HonorDetail::where('honor_type_id', $record->honor_type_id)
                    ->where('rate_snapshot', $record->rate)
                    ->count(),
            ],
            default => throw new \InvalidArgumentException('Jenis data ini tidak dapat dihapus.'),
        };
    }
}
