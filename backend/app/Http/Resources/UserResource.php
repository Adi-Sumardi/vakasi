<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'employee_id' => $this->employee_id,
            'unit_id' => $this->unit_id,
            'role' => $this->whenLoaded('role', fn () => [
                'id' => $this->role->id,
                'name' => $this->role->name,
            ]),
            // null = seluruh unit (yayasan).
            'unit' => $this->whenLoaded('unit', fn () => $this->unit ? [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
            ] : null),
            'scoped_unit_id' => $this->scopedUnitId(),
            'permissions' => $this->whenLoaded('role', fn () => $this->role
                ?->permissions
                ->pluck('name')
                ->values()),
            'last_login_at' => $this->last_login_at,
        ];
    }
}
