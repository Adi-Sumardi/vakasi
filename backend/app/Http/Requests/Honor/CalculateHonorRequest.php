<?php

namespace App\Http\Requests\Honor;

use Illuminate\Foundation\Http\FormRequest;

class CalculateHonorRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.employee_id' => ['required', 'exists:employees,id'],
            'items.*.honor_type_id' => ['required', 'exists:honor_types,id'],
            'items.*.volume' => ['required', 'integer', 'min:1'],
            'items.*.tax_amount' => ['sometimes', 'integer', 'min:0'],
            'items.*.deduction_amount' => ['sometimes', 'integer', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
