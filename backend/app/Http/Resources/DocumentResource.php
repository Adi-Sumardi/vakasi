<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_type' => $this->document_type,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'uploaded_by' => $this->whenLoaded('uploader', fn () => $this->uploader->name),
            'activity' => $this->whenLoaded('activity', fn () => $this->activity ? [
                'id' => $this->activity->id,
                'activity_code' => $this->activity->activity_code,
                'name' => $this->activity->name,
            ] : null),
            'payment' => $this->whenLoaded('payment', fn () => $this->payment ? [
                'id' => $this->payment->id,
                'payment_number' => $this->payment->payment_number,
            ] : null),
            'created_at' => $this->created_at,
        ];
    }
}
