'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Icon } from '@/components/ui/icon';
import { roleLabel, type AuthUser } from '@/lib/api/auth';
import { apiFetchTotal } from '@/lib/api/client';
import { activeHref, buildNav } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const groups = useMemo(() => buildNav(user), [user]);
  const current = activeHref(groups, pathname);
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user.permissions.includes('activities.approve')) {
      return;
    }

    apiFetchTotal('/api/v1/activities?status=submitted&per_page=1')
      .then(setPendingApprovalCount)
      .catch(() => {});
  }, [user.permissions, pathname]);

  return (
    <Sidebar className="border-r border-outline-variant/30 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      <SidebarHeader className="h-header-height px-space-lg flex flex-row items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-space-sm">
          <span className="w-9 h-9 rounded-xl bg-surface-container-lowest flex items-center justify-center">
            <Image alt="Logo VAKASI" src="/logo.png" width={28} height={28} priority className="h-7 w-auto object-contain" />
          </span>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary leading-none font-bold">VAKASI</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold mt-space-2xs">Yayasan Asrama Pelajar Islam</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-space-md py-space-md space-y-space-xs">
        {groups.map((group, index) => (
          <SidebarGroup key={group.label ?? `group-${index}`} className="p-0">
            {group.label && (
              <SidebarGroupLabel className="px-space-md pt-space-xs pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-space-2xs">
                {group.items.map((item) => {
                  const isActive = current === item.href;
                  const badge = item.href === '/kegiatan/approval' ? pendingApprovalCount : null;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'relative flex items-center justify-between gap-space-sm px-space-md py-space-sm rounded-lg transition-all font-body-sm text-body-sm group',
                          isActive
                            ? 'bg-secondary-container text-primary font-semibold shadow-xs before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full before:bg-gold'
                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        )}
                      >
                        <div className="flex items-center gap-space-md min-w-0">
                          <Icon
                            name={item.icon}
                            className={cn('text-[18px] transition-colors', isActive ? 'text-primary' : 'text-secondary group-hover:text-on-surface')}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {badge !== null && badge > 0 && (
                          <span className="px-space-xs py-0.5 rounded-full bg-gold text-on-gold font-label-sm text-label-sm font-bold tabular-nums">
                            {badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-space-md border-t border-outline-variant/30 bg-surface-container-low/40">
        <div className="flex items-center justify-between px-space-sm py-space-xs rounded-lg bg-surface-container-lowest border border-outline-variant/40">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">Sistem Aktif</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{roleLabel(user)}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
