import { apiFetch } from '@/lib/api/client';

/** Mirrors App\Http\Resources\UserResource in the backend. */
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  status: string;
  employee_id?: number | null;
  unit_id?: number | null;
  role: { id: number; name: string } | null;
  /** Unit akun; null = seluruh unit. */
  unit?: { id: number; name: string } | null;
  /** Unit yang membatasi data akun ini (null untuk Super Admin / akun tanpa unit). */
  scoped_unit_id?: number | null;
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

export function changePassword(currentPassword: string, newPassword: string): Promise<null> {
  return apiFetch<null>('/api/v1/auth/password', {
    method: 'PATCH',
    body: { current_password: currentPassword, password: newPassword },
  });
}

/**
 * Always resolves with the same neutral message whether or not the
 * address is registered — the API deliberately does not reveal it.
 */
export function forgotPassword(email: string): Promise<null> {
  return apiFetch<null>('/api/v1/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(input: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<null> {
  return apiFetch<null>('/api/v1/auth/reset-password', { method: 'POST', body: input });
}

export function me(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/v1/auth/me');
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}

export function hasRole(user: AuthUser | null, ...roles: string[]): boolean {
  return !!user?.role && roles.includes(user.role.name);
}

export const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  tu: 'TU',
  kepala_sekolah: 'Kepala Sekolah',
  keuangan: 'Keuangan',
  guru_tendik: 'Guru/Tendik',
  auditor: 'Auditor',
};

export const roleLabel = (user: AuthUser | null) => (user?.role ? (ROLE_LABEL[user.role.name] ?? user.role.name) : '');
