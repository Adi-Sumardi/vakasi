<?php

namespace Database\Factories;

use App\Models\ActivityType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityType>
 */
class ActivityTypeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'AT-'.strtoupper(fake()->unique()->lexify('???')),
            'name' => fake()->words(2, true),
            'status' => 'active',
        ];
    }
}
