<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * `users.status` is set by UserController (Pengaturan) but authentication
 * alone never consults it — Auth::attempt() only matches credentials.
 * Without this middleware, deactivating an account has no effect on a
 * session that is already established, and PRD.md FR-01's "session
 * management" requirement is unmet.
 *
 * Login itself is guarded separately in AuthController::login; this
 * middleware covers every *subsequent* request, so an account
 * deactivated mid-session loses access on its next call rather than
 * when its session happens to expire.
 */
class EnsureUserIsActive
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isActive()) {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            abort(403, 'Akun Anda telah dinonaktifkan. Hubungi administrator.');
        }

        return $next($request);
    }
}
