<?php

namespace Database\Factories;

use App\Models\HonorType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HonorRate>
 */
class HonorRateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'honor_type_id' => HonorType::factory(),
            'unit_id' => null,
            'rate' => 25000,
            'effective_from' => '2026-01-01',
            'effective_to' => null,
            'status' => 'active',
        ];
    }
}
