<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Grants the new master-data.delete permission to Super Admin on existing
 * installs (RolePermissionSeeder does the same for fresh ones).
 */
return new class extends Migration
{
    public function up(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'master-data.delete')->value('id')
            ?? DB::table('permissions')->insertGetId([
                'name' => 'master-data.delete',
                'module' => 'master-data',
                'action' => 'delete',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        $superAdmin = DB::table('roles')->where('name', 'super_admin')->value('id');

        if ($superAdmin) {
            DB::table('role_permission')->updateOrInsert(['role_id' => $superAdmin, 'permission_id' => $permissionId]);
        }
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'master-data.delete')->value('id');

        if ($permissionId) {
            DB::table('role_permission')->where('permission_id', $permissionId)->delete();
            DB::table('permissions')->where('id', $permissionId)->delete();
        }
    }
};
