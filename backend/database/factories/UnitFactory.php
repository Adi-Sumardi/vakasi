<?php

namespace Database\Factories;

use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Unit>
 */
class UnitFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'UNIT-'.strtoupper(fake()->unique()->lexify('???')),
            'name' => fake()->words(2, true),
            'status' => 'active',
        ];
    }
}
