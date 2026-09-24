<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Budget;
use App\Services\Exceptions\BusinessValidationException;

/**
 * Tracks budget vs realisasi per BRD.md section 8: budget, committed
 * (requested honor pending decision), approved, paid, remaining.
 *
 * `remaining_amount` = budget_amount - committed_amount: what's left
 * of the pagu available to commit to *more* honor. Once honor is
 * calculated it's considered spoken-for even before it's literally
 * paid out, so paying it later doesn't change remaining_amount —
 * `paid_amount` tracks realized disbursement as a separate concern.
 *
 * Simplification (documented per AI_CODING_RULES.md 18 — flag
 * ambiguity rather than guess silently): BRD.md leaves the
 * over-budget policy configurable ("hard limit jika policy
 * mengharuskan"). VAKASI MVP always hard-blocks submission over
 * budget_amount; a configurable soft-warning policy is future work.
 */
class BudgetService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function initializeForActivity(Activity $activity): Budget
    {
        $budget = Budget::create([
            'activity_id' => $activity->id,
            'budget_code' => 'BGT-'.$activity->activity_code,
            'budget_amount' => $activity->budget_amount,
            'committed_amount' => 0,
            'approved_amount' => 0,
            'paid_amount' => 0,
            'remaining_amount' => $activity->budget_amount,
            'status' => 'active',
        ]);

        $this->auditService->logModel('budget.initialized', $budget, newValues: $budget->toArray());

        return $budget;
    }

    /**
     * Lowering the pagu below what is already committed would leave
     * remaining_amount negative and silently contradict the hard limit
     * that recalculateCommitted() enforces in the other direction.
     */
    public function syncBudgetAmount(Activity $activity): void
    {
        $budget = $activity->budget ?? $this->initializeForActivity($activity);

        if ($activity->budget_amount < $budget->committed_amount) {
            throw new BusinessValidationException(
                'budget_amount',
                sprintf(
                    'Anggaran (Rp%s) tidak boleh lebih kecil dari honor yang sudah dihitung (Rp%s). Hitung ulang honor terlebih dahulu.',
                    number_format($activity->budget_amount, 0, ',', '.'),
                    number_format($budget->committed_amount, 0, ',', '.'),
                ),
            );
        }

        $old = $budget->only(['budget_amount', 'remaining_amount']);

        $budget->update([
            'budget_amount' => $activity->budget_amount,
            'remaining_amount' => $activity->budget_amount - $budget->committed_amount,
        ]);

        $this->auditService->logModel('budget.synced', $budget, $old, $budget->only(['budget_amount', 'remaining_amount']));
    }

    /**
     * Recompute committed_amount (and remaining_amount alongside it)
     * from the activity's current honor details, and hard-block if it
     * exceeds budget_amount.
     */
    public function recalculateCommitted(Activity $activity): Budget
    {
        $budget = $activity->budget ?? $this->initializeForActivity($activity);
        $committed = (int) $activity->honorDetails()->sum('net_amount');

        if ($committed > $budget->budget_amount) {
            throw new BusinessValidationException(
                'budget_amount',
                sprintf(
                    'Total honor (Rp%s) melebihi anggaran kegiatan (Rp%s).',
                    number_format($committed, 0, ',', '.'),
                    number_format($budget->budget_amount, 0, ',', '.'),
                ),
            );
        }

        $old = $budget->only(['committed_amount', 'remaining_amount']);

        $budget->update([
            'committed_amount' => $committed,
            'remaining_amount' => $budget->budget_amount - $committed,
        ]);

        $this->auditService->logModel('budget.committed', $budget, $old, $budget->only(['committed_amount', 'remaining_amount']));

        return $budget->fresh();
    }

    public function approve(Activity $activity): void
    {
        $budget = $activity->budget;

        if ($budget) {
            $old = $budget->only('approved_amount');
            $budget->update(['approved_amount' => $budget->committed_amount]);
            $this->auditService->logModel('budget.approved', $budget, $old, $budget->only('approved_amount'));
        }
    }

    public function recordPayment(Activity $activity, int $amount): void
    {
        $budget = $activity->budget;

        if (! $budget) {
            return;
        }

        $old = $budget->only('paid_amount');
        $budget->update(['paid_amount' => $budget->paid_amount + $amount]);
        $this->auditService->logModel('budget.paid', $budget, $old, $budget->only('paid_amount'));
    }
}
