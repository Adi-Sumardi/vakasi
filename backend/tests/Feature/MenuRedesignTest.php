<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityDisbursement;
use App\Models\ActivityMember;
use App\Models\Employee;
use App\Models\HonorDetail;
use App\Models\HonorType;
use App\Models\Permission;
use App\Models\Position;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

/**
 * Backend behind the redesigned menus: paging that no longer stops at
 * 20 rows, unit-scoped accounts, employee import, Status Pencairan,
 * the dashboard summary, Role & Hak Akses, exports and Honor Saya.
 */
class MenuRedesignTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private function seededUser(string $role, array $attributes = []): User
    {
        $this->seed(RolePermissionSeeder::class);

        return User::factory()->create(['role_id' => Role::where('name', $role)->value('id')] + $attributes);
    }

    public function test_lists_report_their_page_info_and_accept_a_page_size(): void
    {
        $admin = $this->userWithRole('admin', ['employees.view']);
        Employee::factory()->count(25)->create();

        $this->as($admin)->getJson('/api/v1/employees')
            ->assertOk()
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.last_page', 2);

        $this->as($admin)->getJson('/api/v1/employees?per_page=1000')->assertJsonCount(25, 'data');
    }

    public function test_a_unit_scoped_tu_sees_and_edits_only_its_unit(): void
    {
        $sd = Unit::factory()->create();
        $sma = Unit::factory()->create();
        $tu = $this->seededUser('tu', ['unit_id' => $sd->id]);

        $colleagueDraft = Activity::factory()->create(['unit_id' => $sd->id]);
        $otherUnit = Activity::factory()->create(['unit_id' => $sma->id]);

        $ids = collect($this->as($tu)->getJson('/api/v1/activities')->assertOk()->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($colleagueDraft->id));
        $this->assertFalse($ids->contains($otherUnit->id));

        // A colleague's draft in the same unit can be carried on...
        $this->as($tu)->putJson("/api/v1/activities/{$colleagueDraft->id}", ['name' => 'Diteruskan TU lain'])->assertOk();
        // ...another school's cannot even be opened.
        $this->as($tu)->getJson("/api/v1/activities/{$otherUnit->id}")->assertForbidden();

        $this->as($tu)->postJson('/api/v1/activities', [
            'activity_type_id' => $colleagueDraft->activity_type_id,
            'unit_id' => $sma->id,
            'fund_source_id' => $colleagueDraft->fund_source_id,
            'name' => 'Salah unit',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'budget_amount' => 100000,
        ])->assertStatus(422)->assertJsonValidationErrors('unit_id');
    }

    public function test_a_kepala_sekolah_tied_to_a_unit_approves_only_that_unit(): void
    {
        $sd = Unit::factory()->create();
        $sma = Unit::factory()->create();
        $kepsek = $this->seededUser('kepala_sekolah', ['unit_id' => $sd->id]);
        $foreign = Activity::factory()->create(['unit_id' => $sma->id, 'status' => Activity::SUBMITTED]);

        $this->as($kepsek)->postJson("/api/v1/activities/{$foreign->id}/approve")->assertForbidden();
    }

    public function test_super_admin_is_never_limited_by_a_unit(): void
    {
        $unit = Unit::factory()->create();
        $superAdmin = $this->seededUser('super_admin', ['unit_id' => $unit->id]);
        $elsewhere = Activity::factory()->create();

        $this->as($superAdmin)->getJson("/api/v1/activities/{$elsewhere->id}")->assertOk();
    }

    public function test_tu_no_longer_manages_tariffs_or_master_data(): void
    {
        $tu = $this->seededUser('tu');

        $this->as($tu)->postJson('/api/v1/honor-rates', [])->assertForbidden();
        $this->as($tu)->postJson('/api/v1/units', [])->assertForbidden();
        $this->as($tu)->postJson('/api/v1/fund-sources', [])->assertForbidden();
    }

    public function test_the_data_migration_revokes_tariff_rights_from_an_existing_tu_role(): void
    {
        $tu = Role::create(['name' => 'tu', 'description' => 'TU']);
        $manage = Permission::create(['name' => 'honor-rates.manage', 'module' => 'honor-rates', 'action' => 'manage']);
        $tu->permissions()->attach($manage);

        $migration = require database_path('migrations/2026_09_25_110000_restructure_menu_permissions.php');
        $migration->up();

        $this->assertFalse($tu->permissions()->where('name', 'honor-rates.manage')->exists());
        $this->assertTrue(DB::table('permissions')->where('name', 'master-data.manage')->exists());
    }

    public function test_employees_import_from_an_excel_csv_all_or_nothing(): void
    {
        $admin = $this->seededUser('admin');
        Unit::factory()->create(['code' => 'SD']);
        Position::factory()->create(['code' => 'GURU']);

        $good = "\xEF\xBB\xBFkode_pegawai;nama;nip;nuptk;jenis;kode_unit;kode_jabatan;bank;nama_rekening;no_rekening\n"
            ."PGW-1;Budi;;;guru;sd;GURU;BSI;Budi;700111\n"
            ."PGW-2;Siti;;;tendik;SD;GURU;;;\n";

        $this->as($admin)->post('/api/v1/employees/import', [
            'file' => UploadedFile::fake()->createWithContent('pegawai.csv', $good),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.created', 2);

        $bad = "kode_pegawai,nama,nip,nuptk,jenis,kode_unit,kode_jabatan,bank,nama_rekening,no_rekening\n"
            ."PGW-1,Budi Baru,,,guru,SD,GURU,,,\n"
            ."PGW-3,Tanpa Unit,,,guru,SMK,GURU,,,\n";

        $this->as($admin)->post('/api/v1/employees/import', [
            'file' => UploadedFile::fake()->createWithContent('pegawai.csv', $bad),
        ], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['baris_3']]);

        // Nothing from the failed file was applied, not even the valid row.
        $this->assertSame('Budi', Employee::where('employee_code', 'PGW-1')->value('name'));
        $this->assertSame(2, Employee::count());
    }

    public function test_status_pencairan_follows_what_sianggar_reports(): void
    {
        $admin = $this->seededUser('admin');

        $waiting = Activity::factory()->create(['status' => Activity::APPROVED, 'approved_at' => now(), 'sianggar_status' => Activity::SIANGGAR_SENT]);
        $paid = Activity::factory()->create(['status' => Activity::APPROVED, 'approved_at' => now(), 'sianggar_status' => Activity::SIANGGAR_SENT]);
        ActivityDisbursement::create(['activity_id' => $paid->id, 'status_proses' => 'paid', 'approved_amount' => 200000, 'paid_at' => now()]);
        Activity::factory()->create(['status' => Activity::DRAFT]);

        $response = $this->as($admin)->getJson('/api/v1/disbursements?state=dibayar')
            ->assertOk()
            ->assertJsonPath('meta.counts.menunggu_sdm', 1)
            ->assertJsonPath('meta.counts.dibayar', 1)
            ->assertJsonCount(1, 'data');

        $this->assertSame($paid->id, $response->json('data.0.id'));
        $this->assertSame('dibayar', $response->json('data.0.disbursement_state'));
        $this->assertNotSame($waiting->id, $response->json('data.0.id'));
    }

    public function test_dashboard_counts_everything_not_just_the_first_page(): void
    {
        $admin = $this->seededUser('admin');
        Activity::factory()->count(23)->create(['status' => Activity::DRAFT]);

        $this->as($admin)->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.status_counts.draft', 23)
            ->assertJsonStructure(['data' => ['per_unit', 'data_health', 'todo']]);
    }

    public function test_dashboard_for_tu_lists_drafts_still_missing_sk_panitia(): void
    {
        $unit = Unit::factory()->create();
        $tu = $this->seededUser('tu', ['unit_id' => $unit->id]);
        $draft = Activity::factory()->create(['unit_id' => $unit->id, 'created_by' => $tu->id]);

        $response = $this->as($tu)->getJson('/api/v1/dashboard')->assertOk();

        $this->assertSame($draft->id, $response->json('data.todo.missing_sk_panitia.0.id'));
        $this->assertArrayNotHasKey('per_unit', $response->json('data'));
        $this->assertArrayNotHasKey('data_health', $response->json('data'));
    }

    public function test_role_permissions_can_be_changed_but_super_admin_is_locked(): void
    {
        $superAdmin = $this->seededUser('super_admin');
        $auditor = Role::where('name', 'auditor')->first();

        $this->as($superAdmin)->putJson("/api/v1/role-permissions/{$auditor->id}", [
            'permissions' => ['dashboard.view', 'reports.view'],
        ])->assertOk();

        $this->assertEqualsCanonicalizing(['dashboard.view', 'reports.view'], $auditor->permissions()->pluck('name')->all());

        $superRole = Role::where('name', 'super_admin')->first();
        $this->as($superAdmin)->putJson("/api/v1/role-permissions/{$superRole->id}", ['permissions' => []])->assertForbidden();

        $admin = $this->seededUser('admin');
        $this->as($admin)->getJson('/api/v1/role-permissions')->assertForbidden();
    }

    public function test_reports_export_as_excel_friendly_csv(): void
    {
        $admin = $this->seededUser('admin');
        Activity::factory()->create(['name' => 'Ujian Semester']);

        $response = $this->as($admin)->get('/api/v1/reports/export/kegiatan');

        $response->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringStartsWith("\xEF\xBB\xBF\"Kode Kegiatan\";", $response->getContent());
        $this->assertStringContainsString('Ujian Semester', $response->getContent());

        $this->as($admin)->get('/api/v1/reports/export/rahasia')->assertNotFound();
    }

    public function test_honor_saya_shows_only_the_signed_in_employees_honor(): void
    {
        $me = Employee::factory()->create();
        $colleague = Employee::factory()->create();
        $guru = $this->seededUser('guru_tendik', ['employee_id' => $me->id]);
        $activity = Activity::factory()->create(['status' => Activity::APPROVED, 'approved_at' => now()]);
        $type = HonorType::factory()->create();

        foreach ([$me, $colleague] as $employee) {
            $member = ActivityMember::factory()->create(['activity_id' => $activity->id, 'employee_id' => $employee->id, 'role_name' => 'Panitia']);
            HonorDetail::factory()->create([
                'activity_id' => $activity->id,
                'activity_member_id' => $member->id,
                'employee_id' => $employee->id,
                'honor_type_id' => $type->id,
            ]);
        }

        $this->as($guru)->getJson('/api/v1/my-honors')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.employee_id', $me->id)
            ->assertJsonPath('data.0.activity.disbursement_state', 'belum_terkirim');
    }

    public function test_the_approval_queue_carries_what_kepala_sekolah_needs_to_triage(): void
    {
        $unit = Unit::factory()->create();
        $kepsek = $this->seededUser('kepala_sekolah', ['unit_id' => $unit->id]);
        $older = Activity::factory()->create(['unit_id' => $unit->id, 'status' => Activity::SUBMITTED, 'submitted_at' => now()->subDays(3)]);
        $newer = Activity::factory()->create(['unit_id' => $unit->id, 'status' => Activity::SUBMITTED, 'submitted_at' => now()]);
        $this->attachSkPanitia($newer->id);

        $member = ActivityMember::factory()->create(['activity_id' => $newer->id, 'employee_id' => Employee::factory()->create()->id, 'role_name' => 'Panitia']);
        HonorDetail::factory()->create([
            'activity_id' => $newer->id,
            'activity_member_id' => $member->id,
            'employee_id' => $member->employee_id,
            'honor_type_id' => HonorType::factory()->create()->id,
        ]);

        $this->as($kepsek)->getJson('/api/v1/approvals')
            ->assertOk()
            ->assertJsonPath('data.0.id', $older->id)
            ->assertJsonPath('data.0.has_sk_panitia', false)
            ->assertJsonPath('data.1.has_sk_panitia', true)
            ->assertJsonPath('data.1.members_count', 1)
            ->assertJsonPath('data.1.honor_total', 200000);
    }

    public function test_super_admin_deletes_unused_master_data_only(): void
    {
        $superAdmin = $this->seededUser('super_admin');
        $unused = Unit::factory()->create();
        $withStaff = Unit::factory()->create();
        Employee::factory()->create(['unit_id' => $withStaff->id]);
        $withAccount = Unit::factory()->create();
        User::factory()->create(['unit_id' => $withAccount->id]);

        $this->as($superAdmin)->deleteJson("/api/v1/units/{$unused->id}")->assertOk();
        $this->assertModelMissing($unused);

        $this->as($superAdmin)->deleteJson("/api/v1/units/{$withStaff->id}")
            ->assertStatus(422)
            ->assertJsonPath('errors.record.0', fn (string $m) => str_contains($m, '1 pegawai'));

        // users.unit_id is nullOnDelete: without the check this would
        // silently turn a unit TU into a yayasan-wide account.
        $this->as($superAdmin)->deleteJson("/api/v1/units/{$withAccount->id}")->assertStatus(422);

        $this->assertDatabaseHas('audit_logs', ['action' => 'master_data.deleted']);
    }

    public function test_admin_cannot_delete_master_data(): void
    {
        $admin = $this->seededUser('admin');
        $unit = Unit::factory()->create();

        $this->as($admin)->deleteJson("/api/v1/units/{$unit->id}")->assertForbidden();
        $this->assertModelExists($unit);
    }
}
