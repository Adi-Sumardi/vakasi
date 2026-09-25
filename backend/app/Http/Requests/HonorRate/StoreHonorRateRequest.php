<?php

namespace App\Http\Requests\HonorRate;

use App\Rules\NoOverlappingHonorRate;
use Illuminate\Foundation\Http\FormRequest;

class StoreHonorRateRequest extends FormRequest
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
        return [
            'honor_type_id' => ['required', 'exists:honor_types,id'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'rate' => ['required', 'integer', 'min:1'],
            // A new tariff must name the SK Yayasan it comes from; the
            // scan itself is uploaded separately (HonorRateController::uploadDecree).
            'decree_number' => ['required', 'string', 'max:100'],
            'decree_date' => ['nullable', 'date'],
            'effective_from' => [
                'required',
                'date',
                new NoOverlappingHonorRate(
                    (int) $this->input('honor_type_id'),
                    $this->input('unit_id') !== null ? (int) $this->input('unit_id') : null,
                    $this->input('effective_to'),
                    null,
                ),
            ],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
