<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Document;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression test for a real bug found in audit: PaymentController had
 * no authorization at all beyond route-level permission middleware —
 * any payments.view/payments.process holder could read or act on
 * ANY payment regardless of which activity/unit it belonged to. Also
 * covers the "Payment View" TU-ownership scope ROLE_PERMISSION.md
 * documents (same "Own" rule as Activities/Documents/Reports).
 */
class PaymentAuthorizationTest extends TestCase
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

    private function as(User $user): mixed
    {
        $this->app['auth']->forgetGuards();

        return $this->actingAs($user, 'web');
    }

    private function makePayment(Activity $activity, string $status = Payment::PROCESSING): Payment
    {
        return Payment::create([
            'payment_number' => 'PAY-TEST-'.$activity->id,
            'activity_id' => $activity->id,
            'payment_date' => now()->toDateString(),
            'payment_method' => 'transfer_bank',
            'total_amount' => 100000,
            'status' => $status,
            'processed_by' => User::factory()->create()->id,
        ]);
    }

    public function test_tu_only_sees_payments_for_their_own_activities_in_index(): void
    {
        $tu = $this->userWithRole('tu', ['payments.view']);
        $myActivity = Activity::factory()->create(['created_by' => $tu->id]);
        $otherActivity = Activity::factory()->create();

        $myPayment = $this->makePayment($myActivity);
        $this->makePayment($otherActivity);

        $response = $this->as($tu)->getJson('/api/v1/payments');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$myPayment->id], $ids->all());
    }

    public function test_tu_cannot_view_payment_for_someone_elses_activity(): void
    {
        $owner = $this->userWithRole('tu', ['payments.view']);
        $stranger = $this->userWithRole('tu', ['payments.view']);

        $activity = Activity::factory()->create(['created_by' => $owner->id]);
        $payment = $this->makePayment($activity);

        $this->as($stranger)->getJson("/api/v1/payments/{$payment->id}")->assertForbidden();
        $this->as($owner)->getJson("/api/v1/payments/{$payment->id}")->assertOk();
    }

    public function test_keuangan_sees_and_can_act_on_every_payment_org_wide(): void
    {
        $keuangan = $this->userWithRole('keuangan', ['payments.view', 'payments.process']);
        $activity = Activity::factory()->create();
        // process() moves VERIFIED -> PROCESSING, so start from VERIFIED.
        $payment = $this->makePayment($activity, Payment::VERIFIED);

        $this->as($keuangan)->getJson('/api/v1/payments')->assertOk()
            ->assertJsonCount(1, 'data');
        $this->as($keuangan)->getJson("/api/v1/payments/{$payment->id}")->assertOk();
        $this->as($keuangan)->postJson("/api/v1/payments/{$payment->id}/process")->assertOk();
    }

    public function test_complete_requires_bukti_transfer_document_type_specifically(): void
    {
        Storage::fake('local');
        $keuangan = $this->userWithRole('keuangan', ['payments.view', 'payments.process']);
        $activity = Activity::factory()->create();
        $payment = $this->makePayment($activity);

        Document::create([
            'payment_id' => $payment->id,
            'document_type' => 'surat_tugas',
            'file_name' => 'irrelevant.pdf',
            'file_path' => 'x',
            'mime_type' => 'application/pdf',
            'file_size' => 1,
            'uploaded_by' => $keuangan->id,
        ]);

        $this->as($keuangan)->postJson("/api/v1/payments/{$payment->id}/complete")
            ->assertStatus(422);

        $file = UploadedFile::fake()->create('bukti.pdf', 50, 'application/pdf');
        $this->as($keuangan)->postJson("/api/v1/payments/{$payment->id}/evidence", [
            'document_type' => 'bukti_transfer',
            'file' => $file,
        ])->assertStatus(201);

        $this->as($keuangan)->postJson("/api/v1/payments/{$payment->id}/complete")
            ->assertOk()->assertJsonPath('data.status', 'paid');
    }

    public function test_only_super_admin_can_create_a_super_admin_user(): void
    {
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin'], ['description' => 'Super Admin']);
        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['description' => 'Admin']);
        $permission = Permission::firstOrCreate(['name' => 'users.manage'], ['module' => 'users', 'action' => 'manage']);
        $adminRole->permissions()->syncWithoutDetaching($permission);
        $superAdminRole->permissions()->syncWithoutDetaching($permission);

        $admin = User::factory()->create(['role_id' => $adminRole->id]);
        $superAdmin = User::factory()->create(['role_id' => $superAdminRole->id]);

        $this->as($admin)->postJson('/api/v1/users', [
            'name' => 'Escalation Attempt',
            'email' => 'escalate@vakasi.test',
            'password' => 'password123',
            'role_id' => $superAdminRole->id,
        ])->assertStatus(422)->assertJsonValidationErrors('role_id');

        $this->as($superAdmin)->postJson('/api/v1/users', [
            'name' => 'Legit New Super Admin',
            'email' => 'legit@vakasi.test',
            'password' => 'password123',
            'role_id' => $superAdminRole->id,
        ])->assertStatus(201);
    }
}
