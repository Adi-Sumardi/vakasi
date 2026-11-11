import 'server-only';

import { cache } from 'react';

import type { AuthUser } from '@/lib/api/auth';
import { serverApiFetch } from '@/lib/api/server';

/**
 * Server Component-only variant of `me()`. Kept in a separate module
 * from lib/api/auth.ts (which login/page.tsx imports as a Client
 * Component) so bundling never pulls `server-only`/`next/headers`
 * into client code — see lib/api/server.ts.
 *
 * Wrapped in cache(): the layout and the page both ask for the user, and
 * a no-store fetch is not deduplicated, so without it every navigation
 * paid for /auth/me twice.
 */
export const meServer = cache((): Promise<AuthUser> => serverApiFetch<AuthUser>('/api/v1/auth/me'));
