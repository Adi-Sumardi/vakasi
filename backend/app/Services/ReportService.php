<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Budget;
use App\Models\HonorDetail;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Read-only aggregations for API.md section 9. Filters follow the
 * documented query parameters: start_date, end_date, unit_id, status.
 *
 * Data scope per ROLE_PERMISSION.md section 4/7.4: TU only sees
 * reports for activities they created; Guru/Tendik only for
 * activities they're a member of. This resolves the documented
 * conflict between section 3's matrix ("✓" for TU) and section 4's
 * narrative ("kegiatan yang menjadi tanggung jawabnya") in favor of
 * the narrower, already-implemented interpretation used by
 * ActivityController — see ROLE_PERMISSION.md's updated note.
 */
class ReportService
{
    /**
     * @param  Builder<Activity>  $query
     * @return Builder<Activity>
     */
    private function scopeActivitiesToUser(Builder $query, User $user): Builder
    {
        return $query->visibleTo($user);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function perPage(array $filters): int
    {
        return max(1, min(1000, (int) ($filters['per_page'] ?? 20) ?: 20));
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function activities(array $filters, User $user): LengthAwarePaginator
    {
        return $this->scopeActivitiesToUser(Activity::query(), $user)
            ->with(['activityType', 'unit', 'fundSource'])
            ->when($filters['unit_id'] ?? null, fn (Builder $q, $v) => $q->where('unit_id', $v))
            ->when($filters['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('start_date', '>=', $v))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('end_date', '<=', $v))
            ->latest()
            ->paginate($this->perPage($filters));
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function honors(array $filters, User $user): LengthAwarePaginator
    {
        return HonorDetail::query()
            ->whereHas('activity', fn (Builder $a) => $this->scopeActivitiesToUser($a, $user))
            ->with(['activity', 'employee', 'honorType', 'activityMember'])
            ->when($filters['unit_id'] ?? null, fn (Builder $q, $v) => $q->whereHas('activity', fn (Builder $a) => $a->where('unit_id', $v)))
            // By the activity's date, like the Excel export, so the screen
            // and the file agree on what "September" means.
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereHas('activity', fn (Builder $a) => $a->whereDate('start_date', '>=', $v)))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereHas('activity', fn (Builder $a) => $a->whereDate('start_date', '<=', $v)))
            ->latest()
            ->paginate($this->perPage($filters));
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function employeeHonors(int $employeeId, array $filters, User $user): LengthAwarePaginator
    {
        return HonorDetail::query()
            ->whereHas('activity', fn (Builder $a) => $this->scopeActivitiesToUser($a, $user))
            ->with(['activity', 'honorType'])
            ->where('employee_id', $employeeId)
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v))
            ->latest()
            ->paginate($this->perPage($filters));
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function budget(array $filters, User $user): LengthAwarePaginator
    {
        return Budget::query()
            ->whereHas('activity', fn (Builder $a) => $this->scopeActivitiesToUser($a, $user))
            ->with(['activity.unit', 'activity.fundSource', 'activity.disbursement.latestEvent'])
            ->when(
                $filters['unit_id'] ?? null,
                fn (Builder $q, $v) => $q->whereHas('activity', fn (Builder $a) => $a->where('unit_id', $v)),
            )
            ->latest()
            ->paginate($this->perPage($filters));
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function payments(array $filters, User $user): LengthAwarePaginator
    {
        return Payment::query()
            ->whereHas('activity', fn (Builder $a) => $this->scopeActivitiesToUser($a, $user))
            ->with(['activity', 'processor'])
            ->when($filters['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('payment_date', '>=', $v))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('payment_date', '<=', $v))
            ->latest('payment_date')
            ->paginate($this->perPage($filters));
    }
}
