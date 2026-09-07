<?php

namespace App\Http\Concerns;

use Illuminate\Http\JsonResponse;

/**
 * Standard response envelope for all /api/v1 endpoints, per API.md section 11.
 */
trait ApiResponse
{
    protected function success(mixed $data = null, string $message = 'Data berhasil diproses.', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
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
