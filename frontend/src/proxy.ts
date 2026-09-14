import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * UX-only redirect: bounces obviously-unauthenticated visitors to
 * /login before a page even renders. This is NOT the real
 * authorization layer — it only checks whether Laravel's session
 * cookie is present, it cannot verify the session is valid. The
 * actual check happens server-side via GET /api/v1/auth/me
 * (see (dashboard)/layout.tsx and ROLE_PERMISSION.md section 7).
 *
 * Cookie name must match Laravel's `session.cookie` config, which
 * Laravel derives from APP_NAME ("VAKASI" -> "vakasi-session").
 */
const SESSION_COOKIE = 'vakasi-session';

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Also exclude static files served straight out of /public (logo,
  // icons, etc.) — without this, e.g. /logo.png on the (unauthenticated)
  // login page itself gets redirected to /login instead of the image.
  // /verify is the public QR-approval verification page (FLOW.md
  // section 8) — deliberately reachable without a session, same as
  // its backend counterpart (/api/v1/public/verify/{code}).
  matcher: [
    '/((?!login|verify|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$).*)',
  ],
};
