<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\ActivityType\StoreActivityTypeRequest;
use App\Http\Requests\ActivityType\UpdateActivityTypeRequest;
use App\Http\Resources\ActivityTypeResource;
use App\Models\ActivityType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityTypeController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $types = ActivityType::query()
            ->when($request->string('search')->toString(), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->orderBy('name')
            ->paginate(20);

        return $this->success(ActivityTypeResource::collection($types));
    }

    public function store(StoreActivityTypeRequest $request): JsonResponse
    {
        $type = ActivityType::create($request->validated());

        return $this->success(new ActivityTypeResource($type), 'Jenis kegiatan berhasil dibuat.', 201);
    }

    public function show(ActivityType $activityType): JsonResponse
    {
        return $this->success(new ActivityTypeResource($activityType));
    }

    public function update(UpdateActivityTypeRequest $request, ActivityType $activityType): JsonResponse
    {
        $activityType->update($request->validated());

        return $this->success(new ActivityTypeResource($activityType), 'Jenis kegiatan berhasil diperbarui.');
    }
}
