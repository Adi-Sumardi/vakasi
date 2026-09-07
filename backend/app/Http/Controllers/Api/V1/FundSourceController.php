<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\FundSource\StoreFundSourceRequest;
use App\Http\Requests\FundSource\UpdateFundSourceRequest;
use App\Http\Resources\FundSourceResource;
use App\Models\FundSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FundSourceController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $sources = FundSource::query()
            ->when($request->string('search')->toString(), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->orderBy('name')
            ->paginate(20);

        return $this->success(FundSourceResource::collection($sources));
    }

    public function store(StoreFundSourceRequest $request): JsonResponse
    {
        $source = FundSource::create($request->validated());

        return $this->success(new FundSourceResource($source), 'Sumber dana berhasil dibuat.', 201);
    }

    public function show(FundSource $fundSource): JsonResponse
    {
        return $this->success(new FundSourceResource($fundSource));
    }

    public function update(UpdateFundSourceRequest $request, FundSource $fundSource): JsonResponse
    {
        $fundSource->update($request->validated());

        return $this->success(new FundSourceResource($fundSource), 'Sumber dana berhasil diperbarui.');
    }
}
