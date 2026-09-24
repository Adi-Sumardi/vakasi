<?php

namespace Tests\Concerns;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\TestResponse;

trait CreatesUsersWithRoles
{
    /**
     * @param  array<int, string>  $permissions
     */
    protected function userWithRole(string $roleName, array $permissions = []): User
    {
        $role = Role::firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        foreach ($permissions as $name) {
            [$module, $action] = explode('.', $name);
            $permission = Permission::firstOrCreate(['name' => $name], ['module' => $module, 'action' => $action]);
            $role->permissions()->syncWithoutDetaching($permission);
        }

        return User::factory()->create(['role_id' => $role->id]);
    }

    /**
     * Sanctum's RequestGuard caches the resolved user, and the app
     * instance persists across requests within one test — forgetGuards()
     * forces a fresh resolution when switching actors.
     */
    protected function as(User $user): TestResponse|static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'web');
    }
}
