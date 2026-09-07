<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Activity;
use App\Models\Document;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly DocumentService $documentService) {}

    public function index(Activity $activity): JsonResponse
    {
        $this->authorize('view', $activity);

        return $this->success(DocumentResource::collection($activity->documents()->with('uploader')->get()));
    }

    public function store(StoreDocumentRequest $request, Activity $activity): JsonResponse
    {
        $this->authorize('update', $activity);

        $document = $this->documentService->store(
            $request->file('file'),
            $request->validated('document_type'),
            $request->user(),
            activity: $activity,
        );

        return $this->success(new DocumentResource($document), 'Dokumen berhasil diunggah.', 201);
    }

    public function download(Document $document): StreamedResponse
    {
        return $this->documentService->streamDownload($document);
    }
}
