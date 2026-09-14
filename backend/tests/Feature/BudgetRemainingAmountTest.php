<?php

namespace Tests\Feature;

use App\Models\ActivityType;
use App\Models\Employee;
use App\Models\FundSource;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression test for a real bug found in audit: BudgetService never
 * subtracted committed_amount from remaining_amount (only paid_amount
 * was ever subtracted) — so the Anggaran page showed the full budget
 * as "remaining" even while most of it was already committed to
 * calculated-but-unpaid honor.
 */
class BudgetRemainingAmountTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): mixed
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'web');
    }

    public function test_remaining_amount_reflects_committed_honor_before_any_payment(): void
    {
        $role = Role::firstOrCreate(['name' => 'tu'], ['description' => 'TU']);
        foreach (['activities.view', 'activities.create', 'activities.update', 'honors.calculate'] as $name) {
            [$module, $action] = explode('.', $name);
            $permission = Permission::firstOrCreate(['name' => $name], ['module' => $module, 'action' => $action]);
            $role->permissions()->syncWithoutDetaching($permission);
        }
        $tu = User::factory()->create(['role_id' => $role->id]);

        $employee = Employee::factory()->create();
        $honorType = HonorType::factory()->create();
        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'rate' => 25000, 'effective_from' => now()->toDateString()]);

        $activityId = $this->as($tu)->postJson('/api/v1/activities', [
            'activity_type_id' => ActivityType::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
            'fund_source_id' => FundSource::factory()->create()->id,
            'name' => 'Rapat Anggaran Test',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'budget_amount' => 1_000_000,
        ])->json('data.id');

        $this->assertDatabaseHas('budgets', [
            'activity_id' => $activityId,
            'committed_amount' => 0,
            'remaining_amount' => 1_000_000,
        ]);

        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/members", [
            'employee_id' => $employee->id,
            'role_name' => 'Panitia',
        ]);

        // 8 jam x Rp25.000 = Rp200.000 committed, nothing paid yet.
        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 8]],
        ])->assertOk();

        // Before the fix this stayed at 1_000_000 (budget - paid_amount,
        // paid_amount still 0) even though Rp200.000 is already spoken for.
        $this->assertDatabaseHas('budgets', [
            'activity_id' => $activityId,
            'committed_amount' => 200000,
            'remaining_amount' => 800000,
        ]);
    }
}
