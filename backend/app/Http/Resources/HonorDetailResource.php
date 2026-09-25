<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HonorDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'honor_type' => new HonorTypeResource($this->whenLoaded('honorType')),
            'activity' => $this->whenLoaded('activity', fn () => [
                'id' => $this->activity->id,
                'activity_code' => $this->activity->activity_code,
                'name' => $this->activity->name,
            ]),
            'activity_member_id' => $this->activity_member_id,
            'role_name' => $this->whenLoaded('activityMember', fn () => $this->activityMember?->role_name),
            'rate_snapshot' => $this->rate_snapshot,
            'rate_decree_number' => $this->rate_decree_number_snapshot,
            'volume' => $this->volume,
            'unit_snapshot' => $this->unit_snapshot,
            'gross_amount' => $this->gross_amount,
            'tax_amount' => $this->tax_amount,
            'deduction_amount' => $this->deduction_amount,
            'net_amount' => $this->net_amount,
            'notes' => $this->notes,
        ];
    }
}
