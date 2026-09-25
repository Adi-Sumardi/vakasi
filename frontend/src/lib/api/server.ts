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
export type PageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

/** A list plus its page info — see ApiResponse::success() in the backend. */
export type Paged<T, M = PageMeta> = { data: T[]; meta: M };

export async function serverApiFetch<T>(path: string): Promise<T> {
  return (await request<T>(path)).data;
}

/**
 * For paginated lists. Plain serverApiFetch only returns `data`, which
 * made every list silently stop at its first page.
 */
export async function serverApiFetchPage<T, M = PageMeta>(path: string): Promise<Paged<T, M>> {
  const json = await request<T[]>(path);
  const data = json.data ?? [];

  return {
    data,
    meta: (json.meta ?? { current_page: 1, last_page: 1, per_page: data.length, total: data.length }) as M,
  };
}

/** Builds a query string, skipping empty values. */
export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  }

  const out = qs.toString();
  return out ? `?${out}` : '';
}

async function request<T>(path: string): Promise<ApiSuccess<T> & { meta?: unknown }> {
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
    | (ApiSuccess<T> & { meta?: unknown })
    | ApiErrorBody
    | null;

  if (!response.ok || !json || json.success === false) {
    throw new ApiError(response.status, json as ApiErrorBody ?? {
      success: false,
      message: 'Terjadi kesalahan yang tidak terduga.',
      errors: {},
    });
  }

  return json;
}
