import { apiFetch } from '@/lib/api/client';

export type Role = { id: number; name: string; description: string | null };

export type AppUser = {
  id: number;
  name: string;
  email: string;
  status: string;
  role: { id: number; name: string } | null;
  unit_id?: number | null;
  unit?: { id: number; name: string } | null;
  last_login_at: string | null;
};

export function listUsers(): Promise<AppUser[]> {
  return apiFetch<AppUser[]>('/api/v1/users');
}

export function listRoles(): Promise<Role[]> {
  return apiFetch<Role[]>('/api/v1/roles');
}

export function createUser(input: {
  name: string;
  email: string;
  password: string;
  role_id: number;
  unit_id: number | null;
}): Promise<AppUser> {
  return apiFetch<AppUser>('/api/v1/users', { method: 'POST', body: input });
}

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role_id?: number;
  unit_id?: number | null;
  status?: 'active' | 'inactive';
};

export type RolePermissions = {
  roles: (Role & { permissions: string[]; users_count: number })[];
  permissions: { id: number; name: string; module: string; action: string; description: string | null }[];
};

export function updateRolePermissions(roleId: number, permissions: string[]) {
  return apiFetch(`/api/v1/role-permissions/${roleId}`, { method: 'PUT', body: { permissions } });
}

export function updateUser(id: number, input: UpdateUserInput): Promise<AppUser> {
  return apiFetch<AppUser>(`/api/v1/users/${id}`, { method: 'PUT', body: input });
}
