<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\BudgetResource;
use App\Http\Resources\HonorDetailResource;
use App\Http\Resources\MyHonorResource;
use App\Http\Resources\PaymentResource;
use App\Models\HonorDetail;
use App\Services\ReportExportService;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ReportService $reportService) {}

    public function activities(Request $request): JsonResponse
    {
        return $this->success(ActivityResource::collection($this->reportService->activities($request->all(), $request->user())));
    }

    public function honors(Request $request): JsonResponse
    {
        return $this->success(HonorDetailResource::collection($this->reportService->honors($request->all(), $request->user())));
    }

    public function employeeHonors(Request $request, int $employee): JsonResponse
    {
        return $this->success(HonorDetailResource::collection($this->reportService->employeeHonors($employee, $request->all(), $request->user())));
    }

    public function budget(Request $request): JsonResponse
    {
        return $this->success(BudgetResource::collection($this->reportService->budget($request->all(), $request->user())));
    }

    public function payments(Request $request): JsonResponse
    {
        return $this->success(PaymentResource::collection($this->reportService->payments($request->all(), $request->user())));
    }

    /**
     * CSV download for "Laporan & Export"; same visibility as the lists.
     */
    public function export(Request $request, string $type, ReportExportService $exporter): Response
    {
        abort_unless(in_array($type, ReportExportService::TYPES, true), 404);

        $filters = $request->validate([
            'unit_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $name = "laporan-{$type}-".now()->format('Ymd-His').'.csv';

        return response($exporter->csv($type, $filters, $request->user()), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$name}\"",
        ]);
    }

    /**
     * "Honor Saya": every honor line of the signed-in employee, with
     * where each activity's payment stands.
     */
    public function myHonors(Request $request): JsonResponse
    {
        $employeeId = $request->user()->employee_id;

        if (! $employeeId) {
            return $this->success([]);
        }

        $details = HonorDetail::query()
            ->where('employee_id', $employeeId)
            ->with(['activity.unit', 'activity.disbursement.latestEvent', 'honorType', 'activityMember'])
            ->latest()
            ->paginate($this->perPage($request));

        return $this->success(MyHonorResource::collection($details));
    }
}
