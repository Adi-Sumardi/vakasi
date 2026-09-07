import 'server-only';

import type { AuthUser } from '@/lib/api/auth';
import { serverApiFetch } from '@/lib/api/server';

/**
 * Server Component-only variant of `me()`. Kept in a separate module
 * from lib/api/auth.ts (which login/page.tsx imports as a Client
 * Component) so bundling never pulls `server-only`/`next/headers`
 * into client code — see lib/api/server.ts.
 */
export function meServer(): Promise<AuthUser> {
  return serverApiFetch<AuthUser>('/api/v1/auth/me');
}
