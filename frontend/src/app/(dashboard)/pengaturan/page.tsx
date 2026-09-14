import { listUsersServer, listRolesServer } from '@/lib/api/users.server';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';
import { Unauthorized } from '@/components/layout/unauthorized';
import { UserManager } from '@/components/pengaturan/user-manager';

export default async function PengaturanPage() {
  const me = await meServer();

  if (!hasPermission(me, 'users.manage')) {
    return <Unauthorized />;
  }

  const [users, roles] = await Promise.all([listUsersServer(), listRolesServer()]);

  return <UserManager users={users} roles={roles} currentUserId={me.id} />;
}
