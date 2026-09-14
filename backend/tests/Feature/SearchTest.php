<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Backs the header search box (previously decorative — see audit).
 * Verifies each section respects the requesting user's permissions
 * and existing data scope, matching ActivityController::index /
 * DocumentController::all rather than introducing a new leak.
 */
class SearchTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): mixed
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'web');
    }

    public function test_search_returns_empty_sections_for_a_query_shorter_than_two_characters(): void
    {
        $role = Role::firstOrCreate(['name' => 'super_admin'], ['description' => 'Super Admin']);
        $admin = User::factory()->create(['role_id' => $role->id]);

        $response = $this->as($admin)->getJson('/api/v1/search?q=a');

        $response->assertOk();
        $response->assertJsonPath('data.activities', []);
        $response->assertJsonPath('data.employees', []);
        $response->assertJsonPath('data.documents', []);
    }

    public function test_tu_search_only_returns_their_own_activities(): void
    {
        $role = Role::firstOrCreate(['name' => 'tu'], ['description' => 'TU']);
        $role->permissions()->syncWithoutDetaching(
            Permission::firstOrCreate(['name' => 'activities.view'], ['module' => 'activities', 'action' => 'view']),
        );
        $tu = User::factory()->create(['role_id' => $role->id]);

        $myActivity = Activity::factory()->create(['created_by' => $tu->id, 'name' => 'Rapat Kurikulum Semester Ganjil']);
        Activity::factory()->create(['name' => 'Rapat Kurikulum Semester Genap']);

        $response = $this->as($tu)->getJson('/api/v1/search?q=Rapat+Kurikulum');

        $response->assertOk();
        $ids = collect($response->json('data.activities'))->pluck('id');
        $this->assertEquals([$myActivity->id], $ids->all());
    }

    public function test_search_omits_a_section_the_user_lacks_permission_for(): void
    {
        $role = Role::firstOrCreate(['name' => 'no_employee_access'], ['description' => 'Limited']);
        $role->permissions()->syncWithoutDetaching(
            Permission::firstOrCreate(['name' => 'activities.view'], ['module' => 'activities', 'action' => 'view']),
        );
        $user = User::factory()->create(['role_id' => $role->id]);

        Employee::factory()->create(['name' => 'Budi Santoso']);

        $response = $this->as($user)->getJson('/api/v1/search?q=Budi');

        $response->assertOk();
        $response->assertJsonPath('data.employees', []);
    }
}
