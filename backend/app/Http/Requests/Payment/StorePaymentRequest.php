<?php

namespace App\Http\Requests\Payment;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
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
            'activity_id' => ['required', 'exists:activities,id'],
            // Not in the future: a payment cannot be recorded as having
            // been disbursed on a date that has not happened yet.
            'payment_date' => ['nullable', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', 'string', Rule::in(Payment::METHODS)],
            'source_account' => ['nullable', 'string', 'max:100'],
            'reference_number' => ['nullable', 'string', 'max:100'],
        ];
    }
}
