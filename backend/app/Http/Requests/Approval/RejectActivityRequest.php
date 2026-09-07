<?php

namespace App\Http\Requests\Approval;

use Illuminate\Foundation\Http\FormRequest;

class RejectActivityRequest extends FormRequest
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
            // BR: "Semua reject wajib memiliki alasan" (BRD.md/PRD.md).
            'notes' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }
}
