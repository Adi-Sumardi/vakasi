<?php

namespace Tests\Feature;

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
use Illuminate\Foundation\Testing\TestResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * End-to-end golden path per FLOW.md section 1: create -> assign
 * members -> calculate honor -> submit -> approve -> pay -> complete.
 * Exercises ActivityService/HonorCalculationService/ApprovalService/
 * PaymentService/BudgetService together as they're actually wired
 * through the API, not in isolation.
 */
class ActivityWorkflowTest extends TestCase
{
    use RefreshDatabase;

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

    /**
     * Sanctum's guard is a RequestGuard that caches the resolved user
     * on first use (Illuminate\Auth\RequestGuard::user()). Laravel's
     * app instance persists across multiple ->postJson() calls within
     * one test, so switching actors mid-test with plain actingAs()
     * would keep resolving the *first* user. forgetGuards() forces a
     * fresh guard (and fresh resolution) on the next request.
     */
    private function as(User $user): TestResponse|static
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'web');
    }

    public function test_full_activity_to_payment_lifecycle(): void
    {
        Storage::fake('local');

        $tu = $this->userWithRole('tu', [
            'activities.view', 'activities.create', 'activities.update', 'activities.submit', 'honors.calculate',
        ]);
        $kepsek = $this->userWithRole('kepala_sekolah', ['activities.view', 'activities.approve']);
        $keuangan = $this->userWithRole('keuangan', ['activities.view', 'payments.view', 'payments.process']);

        $employee = Employee::factory()->create();
        $honorType = HonorType::factory()->create();

        // 1. TU creates the activity (DRAFT).
        $createResponse = $this->as($tu)->postJson('/api/v1/activities', [
            'activity_type_id' => ActivityType::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
            'fund_source_id' => FundSource::factory()->create()->id,
            'name' => 'Ujian Tengah Semester',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'budget_amount' => 1_000_000,
        ]);
        $createResponse->assertStatus(201)->assertJsonPath('data.status', 'draft');
        $activityId = $createResponse->json('data.id');

        HonorRate::factory()->create(['honor_type_id' => $honorType->id, 'rate' => 25000, 'effective_from' => now()->toDateString()]);

        // 2. TU adds a member.
        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/members", [
            'employee_id' => $employee->id,
            'role_name' => 'Pengawas',
        ])->assertStatus(201);

        // 3. TU calculates honor (8 jam x Rp25.000 = Rp200.000).
        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/calculate-honor", [
            'items' => [['employee_id' => $employee->id, 'honor_type_id' => $honorType->id, 'volume' => 8]],
        ])->assertOk()->assertJsonPath('data.net_amount', 200000);

        // 4. TU submits for approval.
        $submitResponse = $this->as($tu)->postJson("/api/v1/activities/{$activityId}/submit");
        $submitResponse->assertOk()->assertJsonPath('data.status', 'submitted');

        // Creator cannot approve their own submission (separation of duties).
        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/approve")->assertStatus(403);

        // 5. Kepala Sekolah approves.
        $approveResponse = $this->as($kepsek)->postJson("/api/v1/activities/{$activityId}/approve");
        $approveResponse->assertOk()->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('budgets', [
            'activity_id' => $activityId,
            'committed_amount' => 200000,
            'approved_amount' => 200000,
        ]);

        // 6. Keuangan creates the payment (APPROVED -> VERIFIED -> PROCESSING).
        $paymentResponse = $this->as($keuangan)->postJson('/api/v1/payments', [
            'activity_id' => $activityId,
            'payment_method' => 'transfer_bank',
        ]);
        $paymentResponse->assertStatus(201)->assertJsonPath('data.total_amount', 200000);
        $paymentId = $paymentResponse->json('data.id');

        $this->assertDatabaseHas('activities', ['id' => $activityId, 'status' => 'processing']);

        // Cannot complete without evidence uploaded first.
        $this->as($keuangan)->postJson("/api/v1/payments/{$paymentId}/complete")->assertStatus(422);

        // 7. Upload bukti transfer.
        $file = UploadedFile::fake()->create('bukti-transfer.pdf', 100, 'application/pdf');
        $this->as($keuangan)->postJson("/api/v1/payments/{$paymentId}/evidence", [
            'document_type' => 'bukti_transfer',
            'file' => $file,
        ])->assertStatus(201);

        // 8. Complete the payment (PROCESSING -> PAID -> COMPLETED).
        $completeResponse = $this->as($keuangan)->postJson("/api/v1/payments/{$paymentId}/complete");
        $completeResponse->assertOk()->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('activities', ['id' => $activityId, 'status' => 'completed']);
        $this->assertDatabaseHas('budgets', [
            'activity_id' => $activityId,
            'paid_amount' => 200000,
            'remaining_amount' => 800000,
        ]);
        $this->assertDatabaseHas('payment_details', [
            'payment_id' => $paymentId,
            'employee_id' => $employee->id,
            'amount' => 200000,
            'status' => 'paid',
        ]);

        // Full audit trail exists for the key transitions.
        $this->assertDatabaseHas('audit_logs', ['action' => 'activity.submitted']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'activity.approved']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'payment.completed']);
    }

    public function test_reject_returns_activity_to_rejected_status_with_reason(): void
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
            'name' => 'Rapat Panitia',
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
        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/submit");

        // Reject without a reason must fail validation.
        $this->as($kepsek)->postJson("/api/v1/activities/{$activityId}/reject", [])
            ->assertStatus(422);

        $reject = $this->as($kepsek)->postJson("/api/v1/activities/{$activityId}/reject", [
            'notes' => 'Volume tidak sesuai SK penugasan.',
        ]);
        $reject->assertOk()->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('approval_logs', ['action' => 'reject', 'notes' => 'Volume tidak sesuai SK penugasan.']);

        // TU can edit and resubmit a REJECTED activity.
        $this->as($tu)->putJson("/api/v1/activities/{$activityId}", ['name' => 'Rapat Panitia (Revisi)'])
            ->assertOk();
        $this->as($tu)->postJson("/api/v1/activities/{$activityId}/submit")
            ->assertOk()->assertJsonPath('data.status', 'submitted');
    }
}
