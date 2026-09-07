<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Payment;
use App\Models\User;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Support\Facades\DB;

/**
 * Payment Architecture per ARSITEKTUR.md section 8.
 *
 * Simplification (documented, see AI_CODING_RULES.md 18): API.md does
 * not define a separate "verify" endpoint distinct from payment
 * creation, so Finance Verification (FR-10) and payment creation are
 * bundled into `create()` — the activity still visibly passes through
 * VERIFIED before PROCESSING in its audit trail.
 */
class PaymentService
{
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

        return DB::transaction(function () use ($activity, $data, $processor, $honorDetails, $totalAmount) {
            $payment = Payment::create([
                'payment_number' => $this->generatePaymentNumber(),
                'activity_id' => $activity->id,
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'payment_method' => $data['payment_method'],
                'source_account' => $data['source_account'] ?? null,
                'total_amount' => $totalAmount,
                'reference_number' => $data['reference_number'] ?? null,
                'status' => Payment::PROCESSING,
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

            // APPROVED -> VERIFIED -> PROCESSING, each step audited.
            $activity->update(['status' => Activity::VERIFIED]);
            $this->auditService->logModel('activity.verified', $activity, newValues: ['status' => Activity::VERIFIED]);

            $activity->update(['status' => Activity::PROCESSING]);
            $this->auditService->logModel('activity.processing', $activity, newValues: ['status' => Activity::PROCESSING]);

            $this->auditService->logModel('payment.created', $payment, newValues: $payment->toArray());

            $this->notificationService->send(
                $activity->creator,
                'payment.created',
                'Pembayaran Diproses',
                "Pembayaran {$payment->payment_number} untuk kegiatan {$activity->activity_code} sedang diproses.",
            );

            return $payment->fresh('details');
        });
    }

    public function process(Payment $payment): Payment
    {
        if ($payment->status !== Payment::PROCESSING) {
            throw new BusinessValidationException('status', 'Hanya pembayaran berstatus PROCESSING yang dapat diproses.');
        }

        $this->auditService->logModel('payment.process_confirmed', $payment);

        return $payment;
    }

    public function complete(Payment $payment): Payment
    {
        if ($payment->status !== Payment::PROCESSING) {
            throw new BusinessValidationException('status', 'Pembayaran hanya dapat diselesaikan dari status PROCESSING.');
        }

        if (! $payment->documents()->exists()) {
            // FLOW.md section 8: "Bukti pembayaran tidak valid -> payment tetap PROCESSING".
            throw new BusinessValidationException('evidence', 'Bukti pembayaran wajib diunggah sebelum pembayaran diselesaikan.');
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
