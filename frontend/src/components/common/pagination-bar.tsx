import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import type { PageMeta } from '@/lib/api/server';
import { cn } from '@/lib/utils';

/**
 * Server-rendered pager: every link keeps the page's other filters and
 * only changes `page`, so a filtered list pages through its own results.
 */
export function PaginationBar({
  meta,
  basePath,
  params = {},
}: {
  meta: PageMeta;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (meta.total === 0) {
    return null;
  }

  const hrefFor = (page: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
    if (page > 1) qs.set('page', String(page));
    const query = qs.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const from = (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);
  const hasPrev = meta.current_page > 1;
  const hasNext = meta.current_page < meta.last_page;

  const button = 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/40 font-label-sm text-label-sm font-semibold';

  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-base py-space-sm border-t border-outline-variant/30 font-body-sm text-body-sm text-on-surface-variant">
      <span className="tabular-nums">
        {from}–{to} dari {meta.total}
      </span>
      <div className="flex items-center gap-space-xs">
        {hasPrev ? (
          <Link href={hrefFor(meta.current_page - 1)} className={cn(button, 'bg-surface-container-lowest hover:bg-surface-container text-on-surface')}>
            Sebelumnya
          </Link>
        ) : (
          <span className={cn(button, 'opacity-40')}>Sebelumnya</span>
        )}
        <span className="tabular-nums px-space-xs">
          {meta.current_page} / {meta.last_page}
        </span>
        {hasNext ? (
          <Link href={hrefFor(meta.current_page + 1)} className={cn(button, 'bg-surface-container-lowest hover:bg-surface-container text-on-surface')}>
            Berikutnya
            <Icon name="chevron_right" className="text-sm" />
          </Link>
        ) : (
          <span className={cn(button, 'opacity-40')}>Berikutnya</span>
        )}
      </div>
    </div>
  );
}
