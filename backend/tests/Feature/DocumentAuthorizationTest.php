<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Document;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression test for a real bug found in audit: DocumentController::download
 * had no authorization check at all — any authenticated user could
 * download any document by ID. See ARSITEKTUR.md section 9 ("Dokumen
 * tidak disimpan sebagai public URL") and AI_CODING_RULES.md ("authorization
 * saat download").
 */
class DocumentAuthorizationTest extends TestCase
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

    public function test_user_cannot_download_a_document_belonging_to_someone_elses_activity(): void
    {
        Storage::fake('local');

        $owner = $this->userWithRole('tu', ['activities.view', 'activities.update']);
        $stranger = $this->userWithRole('tu', ['activities.view', 'activities.update']);

        $activity = Activity::factory()->create(['created_by' => $owner->id]);
        $document = Document::create([
            'activity_id' => $activity->id,
            'document_type' => 'surat_tugas',
            'file_name' => 'surat.pdf',
            'file_path' => 'documents/activities/'.$activity->id.'/fake.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 100,
            'uploaded_by' => $owner->id,
        ]);
        Storage::disk('local')->put($document->file_path, 'fake content');

        $this->as($stranger)->get("/api/v1/documents/{$document->id}/download")->assertForbidden();
        $this->as($owner)->get("/api/v1/documents/{$document->id}/download")->assertOk();
    }

    public function test_guru_tendik_only_sees_documents_for_activities_they_are_a_member_of(): void
    {
        Storage::fake('local');

        $employee = Employee::factory()->create();
        $otherEmployee = Employee::factory()->create();

        $guruRole = Role::firstOrCreate(['name' => 'guru_tendik'], ['description' => 'Guru/Tendik']);
        $permission = Permission::firstOrCreate(['name' => 'documents.view'], ['module' => 'documents', 'action' => 'view']);
        $guruRole->permissions()->syncWithoutDetaching($permission);
        $guru = User::factory()->create(['role_id' => $guruRole->id, 'employee_id' => $employee->id]);

        $myActivity = Activity::factory()->create();
        $myActivity->members()->create(['employee_id' => $employee->id, 'role_name' => 'Pengawas']);
        $otherActivity = Activity::factory()->create();
        $otherActivity->members()->create(['employee_id' => $otherEmployee->id, 'role_name' => 'Pengawas']);

        $myDoc = Document::create([
            'activity_id' => $myActivity->id, 'document_type' => 'surat_tugas', 'file_name' => 'a.pdf',
            'file_path' => 'x', 'mime_type' => 'application/pdf', 'file_size' => 1, 'uploaded_by' => $guru->id,
        ]);
        Document::create([
            'activity_id' => $otherActivity->id, 'document_type' => 'surat_tugas', 'file_name' => 'b.pdf',
            'file_path' => 'y', 'mime_type' => 'application/pdf', 'file_size' => 1, 'uploaded_by' => $guru->id,
        ]);

        $response = $this->as($guru)->getJson('/api/v1/documents');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($myDoc->id));
        $this->assertCount(1, $ids);
    }
}
