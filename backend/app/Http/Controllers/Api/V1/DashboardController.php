<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request, DashboardService $dashboard): JsonResponse
    {
        return $this->success($dashboard->summary($request->user()->loadMissing('unit')));
    }
}
