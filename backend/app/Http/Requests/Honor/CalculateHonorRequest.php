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
            // activity_member_id pins the line to one role when the same
            // employee holds several on this activity (e.g. Pengawas and
            // Korektor). employee_id alone is still accepted for the
            // common one-role case.
            'items.*.activity_member_id' => ['nullable', 'integer', 'required_without:items.*.employee_id'],
            'items.*.employee_id' => ['nullable', 'exists:employees,id', 'required_without:items.*.activity_member_id'],
            'items.*.honor_type_id' => ['required', 'exists:honor_types,id'],
            'items.*.volume' => ['required', 'integer', 'min:1'],
            'items.*.tax_amount' => ['sometimes', 'integer', 'min:0'],
            'items.*.deduction_amount' => ['sometimes', 'integer', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
