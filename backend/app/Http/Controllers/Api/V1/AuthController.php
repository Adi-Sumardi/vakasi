<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly AuditService $auditService) {}

    /**
     * Authenticate the user via the "web" guard so Sanctum can issue a
     * stateful (cookie-based) session for the Next.js SPA. See
     * API.md section 2 for the full Sanctum SPA flow.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // EnsureFrontendRequestsAreStateful only attaches the session
        // store when the request's Origin/Referer matches
        // SANCTUM_STATEFUL_DOMAINS. A real browser request from the
        // Next.js SPA always sends Origin on this cross-origin POST;
        // anything else (misconfigured domain, non-browser caller)
        // must fail cleanly instead of crashing on $request->session().
        if (! $request->hasSession()) {
            return $this->error(
                'Request tidak dikenali sebagai permintaan dari frontend terdaftar. Periksa SANCTUM_STATEFUL_DOMAINS.',
                status: 400,
            );
        }

        $credentials = $request->validated();

        if (! Auth::guard('web')->attempt($credentials, remember: false)) {
            $this->auditService->log(
                action: 'login_failed',
                entityType: User::class,
                newValues: ['email' => $credentials['email']],
            );

            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();

        // Auth::attempt() only matches credentials — it never consults
        // `users.status`, so a deactivated account would otherwise stay
        // fully usable. Reject before regenerating the session so no
        // authenticated session is ever established for it.
        if (! $user->isActive()) {
            Auth::guard('web')->logout();

            $this->auditService->log(
                action: 'login_blocked_inactive',
                entityType: User::class,
                entityId: $user->id,
                newValues: ['email' => $credentials['email']],
            );

            throw ValidationException::withMessages([
                'email' => ['Akun Anda telah dinonaktifkan. Hubungi administrator.'],
            ]);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        $this->auditService->logModel('login', $user);

        return $this->success(
            new UserResource($user->load(['role.permissions', 'unit'])),
            'Login berhasil.',
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $this->auditService->logModel('logout', $user);
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->success(message: 'Logout berhasil.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success(
            new UserResource($request->user()->load(['role.permissions', 'unit'])),
        );
    }

    /**
     * PRD.md FR-01 requires a reset flow, not just an admin-driven one.
     *
     * The response is deliberately identical whether or not the address
     * exists: a differing message would turn this endpoint into an
     * account-enumeration oracle. `status => active` is part of the
     * lookup so a deactivated account cannot be revived through it.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink([
            'email' => $request->validated('email'),
            'status' => 'active',
        ]);

        $this->auditService->log(
            action: 'password_reset_requested',
            entityType: User::class,
            newValues: ['email' => $request->validated('email')],
        );

        return $this->success(message: 'Jika email terdaftar, tautan reset password telah dikirim.');
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            [...$request->validated(), 'status' => 'active'],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $this->auditService->logModel('password_reset', $user);
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return $this->success(message: 'Password berhasil direset. Silakan login kembali.');
    }

    /**
     * Self-service password change — the only way a regular user could
     * change their password before was asking an admin to reset it via
     * UserController::update (permission:users.manage).
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->forceFill(['password' => Hash::make($request->validated('password'))])->save();

        $this->auditService->logModel('password_changed', $user);

        return $this->success(message: 'Password berhasil diubah.');
    }
}
