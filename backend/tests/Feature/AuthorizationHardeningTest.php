<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityMember;
use App\Models\Employee;
use App\Models\HonorDetail;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

/**
 * Object-level authorization: route permissions say a role may use a
 * feature at all, but every one of these cases is about *which record*
 * it may touch (ROLE_PERMISSION.md section 7.3).
 */
class AuthorizationHardeningTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    public function test_member_routes_are_scoped_to_their_activity(): void
    {
        $tu = $this->userWithRole('tu', ['activities.update']);
        $stranger = User::factory()->create(['role_id' => $tu->role_id]);

        $mine = Activity::factory()->create(['created_by' => $tu->id, 'status' => Activity::DRAFT]);
        $theirs = Activity::factory()->create(['created_by' => $stranger->id, 'status' => Activity::DRAFT]);

        $victim = ActivityMember::factory()->create([
            'activity_id' => $theirs->id,
            'employee_id' => Employee::factory()->create()->id,
            'role_name' => 'Panitia',
        ]);

        // Authorizing against an activity the actor owns must not let
        // them act on a member belonging to someone else's activity.
        $this->as($tu)->deleteJson("/api/v1/activities/{$mine->id}/members/{$victim->id}")
            ->assertNotFound();
        $this->as($tu)->putJson("/api/v1/activities/{$mine->id}/members/{$victim->id}", ['role_name' => 'Ketua'])
            ->assertNotFound();

        $this->assertDatabaseHas('activity_members', ['id' => $victim->id, 'role_name' => 'Panitia']);
    }

    public function test_employee_cannot_download_a_colleagues_honor_slip(): void
    {
        $me = Employee::factory()->create();
        $colleague = Employee::factory()->create();

        $guru = $this->userWithRole('guru_tendik', ['activities.view', 'documents.view']);
        $guru->update(['employee_id' => $me->id]);

        $activity = Activity::factory()->create(['status' => Activity::APPROVED]);
        $honorType = HonorType::factory()->create();
        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'rate' => 25000]);

        foreach ([$me, $colleague] as $employee) {
            $member = ActivityMember::factory()->create([
                'activity_id' => $activity->id,
                'employee_id' => $employee->id,
                'role_name' => 'Panitia',
            ]);
            HonorDetail::factory()->create([
                'activity_id' => $activity->id,
                'activity_member_id' => $member->id,
                'employee_id' => $employee->id,
                'honor_type_id' => $honorType->id,
            ]);
        }

        $this->as($guru)->get("/api/v1/activities/{$activity->id}/employees/{$colleague->id}/honor-slip")
            ->assertForbidden();
        $this->as($guru)->get("/api/v1/activities/{$activity->id}/employees/{$me->id}/honor-slip")
            ->assertOk();
    }

    public function test_guru_only_sees_their_own_employee_record(): void
    {
        $me = Employee::factory()->create();
        Employee::factory()->count(3)->create();

        $guru = $this->userWithRole('guru_tendik', ['employees.view']);
        $guru->update(['employee_id' => $me->id]);

        $response = $this->as($guru)->getJson('/api/v1/employees')->assertOk();

        $this->assertSame([$me->id], collect($response->json('data'))->pluck('id')->all());
    }

    public function test_bank_account_number_is_masked_from_viewers_who_do_not_need_it(): void
    {
        $employee = Employee::factory()->create(['bank_account_number' => '1234567890']);

        $auditor = $this->userWithRole('auditor', ['employees.view']);
        $admin = $this->userWithRole('admin', ['employees.view', 'employees.manage']);

        $this->as($auditor)->getJson("/api/v1/employees/{$employee->id}")
            ->assertOk()
            ->assertJsonPath('data.bank_account_number', '******7890')
            ->assertJsonPath('data.bank_account_name', null);

        $this->as($admin)->getJson("/api/v1/employees/{$employee->id}")
            ->assertOk()
            ->assertJsonPath('data.bank_account_number', '1234567890');
    }

    public function test_admin_cannot_reset_a_super_admins_password(): void
    {
        $admin = $this->userWithRole('admin', ['users.manage']);
        $superRole = Role::firstOrCreate(['name' => 'super_admin'], ['description' => 'Super Admin']);
        $superAdmin = User::factory()->create(['role_id' => $superRole->id]);

        // Blocking role promotion alone is not enough — resetting the
        // password is an equivalent takeover path.
        $this->as($admin)->putJson("/api/v1/users/{$admin->id}", ['role_id' => $superRole->id])
            ->assertStatus(422);
        $this->as($admin)->putJson("/api/v1/users/{$superAdmin->id}", ['password' => 'takeover123'])
            ->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->assertFalse(
            auth('web')->attempt(['email' => $superAdmin->email, 'password' => 'takeover123']),
        );
    }

    public function test_user_cannot_deactivate_or_demote_their_own_account(): void
    {
        $admin = $this->userWithRole('admin', ['users.manage']);
        $tuRole = Role::firstOrCreate(['name' => 'tu'], ['description' => 'TU']);

        $this->as($admin)->putJson("/api/v1/users/{$admin->id}", ['status' => 'inactive'])
            ->assertForbidden();
        $this->as($admin)->putJson("/api/v1/users/{$admin->id}", ['role_id' => $tuRole->id])
            ->assertForbidden();
    }

    public function test_keuangan_can_actually_use_its_honor_calculation_permission(): void
    {
        $keuangan = $this->userWithRole('keuangan', ['activities.view', 'honors.calculate']);
        $employee = Employee::factory()->create();
        $honorType = HonorType::factory()->create();

        $activity = Activity::factory()->create(['status' => Activity::DRAFT, 'budget_amount' => 1_000_000]);
        HonorRate::factory()->create([
            'honor_type_id' => $honorType->id,
            'rate' => 25000,
            'effective_from' => $activity->start_date->toDateString(),
        ]);
        ActivityMember::factory()->create([
            'activity_id' => $activity->id,
            'employee_id' => $employee->id,
            'role_name' => 'Panitia',
        ]);

        $this->as($keuangan)->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 4]],
        ])->assertOk()->assertJsonPath('data.net_amount', 100000);
    }
}
