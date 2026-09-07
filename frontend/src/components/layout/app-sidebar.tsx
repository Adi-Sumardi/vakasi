'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
import { NAV_DASHBOARD, NAV_FOOTER, NAV_GROUPS, type NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';

function isVisible(item: NavItem, permissions: string[]) {
  return permissions.includes(item.permission);
}

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-outline-variant/30 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      <SidebarHeader className="h-header-height px-space-lg flex flex-row items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-space-sm">
          <img
            alt="Logo VAKASI"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VjAZ6YvvtPYKqQpOx4h0ZuBAamCK-LYQ8nrp9ziuR0Q5sWDYblLibPi8x-DM5UYKmX9-pY_OX-eR5hMtXn1R1MeZYUWjHOZaQJQ4_0P4xEHmlz8tfNjWwIqlRxDAv5X_PBSpAn2bydI6pi94srq2cK6W-FEdcCOfNzl2IFas4o_TepPyKUijJ7eeM0d3CirlmNB3lKo76C5Vw1HA1a_RFOxslqeVxy1DlWoR88c7ZcpuQSfBzlCm4e-Oij"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary leading-none font-bold">
              VAKASI
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold mt-space-2xs tracking-wider">
              GOVERNANCE
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
                          {item.badge !== undefined && (
                            <span className="px-space-xs py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                              {item.badge}
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
              Server Satker: Aktif
            </span>
          </div>
          <span className="font-label-sm text-label-sm font-mono text-outline">v2.4</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
