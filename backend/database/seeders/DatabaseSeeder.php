<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);
        $this->call(MasterDataSeeder::class);

        $roles = Role::pluck('id', 'name');

        $demoUsers = [
            ['name' => 'Super Admin', 'email' => 'superadmin@vakasi.test', 'role' => 'super_admin'],
            ['name' => 'Admin Sekolah', 'email' => 'admin@vakasi.test', 'role' => 'admin'],
            ['name' => 'Budi Santoso (TU)', 'email' => 'tu@vakasi.test', 'role' => 'tu'],
            ['name' => 'Dr. Kepala Sekolah', 'email' => 'kepsek@vakasi.test', 'role' => 'kepala_sekolah'],
            ['name' => 'Staf Keuangan', 'email' => 'keuangan@vakasi.test', 'role' => 'keuangan'],
            ['name' => 'Auditor Internal', 'email' => 'auditor@vakasi.test', 'role' => 'auditor'],
        ];

        foreach ($demoUsers as $demoUser) {
            User::factory()->create([
                'name' => $demoUser['name'],
                'email' => $demoUser['email'],
                'role_id' => $roles[$demoUser['role']],
            ]);
        }
    }
}
