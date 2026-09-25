<?php

namespace App\Http\Concerns;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * Standard response envelope for all /api/v1 endpoints, per API.md section 11.
 */
trait ApiResponse
{
    /**
     * Nesting a paginated collection under "data" drops Laravel's own
     * meta wrapper, so every list silently stopped at its first page.
     * The page info is surfaced as a sibling "meta" key instead, which
     * leaves "data" an array for every existing caller.
     */
    protected function success(mixed $data = null, string $message = 'Data berhasil diproses.', int $status = 200): JsonResponse
    {
        $body = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        $paginator = $data instanceof ResourceCollection ? $data->resource : $data;

        if ($paginator instanceof LengthAwarePaginator) {
            $body['meta'] = [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ];
        }

        return response()->json($body, $status);
    }

    /**
     * Page size requested via ?per_page=, bounded so a picker can load a
     * whole (school-sized) master list in one call without letting a
     * client ask for an unbounded result.
     */
    protected function perPage(Request $request, int $default = 20): int
    {
        return max(1, min(1000, $request->integer('per_page') ?: $default));
    }

    /**
     * @param  array<string, array<int, string>>  $errors
     */
    protected function error(string $message, array $errors = [], int $status = 422): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
