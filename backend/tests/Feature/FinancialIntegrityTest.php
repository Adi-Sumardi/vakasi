<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityMember;
use App\Models\ActivityType;
use App\Models\Budget;
use App\Models\Employee;
use App\Models\FundSource;
use App\Models\HonorDetail;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Models\Payment;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

/**
 * The numbers the UI shows, the numbers the budget commits and the
 * numbers that get disbursed must always be the same numbers.
 */
class FinancialIntegrityTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    /** @return array{0: int, 1: Employee, 2: Employee, 3: HonorType} */
    private function draftActivityWithTwoMembers(int $budget = 5_000_000): array
    {
        $tu = $this->tu();
        $a = Employee::factory()->create(['name' => 'Pegawai A']);
        $b = Employee::factory()->create(['name' => 'Pegawai B']);
        $honorType = HonorType::factory()->create();

        $id = $this->as($tu)->postJson('/api/v1/activities', [
            'activity_type_id' => ActivityType::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
            'fund_source_id' => FundSource::factory()->create()->id,
            'name' => 'Ujian Sekolah',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'budget_amount' => $budget,
        ])->json('data.id');

        HonorRate::factory()->create([
            'honor_type_id' => $honorType->id,
            'rate' => 25000,
            'effective_from' => now()->toDateString(),
        ]);

        foreach ([$a, $b] as $employee) {
            $this->as($tu)->postJson("/api/v1/activities/{$id}/members", [
                'employee_id' => $employee->id,
                'role_name' => 'Panitia',
            ])->assertStatus(201);
        }

        return [$id, $a, $b, $honorType];
    }

    private function tu(): User
    {
        return $this->userWithRole('tu', [
            'activities.view', 'activities.create', 'activities.update',
            'activities.submit', 'honors.calculate',
        ]);
    }

    public function test_recalculating_honor_removes_lines_left_out_of_the_payload(): void
    {
        [$id, $a, $b, $honorType] = $this->draftActivityWithTwoMembers();
        $tu = Activity::find($id)->creator;

        $this->as($tu)->postJson("/api/v1/activities/{$id}/calculate-honor", ['items' => [
            ['employee_id' => $a->id, 'honor_type_id' => $honorType->id, 'volume' => 8],
            ['employee_id' => $b->id, 'honor_type_id' => $honorType->id, 'volume' => 8],
        ]])->assertOk()->assertJsonPath('data.net_amount', 400000);

        // B is dropped from the recalculation.
        $this->as($tu)->postJson("/api/v1/activities/{$id}/calculate-honor", ['items' => [
            ['employee_id' => $a->id, 'honor_type_id' => $honorType->id, 'volume' => 8],
        ]])->assertOk()->assertJsonPath('data.net_amount', 200000);

        // What the API reported, what the table holds and what the budget
        // committed must agree — they used to be 200k / 400k / 400k.
        $this->assertSame(200000, (int) HonorDetail::where('activity_id', $id)->sum('net_amount'));
        $this->assertSame(200000, (int) Budget::where('activity_id', $id)->value('committed_amount'));
        $this->assertDatabaseMissing('honor_details', ['activity_id' => $id, 'employee_id' => $b->id]);
    }

    public function test_duplicate_honor_lines_in_one_payload_are_rejected(): void
    {
        [$id, $a, , $honorType] = $this->draftActivityWithTwoMembers();
        $tu = Activity::find($id)->creator;

        $this->as($tu)->postJson("/api/v1/activities/{$id}/calculate-honor", ['items' => [
            ['employee_id' => $a->id, 'honor_type_id' => $honorType->id, 'volume' => 8],
            ['employee_id' => $a->id, 'honor_type_id' => $honorType->id, 'volume' => 4],
        ]])->assertStatus(422);
    }

    public function test_removing_a_member_also_removes_their_honor_and_frees_the_budget(): void
    {
        [$id, $a, $b, $honorType] = $this->draftActivityWithTwoMembers();
        $tu = Activity::find($id)->creator;

        $this->as($tu)->postJson("/api/v1/activities/{$id}/calculate-honor", ['items' => [
            ['employee_id' => $a->id, 'honor_type_id' => $honorType->id, 'volume' => 8],
            ['employee_id' => $b->id, 'honor_type_id' => $honorType->id, 'volume' => 8],
        ]])->assertOk();

        $memberB = Activity::find($id)->members()->where('employee_id', $b->id)->firstOrFail();

        // Used to be a dead end: removal was refused because honor lines
        // existed, and no endpoint could delete them.
        $this->as($tu)->deleteJson("/api/v1/activities/{$id}/members/{$memberB->id}")->assertOk();

        $this->assertDatabaseMissing('honor_details', ['activity_id' => $id, 'employee_id' => $b->id]);
        $this->assertSame(200000, (int) Budget::where('activity_id', $id)->value('committed_amount'));
    }

    public function test_budget_cannot_be_lowered_below_committed_honor(): void
    {
        [$id, $a, , $honorType] = $this->draftActivityWithTwoMembers();
        $tu = Activity::find($id)->creator;

        $this->as($tu)->postJson("/api/v1/activities/{$id}/calculate-honor", ['items' => [
            ['employee_id' => $a->id, 'honor_type_id' => $honorType->id, 'volume' => 8],
        ]])->assertOk();

        $this->as($tu)->putJson("/api/v1/activities/{$id}", ['budget_amount' => 100000])
            ->assertStatus(422);

        $this->assertSame(5_000_000, (int) Budget::where('activity_id', $id)->value('budget_amount'));
        $this->assertGreaterThanOrEqual(0, (int) Budget::where('activity_id', $id)->value('remaining_amount'));
    }

    public function test_activity_cannot_reference_inactive_master_data(): void
    {
        $tu = $this->tu();

        $this->as($tu)->postJson('/api/v1/activities', [
            'activity_type_id' => ActivityType::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
            'fund_source_id' => FundSource::factory()->create(['status' => 'inactive'])->id,
            'name' => 'Kegiatan Sumber Dana Tutup',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'budget_amount' => 100000,
        ])->assertStatus(422)->assertJsonValidationErrors('fund_source_id');
    }

    public function test_overlapping_honor_rate_periods_are_rejected(): void
    {
        $admin = $this->userWithRole('admin', ['honor-rates.view', 'honor-rates.manage']);
        $honorType = HonorType::factory()->create();

        $payload = fn (string $from, ?string $to) => [
            'honor_type_id' => $honorType->id,
            'rate' => 25000,
            'decree_number' => 'SK-YAPI/2026/001',
            'effective_from' => $from,
            'effective_to' => $to,
        ];

        $this->as($admin)->postJson('/api/v1/honor-rates', $payload('2026-01-01', '2026-06-30'))
            ->assertStatus(201);

        // Overlaps the existing window.
        $this->as($admin)->postJson('/api/v1/honor-rates', $payload('2026-06-01', '2026-12-31'))
            ->assertStatus(422)->assertJsonValidationErrors('effective_from');

        // Starts the day after: no overlap.
        $this->as($admin)->postJson('/api/v1/honor-rates', $payload('2026-07-01', null))
            ->assertStatus(201);
    }

    public function test_payment_is_verified_before_it_is_processed_and_can_be_cancelled(): void
    {
        Storage::fake('local');
        $keuangan = $this->userWithRole('keuangan', ['activities.view', 'payments.view', 'payments.process']);

        $activity = Activity::factory()->create(['status' => Activity::APPROVED]);
        HonorDetail::factory()->create([
            'activity_id' => $activity->id,
            'activity_member_id' => ActivityMember::factory()->create([
                'activity_id' => $activity->id,
                'employee_id' => Employee::factory()->create()->id,
                'role_name' => 'Panitia',
            ])->id,
            'employee_id' => Employee::factory()->create()->id,
            'honor_type_id' => HonorType::factory()->create()->id,
        ]);

        $paymentId = $this->as($keuangan)->postJson('/api/v1/payments', [
            'activity_id' => $activity->id,
            'payment_method' => 'transfer_bank',
        ])->assertStatus(201)->assertJsonPath('data.status', Payment::VERIFIED)->json('data.id');

        // FR-10: money has not moved yet, so the activity stops at VERIFIED.
        $this->assertDatabaseHas('activities', ['id' => $activity->id, 'status' => Activity::VERIFIED]);

        $this->as($keuangan)->postJson("/api/v1/payments/{$paymentId}/cancel", [
            'reason' => 'Rekening penerima salah.',
        ])->assertOk()->assertJsonPath('data.status', Payment::CANCELLED);

        // Cancelling hands the activity back to finance rather than
        // stranding it — and keeps the payment row (BR-04).
        $this->assertDatabaseHas('activities', ['id' => $activity->id, 'status' => Activity::APPROVED]);
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => Payment::CANCELLED]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'payment.cancelled']);
    }

    public function test_paid_payment_cannot_be_cancelled(): void
    {
        $keuangan = $this->userWithRole('keuangan', ['activities.view', 'payments.view', 'payments.process']);
        $activity = Activity::factory()->create(['status' => Activity::COMPLETED]);

        $payment = Payment::create([
            'payment_number' => 'PAY-TEST-1',
            'activity_id' => $activity->id,
            'payment_date' => now()->toDateString(),
            'payment_method' => 'transfer_bank',
            'total_amount' => 100000,
            'status' => Payment::PAID,
            'processed_by' => $keuangan->id,
        ]);

        $this->as($keuangan)->postJson("/api/v1/payments/{$payment->id}/cancel", [
            'reason' => 'Ingin dibatalkan.',
        ])->assertStatus(422);
    }

    public function test_payment_evidence_rejects_a_document_type_that_can_never_complete_it(): void
    {
        Storage::fake('local');
        $keuangan = $this->userWithRole('keuangan', ['activities.view', 'payments.view', 'payments.process']);
        $activity = Activity::factory()->create(['status' => Activity::PROCESSING]);

        $payment = Payment::create([
            'payment_number' => 'PAY-TEST-2',
            'activity_id' => $activity->id,
            'payment_date' => now()->toDateString(),
            'payment_method' => 'transfer_bank',
            'total_amount' => 100000,
            'status' => Payment::PROCESSING,
            'processed_by' => $keuangan->id,
        ]);

        $this->as($keuangan)->postJson("/api/v1/payments/{$payment->id}/evidence", [
            'document_type' => 'surat_tugas',
            'file' => UploadedFile::fake()->create('bukti.pdf', 10, 'application/pdf'),
        ])->assertStatus(422)->assertJsonValidationErrors('document_type');
    }
}
