<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\ActivityMember\StoreActivityMemberRequest;
use App\Http\Requests\ActivityMember\UpdateActivityMemberRequest;
use App\Http\Resources\ActivityMemberResource;
use App\Models\Activity;
use App\Models\ActivityMember;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;

class ActivityMemberController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ActivityService $activityService) {}

    public function index(Activity $activity): JsonResponse
    {
        $this->authorize('view', $activity);

        return $this->success(ActivityMemberResource::collection($activity->members()->with('employee')->get()));
    }

    public function store(StoreActivityMemberRequest $request, Activity $activity): JsonResponse
    {
        $this->authorize('update', $activity);

        $member = $this->activityService->addMember($activity, $request->validated());

        return $this->success(new ActivityMemberResource($member->load('employee')), 'Peserta berhasil ditambahkan.', 201);
    }

    public function update(UpdateActivityMemberRequest $request, Activity $activity, ActivityMember $member): JsonResponse
    {
        $this->authorize('update', $activity);

        $this->activityService->ensureEditable($activity);
        $member->update($request->validated());

        return $this->success(new ActivityMemberResource($member->load('employee')), 'Peserta berhasil diperbarui.');
    }

    public function destroy(Activity $activity, ActivityMember $member): JsonResponse
    {
        $this->authorize('update', $activity);

        $this->activityService->removeMember($activity, $member);

        return $this->success(message: 'Peserta berhasil dihapus.');
    }
}
