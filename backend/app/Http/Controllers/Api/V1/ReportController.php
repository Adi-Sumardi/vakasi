<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\BudgetResource;
use App\Http\Resources\HonorDetailResource;
use App\Http\Resources\PaymentResource;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ReportService $reportService) {}

    public function activities(Request $request): JsonResponse
    {
        return $this->success(ActivityResource::collection($this->reportService->activities($request->all())));
    }

    public function honors(Request $request): JsonResponse
    {
        return $this->success(HonorDetailResource::collection($this->reportService->honors($request->all())));
    }

    public function employeeHonors(Request $request, int $employee): JsonResponse
    {
        return $this->success(HonorDetailResource::collection($this->reportService->employeeHonors($employee, $request->all())));
    }

    public function budget(Request $request): JsonResponse
    {
        return $this->success(BudgetResource::collection($this->reportService->budget($request->all())));
    }

    public function payments(Request $request): JsonResponse
    {
        return $this->success(PaymentResource::collection($this->reportService->payments($request->all())));
    }
}
