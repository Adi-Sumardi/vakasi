import Link from 'next/link';

import { cn } from '@/lib/utils';

export type PageTab = { key: string; label: string; href: string; count?: number };

/**
 * Link-based tabs for server pages: the active tab lives in the URL,
 * so a filtered view can be bookmarked and the back button works.
 */
export function PageTabs({ tabs, active }: { tabs: PageTab[]; active: string }) {
  return (
    <div className="flex flex-wrap items-center gap-space-2xs p-space-2xs rounded-xl bg-surface-container-low border border-outline-variant/30 w-fit max-w-full overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              'px-space-md py-space-xs rounded-lg font-label-md text-label-md whitespace-nowrap transition-all flex items-center gap-1.5',
              isActive
                ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 rounded-full font-mono text-[11px] font-bold tabular-nums',
                  isActive ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant'
                )}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
