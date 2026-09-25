<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Approval\ApproveActivityRequest;
use App\Http\Requests\Approval\RejectActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ApprovalResource;
use App\Models\Activity;
use App\Models\Document;
use App\Services\ApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ApprovalService $approvalService) {}

    public function index(Request $request): JsonResponse
    {
        $approvals = Activity::query()
            ->where('status', Activity::SUBMITTED)
            ->visibleTo($request->user())
            ->with(['activityType', 'unit', 'fundSource', 'creator', 'approvals'])
            // What Kepala Sekolah needs to triage the queue without
            // opening each activity.
            ->withCount('members')
            ->withSum('honorDetails as honor_total', 'net_amount')
            ->withExists(['documents as has_sk_panitia' => fn ($q) => $q->where('document_type', Document::SK_PANITIA)])
            // Oldest first: the queue is worked in the order it arrived.
            ->oldest('submitted_at')
            ->paginate($this->perPage($request));

        return $this->success(ActivityResource::collection($approvals));
    }

    public function forActivity(Activity $activity): JsonResponse
    {
        $this->authorize('view', $activity);

        return $this->success(ApprovalResource::collection($activity->approvals()->with(['approver', 'logs.actor'])->get()));
    }

    public function approve(ApproveActivityRequest $request, Activity $activity): JsonResponse
    {
        $this->authorize('approve', $activity);

        $activity = $this->approvalService->approve($activity, $request->user(), $request->validated('notes'));

        return $this->success(new ActivityResource($activity), 'Kegiatan berhasil disetujui.');
    }

    public function reject(RejectActivityRequest $request, Activity $activity): JsonResponse
    {
        $this->authorize('approve', $activity);

        $activity = $this->approvalService->reject($activity, $request->user(), $request->validated('notes'));

        return $this->success(new ActivityResource($activity), 'Kegiatan berhasil ditolak.');
    }
}
