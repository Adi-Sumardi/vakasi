<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\HonorDetail;
use App\Models\Payment;
use App\Models\User;
use App\Services\Concerns\RetriesUniqueNumber;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Payment Architecture per ARSITEKTUR.md section 8.
 *
 * The lifecycle mirrors FLOW.md section 3 one step at a time:
 *
 *   create()   APPROVED  -> VERIFIED    (FR-10 Finance Verification)
 *   process()  VERIFIED  -> PROCESSING  (FR-11 disbursement started)
 *   complete() PROCESSING -> PAID -> COMPLETED
 *   cancel()   VERIFIED|PROCESSING -> back to APPROVED
 *
 * create() used to run APPROVED -> VERIFIED -> PROCESSING in a single
 * call, which made process() a no-op and left finance no point at which
 * to check the figures before money moved.
 */
class PaymentService
{
    use RetriesUniqueNumber;

    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService,
        private readonly BudgetService $budgetService,
    ) {}

    /**
     * @param  array{payment_date?: string, payment_method: string, source_account?: string|null, reference_number?: string|null}  $data
     */
    public function create(Activity $activity, array $data, User $processor): Payment
    {
        if ($activity->status !== Activity::APPROVED) {
            throw new BusinessValidationException('status', 'Hanya kegiatan berstatus APPROVED yang dapat diproses pembayaran.');
        }

        $honorDetails = $activity->honorDetails;

        if ($honorDetails->isEmpty()) {
            throw new BusinessValidationException('activity_id', 'Kegiatan tidak memiliki detail honor untuk dibayarkan.');
        }

        $totalAmount = (int) $honorDetails->sum('net_amount');

        return $this->retryingUniqueNumber(
            'payment_number',
            fn () => $this->createPayment($activity, $data, $processor, $honorDetails, $totalAmount),
        );
    }

    /**
     * @param  array{payment_date?: string, payment_method: string, source_account?: string|null, reference_number?: string|null}  $data
     * @param  Collection<int, HonorDetail>  $honorDetails
     */
    private function createPayment(Activity $activity, array $data, User $processor, $honorDetails, int $totalAmount): Payment
    {
        return DB::transaction(function () use ($activity, $data, $processor, $honorDetails, $totalAmount) {
            $payment = Payment::create([
                'payment_number' => $this->generatePaymentNumber(),
                'activity_id' => $activity->id,
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'payment_method' => $data['payment_method'],
                'source_account' => $data['source_account'] ?? null,
                'total_amount' => $totalAmount,
                'reference_number' => $data['reference_number'] ?? null,
                'status' => Payment::VERIFIED,
                'processed_by' => $processor->id,
            ]);

            foreach ($honorDetails as $detail) {
                $payment->details()->create([
                    'employee_id' => $detail->employee_id,
                    'honor_detail_id' => $detail->id,
                    'amount' => $detail->net_amount,
                    'status' => 'pending',
                ]);
            }

            // APPROVED -> VERIFIED. PROCESSING is a separate, deliberate
            // step (process()) so finance can still check the figures here.
            $activity->update(['status' => Activity::VERIFIED]);
            $this->auditService->logModel('activity.verified', $activity, newValues: ['status' => Activity::VERIFIED]);

            // Never log the full model: $payment->toArray() carries
            // source_account (AI_CODING_RULES.md section 10).
            $this->auditService->logModel('payment.created', $payment, newValues: $payment->only([
                'payment_number', 'activity_id', 'payment_date', 'payment_method', 'total_amount', 'status',
            ]));

            $this->notificationService->send(
                $activity->creator,
                'payment.created',
                'Pembayaran Diverifikasi',
                "Pembayaran {$payment->payment_number} untuk kegiatan {$activity->activity_code} telah diverifikasi keuangan.",
            );

            return $payment->fresh('details');
        });
    }

    /**
     * VERIFIED -> PROCESSING: finance has checked the figures and is now
     * actually disbursing.
     */
    public function process(Payment $payment): Payment
    {
        if ($payment->status !== Payment::VERIFIED) {
            throw new BusinessValidationException('status', 'Hanya pembayaran berstatus VERIFIED yang dapat diproses.');
        }

        return DB::transaction(function () use ($payment) {
            $payment->update(['status' => Payment::PROCESSING]);

            $activity = $payment->activity;
            $activity->update(['status' => Activity::PROCESSING]);

            $this->auditService->logModel('activity.processing', $activity, newValues: ['status' => Activity::PROCESSING]);
            $this->auditService->logModel('payment.processing', $payment, newValues: ['status' => Payment::PROCESSING]);

            $this->notificationService->send(
                $activity->creator,
                'payment.processing',
                'Pembayaran Diproses',
                "Pembayaran {$payment->payment_number} untuk kegiatan {$activity->activity_code} sedang diproses.",
            );

            return $payment->fresh('details');
        });
    }

    /**
     * Abandon a payment that has not been disbursed and hand the activity
     * back to APPROVED so finance can record it again. The payment row
     * itself is kept — financial records are never hard deleted (BR-04).
     */
    public function cancel(Payment $payment, string $reason): Payment
    {
        if (! in_array($payment->status, [Payment::VERIFIED, Payment::PROCESSING], true)) {
            throw new BusinessValidationException(
                'status',
                'Hanya pembayaran berstatus VERIFIED/PROCESSING yang dapat dibatalkan. Pembayaran yang sudah PAID bersifat final.',
            );
        }

        return DB::transaction(function () use ($payment, $reason) {
            $old = ['status' => $payment->status];

            $payment->update(['status' => Payment::CANCELLED]);
            $payment->details()->update(['status' => 'cancelled']);

            $activity = $payment->activity;
            $activity->update(['status' => Activity::APPROVED]);

            $this->auditService->logModel('payment.cancelled', $payment, $old, ['status' => Payment::CANCELLED, 'reason' => $reason]);
            $this->auditService->logModel('activity.payment_cancelled', $activity, newValues: ['status' => Activity::APPROVED, 'reason' => $reason]);

            $this->notificationService->send(
                $activity->creator,
                'payment.cancelled',
                'Pembayaran Dibatalkan',
                "Pembayaran {$payment->payment_number} dibatalkan: {$reason}",
            );

            return $payment->fresh('details');
        });
    }

    public function complete(Payment $payment): Payment
    {
        if ($payment->status !== Payment::PROCESSING) {
            throw new BusinessValidationException('status', 'Pembayaran hanya dapat diselesaikan dari status PROCESSING.');
        }

        if (! $payment->documents()->where('document_type', 'bukti_transfer')->exists()) {
            // FLOW.md section 8: "Bukti pembayaran tidak valid -> payment tetap PROCESSING".
            // Must specifically be bukti_transfer, not just any document
            // type — a payment shouldn't complete on, say, a stray
            // surat_tugas attached to it.
            throw new BusinessValidationException('evidence', 'Bukti pembayaran (bukti transfer) wajib diunggah sebelum pembayaran diselesaikan.');
        }

        return DB::transaction(function () use ($payment) {
            $payment->update(['status' => Payment::PAID]);
            $payment->details()->update(['status' => 'paid', 'paid_at' => now()]);

            $activity = $payment->activity;
            $activity->update(['status' => Activity::PAID]);
            $this->auditService->logModel('activity.paid', $activity, newValues: ['status' => Activity::PAID]);

            $activity->update(['completed_at' => now(), 'status' => Activity::COMPLETED]);
            $this->auditService->logModel('activity.completed', $activity, newValues: ['status' => Activity::COMPLETED]);

            $this->budgetService->recordPayment($activity, $payment->total_amount);

            $this->auditService->logModel('payment.completed', $payment, newValues: ['status' => Payment::PAID]);

            $this->notificationService->send(
                $activity->creator,
                'payment.completed',
                'Pembayaran Selesai',
                "Pembayaran {$payment->payment_number} telah selesai. Slip honor dapat diunduh.",
            );

            return $payment->fresh('details');
        });
    }

    private function generatePaymentNumber(): string
    {
        $year = now()->year;
        $sequence = Payment::whereYear('created_at', $year)->count() + 1;

        return sprintf('PAY-%d-%04d', $year, $sequence);
    }
}
