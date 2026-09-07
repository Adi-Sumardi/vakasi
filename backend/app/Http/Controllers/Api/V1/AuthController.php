<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::guard('web')->user();
        $user->forceFill(['last_login_at' => now()])->save();

        $this->auditService->logModel('login', $user);

        return $this->success(
            new UserResource($user->load('role.permissions')),
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
            new UserResource($request->user()->load('role.permissions')),
        );
    }
}
