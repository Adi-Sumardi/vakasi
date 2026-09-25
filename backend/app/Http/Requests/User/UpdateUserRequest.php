<?php

namespace App\Http\Requests\User;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password' => ['sometimes', 'string', 'min:8'],
            // Kosong = akun berlaku untuk seluruh unit.
            'unit_id' => ['nullable', 'exists:units,id'],
            'role_id' => [
                'sometimes',
                'exists:roles,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    // Same rule as StoreUserRequest: `users.manage`
                    // alone (currently also granted to Admin) must not
                    // be enough to promote a user to Super Admin.
                    $role = Role::find($value);

                    if ($role?->name === 'super_admin' && ! $this->user()?->hasRole('super_admin')) {
                        $fail('Hanya Super Admin yang dapat memberikan role Super Admin.');
                    }
                },
            ],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
