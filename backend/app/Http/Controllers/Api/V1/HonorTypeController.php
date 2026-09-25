<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\HonorType\StoreHonorTypeRequest;
use App\Http\Requests\HonorType\UpdateHonorTypeRequest;
use App\Http\Resources\HonorTypeResource;
use App\Models\HonorType;
use App\Services\MasterDataDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HonorTypeController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $types = HonorType::query()
            ->when($request->string('search')->toString(), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->orderBy('name')
            ->paginate($this->perPage($request));

        return $this->success(HonorTypeResource::collection($types));
    }

    public function store(StoreHonorTypeRequest $request): JsonResponse
    {
        $type = HonorType::create($request->validated());

        return $this->success(new HonorTypeResource($type), 'Jenis honor berhasil dibuat.', 201);
    }

    public function show(HonorType $honorType): JsonResponse
    {
        return $this->success(new HonorTypeResource($honorType));
    }

    public function update(UpdateHonorTypeRequest $request, HonorType $honorType): JsonResponse
    {
        $honorType->update($request->validated());

        return $this->success(new HonorTypeResource($honorType), 'Jenis honor berhasil diperbarui.');
    }

    /**
     * Permanent delete for a record entered by mistake; refused while
     * anything still uses it (MasterDataDeletionService).
     */
    public function destroy(Request $request, HonorType $honorType, MasterDataDeletionService $deletion): JsonResponse
    {
        $deletion->delete($honorType, $request->user());

        return $this->success(message: 'Jenis honor berhasil dihapus.');
    }
}
