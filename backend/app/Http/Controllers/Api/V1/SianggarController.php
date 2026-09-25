<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Jobs\PushApprovedActivityToSianggar;
use App\Models\Activity;
use App\Services\Exceptions\BusinessValidationException;
use App\Services\SianggarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Operational control over the handoff to Sianggar (FLOW.md section 8).
 * The push happens automatically on approval; this exists for when it
 * did not get through — Sianggar was down, the token was wrong, the URL
 * was not configured yet — so the approval does not have to be redone.
 */
class SianggarController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly SianggarService $sianggar) {}

    /**
     * Activities whose handoff still needs attention.
     */
    public function pending(Request $request): JsonResponse
    {
        $activities = Activity::query()
            ->where('status', Activity::APPROVED)
            ->whereIn('sianggar_status', [Activity::SIANGGAR_PENDING, Activity::SIANGGAR_FAILED, Activity::SIANGGAR_SKIPPED])
            ->with(['activityType', 'unit', 'fundSource', 'creator'])
            ->latest('approved_at')
            ->paginate($this->perPage($request));

        return $this->success(ActivityResource::collection($activities));
    }

    public function push(Activity $activity): JsonResponse
    {
        if ($activity->status !== Activity::APPROVED) {
            throw new BusinessValidationException(
                'status',
                'Hanya kegiatan berstatus APPROVED yang dapat dikirim ke Sianggar.',
            );
        }

        if (! $this->sianggar->isConfigured()) {
            throw new BusinessValidationException(
                'sianggar',
                'Integrasi Sianggar belum dikonfigurasi (SIANGGAR_WEBHOOK_URL kosong). Hubungi administrator.',
            );
        }

        $activity->forceFill(['sianggar_status' => Activity::SIANGGAR_PENDING])->save();

        PushApprovedActivityToSianggar::dispatch($activity);

        return $this->success(
            new ActivityResource($activity->fresh()),
            'Pengiriman ulang ke Sianggar sedang diproses.',
        );
    }
}
