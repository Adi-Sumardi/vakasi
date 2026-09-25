<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityDisbursementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'nomor_pengajuan' => $this->nomor_pengajuan,
            'no_surat' => $this->no_surat,
            'status_proses' => $this->status_proses,
            'current_stage' => $this->current_stage,
            'approved_amount' => $this->approved_amount !== null ? (int) $this->approved_amount : null,
            'no_voucher' => $this->no_voucher,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'last_event_at' => $this->last_event_at?->toIso8601String(),
            'last_note' => $this->whenLoaded('latestEvent', fn () => $this->latestEvent?->note),
            'events' => $this->whenLoaded('events', fn () => $this->events->map(fn ($event) => [
                'event_type' => $event->event_type,
                'stage' => $event->stage,
                'status' => $event->status,
                'actor_name' => $event->actor_name,
                'note' => $event->note,
                'occurred_at' => $event->occurred_at?->toIso8601String(),
            ])->values()),
        ];
    }
}
