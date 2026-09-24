<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityDisbursement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

/**
 * Sianggar reports the disbursement's progress back to VAKASI so the TU
 * who raised the kegiatan can see how far it has got (FLOW.md section 8).
 *
 * The mirror is read-only by design: only this signed callback writes
 * it, and nothing in VAKASI can advance a stage on its own.
 */
class SianggarCallbackTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private const SECRET = 'callback-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['vakasi.sianggar.callback_secret' => self::SECRET]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendCallback(array $payload, ?string $secret = null): TestResponse
    {
        $body = json_encode($payload);

        return $this->call(
            'POST',
            '/api/v1/integrations/sianggar/callback',
            [],
            [],
            [],
            [
                'HTTP_ACCEPT' => 'application/json',
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_SIANGGAR_SIGNATURE' => hash_hmac('sha256', $body, $secret ?? self::SECRET),
            ],
            $body,
        );
    }

    private function approvedActivity(): Activity
    {
        return Activity::factory()->create([
            'status' => Activity::APPROVED,
            'approved_at' => now(),
            'sianggar_status' => Activity::SIANGGAR_SENT,
        ]);
    }

    public function test_callback_records_the_pengajuan_and_its_timeline(): void
    {
        $activity = $this->approvedActivity();

        $this->sendCallback([
            'event_id' => 'evt-1',
            'event' => 'pengajuan.created',
            'activity_code' => $activity->activity_code,
            'occurred_at' => now()->toIso8601String(),
            'pengajuan_ulid' => '01JABCDEF',
            'nomor_pengajuan' => 'SDM/2026/001',
            'status_proses' => 'submitted',
            'stage' => 'staff-keuangan',
            'actor_name' => 'Staf SDM',
        ])->assertOk();

        $disbursement = ActivityDisbursement::where('activity_id', $activity->id)->firstOrFail();
        $this->assertSame('SDM/2026/001', $disbursement->nomor_pengajuan);
        $this->assertSame('staff-keuangan', $disbursement->current_stage);
        $this->assertCount(1, $disbursement->events);
    }

    public function test_repeated_delivery_of_the_same_event_is_ignored(): void
    {
        $activity = $this->approvedActivity();
        $payload = [
            'event_id' => 'evt-dup',
            'event' => 'pengajuan.stage_changed',
            'activity_code' => $activity->activity_code,
            'occurred_at' => now()->toIso8601String(),
            'stage' => 'ketum',
            'status_proses' => 'approved-level-2',
        ];

        $this->sendCallback($payload)->assertOk();
        $this->sendCallback($payload)->assertOk();

        $this->assertDatabaseCount('activity_disbursement_events', 1);
    }

    public function test_an_invalid_signature_is_rejected(): void
    {
        $activity = $this->approvedActivity();

        $this->sendCallback([
            'event_id' => 'evt-bad',
            'event' => 'pengajuan.created',
            'activity_code' => $activity->activity_code,
            'occurred_at' => now()->toIso8601String(),
        ], secret: 'wrong-secret')->assertStatus(401);

        $this->assertDatabaseCount('activity_disbursement_events', 0);
    }

    public function test_callback_is_rejected_when_no_secret_is_configured(): void
    {
        config(['vakasi.sianggar.callback_secret' => null]);
        $activity = $this->approvedActivity();

        $this->sendCallback([
            'event_id' => 'evt-nosecret',
            'event' => 'pengajuan.created',
            'activity_code' => $activity->activity_code,
            'occurred_at' => now()->toIso8601String(),
        ])->assertStatus(401);
    }

    public function test_revision_request_reopens_the_activity_for_editing(): void
    {
        $activity = $this->approvedActivity();

        $this->sendCallback([
            'event_id' => 'evt-rev',
            'event' => 'intake.revision_requested',
            'activity_code' => $activity->activity_code,
            'occurred_at' => now()->toIso8601String(),
            'actor_name' => 'Staf SDM',
            'note' => 'Volume pengawas tidak sesuai SK.',
        ])->assertOk();

        $activity->refresh();

        // Opsi (a): editable again and must be approved by Kepala Sekolah
        // a second time before it can be handed over again.
        $this->assertSame(Activity::REJECTED, $activity->status);
        $this->assertNull($activity->approved_at);
        $this->assertNull($activity->sianggar_status);
        $this->assertDatabaseHas('audit_logs', ['action' => 'activity.returned_for_revision']);
        $this->assertDatabaseHas('notifications', ['type' => 'activity.revision_requested']);
    }

    public function test_paid_event_is_mirrored_with_its_voucher(): void
    {
        $activity = $this->approvedActivity();

        $this->sendCallback([
            'event_id' => 'evt-paid',
            'event' => 'pengajuan.paid',
            'activity_code' => $activity->activity_code,
            'occurred_at' => now()->toIso8601String(),
            'status_proses' => 'paid',
            'stage' => 'payment',
            'no_voucher' => 'VCR-2026-0007',
            'approved_amount' => 200000,
            'paid_at' => now()->toIso8601String(),
        ])->assertOk();

        $disbursement = ActivityDisbursement::where('activity_id', $activity->id)->firstOrFail();
        $this->assertTrue($disbursement->isPaid());
        $this->assertSame('VCR-2026-0007', $disbursement->no_voucher);
        $this->assertNotNull($disbursement->paid_at);
        $this->assertDatabaseHas('notifications', ['type' => 'sianggar.update']);
    }

    public function test_callback_for_an_unknown_activity_is_rejected(): void
    {
        $this->sendCallback([
            'event_id' => 'evt-unknown',
            'event' => 'pengajuan.created',
            'activity_code' => 'KEG-9999-9999',
            'occurred_at' => now()->toIso8601String(),
        ])->assertStatus(422);
    }
}
