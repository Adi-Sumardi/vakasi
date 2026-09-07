<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_number' => $this->payment_number,
            'activity' => $this->whenLoaded('activity', fn () => [
                'id' => $this->activity->id,
                'activity_code' => $this->activity->activity_code,
                'name' => $this->activity->name,
            ]),
            'payment_date' => $this->payment_date?->toDateString(),
            'payment_method' => $this->payment_method,
            'source_account' => $this->source_account,
            'total_amount' => $this->total_amount,
            'reference_number' => $this->reference_number,
            'status' => $this->status,
            'processor' => $this->whenLoaded('processor', fn () => $this->processor->name),
            'details' => PaymentDetailResource::collection($this->whenLoaded('details')),
        ];
    }
}
