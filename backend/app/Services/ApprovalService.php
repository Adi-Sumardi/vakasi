<?php

namespace App\Services;

use App\Jobs\PushApprovedActivityToSianggar;
use App\Models\Activity;
use App\Models\Approval;
use App\Models\Document;
use App\Models\User;
use App\Services\Concerns\RetriesUniqueNumber;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Status transitions per ARSITEKTUR.md section 7 / FLOW.md section 3.
 * Every transition here is validated, authorized (by the caller via
 * Policy), and logged — never assign ->status directly elsewhere
 * (AI_CODING_RULES.md section 5).
 */
class ApprovalService
{
    use RetriesUniqueNumber;

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

        if (! $activity->documents()->where('document_type', Document::SK_PANITIA)->exists()) {
            throw new BusinessValidationException('documents', 'Unggah SK Panitia yang sudah ditandatangani sebelum kegiatan disubmit.');
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

        return $this->retryingUniqueNumber('approval_document_number', fn () => DB::transaction(function () use ($activity, $approver, $notes) {
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

            $activity->update([
                'status' => Activity::APPROVED,
                'approved_at' => now(),
                'verification_code' => $activity->verification_code ?? $this->generateVerificationCode(),
                'approval_document_number' => $activity->approval_document_number ?? $this->generateApprovalDocumentNumber(),
                'sianggar_status' => Activity::SIANGGAR_PENDING,
            ]);

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
                'Kegiatan Siap Diteruskan',
                "Kegiatan {$activity->activity_code} telah disetujui dan diteruskan ke Sianggar untuk pengajuan pencairan.",
            );

            // afterCommit: the job re-reads the activity, so it must not
            // run against a transaction that could still roll back.
            PushApprovedActivityToSianggar::dispatch($activity)->afterCommit();

            return $activity->fresh();
        }));
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

    /**
     * Reopens an approved kegiatan for editing after SDM asked for a
     * revision in Sianggar (FLOW.md section 8).
     *
     * REJECTED is reused rather than inventing a new status: it already
     * means "editable, needs to be submitted and approved again", which
     * is exactly the required outcome. Kepala Sekolah must approve the
     * corrected honor, because disbursing a figure that changed after
     * approval would rest on an approval that never saw it (BR-03).
     */
    public function returnForRevision(Activity $activity, string $reason): Activity
    {
        if ($activity->status !== Activity::APPROVED) {
            throw new BusinessValidationException(
                'status',
                'Hanya kegiatan berstatus APPROVED yang dapat dikembalikan untuk revisi.',
            );
        }

        return DB::transaction(function () use ($activity, $reason) {
            $activity->update([
                'status' => Activity::REJECTED,
                'approved_at' => null,
                // The handoff has to happen again once it is re-approved.
                'sianggar_status' => null,
                'sianggar_synced_at' => null,
                'sianggar_last_error' => null,
            ]);

            $this->auditService->logModel('activity.returned_for_revision', $activity, newValues: [
                'status' => Activity::REJECTED,
                'reason' => $reason,
            ]);

            $this->notificationService->send(
                $activity->creator,
                'activity.revision_requested',
                'Revisi Diminta',
                "Kegiatan {$activity->activity_code} dikembalikan untuk revisi. {$reason}",
            );
            $this->notificationService->sendToRole(
                'kepala_sekolah',
                'activity.revision_requested',
                'Kegiatan Dikembalikan untuk Revisi',
                "Kegiatan {$activity->activity_code} dikembalikan SDM dan perlu disetujui ulang setelah diperbaiki.",
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

    /**
     * Unguessable — backs a public, unauthenticated verification
     * endpoint (PublicVerificationController), so it must never be
     * derivable from the activity's id/code.
     */
    private function generateVerificationCode(): string
    {
        do {
            $code = Str::random(40);
        } while (Activity::where('verification_code', $code)->exists());

        return $code;
    }

    /**
     * Human-facing reference number for the approval document (shown
     * on the public verification page), distinct from the opaque
     * verification_code and from activity_code (assigned on creation,
     * before any approval exists). Follows the same
     * PREFIX-YEAR-SEQUENCE convention as activity_code/payment_number.
     */
    private function generateApprovalDocumentNumber(): string
    {
        $year = now()->year;
        $sequence = Activity::whereYear('approved_at', $year)->whereNotNull('approval_document_number')->count() + 1;

        // "APV", not "SK": this is VAKASI's approval reference, not a Surat
        // Keputusan. The real SK Panitia is a signed document uploaded to
        // the activity, and the two must not be mistaken for each other.
        return sprintf('APV-%d-%04d', $year, $sequence);
    }

    private function pendingApproval(Activity $activity): Approval
    {
        return $activity->approvals()->where('status', Approval::PENDING)->latest('sequence')->firstOrFail();
    }
}
