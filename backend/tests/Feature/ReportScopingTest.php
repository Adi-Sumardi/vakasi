<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Budget;
use App\Models\Employee;
use App\Models\HonorDetail;
use App\Models\HonorType;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression test for a document conflict found in audit: ROLE_PERMISSION.md's
 * matrix (section 3) showed TU with unscoped "✓" access while its narrative
 * (section 4) said TU is scoped to "kegiatan yang menjadi tanggung jawabnya".
 * ActivityController::index already resolved this in favor of the scoped
 * reading, but ReportService (powering /reports/*, i.e. Laporan & Anggaran)
 * had no scoping at all — a TU could see every unit's budgets/payments via
 * reports even though the Kegiatan list itself was restricted.
 */
class ReportScopingTest extends TestCase
{
    use RefreshDatabase;

    private function tuUser(): User
    {
        $role = Role::firstOrCreate(['name' => 'tu'], ['description' => 'TU']);
        $permission = Permission::firstOrCreate(['name' => 'reports.view'], ['module' => 'reports', 'action' => 'view']);
        $role->permissions()->syncWithoutDetaching($permission);

        return User::factory()->create(['role_id' => $role->id]);
    }

    private function as(User $user): mixed
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'web');
    }

    public function test_tu_only_sees_their_own_activities_in_the_activities_report(): void
    {
        $tu = $this->tuUser();
        $myActivity = Activity::factory()->create(['created_by' => $tu->id]);
        Activity::factory()->create();

        $response = $this->as($tu)->getJson('/api/v1/reports/activities');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$myActivity->id], $ids->all());
    }

    public function test_tu_only_sees_budget_for_their_own_activities(): void
    {
        $tu = $this->tuUser();
        $myActivity = Activity::factory()->create(['created_by' => $tu->id]);
        $otherActivity = Activity::factory()->create();

        $myBudget = Budget::create([
            'activity_id' => $myActivity->id, 'budget_code' => 'BUD-1', 'budget_amount' => 1000,
        ]);
        Budget::create([
            'activity_id' => $otherActivity->id, 'budget_code' => 'BUD-2', 'budget_amount' => 2000,
        ]);

        $response = $this->as($tu)->getJson('/api/v1/reports/budget');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$myBudget->id], $ids->all());

        // Regression: BudgetResource never included `activity` at all,
        // even though the Anggaran page (frontend BudgetRow type)
        // depends on `activity.id`/`activity_code`/`name` for its
        // table — the page crashed as soon as any real budget existed.
        $response->assertJsonPath('data.0.activity.id', $myActivity->id);
        $response->assertJsonPath('data.0.activity.activity_code', $myActivity->activity_code);
    }

    public function test_tu_only_sees_payments_for_their_own_activities(): void
    {
        $tu = $this->tuUser();
        $myActivity = Activity::factory()->create(['created_by' => $tu->id]);
        $otherActivity = Activity::factory()->create();

        $myPayment = Payment::create([
            'payment_number' => 'PAY-1', 'activity_id' => $myActivity->id, 'payment_date' => now(),
            'payment_method' => 'transfer', 'total_amount' => 1000, 'processed_by' => $tu->id,
        ]);
        Payment::create([
            'payment_number' => 'PAY-2', 'activity_id' => $otherActivity->id, 'payment_date' => now(),
            'payment_method' => 'transfer', 'total_amount' => 2000, 'processed_by' => $tu->id,
        ]);

        $response = $this->as($tu)->getJson('/api/v1/reports/payments');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$myPayment->id], $ids->all());
    }

    public function test_super_admin_sees_all_activities_in_the_activities_report(): void
    {
        $role = Role::firstOrCreate(['name' => 'super_admin'], ['description' => 'Super Admin']);
        $permission = Permission::firstOrCreate(['name' => 'reports.view'], ['module' => 'reports', 'action' => 'view']);
        $role->permissions()->syncWithoutDetaching($permission);
        $admin = User::factory()->create(['role_id' => $role->id]);

        Activity::factory()->count(3)->create();

        $response = $this->as($admin)->getJson('/api/v1/reports/activities');

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
    }

    /**
     * Regression test for a real crash found via E2E testing:
     * HonorDetailResource never included `activity` at all (only
     * `employee`/`honor_type`), even though the Rekap Honor page
     * (frontend HonorReportRow type) depends on `activity.id` for its
     * "kegiatan" column and "Cetak Slip" link — every row crashed the
     * page as soon as any real honor data existed.
     */
    public function test_honors_report_includes_the_parent_activity(): void
    {
        $role = Role::firstOrCreate(['name' => 'super_admin'], ['description' => 'Super Admin']);
        $permission = Permission::firstOrCreate(['name' => 'reports.view'], ['module' => 'reports', 'action' => 'view']);
        $role->permissions()->syncWithoutDetaching($permission);
        $admin = User::factory()->create(['role_id' => $role->id]);

        $activity = Activity::factory()->create();
        $employee = Employee::factory()->create();
        $honorType = HonorType::factory()->create();
        $member = $activity->members()->create(['employee_id' => $employee->id, 'role_name' => 'Pengawas']);
        HonorDetail::create([
            'activity_id' => $activity->id,
            'activity_member_id' => $member->id,
            'employee_id' => $employee->id,
            'honor_type_id' => $honorType->id,
            'rate_snapshot' => 50000,
            'volume' => 1,
            'unit_snapshot' => 'JAM',
            'gross_amount' => 50000,
            'net_amount' => 50000,
        ]);

        $response = $this->as($admin)->getJson('/api/v1/reports/honors');

        $response->assertOk();
        $response->assertJsonPath('data.0.activity.id', $activity->id);
        $response->assertJsonPath('data.0.activity.activity_code', $activity->activity_code);
    }
}
