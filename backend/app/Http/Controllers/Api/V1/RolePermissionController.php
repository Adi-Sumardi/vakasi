<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * "Role & Hak Akses": lets a Super Admin adjust which role may do what
 * without a code change. RolePermissionSeeder stays the starting point
 * for a fresh install; changes made here are what production runs on.
 */
class RolePermissionController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly AuditService $auditService) {}

    public function index(): JsonResponse
    {
        return $this->success([
            'roles' => RoleResource::collection(Role::with('permissions')->withCount('users')->orderBy('id')->get()),
            'permissions' => Permission::orderBy('module')->orderBy('action')->get(['id', 'name', 'module', 'action', 'description']),
        ]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        // Super Admin always holds everything: editing it could remove
        // the very permission needed to put it back.
        if ($role->name === 'super_admin') {
            abort(403, 'Hak akses Super Admin tidak dapat diubah.');
        }

        $validated = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $old = $role->permissions()->pluck('name')->sort()->values()->all();
        $ids = Permission::whereIn('name', $validated['permissions'])->pluck('id');

        $role->permissions()->sync($ids);

        $this->auditService->logModel('role.permissions_updated', $role, ['permissions' => $old], [
            'permissions' => collect($validated['permissions'])->sort()->values()->all(),
        ]);

        return $this->success(new RoleResource($role->load('permissions')->loadCount('users')), 'Hak akses role berhasil diperbarui.');
    }
}
