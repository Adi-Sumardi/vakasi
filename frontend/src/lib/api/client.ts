'use client';

import { API_URL } from '@/lib/api/config';
import { ApiError, type ApiErrorBody, type ApiSuccess } from '@/lib/api/types';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Sanctum SPA requires a fresh CSRF cookie before any state-changing
 * request. See API.md section 2 for the full stateful-auth flow.
 */
async function ensureCsrfCookie(): Promise<void> {
  if (readCookie('XSRF-TOKEN')) {
    return;
  }

  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
}

/**
 * Unconditionally fetches a new CSRF cookie, overwriting whatever is
 * currently stored. Used to recover from a 419 (stale/expired
 * XSRF-TOKEN — e.g. the server session was reset, or the browser held
 * onto an old cookie past its server-side lifetime): the plain
 * "only fetch if missing" check in ensureCsrfCookie() can't detect
 * this case since the cookie *is* present, just no longer valid.
 */
async function refreshCsrfCookie(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
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

type ApiFetchOptions = Omit<RequestInit, 'body'> & { body?: unknown };

/**
 * Fetch wrapper for Client Components. Always sends cookies
 * (`credentials: 'include'`) and, for non-GET requests, attaches the
 * `X-XSRF-TOKEN` header Sanctum expects for CSRF protection. Retries
 * once on a 419 CSRF mismatch after refreshing the token.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';

  if (method !== 'GET') {
    await ensureCsrfCookie();
  }

  const send = () => {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    const xsrfToken = readCookie('XSRF-TOKEN');
    if (xsrfToken && method !== 'GET') {
      headers.set('X-XSRF-TOKEN', xsrfToken);
    }

    return fetch(`${API_URL}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await send();

  if (response.status === 419 && method !== 'GET') {
    await refreshCsrfCookie();
    response = await send();
  }

  return parseJsonResponse<T>(response);
}

/**
 * Like apiFetch, but for multipart/form-data (file uploads) — body must
 * NOT be JSON-encoded, and the browser needs to set its own
 * Content-Type (with the multipart boundary) rather than us setting it.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  await ensureCsrfCookie();

  const send = () => {
    const headers = new Headers({ Accept: 'application/json' });
    const xsrfToken = readCookie('XSRF-TOKEN');
    if (xsrfToken) {
      headers.set('X-XSRF-TOKEN', xsrfToken);
    }

    return fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
  };

  let response = await send();

  if (response.status === 419) {
    await refreshCsrfCookie();
    response = await send();
  }

  return parseJsonResponse<T>(response);
}
