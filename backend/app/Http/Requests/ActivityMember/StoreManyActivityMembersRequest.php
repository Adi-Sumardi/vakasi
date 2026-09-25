<?php

namespace App\Http\Requests\ActivityMember;

use Illuminate\Foundation\Http\FormRequest;

class StoreManyActivityMembersRequest extends FormRequest
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
            'employee_ids' => ['required', 'array', 'min:1', 'max:200'],
            'employee_ids.*' => ['integer', 'distinct', 'exists:employees,id'],
            'role_name' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
