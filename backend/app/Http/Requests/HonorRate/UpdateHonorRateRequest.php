<?php

namespace App\Http\Requests\HonorRate;

use App\Models\HonorRate;
use App\Rules\NoOverlappingHonorRate;
use Illuminate\Foundation\Http\FormRequest;

class UpdateHonorRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var HonorRate $rate */
        $rate = $this->route('honorRate');

        // A partial update may omit honor_type_id/unit_id/effective_to, so
        // the overlap check has to fall back to the stored values —
        // otherwise it would compare the new period against the wrong
        // honor type and let a genuine overlap through.
        $honorTypeId = (int) ($this->input('honor_type_id') ?? $rate->honor_type_id);
        $unitId = $this->has('unit_id') ? $this->input('unit_id') : $rate->unit_id;
        $effectiveTo = $this->has('effective_to')
            ? $this->input('effective_to')
            : $rate->effective_to?->toDateString();

        return [
            'honor_type_id' => ['sometimes', 'exists:honor_types,id'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'rate' => ['sometimes', 'integer', 'min:1'],
            'effective_from' => [
                'sometimes',
                'date',
                new NoOverlappingHonorRate(
                    $honorTypeId,
                    $unitId !== null ? (int) $unitId : null,
                    $effectiveTo,
                    $rate->id,
                ),
            ],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
