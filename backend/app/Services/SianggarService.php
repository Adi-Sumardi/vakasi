<?php

namespace App\Services;

use App\Models\Activity;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Hands an approved activity over to Sianggar, where it lands in the
 * "Vakasi" menu on the SDM dashboard. SDM reviews it, then either sends
 * it back for revision, rejects it, or turns it into a PengajuanAnggaran
 * that enters Sianggar's normal approval flow (FLOW.md section 8).
 *
 * VAKASI's own workflow ends at APPROVED — this push is the handoff, not
 * a payment step. Delivery is therefore best-effort-with-retries and is
 * never allowed to roll back an approval that has already been recorded.
 */
class SianggarService
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly HonorRecapPdfService $recapPdf,
    ) {}

    public function isConfigured(): bool
    {
        return filled(config('vakasi.sianggar.url'));
    }

    /**
     * Everything SDM needs to raise the disbursement, which is why bank
     * details are included here and nowhere else outside the employee
     * master (see EmployeeResource).
     *
     * One `amount` per line, no gross/tax/deduction breakdown: this flow
     * is honor/upah panitia only and no tax or other deduction is
     * involved, so the amount sent is simply what gets paid out.
     *
     * @return array<string, mixed>
     */
    public function payloadFor(Activity $activity): array
    {
        $activity->loadMissing([
            'activityType', 'unit', 'fundSource', 'pic',
            'honorDetails.employee.unit', 'honorDetails.honorType',
            'members.employee',
        ]);

        $roleByEmployeeId = $activity->members
            ->mapWithKeys(fn ($member) => [$member->employee_id => $member->role_name]);

        $honors = $activity->honorDetails->map(fn ($detail) => [
            'employee' => [
                'employee_code' => $detail->employee->employee_code,
                'nip' => $detail->employee->nip,
                'nuptk' => $detail->employee->nuptk,
                'name' => $detail->employee->name,
                'unit' => $detail->employee->unit?->name,
                'bank_name' => $detail->employee->bank_name,
                'bank_account_name' => $detail->employee->bank_account_name,
                'bank_account_number' => $detail->employee->bank_account_number,
            ],
            'role_name' => $roleByEmployeeId[$detail->employee_id] ?? null,
            'honor_type' => $detail->honorType?->name,
            'rate' => (int) $detail->rate_snapshot,
            'volume' => (int) $detail->volume,
            'satuan' => $detail->unit_snapshot,
            'amount' => (int) $detail->net_amount,
        ])->values();

        return [
            'event' => 'activity.approved',
            'source' => 'vakasi',
            'sent_at' => now()->toIso8601String(),
            'activity' => [
                'activity_code' => $activity->activity_code,
                'approval_document_number' => $activity->approval_document_number,
                'name' => $activity->name,
                'description' => $activity->description,
                'activity_type' => $activity->activityType?->name,
                'unit' => $activity->unit?->name,
                'fund_source' => $activity->fundSource?->name,
                'location' => $activity->location,
                'start_date' => $activity->start_date?->toDateString(),
                'end_date' => $activity->end_date?->toDateString(),
                'pic' => $activity->pic?->name,
                'approved_at' => $activity->approved_at?->toIso8601String(),
                'verification_url' => $activity->verification_code
                    ? app(QrCodeService::class)->verificationUrl($activity->verification_code)
                    : null,
            ],
            'honors' => $honors,
            'total_amount' => (int) $activity->honorDetails->sum('net_amount'),
            // Where Sianggar should report progress back to, so the
            // callback URL is never hard-coded on their side.
            'callback_url' => route('integrations.sianggar.callback'),
        ];
    }

    /**
     * @throws RuntimeException when Sianggar rejects or cannot be reached,
     *                          so the queue worker retries the job.
     */
    public function push(Activity $activity): void
    {
        if (! $this->isConfigured()) {
            $this->markSkipped($activity);

            return;
        }

        $activity->increment('sianggar_attempts');

        // Multipart rather than JSON: the recap PDF travels with the data
        // in one atomic call. A download URL would require Sianggar to be
        // able to reach back into VAKASI, and base64 would inflate the
        // body by a third.
        $payload = json_encode($this->payloadFor($activity), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $signature = hash_hmac('sha256', $payload, (string) config('vakasi.sianggar.secret'));

        try {
            $response = Http::withHeaders([
                // Signed over the payload part only — a multipart boundary
                // is generated per request and is not stable to sign.
                'X-Vakasi-Signature' => $signature,
                // Lets Sianggar recognise a redelivery of the same approval
                // instead of creating a duplicate entry.
                'X-Idempotency-Key' => $activity->activity_code,
            ])
                ->timeout((int) config('vakasi.sianggar.timeout'))
                ->attach('lampiran', $this->recapPdf->render($activity), $this->recapPdf->fileName($activity))
                ->acceptJson()
                ->post((string) config('vakasi.sianggar.url'), [
                    ['name' => 'payload', 'contents' => $payload],
                ]);
        } catch (ConnectionException $e) {
            $this->markFailed($activity, $e->getMessage());

            throw new RuntimeException("Sianggar tidak dapat dihubungi: {$e->getMessage()}", previous: $e);
        }

        if ($response->failed()) {
            $reason = "HTTP {$response->status()}: ".str($response->body())->limit(500);
            $this->markFailed($activity, $reason);

            throw new RuntimeException("Sianggar menolak data kegiatan {$activity->activity_code}. {$reason}");
        }

        $activity->forceFill([
            'sianggar_status' => Activity::SIANGGAR_SENT,
            'sianggar_synced_at' => now(),
            'sianggar_last_error' => null,
        ])->save();

        $this->auditService->logModel('activity.sianggar_pushed', $activity, newValues: [
            'sianggar_status' => Activity::SIANGGAR_SENT,
            'attempts' => $activity->sianggar_attempts,
        ]);
    }

    private function markSkipped(Activity $activity): void
    {
        $activity->forceFill([
            'sianggar_status' => Activity::SIANGGAR_SKIPPED,
            'sianggar_last_error' => 'SIANGGAR_WEBHOOK_URL belum dikonfigurasi.',
        ])->save();
    }

    private function markFailed(Activity $activity, string $reason): void
    {
        $activity->forceFill([
            'sianggar_status' => Activity::SIANGGAR_FAILED,
            'sianggar_last_error' => str($reason)->limit(1000)->toString(),
        ])->save();

        $this->auditService->logModel('activity.sianggar_push_failed', $activity, newValues: [
            'sianggar_status' => Activity::SIANGGAR_FAILED,
            'attempts' => $activity->sianggar_attempts,
            'error' => $reason,
        ]);
    }
}
