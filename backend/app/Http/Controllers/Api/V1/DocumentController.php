<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Activity;
use App\Models\Document;
use App\Services\DocumentService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly DocumentService $documentService) {}

    public function all(Request $request): JsonResponse
    {
        $user = $request->user();

        $documents = Document::query()
            ->with(['uploader', 'activity', 'payment'])
            // Same visibility as the activity list; payment evidence follows
            // the activity it belongs to.
            ->where(function (Builder $q) use ($user) {
                $q->whereHas('activity', fn (Builder $a) => $a->visibleTo($user))
                    ->orWhereHas('payment.activity', fn (Builder $a) => $a->visibleTo($user));
            })
            ->when($request->string('document_type')->toString(), fn (Builder $q, $type) => $q->where('document_type', $type))
            ->latest('created_at')
            ->paginate($this->perPage($request));

        return $this->success(DocumentResource::collection($documents));
    }

    public function index(Activity $activity): JsonResponse
    {
        $this->authorize('view', $activity);

        return $this->success(DocumentResource::collection($activity->documents()->with('uploader')->get()));
    }

    public function store(StoreDocumentRequest $request, Activity $activity): JsonResponse
    {
        $this->authorize('uploadDocument', $activity);

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
        // Documents are never public URLs (ARSITEKTUR.md section 9) — a
        // document belongs to an activity directly, or indirectly via
        // its payment. Authorize against whichever it is; a document
        // attached to neither cannot be authorized at all.
        $activity = $document->activity ?? $document->payment?->activity;

        if (! $activity) {
            abort(404);
        }

        $this->authorize('view', $activity);

        return $this->documentService->streamDownload($document);
    }
}
