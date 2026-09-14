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

        // ROLE_PERMISSION.md section 4: Guru/Tendik only see documents
        // tied to activities they're a member of; every other role with
        // documents.view sees everything (matches the permission matrix).
        $documents = Document::query()
            ->with(['uploader', 'activity', 'payment'])
            ->when(
                $user->hasRole('guru_tendik') && $user->employee_id,
                fn (Builder $q) => $q->where(function (Builder $q2) use ($user) {
                    $q2->whereHas('activity.members', fn (Builder $m) => $m->where('employee_id', $user->employee_id))
                        ->orWhereHas('payment.activity.members', fn (Builder $m) => $m->where('employee_id', $user->employee_id));
                }),
            )
            ->latest('created_at')
            ->get();

        return $this->success(DocumentResource::collection($documents));
    }

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
