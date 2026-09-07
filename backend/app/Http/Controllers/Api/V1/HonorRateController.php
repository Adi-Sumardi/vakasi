<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\HonorRate\StoreHonorRateRequest;
use App\Http\Requests\HonorRate\UpdateHonorRateRequest;
use App\Http\Resources\HonorRateResource;
use App\Models\HonorRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HonorRateController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $rates = HonorRate::query()
            ->with(['honorType', 'unit'])
            ->when($request->integer('honor_type_id'), fn ($q, $id) => $q->where('honor_type_id', $id))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->latest('effective_from')
            ->paginate(20);

        return $this->success(HonorRateResource::collection($rates));
    }

    public function store(StoreHonorRateRequest $request): JsonResponse
    {
        $rate = HonorRate::create($request->validated());

        return $this->success(new HonorRateResource($rate->load(['honorType', 'unit'])), 'Tarif honor berhasil dibuat.', 201);
    }

    public function show(HonorRate $honorRate): JsonResponse
    {
        return $this->success(new HonorRateResource($honorRate->load(['honorType', 'unit'])));
    }

    public function update(UpdateHonorRateRequest $request, HonorRate $honorRate): JsonResponse
    {
        $honorRate->update($request->validated());

        return $this->success(new HonorRateResource($honorRate->load(['honorType', 'unit'])), 'Tarif honor berhasil diperbarui.');
    }
}
