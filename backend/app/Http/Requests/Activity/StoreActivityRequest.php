<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Master data must be *active*, not merely present: a plain `exists`
     * rule let a retired unit, a deactivated activity type or a closed
     * fund source be attached to a brand new activity. HonorType and
     * HonorRate were already checked this way in
     * HonorCalculationService — these three were the gap
     * (AI_CODING_RULES.md section 7).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'activity_type_id' => ['required', Rule::exists('activity_types', 'id')->where('status', 'active')],
            'unit_id' => [
                'required',
                Rule::exists('units', 'id')->where('status', 'active'),
                // An account tied to a unit raises activities for that
                // unit only.
                function (string $attribute, mixed $value, \Closure $fail) {
                    $unitId = $this->user()?->scopedUnitId();

                    if ($unitId !== null && (int) $value !== $unitId) {
                        $fail('Anda hanya dapat membuat kegiatan untuk unit Anda sendiri.');
                    }
                },
            ],
            'fund_source_id' => ['required', Rule::exists('fund_sources', 'id')->where('status', 'active')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'location' => ['nullable', 'string', 'max:255'],
            'budget_amount' => ['required', 'integer', 'min:0'],
            'pic_employee_id' => ['nullable', Rule::exists('employees', 'id')->where('status', 'active')],
        ];
    }
}
