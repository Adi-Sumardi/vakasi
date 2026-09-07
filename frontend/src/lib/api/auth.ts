import { apiFetch } from '@/lib/api/client';

/** Mirrors App\Http\Resources\UserResource in the backend. */
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  status: string;
  role: { id: number; name: string } | null;
  permissions: string[];
  last_login_at: string | null;
};

export function login(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logout(): Promise<null> {
  return apiFetch<null>('/api/v1/auth/logout', { method: 'POST' });
}

export function me(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/v1/auth/me');
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}
