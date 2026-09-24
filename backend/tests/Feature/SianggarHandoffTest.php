<?php

namespace Tests\Feature;

use App\Jobs\PushApprovedActivityToSianggar;
use App\Models\Activity;
use App\Models\ActivityMember;
use App\Models\Employee;
use App\Models\HonorDetail;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Services\SianggarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

/**
 * VAKASI's workflow ends at Kepala Sekolah approval; the approved
 * activity is then pushed to Sianggar, where SDM picks it up and submits
 * the disbursement in Sianggar (FLOW.md section 8).
 */
class SianggarHandoffTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private const WEBHOOK_URL = 'https://sianggar.test/api/v1/webhooks/vakasi';

    private function approvedActivityWithHonor(): Activity
    {
        $activity = Activity::factory()->create([
            'status' => Activity::APPROVED,
            'approved_at' => now(),
            'verification_code' => str_repeat('a', 40),
            'approval_document_number' => 'SK-2026-0001',
        ]);

        $employee = Employee::factory()->create([
            'name' => 'Budi Santoso',
            'bank_name' => 'BSI',
            'bank_account_name' => 'Budi Santoso',
            'bank_account_number' => '1234567890',
        ]);

        $member = ActivityMember::factory()->create([
            'activity_id' => $activity->id,
            'employee_id' => $employee->id,
            'role_name' => 'Pengawas',
        ]);

        HonorDetail::factory()->create([
            'activity_id' => $activity->id,
            'activity_member_id' => $member->id,
            'employee_id' => $employee->id,
            'honor_type_id' => HonorType::factory()->create(['name' => 'Honor Pengawas'])->id,
        ]);

        return $activity->fresh();
    }

    private function configureWebhook(): void
    {
        config([
            'vakasi.sianggar.url' => self::WEBHOOK_URL,
            'vakasi.sianggar.secret' => 'shared-secret',
        ]);
    }

    public function test_approval_queues_a_push_to_sianggar(): void
    {
        Bus::fake();

        $tu = $this->userWithRole('tu', [
            'activities.view', 'activities.create', 'activities.update',
            'activities.submit', 'honors.calculate',
        ]);
        $kepsek = $this->userWithRole('kepala_sekolah', ['activities.view', 'activities.approve']);

        $employee = Employee::factory()->create();
        $honorType = HonorType::factory()->create();
        $activity = Activity::factory()->create([
            'created_by' => $tu->id,
            'status' => Activity::DRAFT,
            'budget_amount' => 1_000_000,
        ]);
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

        $this->as($tu)->postJson("/api/v1/activities/{$activity->id}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 8]],
        ])->assertOk();
        $this->as($tu)->postJson("/api/v1/activities/{$activity->id}/submit")->assertOk();

        $this->as($kepsek)->postJson("/api/v1/activities/{$activity->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', Activity::APPROVED)
            ->assertJsonPath('data.sianggar_status', Activity::SIANGGAR_PENDING);

        Bus::assertDispatched(PushApprovedActivityToSianggar::class);
    }

    public function test_push_signs_the_body_and_marks_the_activity_sent(): void
    {
        $this->configureWebhook();
        Http::fake([self::WEBHOOK_URL => Http::response(['ok' => true])]);

        $activity = $this->approvedActivityWithHonor();

        app(SianggarService::class)->push($activity);

        Http::assertSent(function ($request) use ($activity) {
            // Multipart: the signature covers the `payload` part only, and
            // the recap PDF rides along in the same request.
            $parts = collect($request->data())->keyBy('name');
            $payload = $parts['payload']['contents'];
            $expected = hash_hmac('sha256', $payload, 'shared-secret');
            $decoded = json_decode($payload, true);

            return $request->url() === self::WEBHOOK_URL
                && $request->isMultipart()
                && $request->header('X-Vakasi-Signature')[0] === $expected
                && $request->header('X-Idempotency-Key')[0] === $activity->activity_code
                && $decoded['event'] === 'activity.approved'
                && $parts->has('lampiran');
        });

        $activity->refresh();
        $this->assertSame(Activity::SIANGGAR_SENT, $activity->sianggar_status);
        $this->assertNotNull($activity->sianggar_synced_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'activity.sianggar_pushed']);
    }

    public function test_payload_carries_what_sdm_needs_to_raise_the_disbursement(): void
    {
        $activity = $this->approvedActivityWithHonor();

        $payload = app(SianggarService::class)->payloadFor($activity);

        $this->assertSame('SK-2026-0001', $payload['activity']['approval_document_number']);
        $this->assertStringContainsString('/verify/', $payload['activity']['verification_url']);
        $this->assertSame(200000, $payload['total_amount']);
        $this->assertStringContainsString('/integrations/sianggar/callback', $payload['callback_url']);

        $honor = $payload['honors'][0];
        $this->assertSame('Budi Santoso', $honor['employee']['name']);
        $this->assertSame('Pengawas', $honor['role_name']);
        // Bank details are the point of the handoff — Sianggar pays against them.
        $this->assertSame('1234567890', $honor['employee']['bank_account_number']);

        // One amount, no gross/tax/deduction: honor/upah panitia only.
        $this->assertSame(200000, $honor['amount']);
        $this->assertArrayNotHasKey('tax_amount', $honor);
        $this->assertArrayNotHasKey('deduction_amount', $honor);
    }

    public function test_a_rejected_push_marks_the_activity_failed_and_retries(): void
    {
        $this->configureWebhook();
        Http::fake([self::WEBHOOK_URL => Http::response('nope', 500)]);

        $activity = $this->approvedActivityWithHonor();

        // Throwing is what makes the queue worker retry; the approval
        // itself must stay intact either way.
        $this->expectException(\RuntimeException::class);

        try {
            app(SianggarService::class)->push($activity);
        } finally {
            $activity->refresh();
            $this->assertSame(Activity::SIANGGAR_FAILED, $activity->sianggar_status);
            $this->assertSame(1, $activity->sianggar_attempts);
            $this->assertSame(Activity::APPROVED, $activity->status);
            $this->assertDatabaseHas('audit_logs', ['action' => 'activity.sianggar_push_failed']);
        }
    }

    public function test_push_is_skipped_when_the_integration_is_not_configured(): void
    {
        config(['vakasi.sianggar.url' => null]);
        Http::fake();

        $activity = $this->approvedActivityWithHonor();
        app(SianggarService::class)->push($activity);

        Http::assertNothingSent();
        $this->assertSame(Activity::SIANGGAR_SKIPPED, $activity->fresh()->sianggar_status);
    }

    public function test_admin_can_retry_a_failed_handoff(): void
    {
        Bus::fake();
        $this->configureWebhook();

        $admin = $this->userWithRole('admin', ['integration.manage']);
        $activity = $this->approvedActivityWithHonor();
        $activity->forceFill(['sianggar_status' => Activity::SIANGGAR_FAILED])->save();

        $this->as($admin)->getJson('/api/v1/integrations/sianggar/pending')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->as($admin)->postJson("/api/v1/integrations/sianggar/activities/{$activity->id}/push")
            ->assertOk();

        Bus::assertDispatched(PushApprovedActivityToSianggar::class);
        $this->assertSame(Activity::SIANGGAR_PENDING, $activity->fresh()->sianggar_status);
    }

    public function test_retry_is_rejected_for_an_activity_that_is_not_approved(): void
    {
        $this->configureWebhook();
        $admin = $this->userWithRole('admin', ['integration.manage']);
        $activity = Activity::factory()->create(['status' => Activity::DRAFT]);

        $this->as($admin)->postJson("/api/v1/integrations/sianggar/activities/{$activity->id}/push")
            ->assertStatus(422);
    }
}
