<?php

namespace App\Http\Requests\User;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => [
                'required',
                'exists:roles,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    // The `users.manage` permission alone isn't enough
                    // to mint new Super Admins (ROLE_PERMISSION.md
                    // matrix currently grants it to Admin too) — only
                    // an existing Super Admin may grant that role.
                    $role = Role::find($value);

                    if ($role?->name === 'super_admin' && ! $this->user()?->hasRole('super_admin')) {
                        $fail('Hanya Super Admin yang dapat memberikan role Super Admin.');
                    }
                },
            ],
        ];
    }
}
