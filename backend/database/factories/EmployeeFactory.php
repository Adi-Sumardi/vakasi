<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\Position;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'unit_id' => Unit::factory(),
            'position_id' => Position::factory(),
            'employee_code' => 'EMP-'.fake()->unique()->numerify('#####'),
            'nip' => fake()->numerify('##################'),
            'name' => fake()->name(),
            'employee_type' => fake()->randomElement(['guru', 'tu', 'tendik', 'panitia']),
            'status' => 'active',
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => 'inactive']);
    }
}
