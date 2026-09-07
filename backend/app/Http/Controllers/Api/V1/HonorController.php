<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Honor\CalculateHonorRequest;
use App\Http\Resources\HonorDetailResource;
use App\Models\Activity;
use App\Services\HonorCalculationService;
use Illuminate\Http\JsonResponse;

class HonorController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly HonorCalculationService $honorCalculationService) {}

    public function calculate(CalculateHonorRequest $request, Activity $activity): JsonResponse
    {
        $this->authorize('update', $activity);

        $result = $this->honorCalculationService->generateForActivity($activity, $request->validated('items'));

        return $this->success([
            'items' => HonorDetailResource::collection($result['items']),
            'gross_amount' => $result['gross_amount'],
            'tax_amount' => $result['tax_amount'],
            'deduction_amount' => $result['deduction_amount'],
            'net_amount' => $result['net_amount'],
        ], 'Honor berhasil dihitung.');
    }

    public function index(Activity $activity): JsonResponse
    {
        $this->authorize('view', $activity);

        $details = $activity->honorDetails()->with(['employee', 'honorType'])->get();

        return $this->success(HonorDetailResource::collection($details));
    }
}
