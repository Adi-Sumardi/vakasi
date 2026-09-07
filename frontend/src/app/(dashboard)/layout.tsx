import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/layout/app-sidebar';
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

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="bg-surface min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 flex h-header-height items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest/90 px-space-xl backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          {/* Left zone */}
          <div className="flex items-center gap-space-lg">
            <SidebarTrigger className="text-on-surface-variant hover:bg-surface-container" />
            <div className="hidden xl:flex items-center px-space-md py-space-xs rounded-full bg-secondary-container/60 text-on-secondary-fixed text-label-sm font-label-sm border border-outline-variant/40 gap-space-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Sistem Honorarium &amp; Kegiatan</span>
            </div>
            <div className="relative hidden md:flex items-center">
              <Icon name="search" className="absolute left-space-md text-outline text-lg pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kegiatan, penerima, SK, SPD..."
                className="w-72 lg:w-80 h-9 pl-9 pr-14 py-space-xs bg-surface-container-low/60 border border-outline-variant/50 rounded-lg text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all"
              />
              <kbd className="absolute right-space-md px-1.5 py-0.5 text-[10px] font-mono font-semibold text-outline bg-surface-container-lowest border border-outline-variant rounded shadow-xs">
                Ctrl+K
              </kbd>
            </div>
            <button
              type="button"
              className="relative p-space-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              title="Notifikasi"
            >
              <Icon name="notifications" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest" />
            </button>
          </div>

          {/* Right zone */}
          <div className="flex items-center gap-space-md">
            <div className="hidden sm:flex items-center gap-space-sm px-space-md py-space-xs rounded-lg bg-surface-container-low border border-outline-variant/40">
              <Icon name="calendar_month" className="text-primary text-base" />
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">TA 2025</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary-container" />
              <span className="font-label-sm text-label-sm text-on-tertiary-fixed-variant font-medium">Berjalan</span>
            </div>

            <div className="hidden lg:flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-low/70 border border-outline-variant/40 text-on-surface">
              <Icon name="account_balance" className="text-secondary text-base" />
              <span className="font-label-sm text-label-sm font-medium">Biro Perencanaan &amp; Keuangan</span>
            </div>

            <div className="h-6 w-px bg-outline-variant/40 hidden sm:block" />

            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 w-full bg-surface">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
