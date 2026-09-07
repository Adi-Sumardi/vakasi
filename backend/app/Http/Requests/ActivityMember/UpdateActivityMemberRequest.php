<?php

namespace App\Http\Requests\ActivityMember;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActivityMemberRequest extends FormRequest
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
            'role_name' => ['sometimes', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
