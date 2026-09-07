<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Budget;
use App\Services\Exceptions\BusinessValidationException;

/**
 * Tracks budget vs realisasi per BRD.md section 8: budget, committed
 * (requested honor pending decision), approved, paid, remaining.
 *
 * Simplification (documented per AI_CODING_RULES.md 18 — flag
 * ambiguity rather than guess silently): BRD.md leaves the
 * over-budget policy configurable ("hard limit jika policy
 * mengharuskan"). VAKASI MVP always hard-blocks submission over
 * budget_amount; a configurable soft-warning policy is future work.
 */
class BudgetService
{
    public function initializeForActivity(Activity $activity): Budget
    {
        return Budget::create([
            'activity_id' => $activity->id,
            'budget_code' => 'BGT-'.$activity->activity_code,
            'budget_amount' => $activity->budget_amount,
            'committed_amount' => 0,
            'approved_amount' => 0,
            'paid_amount' => 0,
            'remaining_amount' => $activity->budget_amount,
            'status' => 'active',
        ]);
    }

    public function syncBudgetAmount(Activity $activity): void
    {
        $budget = $activity->budget ?? $this->initializeForActivity($activity);

        $budget->update([
            'budget_amount' => $activity->budget_amount,
            'remaining_amount' => $activity->budget_amount - $budget->paid_amount,
        ]);
    }

    /**
     * Recompute committed_amount from the activity's current honor
     * details and hard-block if it exceeds budget_amount.
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

        $budget->update(['committed_amount' => $committed]);

        return $budget->fresh();
    }

    public function approve(Activity $activity): void
    {
        $budget = $activity->budget;

        if ($budget) {
            $budget->update(['approved_amount' => $budget->committed_amount]);
        }
    }

    public function recordPayment(Activity $activity, int $amount): void
    {
        $budget = $activity->budget;

        if (! $budget) {
            return;
        }

        $paid = $budget->paid_amount + $amount;

        $budget->update([
            'paid_amount' => $paid,
            'remaining_amount' => $budget->budget_amount - $paid,
        ]);
    }
}
