'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
import type { AuthUser } from '@/lib/api/auth';
import { listActivities } from '@/lib/api/activities';
import { NAV_DASHBOARD, NAV_FOOTER, NAV_GROUPS, type NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';

function isVisible(item: NavItem, permissions: string[]) {
  return permissions.includes(item.permission);
}

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user.permissions.includes('activities.approve')) {
      return;
    }

    listActivities({ status: 'submitted' })
      .then((activities) => setPendingApprovalCount(activities.length))
      .catch(() => {});
  }, [user.permissions, pathname]);

  return (
    <Sidebar className="border-r border-outline-variant/30 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      <SidebarHeader className="h-header-height px-space-lg flex flex-row items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-space-sm">
          <Image
            alt="Logo VAKASI"
            src="/logo.png"
            width={32}
            height={32}
            priority
            className="h-8 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary leading-none font-bold">
              VAKASI
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold mt-space-2xs">
              Yayasan Asrama Pelajar Islam
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-space-md py-space-md space-y-space-xs">
        {/* Dashboard */}
        {isVisible(NAV_DASHBOARD, user.permissions) && (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link
                    href={NAV_DASHBOARD.href}
                    className={cn(
                      'flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-all font-label-lg text-label-lg group',
                      pathname === NAV_DASHBOARD.href
                        ? 'bg-secondary-container text-primary font-semibold shadow-xs'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    )}
                  >
                    <Icon
                      name={NAV_DASHBOARD.icon || 'grid_view'}
                      className={cn(
                        'text-secondary transition-colors',
                        pathname === NAV_DASHBOARD.href && 'text-primary'
                      )}
                    />
                    <span>{NAV_DASHBOARD.label}</span>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Group Modules */}
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => isVisible(item, user.permissions));
          if (items.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="p-0">
              <SidebarGroupLabel className="px-space-md pt-space-xs pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-space-2xs">
                  {items.map((item) => {
                    const isActive = pathname === item.href;
                    const badge = item.href === '/kegiatan/approval' ? (pendingApprovalCount ?? undefined) : item.badge;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center justify-between px-space-md py-space-sm rounded-lg transition-all font-body-sm text-body-sm group',
                            isActive
                              ? 'bg-secondary-container text-primary font-semibold shadow-xs'
                              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                          )}
                        >
                          <div className="flex items-center gap-space-md">
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className={cn(
                                  'text-secondary text-[18px] transition-colors',
                                  isActive && 'text-primary'
                                )}
                              />
                            )}
                            <span>{item.label}</span>
                          </div>
                          {badge !== undefined && (typeof badge === 'number' ? badge > 0 : badge.length > 0) && (
                            <span className="px-space-xs py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
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
          );
        })}

        {/* Administrasi Footer Section */}
        <SidebarGroup className="p-0 pt-space-xs">
          <SidebarGroupLabel className="px-space-md pt-space-sm border-t border-outline-variant/30 my-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
            Administrasi
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-space-2xs">
              {NAV_FOOTER.filter((item) => isVisible(item, user.permissions)).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-all font-body-sm text-body-sm group',
                        isActive
                          ? 'bg-secondary-container text-primary font-semibold shadow-xs'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      )}
                    >
                      {item.icon && (
                        <Icon
                          name={item.icon}
                          className={cn(
                            'text-secondary text-[18px] transition-colors',
                            isActive && 'text-primary'
                          )}
                        />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-space-md border-t border-outline-variant/30 bg-surface-container-low/40">
        <div className="flex items-center justify-between px-space-sm py-space-xs rounded bg-surface-container-lowest border border-outline-variant/40">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">
              Sistem Aktif
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
