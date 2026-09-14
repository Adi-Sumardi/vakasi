<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::query()
            ->with('user')
            ->when($request->string('entity_type')->toString(), fn ($q, $type) => $q->where('entity_type', 'like', "%{$type}%"))
            ->when($request->integer('entity_id'), fn ($q, $id) => $q->where('entity_id', $id))
            ->latest('created_at')
            ->paginate(30, page: $request->integer('page') ?: 1);

        // ApiResponse::success() nests $data under "data", which
        // discards Laravel's automatic paginator meta/links wrapper —
        // so the audit trail (the one screen where silently hiding
        // older entries matters most) needs its pagination surfaced
        // explicitly rather than relying on that wrapper.
        return $this->success([
            'items' => AuditLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
            ],
        ]);
    }
}
