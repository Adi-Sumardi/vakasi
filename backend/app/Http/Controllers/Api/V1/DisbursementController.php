<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * "Status Pencairan": where each approved activity's honor stands in
 * Sianggar, from the callbacks Sianggar sends back (FLOW.md section 8).
 *
 * The state is derived per activity (Activity::disbursementState), so
 * filtering happens after loading. A school approves a few hundred
 * activities a year at most, which keeps this well within reason.
 */
class DisbursementController extends Controller
{
    use ApiResponse;

    private const STATES = [
        Activity::DISBURSEMENT_NOT_SENT,
        Activity::DISBURSEMENT_WAITING,
        Activity::DISBURSEMENT_PROCESSING,
        Activity::DISBURSEMENT_PAID,
        Activity::DISBURSEMENT_REJECTED,
    ];

    public function index(Request $request): JsonResponse
    {
        $activities = Activity::query()
            ->visibleTo($request->user())
            ->where('status', Activity::APPROVED)
            ->when($request->integer('unit_id'), fn ($q, $unitId) => $q->where('unit_id', $unitId))
            ->with(['unit', 'fundSource', 'creator', 'budget', 'disbursement.latestEvent'])
            ->latest('approved_at')
            ->get();

        $counts = collect(self::STATES)->mapWithKeys(fn (string $state) => [$state => 0])->all();

        foreach ($activities as $activity) {
            $counts[$activity->disbursementState()]++;
        }

        $state = $request->string('state')->toString();

        if (in_array($state, self::STATES, true)) {
            $activities = $activities->filter(fn (Activity $a) => $a->disbursementState() === $state)->values();
        }

        $perPage = $this->perPage($request);
        $page = max(1, $request->integer('page') ?: 1);

        $paginator = new LengthAwarePaginator(
            $activities->forPage($page, $perPage)->values(),
            $activities->count(),
            $perPage,
            $page,
        );

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diproses.',
            'data' => ActivityResource::collection($paginator->getCollection()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'counts' => $counts,
            ],
        ]);
    }
}
