<?php

namespace App\Rules;

use App\Models\HonorRate;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Two active rates for the same honor type, unit and date make
 * HonorRate::scopeActiveFor() pick one by ordering alone — the amount an
 * activity is charged would then depend on the order rows happen to be
 * stored in. BR-02 wants "master tarif aktif", singular, so overlapping
 * validity periods are rejected at the source.
 */
class NoOverlappingHonorRate implements ValidationRule
{
    public function __construct(
        private readonly int $honorTypeId,
        private readonly ?int $unitId,
        private readonly ?string $effectiveTo,
        private readonly ?int $ignoreId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $from = (string) $value;
        $to = $this->effectiveTo;

        $overlapping = HonorRate::query()
            ->where('honor_type_id', $this->honorTypeId)
            ->where('status', 'active')
            ->when($this->unitId === null, fn ($q) => $q->whereNull('unit_id'))
            ->when($this->unitId !== null, fn ($q) => $q->where('unit_id', $this->unitId))
            ->when($this->ignoreId !== null, fn ($q) => $q->whereKeyNot($this->ignoreId))
            // Two ranges overlap unless one ends before the other starts.
            // A null effective_to means "open ended", so it overlaps
            // anything starting on or after its effective_from.
            ->where(fn ($q) => $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $from))
            ->when($to !== null, fn ($q) => $q->whereDate('effective_from', '<=', $to))
            ->exists();

        if ($overlapping) {
            $fail('Sudah ada tarif aktif untuk jenis honor dan unit ini pada periode yang bertumpang tindih.');
        }
    }
}
