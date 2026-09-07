import 'server-only';

import { cookies } from 'next/headers';

import { API_URL, APP_URL } from '@/lib/api/config';
import { ApiError, type ApiErrorBody, type ApiSuccess } from '@/lib/api/types';

/**
 * Fetch wrapper for Server Components / Route Handlers. Browser cookies
 * are not automatically attached to server-side fetches, so the
 * incoming request's cookie header must be forwarded manually — see
 * API.md section 2 and ARSITEKTUR.md section 10.
 *
 * Read-only: intended for GET requests made during render (e.g. loading
 * the current user for a protected layout). Mutations should go through
 * `apiFetch` from a Client Component so the CSRF/XSRF flow applies.
 */
export async function serverApiFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      Cookie: cookieHeader,
      Referer: APP_URL,
    },
    cache: 'no-store',
  });

  const json = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiErrorBody
    | null;

  if (!response.ok || !json || json.success === false) {
    throw new ApiError(response.status, json as ApiErrorBody ?? {
      success: false,
      message: 'Terjadi kesalahan yang tidak terduga.',
      errors: {},
    });
  }

  return json.data;
}
