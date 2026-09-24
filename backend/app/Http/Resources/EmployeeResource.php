<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /**
     * Bank details are payroll data, not directory data. Only roles that
     * actually need them are shown the account — whoever maintains the
     * master record (`employees.manage`), whoever disburses against it
     * (`payments.process`), and the employee themselves. Every other
     * viewer (Kepala Sekolah, Auditor, a colleague) gets the bank name
     * for context and a masked account number, per AI_CODING_RULES.md
     * section 9 "jangan expose sensitive fields".
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User|null $viewer */
        $viewer = $request->user();
        $showBankDetails = $viewer !== null && (
            $viewer->hasPermission('employees.manage')
            || $viewer->hasPermission('payments.process')
            || $viewer->employee_id === $this->id
        );

        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'nip' => $this->nip,
            'nuptk' => $this->nuptk,
            'name' => $this->name,
            'employee_type' => $this->employee_type,
            'status' => $this->status,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'position' => new PositionResource($this->whenLoaded('position')),
            'bank_name' => $this->bank_name,
            'bank_account_name' => $showBankDetails ? $this->bank_account_name : null,
            'bank_account_number' => $showBankDetails
                ? $this->bank_account_number
                : self::maskAccountNumber($this->bank_account_number),
        ];
    }

    /**
     * Keeps the last four digits so a user can still recognise which
     * account a record refers to without the number being readable.
     */
    private static function maskAccountNumber(?string $number): ?string
    {
        if ($number === null || $number === '') {
            return $number;
        }

        return strlen($number) <= 4
            ? str_repeat('*', strlen($number))
            : str_repeat('*', strlen($number) - 4).substr($number, -4);
    }
}
