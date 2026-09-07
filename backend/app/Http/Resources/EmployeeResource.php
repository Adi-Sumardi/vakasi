<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'nip' => $this->nip,
            'nuptk' => $this->nuptk,
            'name' => $this->name,
            'employee_type' => $this->employee_type,
            'status' => $this->status,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'position' => new PositionResource($this->whenLoaded('position')),
            'bank_name' => $this->bank_name,
            'bank_account_name' => $this->bank_account_name,
            'bank_account_number' => $this->bank_account_number,
        ];
    }
}
