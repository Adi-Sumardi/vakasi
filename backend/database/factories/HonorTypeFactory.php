<?php

namespace Database\Factories;

use App\Models\HonorType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HonorType>
 */
class HonorTypeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'HT-'.strtoupper(fake()->unique()->lexify('????')),
            'name' => fake()->words(2, true),
            'unit' => 'JAM',
            'status' => 'active',
        ];
    }
}
