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

type ApiFetchOptions = Omit<RequestInit, 'body'> & { body?: unknown };

/**
 * Fetch wrapper for Client Components. Always sends cookies
 * (`credentials: 'include'`) and, for non-GET requests, attaches the
 * `X-XSRF-TOKEN` header Sanctum expects for CSRF protection.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';

  if (method !== 'GET') {
    await ensureCsrfCookie();
  }

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const xsrfToken = readCookie('XSRF-TOKEN');
  if (xsrfToken && method !== 'GET') {
    headers.set('X-XSRF-TOKEN', xsrfToken);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
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
