<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Approval;
use App\Models\User;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Support\Facades\DB;

/**
 * Status transitions per ARSITEKTUR.md section 7 / FLOW.md section 3.
 * Every transition here is validated, authorized (by the caller via
 * Policy), and logged — never assign ->status directly elsewhere
 * (AI_CODING_RULES.md section 5).
 */
class ApprovalService
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService,
    ) {}

    public function submit(Activity $activity, User $actor): Activity
    {
        if (! in_array($activity->status, [Activity::DRAFT, Activity::REJECTED], true)) {
            throw new BusinessValidationException('status', 'Hanya kegiatan DRAFT/REJECTED yang dapat disubmit.');
        }

        if (! $activity->members()->exists()) {
            throw new BusinessValidationException('members', 'Kegiatan harus memiliki minimal satu peserta sebelum disubmit.');
        }

        if (! $activity->honorDetails()->exists()) {
            throw new BusinessValidationException('honor', 'Kegiatan harus memiliki perhitungan honor sebelum disubmit.');
        }

        return DB::transaction(function () use ($activity) {
            $sequence = $activity->approvals()->count() + 1;

            Approval::create([
                'activity_id' => $activity->id,
                'approval_type' => 'kepala_sekolah',
                'sequence' => $sequence,
                'status' => Approval::PENDING,
            ]);

            $activity->update(['status' => Activity::SUBMITTED, 'submitted_at' => now()]);

            $this->auditService->logModel('activity.submitted', $activity, newValues: ['status' => Activity::SUBMITTED]);

            $this->notificationService->sendToRole(
                'kepala_sekolah',
                'activity.submitted',
                'Pengajuan Kegiatan Baru',
                "Kegiatan {$activity->activity_code} - {$activity->name} menunggu persetujuan Anda.",
            );

            return $activity->fresh();
        });
    }

    public function approve(Activity $activity, User $approver, ?string $notes = null): Activity
    {
        $this->ensurePendingApprovalBy($activity, $approver);

        return DB::transaction(function () use ($activity, $approver, $notes) {
            $approval = $this->pendingApproval($activity);

            $approval->update(['status' => Approval::APPROVED, 'decision_at' => now(), 'notes' => $notes]);
            $approval->logs()->create([
                'action' => 'approve',
                'from_status' => Activity::SUBMITTED,
                'to_status' => Activity::APPROVED,
                'notes' => $notes,
                'acted_by' => $approver->id,
                'acted_at' => now(),
            ]);

            $activity->update(['status' => Activity::APPROVED, 'approved_at' => now()]);

            app(BudgetService::class)->approve($activity);

            $this->auditService->logModel('activity.approved', $activity, newValues: ['status' => Activity::APPROVED]);

            $this->notificationService->send(
                $activity->creator,
                'activity.approved',
                'Kegiatan Disetujui',
                "Kegiatan {$activity->activity_code} telah disetujui Kepala Sekolah.",
            );
            $this->notificationService->sendToRole(
                'keuangan',
                'activity.approved',
                'Kegiatan Siap Diverifikasi',
                "Kegiatan {$activity->activity_code} telah disetujui dan menunggu verifikasi keuangan.",
            );

            return $activity->fresh();
        });
    }

    public function reject(Activity $activity, User $approver, string $reason): Activity
    {
        $this->ensurePendingApprovalBy($activity, $approver);

        return DB::transaction(function () use ($activity, $approver, $reason) {
            $approval = $this->pendingApproval($activity);

            $approval->update(['status' => Approval::REJECTED, 'decision_at' => now(), 'notes' => $reason]);
            $approval->logs()->create([
                'action' => 'reject',
                'from_status' => Activity::SUBMITTED,
                'to_status' => Activity::REJECTED,
                'notes' => $reason,
                'acted_by' => $approver->id,
                'acted_at' => now(),
            ]);

            $activity->update(['status' => Activity::REJECTED]);

            $this->auditService->logModel('activity.rejected', $activity, newValues: ['status' => Activity::REJECTED, 'reason' => $reason]);

            $this->notificationService->send(
                $activity->creator,
                'activity.rejected',
                'Kegiatan Ditolak',
                "Kegiatan {$activity->activity_code} ditolak: {$reason}",
            );

            return $activity->fresh();
        });
    }

    private function ensurePendingApprovalBy(Activity $activity, User $approver): void
    {
        if ($activity->status !== Activity::SUBMITTED) {
            throw new BusinessValidationException('status', 'Hanya kegiatan berstatus SUBMITTED yang dapat di-approve/reject.');
        }

        if ($activity->created_by === $approver->id) {
            throw new BusinessValidationException('approver', 'Pembuat pengajuan tidak boleh menyetujui pengajuannya sendiri (separation of duties).');
        }
    }

    private function pendingApproval(Activity $activity): Approval
    {
        return $activity->approvals()->where('status', Approval::PENDING)->latest('sequence')->firstOrFail();
    }
}
