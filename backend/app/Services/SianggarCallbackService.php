<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\ActivityDisbursement;
use App\Models\ActivityDisbursementEvent;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Support\Facades\DB;

/**
 * Applies progress reported back by Sianggar (FLOW.md section 8).
 *
 * Everything here is a mirror: VAKASI records what Sianggar says and
 * never decides it. The two exceptions are the intake outcomes, which
 * are genuinely VAKASI's business — a revision request has to reopen
 * the kegiatan for editing, and a rejection has to be visible to the TU
 * who raised it.
 */
class SianggarCallbackService
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService,
        private readonly ApprovalService $approvalService,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): ActivityDisbursementEvent
    {
        $activity = Activity::where('activity_code', $data['activity_code'])->first();

        if (! $activity) {
            throw new BusinessValidationException(
                'activity_code',
                "Kegiatan dengan kode {$data['activity_code']} tidak ditemukan.",
            );
        }

        // The callback is retried on failure, so the same event can
        // legitimately arrive more than once. Returning the stored event
        // keeps the endpoint idempotent without a 409.
        $existing = ActivityDisbursementEvent::where('external_event_id', $data['event_id'])->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($activity, $data) {
            $disbursement = ActivityDisbursement::firstOrCreate(
                ['activity_id' => $activity->id],
            );

            $disbursement->fill(array_filter([
                'pengajuan_ulid' => $data['pengajuan_ulid'] ?? null,
                'nomor_pengajuan' => $data['nomor_pengajuan'] ?? null,
                'no_surat' => $data['no_surat'] ?? null,
                'perihal' => $data['perihal'] ?? null,
                'status_proses' => $data['status_proses'] ?? null,
                'current_stage' => $data['stage'] ?? null,
                'approved_amount' => $data['approved_amount'] ?? null,
                'no_voucher' => $data['no_voucher'] ?? null,
                'paid_at' => $data['paid_at'] ?? null,
            ], fn ($value) => $value !== null));

            $disbursement->last_event_at = $data['occurred_at'];
            $disbursement->save();

            $event = $disbursement->events()->create([
                'external_event_id' => $data['event_id'],
                'event_type' => $data['event'],
                'stage' => $data['stage'] ?? null,
                'status' => $data['status_proses'] ?? null,
                'actor_name' => $data['actor_name'] ?? null,
                'note' => $data['note'] ?? null,
                'occurred_at' => $data['occurred_at'],
                'payload' => $data,
            ]);

            $this->auditService->logModel('activity.sianggar_callback', $activity, newValues: [
                'event' => $data['event'],
                'stage' => $data['stage'] ?? null,
                'status_proses' => $data['status_proses'] ?? null,
            ]);

            $this->applySideEffects($activity, $data);

            return $event;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applySideEffects(Activity $activity, array $data): void
    {
        $note = $data['note'] ?? 'Tanpa catatan.';

        match ($data['event']) {
            // SDM sent it back before it ever became a pengajuan. Per the
            // agreed flow, the kegiatan reopens for editing and must be
            // approved by Kepala Sekolah again — an honor that changed
            // after approval would otherwise be disbursed on the strength
            // of an approval that never saw it (BR-03).
            'intake.revision_requested' => $this->approvalService->returnForRevision(
                $activity,
                "Revisi diminta SDM (Sianggar): {$note}",
            ),

            'intake.rejected' => $this->notifyCreator(
                $activity,
                'Pengajuan Ditolak SDM',
                "Kegiatan {$activity->activity_code} ditolak oleh SDM: {$note}",
            ),

            'pengajuan.created' => $this->notifyCreator(
                $activity,
                'Pengajuan Pencairan Dibuat',
                "Kegiatan {$activity->activity_code} telah diajukan pencairannya"
                    .($data['nomor_pengajuan'] ?? null ? " dengan nomor {$data['nomor_pengajuan']}" : '').'.',
            ),

            'pengajuan.paid' => $this->notifyCreator(
                $activity,
                'Honor Telah Dicairkan',
                "Honor kegiatan {$activity->activity_code} telah dibayarkan"
                    .($data['no_voucher'] ?? null ? " (voucher {$data['no_voucher']})" : '').'.',
            ),

            'pengajuan.rejected' => $this->notifyCreator(
                $activity,
                'Pengajuan Pencairan Ditolak',
                "Pengajuan pencairan kegiatan {$activity->activity_code} ditolak: {$note}",
            ),

            // Ordinary stage movements are mirrored, not announced — the
            // stepper on the activity page already shows them, and a
            // notification per approval level would be noise.
            default => null,
        };
    }

    private function notifyCreator(Activity $activity, string $title, string $message): void
    {
        if ($activity->creator) {
            $this->notificationService->send($activity->creator, 'sianggar.update', $title, $message);
        }
    }
}
