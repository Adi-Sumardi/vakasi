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
            ->paginate(30);

        return $this->success(AuditLogResource::collection($logs));
    }
}
