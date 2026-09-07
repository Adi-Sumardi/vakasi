<?php

namespace Database\Factories;

use App\Models\Position;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Position>
 */
class PositionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'POS-'.strtoupper(fake()->unique()->lexify('???')),
            'name' => fake()->jobTitle(),
            'status' => 'active',
        ];
    }
}
