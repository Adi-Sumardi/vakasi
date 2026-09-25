import { redirect } from 'next/navigation';

import { ConfirmProvider } from '@/components/common/confirm-dialog';
import { Hint } from '@/components/common/hint';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { HeaderSearch } from '@/components/layout/header-search';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Icon } from '@/components/ui/icon';
import { meServer } from '@/lib/api/auth.server';
import { ApiError } from '@/lib/api/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user;

  try {
    user = await meServer();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }

    throw error;
  }

  // Tahun ajaran Indonesia umumnya berjalan Juli - Juni.
  const now = new Date();
  const academicYearStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const academicYearLabel = `TA ${academicYearStart}/${academicYearStart + 1}`;

  return (
    <ConfirmProvider>
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="bg-surface min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 flex h-header-height items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest/90 px-space-xl backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          {/* Left zone */}
          <div className="flex items-center gap-space-lg">
            <Hint label="Buka / tutup menu" side="bottom">
              <SidebarTrigger className="text-on-surface-variant hover:bg-surface-container" />
            </Hint>
            <HeaderSearch />
            <NotificationBell />
          </div>

          {/* Right zone */}
          <div className="flex items-center gap-space-md">
            <div className="hidden sm:flex items-center gap-space-sm px-space-md py-space-xs rounded-lg bg-surface-container-low border border-outline-variant/40">
              <Icon name="calendar_month" className="text-primary text-base" />
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">{academicYearLabel}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary-container" />
              <span className="font-label-sm text-label-sm text-on-tertiary-fixed-variant font-medium">Berjalan</span>
            </div>

            <div className="h-6 w-px bg-outline-variant/40 hidden sm:block" />

            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 w-full bg-surface">{children}</main>
      </SidebarInset>
    </SidebarProvider>
    </ConfirmProvider>
  );
}
