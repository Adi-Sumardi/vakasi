<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MyHonorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'role_name' => $this->activityMember?->role_name,
            'honor_type' => $this->honorType?->name,
            'rate' => (int) $this->rate_snapshot,
            'volume' => (int) $this->volume,
            'unit' => $this->unit_snapshot,
            'amount' => (int) $this->net_amount,
            'activity' => [
                'id' => $this->activity->id,
                'activity_code' => $this->activity->activity_code,
                'name' => $this->activity->name,
                'unit' => $this->activity->unit?->name,
                'start_date' => $this->activity->start_date?->toDateString(),
                'status' => $this->activity->status,
                'disbursement_state' => $this->activity->disbursementState(),
                'paid_at' => $this->activity->disbursement?->paid_at?->toIso8601String(),
            ],
        ];
    }
}
