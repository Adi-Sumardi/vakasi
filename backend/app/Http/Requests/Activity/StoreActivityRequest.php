<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;

class StoreActivityRequest extends FormRequest
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
            'activity_type_id' => ['required', 'exists:activity_types,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'fund_source_id' => ['required', 'exists:fund_sources,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'location' => ['nullable', 'string', 'max:255'],
            'budget_amount' => ['required', 'integer', 'min:0'],
            'pic_employee_id' => ['nullable', 'exists:employees,id'],
        ];
    }
}
