<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HonorRateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'honor_type' => new HonorTypeResource($this->whenLoaded('honorType')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'rate' => $this->rate,
            'decree_number' => $this->decree_number,
            'decree_date' => $this->decree_date?->toDateString(),
            'decree_file_name' => $this->decree_file_name,
            'has_decree_file' => filled($this->decree_file_path),
            'effective_from' => $this->effective_from?->toDateString(),
            'effective_to' => $this->effective_to?->toDateString(),
            'status' => $this->status,
        ];
    }
}
