<?php

namespace App\Http\Requests\Payment;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Payment evidence has its own vocabulary: PaymentService::complete()
 * requires a document of type "bukti_transfer" specifically, so the
 * upload endpoint must not accept activity document types that could
 * never satisfy it.
 */
class StorePaymentEvidenceRequest extends FormRequest
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
            'document_type' => ['required', 'string', Rule::in(Document::PAYMENT_EVIDENCE_TYPES)],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }
}
