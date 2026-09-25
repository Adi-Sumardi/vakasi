<?php

namespace App\Http\Requests\HonorRate;

use Illuminate\Foundation\Http\FormRequest;

class UploadHonorRateDecreeRequest extends FormRequest
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
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }
}
