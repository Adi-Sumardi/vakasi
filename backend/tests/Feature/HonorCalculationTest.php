<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityMember;
use App\Models\Employee;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Honor Engine formula per ARSITEKTUR.md section 6 / TECHSTACK.md
 * section 5: gross = rate_snapshot x volume; net = gross - tax -
 * deduction. Deterministic and snapshot-based.
 */
class HonorCalculationTest extends TestCase
{
    use RefreshDatabase;

    private function actingTu(): User
    {
        $role = Role::create(['name' => 'tu', 'description' => 'TU']);
        $this->seedTuPermissions($role);

        return User::factory()->create(['role_id' => $role->id]);
    }

    private function seedTuPermissions(Role $role): void
    {
        foreach (['activities.view', 'activities.create', 'activities.update', 'honors.calculate'] as $name) {
            $permission = Permission::create(['name' => $name, 'module' => explode('.', $name)[0], 'action' => explode('.', $name)[1]]);
            $role->permissions()->attach($permission);
        }
    }

    private function makeActivityWithMember(User $creator): array
    {
        $employee = Employee::factory()->create();
        $activity = Activity::factory()->create(['created_by' => $creator->id, 'budget_amount' => 10_000_000]);
        $member = ActivityMember::create([
            'activity_id' => $activity->id,
            'employee_id' => $employee->id,
            'role_name' => 'Pengawas',
        ]);

        return [$activity, $member, $employee];
    }

    public function test_gross_and_net_amount_are_calculated_correctly(): void
    {
        $user = $this->actingTu();
        [$activity, , $employee] = $this->makeActivityWithMember($user);

        $honorType = HonorType::factory()->create();
        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'rate' => 25000, 'effective_from' => $activity->start_date]);

        $response = $this->actingAs($user, 'web')->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [
                ['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 8],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.gross_amount', 200000);
        $response->assertJsonPath('data.net_amount', 200000);

        $this->assertDatabaseHas('honor_details', [
            'activity_id' => $activity->id,
            'employee_id' => $employee->id,
            'rate_snapshot' => 25000,
            'volume' => 8,
            'gross_amount' => 200000,
            'net_amount' => 200000,
        ]);
    }

    public function test_tax_and_deduction_reduce_net_amount(): void
    {
        $user = $this->actingTu();
        [$activity, , $employee] = $this->makeActivityWithMember($user);

        $honorType = HonorType::factory()->create();
        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'rate' => 25000, 'effective_from' => $activity->start_date]);

        $response = $this->actingAs($user, 'web')->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [[
                'employee_id' => $employee->id,
                'honor_type_id' => $honorType->id,
                'volume' => 8,
                'tax_amount' => 5000,
                'deduction_amount' => 3000,
            ]],
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.gross_amount', 200000);
        $response->assertJsonPath('data.tax_amount', 5000);
        $response->assertJsonPath('data.deduction_amount', 3000);
        $response->assertJsonPath('data.net_amount', 192000);
    }

    public function test_zero_volume_is_rejected(): void
    {
        $user = $this->actingTu();
        [$activity, , $employee] = $this->makeActivityWithMember($user);
        $honorType = HonorType::factory()->create();
        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'effective_from' => $activity->start_date]);

        $response = $this->actingAs($user, 'web')->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 0]],
        ]);

        $response->assertStatus(422);
    }

    public function test_negative_volume_is_rejected(): void
    {
        $user = $this->actingTu();
        [$activity, , $employee] = $this->makeActivityWithMember($user);
        $honorType = HonorType::factory()->create();
        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'effective_from' => $activity->start_date]);

        $response = $this->actingAs($user, 'web')->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => -5]],
        ]);

        $response->assertStatus(422);
    }

    public function test_missing_active_rate_is_rejected(): void
    {
        $user = $this->actingTu();
        [$activity, , $employee] = $this->makeActivityWithMember($user);
        $honorType = HonorType::factory()->create();
        // No HonorRate created for this honor type.

        $response = $this->actingAs($user, 'web')->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 8]],
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['honor_type_id' => ["Tarif aktif untuk jenis honor \"{$honorType->name}\" tidak ditemukan pada periode kegiatan ini."]]);
    }

    public function test_changing_master_rate_does_not_affect_existing_honor_detail(): void
    {
        $user = $this->actingTu();
        [$activity, , $employee] = $this->makeActivityWithMember($user);
        $honorType = HonorType::factory()->create();
        $rate = HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'rate' => 25000, 'effective_from' => $activity->start_date]);

        $this->actingAs($user, 'web')->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 8]],
        ])->assertOk();

        // Master rate changes after the honor was calculated.
        $rate->update(['rate' => 50000]);

        $this->assertDatabaseHas('honor_details', [
            'activity_id' => $activity->id,
            'rate_snapshot' => 25000,
            'gross_amount' => 200000,
        ]);
    }

    public function test_honor_exceeding_budget_is_hard_blocked(): void
    {
        $user = $this->actingTu();
        $employee = Employee::factory()->create();
        $activity = Activity::factory()->create(['created_by' => $user->id, 'budget_amount' => 100000]);
        ActivityMember::create(['activity_id' => $activity->id, 'employee_id' => $employee->id, 'role_name' => 'Pengawas']);

        $honorType = HonorType::factory()->create();
        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'rate' => 25000, 'effective_from' => $activity->start_date]);

        $response = $this->actingAs($user, 'web')->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            // 25000 * 8 = 200.000, exceeds the 100.000 budget.
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 8]],
        ]);

        $response->assertStatus(422);
    }
}
