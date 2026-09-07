<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Document;
use App\Models\Payment;
use App\Models\User;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Private document storage per ARSITEKTUR.md section 9: never a public
 * URL, always behind authorization (DocumentController::download).
 */
class DocumentService
{
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
    ];

    private const MAX_FILE_SIZE_KB = 5 * 1024; // 5 MB

    public function __construct(private readonly AuditService $auditService) {}

    public function store(
        UploadedFile $file,
        string $documentType,
        User $uploader,
        ?Activity $activity = null,
        ?Payment $payment = null,
    ): Document {
        if (! in_array($file->getMimeType(), self::ALLOWED_MIME_TYPES, true)) {
            throw new BusinessValidationException('file', 'Tipe file tidak diizinkan. Gunakan PDF, JPG, atau PNG.');
        }

        if ($file->getSize() > self::MAX_FILE_SIZE_KB * 1024) {
            throw new BusinessValidationException('file', 'Ukuran file maksimal 5MB.');
        }

        $randomName = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
        $directory = $activity ? "documents/activities/{$activity->id}" : "documents/payments/{$payment?->id}";
        $path = $file->storeAs($directory, $randomName, 'local');

        $document = Document::create([
            'activity_id' => $activity?->id,
            'payment_id' => $payment?->id,
            'document_type' => $documentType,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $uploader->id,
        ]);

        $this->auditService->logModel('document.uploaded', $document, newValues: $document->toArray());

        return $document;
    }

    public function streamDownload(Document $document)
    {
        if (! Storage::disk('local')->exists($document->file_path)) {
            throw new BusinessValidationException('file', 'File tidak ditemukan di storage.');
        }

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }
}
