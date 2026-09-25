<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data migration for the menu redesign. RolePermissionSeeder only ever
 * adds grants (syncWithoutDetaching), so it cannot take the tariff and
 * master-data grants away from TU on an existing install — this does.
 * New permissions are created and granted the same way the seeder would.
 */
return new class extends Migration
{
    /** @var array<string, array{0: string, 1: string, 2: array<int, string>}> */
    private const NEW_PERMISSIONS = [
        'master-data.manage' => ['master-data', 'manage', ['super_admin', 'admin']],
        'roles.manage' => ['roles', 'manage', ['super_admin']],
        'my-honors.view' => ['my-honors', 'view', ['guru_tendik']],
    ];

    /** Grants TU no longer holds: tariffs and fund sources are yayasan-level. */
    private const REVOKED_FROM_TU = ['honor-rates.manage', 'budget.manage'];

    public function up(): void
    {
        $roles = DB::table('roles')->pluck('id', 'name');

        foreach (self::NEW_PERMISSIONS as $name => [$module, $action, $roleNames]) {
            $permissionId = DB::table('permissions')->where('name', $name)->value('id')
                ?? DB::table('permissions')->insertGetId([
                    'name' => $name,
                    'module' => $module,
                    'action' => $action,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            foreach ($roleNames as $roleName) {
                if (! isset($roles[$roleName])) {
                    continue;
                }

                DB::table('role_permission')->updateOrInsert([
                    'role_id' => $roles[$roleName],
                    'permission_id' => $permissionId,
                ]);
            }
        }

        if (isset($roles['tu'])) {
            DB::table('role_permission')
                ->where('role_id', $roles['tu'])
                ->whereIn('permission_id', DB::table('permissions')->whereIn('name', self::REVOKED_FROM_TU)->pluck('id'))
                ->delete();
        }
    }

    public function down(): void
    {
        $roles = DB::table('roles')->pluck('id', 'name');

        if (isset($roles['tu'])) {
            foreach (DB::table('permissions')->whereIn('name', self::REVOKED_FROM_TU)->pluck('id') as $permissionId) {
                DB::table('role_permission')->updateOrInsert([
                    'role_id' => $roles['tu'],
                    'permission_id' => $permissionId,
                ]);
            }
        }

        $ids = DB::table('permissions')->whereIn('name', array_keys(self::NEW_PERMISSIONS))->pluck('id');
        DB::table('role_permission')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('id', $ids)->delete();
    }
};
