import { listUsersServer, listRolesServer } from '@/lib/api/users.server';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';
import { Unauthorized } from '@/components/layout/unauthorized';
import { UserManager } from '@/components/pengaturan/user-manager';
import { activeOnly } from '@/lib/api/master-data';
import { listUnits } from '@/lib/api/master-data.server';

export default async function PengaturanPage() {
  const me = await meServer();

  if (!hasPermission(me, 'users.manage')) {
    return <Unauthorized />;
  }

  const [users, roles, units] = await Promise.all([listUsersServer(), listRolesServer(), listUnits()]);

  return <UserManager users={users} roles={roles} units={activeOnly(units)} currentUserId={me.id} />;
}
