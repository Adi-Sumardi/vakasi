<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Document;
use App\Models\Employee;
use App\Models\HonorDetail;
use App\Models\HonorRate;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Everything the dashboard shows, computed server-side over the whole
 * visible data set. The page used to count from the (first page of the)
 * activity list, so its numbers silently stopped at 20 activities.
 *
 * Sections are only filled for users who can act on them: the to-do
 * list for whoever raises activities, per-unit totals and data health
 * for yayasan-wide accounts.
 */
class DashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function summary(User $user): array
    {
        $visible = fn (): Builder => Activity::query()->visibleTo($user);
        $yearStart = now()->startOfYear();

        $statusCounts = $visible()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($n) => (int) $n);

        $approvedThisYear = $visible()
            ->where('status', Activity::APPROVED)
            ->where('approved_at', '>=', $yearStart)
            ->with(['disbursement.latestEvent'])
            ->get();

        $disbursementCounts = $approvedThisYear
            ->groupBy(fn (Activity $a) => $a->disbursementState())
            ->map->count();

        $summary = [
            'scope' => [
                'unit' => $user->scopedUnitId() ? $user->unit?->name : null,
            ],
            'status_counts' => [
                'draft' => $statusCounts[Activity::DRAFT] ?? 0,
                'submitted' => $statusCounts[Activity::SUBMITTED] ?? 0,
                'rejected' => $statusCounts[Activity::REJECTED] ?? 0,
                'approved' => $statusCounts[Activity::APPROVED] ?? 0,
            ],
            'activities_this_month' => $visible()->where('created_at', '>=', now()->startOfMonth())->count(),
            'honor_approved_this_year' => (int) HonorDetail::query()
                ->whereHas('activity', fn (Builder $a) => $a->visibleTo($user)
                    ->where('status', Activity::APPROVED)
                    ->where('approved_at', '>=', $yearStart))
                ->sum('net_amount'),
            'honor_paid_this_year' => (int) $approvedThisYear
                ->filter(fn (Activity $a) => $a->disbursementState() === Activity::DISBURSEMENT_PAID)
                ->sum(fn (Activity $a) => $a->disbursement?->approved_amount ?? 0),
            'disbursement_counts' => [
                Activity::DISBURSEMENT_NOT_SENT => $disbursementCounts[Activity::DISBURSEMENT_NOT_SENT] ?? 0,
                Activity::DISBURSEMENT_WAITING => $disbursementCounts[Activity::DISBURSEMENT_WAITING] ?? 0,
                Activity::DISBURSEMENT_PROCESSING => $disbursementCounts[Activity::DISBURSEMENT_PROCESSING] ?? 0,
                Activity::DISBURSEMENT_PAID => $disbursementCounts[Activity::DISBURSEMENT_PAID] ?? 0,
                Activity::DISBURSEMENT_REJECTED => $disbursementCounts[Activity::DISBURSEMENT_REJECTED] ?? 0,
            ],
            'recent' => $visible()
                ->with('unit')
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (Activity $a) => $this->row($a))
                ->values(),
        ];

        if ($user->hasPermission('activities.approve')) {
            $summary['awaiting_approval'] = $visible()
                ->where('status', Activity::SUBMITTED)
                ->where('created_by', '!=', $user->id)
                ->with('unit')
                ->oldest('submitted_at')
                ->limit(6)
                ->get()
                ->map(fn (Activity $a) => $this->row($a))
                ->values();
        }

        if ($user->hasPermission('activities.create')) {
            $summary['todo'] = $this->todo($user);
        }

        if ($user->scopedUnitId() === null && ! $user->hasRole('tu', 'guru_tendik')) {
            $summary['per_unit'] = $this->perUnit($user, $yearStart);
        }

        if ($user->hasPermission('integration.manage')) {
            $summary['sianggar_failed'] = Activity::query()
                ->where('status', Activity::APPROVED)
                ->where('sianggar_status', Activity::SIANGGAR_FAILED)
                ->count();
        }

        if ($user->hasPermission('master-data.manage') || $user->hasPermission('honor-rates.manage')) {
            $summary['data_health'] = [
                'employees_total' => Employee::where('status', 'active')->count(),
                'employees_without_bank' => Employee::where('status', 'active')
                    ->where(fn (Builder $q) => $q->whereNull('bank_account_number')->orWhere('bank_account_number', ''))
                    ->count(),
                'rates_without_decree' => HonorRate::where('status', 'active')
                    ->where(fn (Builder $q) => $q->whereNull('decree_number')->orWhere('decree_number', ''))
                    ->count(),
                'rates_without_decree_file' => HonorRate::where('status', 'active')->whereNull('decree_file_path')->count(),
                'units_without_kepala_sekolah' => Unit::where('status', 'active')
                    ->whereDoesntHave('users', fn (Builder $q) => $q->where('status', 'active')
                        ->whereHas('role', fn (Builder $r) => $r->where('name', 'kepala_sekolah')))
                    ->count(),
            ];
        }

        return $summary;
    }

    /**
     * What the person raising activities still has to do, oldest first.
     *
     * @return array<string, mixed>
     */
    private function todo(User $user): array
    {
        $editable = fn (): Builder => Activity::query()->visibleTo($user)
            ->whereIn('status', [Activity::DRAFT, Activity::REJECTED]);

        return [
            'missing_sk_panitia' => $editable()
                ->whereDoesntHave('documents', fn (Builder $d) => $d->where('document_type', Document::SK_PANITIA))
                ->oldest()->limit(10)->get()->map(fn (Activity $a) => $this->row($a))->values(),
            'missing_honor' => $editable()
                ->whereDoesntHave('honorDetails')
                ->oldest()->limit(10)->get()->map(fn (Activity $a) => $this->row($a))->values(),
            'rejected' => Activity::query()->visibleTo($user)
                ->where('status', Activity::REJECTED)
                ->oldest('updated_at')->limit(10)->get()->map(fn (Activity $a) => $this->row($a))->values(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function perUnit(User $user, \DateTimeInterface $yearStart): array
    {
        $activities = Activity::query()
            ->visibleTo($user)
            ->where('created_at', '>=', $yearStart)
            ->withSum('honorDetails as honor_total', 'net_amount')
            ->get(['id', 'unit_id', 'status', 'budget_amount']);

        return Unit::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(function (Unit $unit) use ($activities) {
                $mine = $activities->where('unit_id', $unit->id);
                $approved = $mine->where('status', Activity::APPROVED);

                return [
                    'unit' => $unit->name,
                    'activities' => $mine->count(),
                    'submitted' => $mine->where('status', Activity::SUBMITTED)->count(),
                    'approved' => $approved->count(),
                    'honor_approved' => (int) $approved->sum('honor_total'),
                    'budget_total' => (int) $mine->sum('budget_amount'),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Activity $activity): array
    {
        return [
            'id' => $activity->id,
            'activity_code' => $activity->activity_code,
            'name' => $activity->name,
            'status' => $activity->status,
            'unit' => $activity->relationLoaded('unit') ? $activity->unit?->name : null,
            'start_date' => $activity->start_date?->toDateString(),
            'budget_amount' => (int) $activity->budget_amount,
        ];
    }
}
