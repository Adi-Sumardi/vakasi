<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Honor\CalculateHonorRequest;
use App\Http\Resources\HonorDetailResource;
use App\Models\Activity;
use App\Models\Employee;
use App\Services\HonorCalculationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

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

    /**
     * PRD.md FR-12: printable honor slip PDF (ARSITEKTUR.md section 9
     * document types include "slip"). Bundles every honor line item
     * this employee has on this activity into a single document,
     * since a single Payment already bundles all employees/lines for
     * an activity together (see PaymentService::create).
     */
    public function slip(Activity $activity, Employee $employee): Response
    {
        $this->authorize('view', $activity);

        $details = $activity->honorDetails()
            ->where('employee_id', $employee->id)
            ->with('honorType')
            ->get();

        if ($details->isEmpty()) {
            abort(404);
        }

        $pdf = Pdf::loadView('pdf.honor-slip', [
            'activity' => $activity,
            'employee' => $employee,
            'details' => $details,
            'totalNet' => $details->sum('net_amount'),
        ]);

        return $pdf->stream("slip-honor-{$activity->activity_code}-{$employee->employee_code}.pdf");
    }
}
