<?php

namespace Tests;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * ApprovalService::submit() refuses an activity without a signed SK
     * Panitia; tests that only care about the workflow attach a stand-in.
     */
    protected function attachSkPanitia(int $activityId, ?User $uploader = null): Document
    {
        return Document::create([
            'activity_id' => $activityId,
            'document_type' => Document::SK_PANITIA,
            'file_name' => 'sk-panitia.pdf',
            'file_path' => "documents/activities/{$activityId}/sk-panitia.pdf",
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => ($uploader ?? User::factory()->create())->id,
        ]);
    }
}
