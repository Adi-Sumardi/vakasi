<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

/**
 * Seeds roles and permissions exactly as defined in ROLE_PERMISSION.md
 * section 3 (Permission Matrix). Role names are used elsewhere via
 * User::hasRole() / hasPermission(), so keep these slugs stable.
 */
class RolePermissionSeeder extends Seeder
{
    private const ROLES = [
        'super_admin' => 'Super Admin',
        'admin' => 'Admin',
        'tu' => 'TU',
        'kepala_sekolah' => 'Kepala Sekolah',
        'keuangan' => 'Keuangan',
        'guru_tendik' => 'Guru/Tendik',
        'auditor' => 'Auditor/Viewer',
    ];

    /**
     * permission.name => [module, action, roles that get it]
     *
     * "Own"/"Assigned" scopes from the matrix are still granted the
     * permission here — the actual row-level restriction is enforced
     * in the Service/Repository query layer per ROLE_PERMISSION.md 7.4,
     * not by withholding the permission itself.
     */
    private const PERMISSIONS = [
        'dashboard.view' => ['dashboard', 'view', ['super_admin', 'admin', 'tu', 'kepala_sekolah', 'keuangan', 'guru_tendik', 'auditor']],

        'employees.view' => ['employees', 'view', ['super_admin', 'admin', 'tu', 'kepala_sekolah', 'keuangan', 'guru_tendik', 'auditor']],
        'employees.manage' => ['employees', 'manage', ['super_admin', 'admin', 'tu']],

        'activities.view' => ['activities', 'view', ['super_admin', 'admin', 'tu', 'kepala_sekolah', 'keuangan', 'guru_tendik', 'auditor']],
        'activities.create' => ['activities', 'create', ['super_admin', 'admin', 'tu']],
        'activities.update' => ['activities', 'update', ['super_admin', 'admin', 'tu']],
        'activities.submit' => ['activities', 'submit', ['super_admin', 'admin', 'tu']],
        'activities.approve' => ['activities', 'approve', ['super_admin', 'kepala_sekolah']],

        'honor-rates.view' => ['honor-rates', 'view', ['super_admin', 'admin', 'tu', 'kepala_sekolah', 'keuangan', 'auditor']],
        'honor-rates.manage' => ['honor-rates', 'manage', ['super_admin', 'admin', 'tu']],
        'honors.calculate' => ['honors', 'calculate', ['super_admin', 'admin', 'tu', 'keuangan']],

        'budget.view' => ['budget', 'view', ['super_admin', 'admin', 'tu', 'kepala_sekolah', 'keuangan', 'auditor']],
        'budget.manage' => ['budget', 'manage', ['super_admin', 'admin', 'tu', 'keuangan']],

        'payments.view' => ['payments', 'view', ['super_admin', 'admin', 'tu', 'kepala_sekolah', 'keuangan', 'guru_tendik', 'auditor']],
        'payments.process' => ['payments', 'process', ['super_admin', 'keuangan']],

        'reports.view' => ['reports', 'view', ['super_admin', 'admin', 'tu', 'kepala_sekolah', 'keuangan', 'guru_tendik', 'auditor']],

        'documents.view' => ['documents', 'view', ['super_admin', 'admin', 'tu', 'kepala_sekolah', 'keuangan', 'guru_tendik', 'auditor']],
        'documents.manage' => ['documents', 'manage', ['super_admin', 'admin', 'tu', 'keuangan']],

        'audit.view' => ['audit', 'view', ['super_admin', 'admin', 'kepala_sekolah', 'keuangan', 'auditor']],

        'users.manage' => ['users', 'manage', ['super_admin', 'admin']],
    ];

    public function run(): void
    {
        $roles = collect(self::ROLES)->mapWithKeys(
            fn (string $label, string $slug) => [
                $slug => Role::query()->updateOrCreate(['name' => $slug], ['description' => $label]),
            ],
        );

        foreach (self::PERMISSIONS as $name => [$module, $action, $roleSlugs]) {
            $permission = Permission::query()->updateOrCreate(
                ['name' => $name],
                ['module' => $module, 'action' => $action],
            );

            $roleIds = collect($roleSlugs)->map(fn (string $slug) => $roles[$slug]->id);

            $permission->roles()->syncWithoutDetaching($roleIds);
        }
    }
}
