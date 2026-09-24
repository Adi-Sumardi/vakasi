<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\ActivityMember;
use App\Models\Employee;
use App\Models\User;
use App\Services\Concerns\RetriesUniqueNumber;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Support\Facades\DB;

class ActivityService
{
    use RetriesUniqueNumber;

    public function __construct(
        private readonly AuditService $auditService,
        private readonly BudgetService $budgetService,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $creator): Activity
    {
        return $this->retryingUniqueNumber('activity_code', fn () => DB::transaction(function () use ($data, $creator) {
            $activity = Activity::create([
                ...$data,
                'activity_code' => $this->generateActivityCode(),
                'status' => Activity::DRAFT,
                'created_by' => $creator->id,
            ]);

            $this->budgetService->initializeForActivity($activity);

            $this->auditService->logModel('activity.created', $activity, newValues: $activity->toArray());

            return $activity;
        }));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Activity $activity, array $data): Activity
    {
        $this->ensureEditable($activity);

        $old = $activity->only(array_keys($data));
        $activity->update($data);

        if (array_key_exists('budget_amount', $data)) {
            $this->budgetService->syncBudgetAmount($activity->fresh());
        }

        $this->auditService->logModel('activity.updated', $activity, $old, $data);

        return $activity->fresh();
    }

    /**
     * @param  array{employee_id: int, role_name: string, notes?: string|null}  $data
     */
    public function addMember(Activity $activity, array $data): ActivityMember
    {
        $this->ensureEditable($activity);

        $employee = Employee::findOrFail($data['employee_id']);

        if (! $employee->isActive()) {
            throw new BusinessValidationException('employee_id', 'Pegawai tidak aktif dan tidak dapat diberi penugasan baru.');
        }

        $exists = $activity->members()
            ->where('employee_id', $employee->id)
            ->where('role_name', $data['role_name'])
            ->exists();

        if ($exists) {
            throw new BusinessValidationException('employee_id', 'Pegawai sudah memiliki peran ini pada kegiatan ini.');
        }

        $member = $activity->members()->create([
            'employee_id' => $employee->id,
            'role_name' => $data['role_name'],
            'notes' => $data['notes'] ?? null,
        ]);

        $this->auditService->logModel('activity.member_added', $activity, newValues: $member->toArray());

        return $member;
    }

    /**
     * Removing a member also removes their honor lines. ensureEditable()
     * already restricts this to DRAFT/REJECTED, where no financial
     * snapshot exists yet (BR-03), so there is nothing to preserve —
     * previously this threw "hapus honor terlebih dahulu" while offering
     * no way to delete an honor line, leaving the user stuck.
     */
    public function removeMember(Activity $activity, ActivityMember $member): void
    {
        $this->ensureEditable($activity);

        DB::transaction(function () use ($activity, $member) {
            $honorDetails = $member->honorDetails()->get();

            if ($honorDetails->isNotEmpty()) {
                $this->auditService->logModel(
                    'activity.member_honor_removed',
                    $activity,
                    oldValues: ['honor_details' => $honorDetails->toArray()],
                );

                $member->honorDetails()->delete();
            }

            $this->auditService->logModel('activity.member_removed', $activity, oldValues: $member->toArray());

            $member->delete();

            $activity->unsetRelation('honorDetails');
            $this->budgetService->recalculateCommitted($activity);
        });
    }

    public function ensureEditable(Activity $activity): void
    {
        if (! in_array($activity->status, [Activity::DRAFT, Activity::REJECTED], true)) {
            throw new BusinessValidationException(
                'status',
                "Kegiatan berstatus {$activity->status} tidak dapat diubah. Hanya kegiatan DRAFT/REJECTED yang dapat diedit.",
            );
        }
    }

    public function delete(Activity $activity): void
    {
        if ($activity->payments()->exists()) {
            throw new BusinessValidationException('status', 'Kegiatan yang memiliki pembayaran tidak boleh dihapus.');
        }

        $this->auditService->logModel('activity.deleted', $activity, oldValues: $activity->toArray());

        $activity->delete();
    }

    private function generateActivityCode(): string
    {
        $year = now()->year;
        $sequence = Activity::withTrashed()->whereYear('created_at', $year)->count() + 1;

        return sprintf('KEG-%d-%04d', $year, $sequence);
    }
}
