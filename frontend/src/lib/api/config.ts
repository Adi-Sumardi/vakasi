/**
 * Base URL of the VAKASI Laravel API. Must point at the api.* subdomain
 * that shares a root domain with this app in production, so Sanctum's
 * SPA cookie auth works (see API.md section 2 and ARSITEKTUR.md).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * This app's own public URL. Must be one of Laravel's
 * SANCTUM_STATEFUL_DOMAINS. Server-to-server fetches (server.ts) send
 * no Origin/Referer by default, so Sanctum's EnsureFrontendRequestsAreStateful
 * can't recognize them as a stateful frontend request — we set Referer
 * explicitly to this value to fix that. See API.md section 2.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
