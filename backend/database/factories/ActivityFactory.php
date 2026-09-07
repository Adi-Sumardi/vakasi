<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\ActivityType;
use App\Models\FundSource;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'activity_code' => 'KEG-TEST-'.fake()->unique()->numerify('####'),
            'activity_type_id' => ActivityType::factory(),
            'unit_id' => Unit::factory(),
            'fund_source_id' => FundSource::factory(),
            'name' => fake()->sentence(3),
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'budget_amount' => 1_000_000,
            'status' => Activity::DRAFT,
            'created_by' => User::factory(),
        ];
    }
}
