<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * Handle an incoming request.
     *
     * Enforces the route-level "module.action" permission described in
     * ROLE_PERMISSION.md section 7.2. This only answers whether the
     * user's role may access the feature at all — object-level rules
     * (ownership, unit scope, status transition) belong in a Policy,
     * not here.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! $request->user()?->hasPermission($permission)) {
            abort(403, "Anda tidak memiliki izin: {$permission}");
        }

        return $next($request);
    }
}
