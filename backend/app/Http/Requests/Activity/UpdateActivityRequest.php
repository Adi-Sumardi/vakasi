<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActivityRequest extends FormRequest
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
            'activity_type_id' => ['sometimes', 'exists:activity_types,id'],
            'unit_id' => ['sometimes', 'exists:units,id'],
            'fund_source_id' => ['sometimes', 'exists:fund_sources,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
            'location' => ['nullable', 'string', 'max:255'],
            'budget_amount' => ['sometimes', 'integer', 'min:0'],
            'pic_employee_id' => ['nullable', 'exists:employees,id'],
        ];
    }
}
