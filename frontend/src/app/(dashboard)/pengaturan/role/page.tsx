import { Unauthorized } from '@/components/layout/unauthorized';
import { RolePermissionMatrix } from '@/components/pengaturan/role-permission-matrix';
import { hasPermission } from '@/lib/api/auth';
import { meServer } from '@/lib/api/auth.server';
import { serverApiFetch } from '@/lib/api/server';
import type { RolePermissions } from '@/lib/api/users';

export default async function RoleHakAksesPage() {
  const me = await meServer();

  if (!hasPermission(me, 'roles.manage')) {
    return <Unauthorized />;
  }

  const data = await serverApiFetch<RolePermissions>('/api/v1/role-permissions');

  return <RolePermissionMatrix data={data} />;
}
