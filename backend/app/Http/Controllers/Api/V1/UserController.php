<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\RoleResource;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly AuditService $auditService) {}

    public function index(): JsonResponse
    {
        $users = User::query()->with('role')->orderBy('name')->get();

        return $this->success(UserResource::collection($users));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            ...$request->validated(),
            'password' => Hash::make($request->validated('password')),
            'status' => 'active',
        ]);

        $this->auditService->logModel('user.created', $user, newValues: $user->only(['name', 'email', 'role_id', 'status']));

        return $this->success(new UserResource($user->load('role')), 'Pengguna berhasil dibuat.', 201);
    }

    /**
     * `users.manage` is granted to Admin as well as Super Admin
     * (ROLE_PERMISSION.md section 3). UpdateUserRequest already stops an
     * Admin from *promoting* anyone to Super Admin, but that guard is
     * worthless on its own: an Admin could instead reset a Super Admin's
     * password and simply log in as them. Super Admin accounts are
     * therefore editable only by a Super Admin.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $actor = $request->user();

        if ($user->hasRole('super_admin') && ! $actor->hasRole('super_admin')) {
            abort(403, 'Hanya Super Admin yang dapat mengubah akun Super Admin.');
        }

        $data = $request->validated();

        // Losing your own access mid-session is never intentional, and
        // for the last Super Admin it would lock the whole instance out.
        if ($actor->is($user) && ($data['status'] ?? 'active') !== 'active') {
            abort(403, 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        if ($actor->is($user) && isset($data['role_id']) && (int) $data['role_id'] !== $actor->role_id) {
            abort(403, 'Anda tidak dapat mengubah role akun Anda sendiri.');
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $old = $user->only(['name', 'email', 'role_id', 'status']);

        $user->update($data);

        $this->auditService->logModel(
            'user.updated',
            $user,
            $old,
            // Never log the new password, even hashed (AI_CODING_RULES.md section 10).
            array_diff_key($data, ['password' => null]) + (isset($data['password']) ? ['password' => '[redacted]'] : []),
        );

        return $this->success(new UserResource($user->load('role')), 'Pengguna berhasil diperbarui.');
    }

    public function roles(): JsonResponse
    {
        return $this->success(RoleResource::collection(Role::orderBy('name')->get()));
    }
}
