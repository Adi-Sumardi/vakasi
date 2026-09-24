<?php

namespace Database\Factories;

use App\Models\HonorDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HonorDetail>
 */
class HonorDetailFactory extends Factory
{
    /**
     * Defaults satisfy the honor formula so a factory-made line is never
     * internally inconsistent: gross = rate_snapshot x volume, and
     * net = gross - tax - deduction (AI_CODING_RULES.md section 4).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $rate = 25000;
        $volume = 8;

        return [
            'rate_snapshot' => $rate,
            'volume' => $volume,
            'unit_snapshot' => 'jam',
            'gross_amount' => $rate * $volume,
            'tax_amount' => 0,
            'deduction_amount' => 0,
            'net_amount' => $rate * $volume,
        ];
    }
}
