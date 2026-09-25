<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'budget_code' => $this->budget_code,
            'budget_amount' => $this->budget_amount,
            'committed_amount' => $this->committed_amount,
            'approved_amount' => $this->approved_amount,
            'paid_amount' => $this->paid_amount,
            // Pembayaran terjadi di Sianggar; nilai ini cermin dari callback
            // "dibayar" (activity_disbursements), bukan dari modul Payment.
            'disbursed_amount' => $this->whenLoaded('activity', function () {
                $disbursement = $this->activity->relationLoaded('disbursement') ? $this->activity->disbursement : null;

                return $disbursement?->isPaid() ? (int) ($disbursement->approved_amount ?? $this->approved_amount) : 0;
            }),
            'remaining_amount' => $this->remaining_amount,
            'status' => $this->status,
            'activity' => $this->whenLoaded('activity', fn () => [
                'id' => $this->activity->id,
                'activity_code' => $this->activity->activity_code,
                'name' => $this->activity->name,
                'status' => $this->activity->status,
                'unit' => $this->activity->relationLoaded('unit') ? $this->activity->unit?->name : null,
                'fund_source' => $this->activity->relationLoaded('fundSource') ? $this->activity->fundSource?->name : null,
            ]),
        ];
    }
}
