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
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use ApiResponse;

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

        return $this->success(new UserResource($user->load('role')), 'Pengguna berhasil dibuat.', 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return $this->success(new UserResource($user->load('role')), 'Pengguna berhasil diperbarui.');
    }

    public function roles(): JsonResponse
    {
        return $this->success(RoleResource::collection(Role::orderBy('name')->get()));
    }
}
