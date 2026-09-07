<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Activity\StoreActivityRequest;
use App\Http\Requests\Activity\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Services\ActivityService;
use App\Services\ApprovalService;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ActivityService $activityService,
        private readonly ApprovalService $approvalService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $activities = Activity::query()
            ->with(['activityType', 'unit', 'fundSource', 'creator'])
            ->when(
                $user->hasRole('tu') && ! $user->hasRole('super_admin', 'admin'),
                fn ($q) => $q->where('created_by', $user->id),
            )
            ->when(
                $user->hasRole('guru_tendik') && $user->employee_id,
                fn ($q) => $q->whereHas('members', fn ($m) => $m->where('employee_id', $user->employee_id)),
            )
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->integer('unit_id'), fn ($q, $unitId) => $q->where('unit_id', $unitId))
            ->when($request->string('search')->toString(), fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->where('name', 'like', "%{$s}%")->orWhere('activity_code', 'like', "%{$s}%");
            }))
            ->latest()
            ->paginate(20);

        return $this->success(ActivityResource::collection($activities));
    }

    public function store(StoreActivityRequest $request): JsonResponse
    {
        $activity = $this->activityService->create($request->validated(), $request->user());

        return $this->success(new ActivityResource($activity->load(['activityType', 'unit', 'fundSource'])), 'Kegiatan berhasil dibuat.', 201);
    }

    public function show(Activity $activity): JsonResponse
    {
        $this->authorize('view', $activity);

        return $this->success(new ActivityResource($activity->load([
            'activityType', 'unit', 'fundSource', 'pic', 'creator', 'budget',
            'members.employee', 'honorDetails.employee', 'honorDetails.honorType',
            'approvals.approver', 'approvals.logs.actor', 'documents',
        ])));
    }

    public function update(UpdateActivityRequest $request, Activity $activity): JsonResponse
    {
        $this->authorize('update', $activity);

        $activity = $this->activityService->update($activity, $request->validated());

        return $this->success(new ActivityResource($activity), 'Kegiatan berhasil diperbarui.');
    }

    public function destroy(Activity $activity): JsonResponse
    {
        $this->authorize('delete', $activity);

        $this->activityService->delete($activity);

        return $this->success(message: 'Kegiatan berhasil dihapus.');
    }

    public function submit(Request $request, Activity $activity): JsonResponse
    {
        $this->authorize('submit', $activity);

        $activity = $this->approvalService->submit($activity, $request->user());

        return $this->success(new ActivityResource($activity), 'Kegiatan berhasil disubmit untuk approval.');
    }

    public function cancel(Activity $activity): JsonResponse
    {
        $this->authorize('delete', $activity);

        if ($activity->status !== Activity::DRAFT) {
            throw new BusinessValidationException('status', 'Hanya kegiatan DRAFT yang dapat dibatalkan.');
        }

        $this->activityService->delete($activity);

        return $this->success(message: 'Kegiatan berhasil dibatalkan.');
    }
}
