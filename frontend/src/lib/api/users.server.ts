import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import type { AppUser, Role } from '@/lib/api/users';

export const listUsersServer = () => serverApiFetch<AppUser[]>('/api/v1/users');
export const listRolesServer = () => serverApiFetch<Role[]>('/api/v1/roles');
