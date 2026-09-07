<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Budget;
use App\Models\HonorDetail;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Read-only aggregations for API.md section 9. Filters follow the
 * documented query parameters: start_date, end_date, unit_id, status.
 */
class ReportService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function activities(array $filters): LengthAwarePaginator
    {
        return Activity::query()
            ->with(['activityType', 'unit', 'fundSource'])
            ->when($filters['unit_id'] ?? null, fn (Builder $q, $v) => $q->where('unit_id', $v))
            ->when($filters['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('start_date', '>=', $v))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('end_date', '<=', $v))
            ->latest()
            ->paginate(20);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function honors(array $filters): LengthAwarePaginator
    {
        return HonorDetail::query()
            ->with(['activity', 'employee', 'honorType'])
            ->when($filters['unit_id'] ?? null, fn (Builder $q, $v) => $q->whereHas('activity', fn (Builder $a) => $a->where('unit_id', $v)))
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v))
            ->latest()
            ->paginate(20);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function employeeHonors(int $employeeId, array $filters): LengthAwarePaginator
    {
        return HonorDetail::query()
            ->with(['activity', 'honorType'])
            ->where('employee_id', $employeeId)
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v))
            ->latest()
            ->paginate(20);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function budget(array $filters): LengthAwarePaginator
    {
        return Budget::query()
            ->with('activity')
            ->when(
                $filters['unit_id'] ?? null,
                fn (Builder $q, $v) => $q->whereHas('activity', fn (Builder $a) => $a->where('unit_id', $v)),
            )
            ->latest()
            ->paginate(20);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function payments(array $filters): LengthAwarePaginator
    {
        return Payment::query()
            ->with(['activity', 'processor'])
            ->when($filters['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($filters['start_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('payment_date', '>=', $v))
            ->when($filters['end_date'] ?? null, fn (Builder $q, $v) => $q->whereDate('payment_date', '<=', $v))
            ->latest('payment_date')
            ->paginate(20);
    }
}
