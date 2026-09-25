<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityType;
use App\Models\Employee;
use App\Models\FundSource;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * FLOW.md section 8 / ARSITEKTUR.md section 11.1: on Kepala Sekolah
 * approval, VAKASI generates a QR code pointing at a public,
 * unauthenticated verification URL. Covers: the code is generated on
 * approval, the public endpoints work without a session, non-approved
 * activities aren't verifiable, and sensitive fields (honor/budget
 * amounts) never leak through the public payload.
 */
class PublicVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): mixed
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'web');
    }

    private function approvedActivity(): Activity
    {
        $tu = $this->userWithRole('tu', [
            'activities.view', 'activities.create', 'activities.update', 'activities.submit', 'honors.calculate',
        ]);
        $kepsek = $this->userWithRole('kepala_sekolah', ['activities.view', 'activities.approve']);

        $employee = Employee::factory()->create();
        $honorType = HonorType::factory()->create();
        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'rate' => 25000, 'effective_from' => now()->toDateString()]);

        $activityId = $this->as($tu)->postJson('/api/v1/activities', [
            'activity_type_id' => ActivityType::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
            'fund_source_id' => FundSource::factory()->create()->id,
            'name' => 'Rapat Verifikasi Publik',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'budget_amount' => 500000,
        ])->json('data.id');

        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/members", [
            'employee_id' => $employee->id,
            'role_name' => 'Panitia',
        ]);
        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 2]],
        ]);
        $this->attachSkPanitia($activityId, $tu);
        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/submit");
        $this->as($kepsek)->postJson("/api/v1/activities/{$activityId}/approve");

        return Activity::findOrFail($activityId);
    }

    private function userWithRole(string $roleName, array $permissions): User
    {
        $role = Role::firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        foreach ($permissions as $name) {
            [$module, $action] = explode('.', $name);
            $permission = Permission::firstOrCreate(['name' => $name], ['module' => $module, 'action' => $action]);
            $role->permissions()->syncWithoutDetaching($permission);
        }

        return User::factory()->create(['role_id' => $role->id]);
    }

    public function test_approval_generates_an_unguessable_verification_code(): void
    {
        $activity = $this->approvedActivity();

        $this->assertNotNull($activity->verification_code);
        $this->assertSame(40, strlen($activity->verification_code));
    }

    public function test_public_verification_endpoint_works_without_authentication(): void
    {
        $activity = $this->approvedActivity();

        $response = $this->getJson("/api/v1/public/verify/{$activity->verification_code}");

        $response->assertOk()
            ->assertJsonPath('data.activity_code', $activity->activity_code)
            ->assertJsonPath('data.name', 'Rapat Verifikasi Publik')
            ->assertJsonPath('data.status', 'approved');
        $this->assertNotNull($response->json('data.approved_by'));
        $this->assertNotNull($response->json('data.approved_at'));
    }

    public function test_public_verification_never_exposes_honor_or_budget_amounts(): void
    {
        $activity = $this->approvedActivity();

        $response = $this->getJson("/api/v1/public/verify/{$activity->verification_code}");

        $body = $response->json('data');
        $this->assertArrayNotHasKey('budget_amount', $body);
        $this->assertArrayNotHasKey('net_amount', $body);
        $this->assertArrayNotHasKey('honor_details', $body);

        // Member names ARE shown (per the public-verification design —
        // who was involved is not sensitive), but never their honor.
        $this->assertNotEmpty($body['members']);
        foreach ($body['members'] as $member) {
            $this->assertArrayHasKey('name', $member);
            $this->assertArrayHasKey('role', $member);
            $this->assertArrayNotHasKey('net_amount', $member);
            $this->assertArrayNotHasKey('gross_amount', $member);
            $this->assertArrayNotHasKey('rate_snapshot', $member);
        }
    }

    public function test_public_verification_includes_activity_type_fund_source_location_and_document_number(): void
    {
        $activity = $this->approvedActivity();
        $activity->update(['location' => 'Aula Sekolah']);

        $response = $this->getJson("/api/v1/public/verify/{$activity->verification_code}");

        $response->assertOk()
            ->assertJsonPath('data.activity_type', $activity->activityType->name)
            ->assertJsonPath('data.fund_source', $activity->fundSource->name)
            ->assertJsonPath('data.location', 'Aula Sekolah');
        $this->assertNotNull($response->json('data.approval_document_number'));
        $this->assertStringStartsWith('APV-', $response->json('data.approval_document_number'));
    }

    public function test_unknown_code_returns_404(): void
    {
        $this->getJson('/api/v1/public/verify/does-not-exist')->assertStatus(404);
    }

    public function test_unapproved_activity_has_no_verification_code_and_cannot_be_verified(): void
    {
        $tu = $this->userWithRole('tu', ['activities.view', 'activities.create']);

        $activityId = $this->as($tu)->postJson('/api/v1/activities', [
            'activity_type_id' => ActivityType::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
            'fund_source_id' => FundSource::factory()->create()->id,
            'name' => 'Draft Belum Disetujui',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'budget_amount' => 100000,
        ])->json('data.id');

        $activity = Activity::findOrFail($activityId);
        $this->assertNull($activity->verification_code);
    }

    public function test_qrcode_endpoint_returns_a_png_image(): void
    {
        $activity = $this->approvedActivity();

        $response = $this->get("/api/v1/public/verify/{$activity->verification_code}/qrcode");

        $response->assertOk();
        $this->assertSame('image/png', $response->headers->get('Content-Type'));
    }

    public function test_qrcode_endpoint_404s_for_unknown_code(): void
    {
        $this->get('/api/v1/public/verify/does-not-exist/qrcode')->assertStatus(404);
    }
}
