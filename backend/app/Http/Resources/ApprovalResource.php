<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'approval_type' => $this->approval_type,
            'sequence' => $this->sequence,
            'status' => $this->status,
            'approver' => $this->whenLoaded('approver', fn () => [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ]),
            'decision_at' => $this->decision_at,
            'notes' => $this->notes,
            'logs' => $this->whenLoaded('logs', fn () => $this->logs->map(fn ($log) => [
                'action' => $log->action,
                'from_status' => $log->from_status,
                'to_status' => $log->to_status,
                'notes' => $log->notes,
                'acted_by' => $log->actor?->name,
                'acted_at' => $log->acted_at,
            ])),
        ];
    }
}
