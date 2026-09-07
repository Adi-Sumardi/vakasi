<?php

namespace App\Http\Requests\HonorRate;

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
        return [
            'honor_type_id' => ['sometimes', 'exists:honor_types,id'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'rate' => ['sometimes', 'integer', 'min:1'],
            'effective_from' => ['sometimes', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
