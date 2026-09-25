<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Honor\CalculateHonorRequest;
use App\Http\Resources\HonorDetailResource;
use App\Models\Activity;
use App\Models\Employee;
use App\Services\HonorCalculationService;
use App\Services\QrCodeService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class HonorController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly HonorCalculationService $honorCalculationService,
        private readonly QrCodeService $qrCodeService,
    ) {}

    public function calculate(CalculateHonorRequest $request, Activity $activity): JsonResponse
    {
        $this->authorize('calculateHonor', $activity);

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

        $details = $activity->honorDetails()->with(['employee', 'honorType', 'activityMember'])->get();

        return $this->success(HonorDetailResource::collection($details));
    }

    /**
     * PRD.md FR-12: printable honor slip PDF (ARSITEKTUR.md section 9
     * document types include "slip"). Bundles every honor line item
     * this employee has on this activity into a single document,
     * since a single Payment already bundles all employees/lines for
     * an activity together (see PaymentService::create).
     */
    public function slip(Request $request, Activity $activity, Employee $employee): Response
    {
        $this->authorize('view', $activity);

        // ActivityPolicy::view() passes for *any* member of the activity,
        // so without this a teacher could pull a colleague's slip — and
        // with it their honor amount — just by changing {employee}.
        $user = $request->user();

        if ($user->hasRole('guru_tendik') && $user->employee_id !== $employee->id) {
            abort(403, 'Anda hanya dapat mengunduh slip honor Anda sendiri.');
        }

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
            // Only APPROVED-or-later activities carry a
            // verification_code (ApprovalService::approve) — a slip
            // for a still-DRAFT/REJECTED activity's honor line
            // (shouldn't normally happen, but not impossible) simply
            // prints without a QR rather than erroring.
            'qrCodeDataUri' => $activity->verification_code
                ? $this->qrCodeService->generate(
                    $this->qrCodeService->verificationUrl($activity->verification_code)
                )->getDataUri()
                : null,
        ]);

        return $pdf->stream("slip-honor-{$activity->activity_code}-{$employee->employee_code}.pdf");
    }
}
