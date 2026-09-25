<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityMember;
use App\Models\Document;
use App\Models\Employee;
use App\Models\HonorDetail;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Services\SianggarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

/**
 * A real activity has a committee, not one person: many members, the
 * same employee sometimes in two roles, every rate traceable to an SK
 * Yayasan, and the signed SK Panitia travelling to Sianggar with the
 * recap.
 */
class CommitteeHonorTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private const WEBHOOK_URL = 'https://sianggar.test/api/v1/webhooks/vakasi';

    private function tu()
    {
        return $this->userWithRole('tu', [
            'activities.view', 'activities.update', 'activities.submit', 'honors.calculate',
        ]);
    }

    private function rateFor(HonorType $type, Activity $activity, int $rate, string $decree): HonorRate
    {
        return HonorRate::factory()->create([
            'honor_type_id' => $type->id,
            'rate' => $rate,
            'decree_number' => $decree,
            'effective_from' => $activity->start_date->toDateString(),
        ]);
    }

    public function test_committee_members_can_be_added_in_bulk(): void
    {
        $tu = $this->tu();
        $activity = Activity::factory()->create(['created_by' => $tu->id]);
        $employees = Employee::factory()->count(5)->create();

        $this->as($tu)->postJson("/api/v1/activities/{$activity->id}/members/bulk", [
            'employee_ids' => $employees->pluck('id')->all(),
            'role_name' => 'Pengawas',
        ])->assertStatus(201)->assertJsonCount(5, 'data');

        $this->assertSame(5, $activity->members()->where('role_name', 'Pengawas')->count());
    }

    public function test_bulk_add_is_all_or_nothing(): void
    {
        $tu = $this->tu();
        $activity = Activity::factory()->create(['created_by' => $tu->id]);
        $existing = Employee::factory()->create();
        $fresh = Employee::factory()->create();
        ActivityMember::factory()->create([
            'activity_id' => $activity->id,
            'employee_id' => $existing->id,
            'role_name' => 'Pengawas',
        ]);

        $this->as($tu)->postJson("/api/v1/activities/{$activity->id}/members/bulk", [
            'employee_ids' => [$fresh->id, $existing->id],
            'role_name' => 'Pengawas',
        ])->assertStatus(422);

        $this->assertFalse($activity->members()->where('employee_id', $fresh->id)->exists());
    }

    public function test_one_employee_can_be_paid_for_two_roles(): void
    {
        $tu = $this->tu();
        $activity = Activity::factory()->create(['created_by' => $tu->id]);
        $employee = Employee::factory()->create();
        $pengawas = HonorType::factory()->create(['name' => 'Honor Pengawas']);
        $koreksi = HonorType::factory()->create(['name' => 'Honor Koreksi']);
        $this->rateFor($pengawas, $activity, 25000, 'SK-YAPI/001');
        $this->rateFor($koreksi, $activity, 5000, 'SK-YAPI/002');

        $asPengawas = ActivityMember::factory()->create(['activity_id' => $activity->id, 'employee_id' => $employee->id, 'role_name' => 'Pengawas']);
        $asKorektor = ActivityMember::factory()->create(['activity_id' => $activity->id, 'employee_id' => $employee->id, 'role_name' => 'Korektor']);

        // employee_id alone is ambiguous once there are two roles.
        $this->as($tu)->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $pengawas->id, 'volume' => 4]],
        ])->assertStatus(422)->assertJsonValidationErrors('activity_member_id');

        $this->as($tu)->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [
                ['activity_member_id' => $asPengawas->id, 'honor_type_id' => $pengawas->id, 'volume' => 4],
                ['activity_member_id' => $asKorektor->id, 'honor_type_id' => $koreksi->id, 'volume' => 30],
            ],
        ])->assertOk()->assertJsonPath('data.net_amount', 4 * 25000 + 30 * 5000);

        $payload = app(SianggarService::class)->payloadFor($activity->fresh());

        $byRole = collect($payload['honors'])->keyBy('role_name');
        $this->assertSame(100000, $byRole['Pengawas']['amount']);
        $this->assertSame('SK-YAPI/001', $byRole['Pengawas']['rate_decree_number']);
        $this->assertSame(150000, $byRole['Korektor']['amount']);
        $this->assertSame('SK-YAPI/002', $byRole['Korektor']['rate_decree_number']);
    }

    public function test_member_from_another_activity_is_rejected(): void
    {
        $tu = $this->tu();
        $activity = Activity::factory()->create(['created_by' => $tu->id]);
        $type = HonorType::factory()->create();
        $this->rateFor($type, $activity, 25000, 'SK-YAPI/001');
        $foreign = ActivityMember::factory()->create([
            'activity_id' => Activity::factory()->create()->id,
            'employee_id' => Employee::factory()->create()->id,
            'role_name' => 'Panitia',
        ]);

        $this->as($tu)->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['activity_member_id' => $foreign->id, 'honor_type_id' => $type->id, 'volume' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors('activity_member_id');
    }

    public function test_rate_decree_is_snapshotted_on_the_honor_line(): void
    {
        $tu = $this->tu();
        $activity = Activity::factory()->create(['created_by' => $tu->id]);
        $employee = Employee::factory()->create();
        $type = HonorType::factory()->create();
        $rate = $this->rateFor($type, $activity, 25000, 'SK-YAPI/LAMA');
        ActivityMember::factory()->create(['activity_id' => $activity->id, 'employee_id' => $employee->id, 'role_name' => 'Panitia']);

        $this->as($tu)->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $type->id, 'volume' => 1]],
        ])->assertOk()->assertJsonPath('data.items.0.rate_decree_number', 'SK-YAPI/LAMA');

        $rate->update(['decree_number' => 'SK-YAPI/BARU']);

        $this->assertDatabaseHas('honor_details', [
            'activity_id' => $activity->id,
            'rate_decree_number_snapshot' => 'SK-YAPI/LAMA',
        ]);
    }

    public function test_new_tariff_requires_its_decree_and_accepts_the_scan(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin', ['honor-rates.view', 'honor-rates.manage']);
        $type = HonorType::factory()->create();

        $this->as($admin)->postJson('/api/v1/honor-rates', [
            'honor_type_id' => $type->id,
            'rate' => 25000,
            'effective_from' => '2026-01-01',
        ])->assertStatus(422)->assertJsonValidationErrors('decree_number');

        $rateId = $this->as($admin)->postJson('/api/v1/honor-rates', [
            'honor_type_id' => $type->id,
            'rate' => 25000,
            'decree_number' => '012/SK/YAPI/VII/2026',
            'decree_date' => '2026-07-01',
            'effective_from' => '2026-01-01',
        ])->assertStatus(201)->json('data.id');

        $this->as($admin)->post("/api/v1/honor-rates/{$rateId}/decree", [
            'file' => UploadedFile::fake()->create('sk-tarif.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.has_decree_file', true)
            ->assertJsonPath('data.decree_file_name', 'sk-tarif.pdf');

        $this->as($admin)->get("/api/v1/honor-rates/{$rateId}/decree")->assertOk();
    }

    public function test_sk_panitia_and_documents_travel_with_the_handoff(): void
    {
        Storage::fake('local');
        config(['vakasi.sianggar.url' => self::WEBHOOK_URL, 'vakasi.sianggar.secret' => 'shared-secret']);
        Http::fake([self::WEBHOOK_URL => Http::response(['ok' => true])]);

        $activity = Activity::factory()->create([
            'status' => Activity::APPROVED,
            'approved_at' => now(),
            'approval_document_number' => 'APV-2026-0001',
        ]);
        $employee = Employee::factory()->create();
        $member = ActivityMember::factory()->create(['activity_id' => $activity->id, 'employee_id' => $employee->id, 'role_name' => 'Panitia']);
        HonorDetail::factory()->create([
            'activity_id' => $activity->id,
            'activity_member_id' => $member->id,
            'employee_id' => $employee->id,
            'honor_type_id' => HonorType::factory()->create()->id,
        ]);

        $daftarHadir = $this->attachSkPanitia($activity->id);
        $daftarHadir->update(['document_type' => 'daftar_hadir', 'file_name' => 'hadir.pdf', 'file_path' => 'd/hadir.pdf']);
        $sk = $this->attachSkPanitia($activity->id);
        Storage::disk('local')->put($sk->file_path, '%PDF-sk');
        Storage::disk('local')->put('d/hadir.pdf', '%PDF-hadir');

        app(SianggarService::class)->push($activity->fresh());

        Http::assertSent(function ($request) {
            $parts = collect($request->data())->keyBy('name');
            $payload = json_decode($parts['payload']['contents'], true);

            return $parts->has('lampiran')
                // SK Panitia is always listed first.
                && $parts['lampiran_tambahan[0]']['filename'] === 'SK Panitia - sk-panitia.pdf'
                && $parts['lampiran_tambahan[1]']['filename'] === 'Daftar Hadir - hadir.pdf'
                && $payload['documents'][0]['document_type'] === Document::SK_PANITIA
                && $payload['documents'][1]['field'] === 'lampiran_tambahan[1]';
        });
    }
}
