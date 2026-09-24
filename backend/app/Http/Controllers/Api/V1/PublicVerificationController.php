<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ApprovalLog;
use App\Services\QrCodeService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Public, unauthenticated verification for the QR code generated on
 * Kepala Sekolah approval — see FLOW.md section 8 / ARSITEKTUR.md
 * section 11.1. Deliberately excluded from auth:sanctum (routes.php)
 * since the whole point is that anyone scanning the QR (Sianggar,
 * Sianggar, an auditor, a parent) can confirm the approval is real
 * without a VAKASI account.
 *
 * Only non-sensitive fields are exposed here — no honor amounts,
 * budget figures, or bank details. AI_CODING_RULES.md: never trust
 * `{code}` as anything but an opaque public lookup key.
 */
class PublicVerificationController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly QrCodeService $qrCodeService) {}

    public function show(string $code): JsonResponse
    {
        $activity = Activity::where('verification_code', $code)
            ->with(['unit', 'activityType', 'fundSource', 'members.employee'])
            ->first();

        if (! $activity) {
            return $this->error('Kode verifikasi tidak ditemukan atau kegiatan belum disetujui.', status: 404);
        }

        $approverName = ApprovalLog::whereHas('approval', fn ($q) => $q->where('activity_id', $activity->id))
            ->where('action', 'approve')
            ->with('actor')
            ->latest('acted_at')
            ->first()
            ?->actor?->name;

        return $this->success([
            'activity_code' => $activity->activity_code,
            'approval_document_number' => $activity->approval_document_number,
            'name' => $activity->name,
            'activity_type' => $activity->activityType?->name,
            'fund_source' => $activity->fundSource?->name,
            'unit' => $activity->unit?->name,
            'location' => $activity->location,
            'status' => $activity->status,
            'start_date' => $activity->start_date?->toDateString(),
            'end_date' => $activity->end_date?->toDateString(),
            'approved_at' => $activity->approved_at,
            'approved_by' => $approverName,
            // Names only — never honor amounts (see class docblock).
            'members' => $activity->members
                ->map(fn ($member) => ['name' => $member->employee->name, 'role' => $member->role_name])
                ->values(),
        ]);
    }

    public function qrcode(string $code): Response
    {
        $activity = Activity::where('verification_code', $code)->first();

        if (! $activity) {
            abort(404);
        }

        $result = $this->qrCodeService->generate($this->qrCodeService->verificationUrl($code));

        return new Response($result->getString(), 200, ['Content-Type' => $result->getMimeType()]);
    }
}
