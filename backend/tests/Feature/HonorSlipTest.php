<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Employee;
use App\Models\HonorDetail;
use App\Models\HonorType;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * PRD.md FR-12: printable honor slip PDF. Reuses ActivityPolicy::view
 * for authorization, so a TU cannot print a slip for an activity they
 * don't own — same data-scope rule as everywhere else honor data is
 * exposed.
 */
class HonorSlipTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): mixed
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'web');
    }

    private function makeHonorDetail(Activity $activity, Employee $employee): HonorDetail
    {
        $honorType = HonorType::factory()->create();
        $member = $activity->members()->create(['employee_id' => $employee->id, 'role_name' => 'Pengawas']);

        return HonorDetail::create([
            'activity_id' => $activity->id,
            'activity_member_id' => $member->id,
            'employee_id' => $employee->id,
            'honor_type_id' => $honorType->id,
            'rate_snapshot' => 50000,
            'volume' => 2,
            'unit_snapshot' => 'JAM',
            'gross_amount' => 100000,
            'tax_amount' => 0,
            'deduction_amount' => 0,
            'net_amount' => 100000,
        ]);
    }

    public function test_owner_can_download_honor_slip_pdf(): void
    {
        $role = Role::firstOrCreate(['name' => 'tu'], ['description' => 'TU']);
        $role->permissions()->syncWithoutDetaching(
            Permission::firstOrCreate(['name' => 'documents.view'], ['module' => 'documents', 'action' => 'view']),
        );
        $tu = User::factory()->create(['role_id' => $role->id]);

        $activity = Activity::factory()->create(['created_by' => $tu->id]);
        $employee = Employee::factory()->create();
        $this->makeHonorDetail($activity, $employee);

        $response = $this->as($tu)->get("/api/v1/activities/{$activity->id}/employees/{$employee->id}/honor-slip");

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_non_owner_tu_cannot_download_honor_slip_for_someone_elses_activity(): void
    {
        $role = Role::firstOrCreate(['name' => 'tu'], ['description' => 'TU']);
        $role->permissions()->syncWithoutDetaching(
            Permission::firstOrCreate(['name' => 'documents.view'], ['module' => 'documents', 'action' => 'view']),
        );
        $owner = User::factory()->create(['role_id' => $role->id]);
        $stranger = User::factory()->create(['role_id' => $role->id]);

        $activity = Activity::factory()->create(['created_by' => $owner->id]);
        $employee = Employee::factory()->create();
        $this->makeHonorDetail($activity, $employee);

        $this->as($stranger)->get("/api/v1/activities/{$activity->id}/employees/{$employee->id}/honor-slip")->assertForbidden();
    }

    public function test_returns_404_when_employee_has_no_honor_on_this_activity(): void
    {
        $role = Role::firstOrCreate(['name' => 'super_admin'], ['description' => 'Super Admin']);
        $role->permissions()->syncWithoutDetaching(
            Permission::firstOrCreate(['name' => 'documents.view'], ['module' => 'documents', 'action' => 'view']),
        );
        $admin = User::factory()->create(['role_id' => $role->id]);

        $activity = Activity::factory()->create();
        $employee = Employee::factory()->create();

        $this->as($admin)->get("/api/v1/activities/{$activity->id}/employees/{$employee->id}/honor-slip")->assertNotFound();
    }
}
