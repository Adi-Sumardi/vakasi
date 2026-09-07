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
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};
