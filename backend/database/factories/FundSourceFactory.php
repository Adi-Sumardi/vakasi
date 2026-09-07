<?php

namespace Database\Factories;

use App\Models\FundSource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FundSource>
 */
class FundSourceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'FS-'.strtoupper(fake()->unique()->lexify('???')),
            'name' => fake()->words(2, true),
            'status' => 'active',
        ];
    }
}
