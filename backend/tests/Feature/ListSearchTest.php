<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityMember;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Employee;
use App\Models\HonorDetail;
use App\Models\HonorType;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The `search` parameter behind the live search box on each list page.
 */
class ListSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->admin = User::factory()->create(['role_id' => Role::where('name', 'super_admin')->value('id')]);
    }

    /**
     * @return array<int, int>
     */
    private function ids(string $uri, string $path = 'data'): array
    {
        return collect($this->actingAs($this->admin, 'web')->getJson($uri)->assertOk()->json($path))->pluck('id')->all();
    }

    public function test_activity_search_matches_name_or_code(): void
    {
        $match = Activity::factory()->create(['name' => 'Try Out Kelas 9']);
        $byCode = Activity::factory()->create(['name' => 'Lain', 'activity_code' => 'KEG-TRYOUT-01']);
        Activity::factory()->create(['name' => 'Mabit']);

        $this->assertEqualsCanonicalizing([$match->id, $byCode->id], $this->ids('/api/v1/activities?search=try'));
    }

    public function test_approval_queue_can_be_searched(): void
    {
        $match = Activity::factory()->create(['name' => 'Akhirussanah 2026', 'status' => Activity::SUBMITTED, 'submitted_at' => now()]);
        Activity::factory()->create(['name' => 'Mabit', 'status' => Activity::SUBMITTED, 'submitted_at' => now()]);

        $this->assertSame([$match->id], $this->ids('/api/v1/approvals?search=akhirus'));
    }

    public function test_disbursement_list_can_be_searched(): void
    {
        $match = Activity::factory()->create(['name' => 'Pameran Pendidikan', 'status' => Activity::APPROVED, 'approved_at' => now()]);
        Activity::factory()->create(['name' => 'Career Day', 'status' => Activity::APPROVED, 'approved_at' => now()]);

        $this->assertSame([$match->id], $this->ids('/api/v1/disbursements?search=pameran'));
    }

    public function test_document_archive_matches_file_name_or_activity(): void
    {
        $document = fn (Activity $activity, string $fileName) => Document::create([
            'activity_id' => $activity->id,
            'document_type' => Document::SK_PANITIA,
            'file_name' => $fileName,
            'file_path' => 'documents/'.$fileName,
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $this->admin->id,
        ]);
        $byActivity = $document(Activity::factory()->create(['name' => 'Studi Wisata']), 'sk.pdf');
        $byFile = $document(Activity::factory()->create(['name' => 'Lain']), 'studi-wisata-daftar-hadir.pdf');
        $document(Activity::factory()->create(['name' => 'Mabit']), 'lain.pdf');

        $this->assertEqualsCanonicalizing([$byActivity->id, $byFile->id], $this->ids('/api/v1/documents?search=studi'));
    }

    public function test_honor_recap_matches_employee_name(): void
    {
        $honor = function (string $name) {
            $member = ActivityMember::factory()->create([
                'activity_id' => Activity::factory()->create()->id,
                'employee_id' => Employee::factory()->create(['name' => $name])->id,
                'role_name' => 'Pengawas',
            ]);

            return HonorDetail::factory()->create([
                'activity_id' => $member->activity_id,
                'activity_member_id' => $member->id,
                'employee_id' => $member->employee_id,
                'honor_type_id' => HonorType::factory()->create()->id,
            ]);
        };
        $match = $honor('Siti Aminah');
        $honor('Budi Santoso');

        $this->assertSame([$match->id], $this->ids('/api/v1/reports/honors?search=aminah'));
    }

    public function test_audit_trail_matches_action_or_user(): void
    {
        $match = AuditLog::create(['user_id' => $this->admin->id, 'entity_type' => User::class, 'action' => 'honor_rate.decree_uploaded']);
        AuditLog::create(['user_id' => $this->admin->id, 'entity_type' => User::class, 'action' => 'login']);

        $this->assertSame([$match->id], $this->ids('/api/v1/audit-logs?search=decree', 'data.items'));
    }
}
