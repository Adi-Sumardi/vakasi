/**
 * Base URL of the VAKASI Laravel API. Must point at the api.* subdomain
 * that shares a root domain with this app in production, so Sanctum's
 * SPA cookie auth works (see API.md section 2 and ARSITEKTUR.md).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * Where Server Components fetch from. In production the browser reaches
 * Laravel through this app's /api rewrite (API_PROXY_TARGET); a server
 * render going that way would call itself and queue behind its own
 * request, so it talks to Laravel directly instead. Inlined at build time
 * by next.config.ts; falls back to API_URL when no proxy is configured.
 */
export const SERVER_API_URL = process.env.SERVER_API_URL || API_URL;

/**
 * This app's own public URL. Must be one of Laravel's
 * SANCTUM_STATEFUL_DOMAINS. Server-to-server fetches (server.ts) send
 * no Origin/Referer by default, so Sanctum's EnsureFrontendRequestsAreStateful
 * can't recognize them as a stateful frontend request — we set Referer
 * explicitly to this value to fix that. See API.md section 2.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
