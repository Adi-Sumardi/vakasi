<?php

namespace App\Http\Requests\HonorRate;

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
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
