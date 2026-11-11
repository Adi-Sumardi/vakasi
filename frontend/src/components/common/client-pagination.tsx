'use client';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

/**
 * Pager for lists filtered in the browser (see useClientList). Same look
 * as PaginationBar, which pages server-rendered lists through links.
 */
export function ClientPagination({
  page,
  lastPage,
  pageSize,
  matched,
  total,
  onPage,
}: {
  page: number;
  lastPage: number;
  pageSize: number;
  matched: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (matched === 0) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, matched);
  const button = 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/40 font-label-sm text-label-sm font-semibold';
  const active = 'bg-surface-container-lowest hover:bg-surface-container text-on-surface';

  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-base py-space-sm border-t border-outline-variant/30 font-body-sm text-body-sm text-on-surface-variant">
      <span className="tabular-nums">
        {from}–{to} dari {matched}
        {matched < total && <span className="text-outline"> (disaring dari {total})</span>}
      </span>
      {lastPage > 1 && (
        <div className="flex items-center gap-space-xs">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={cn(button, page <= 1 ? 'opacity-40' : active)}>
            Sebelumnya
          </button>
          <span className="tabular-nums px-space-xs">
            {page} / {lastPage}
          </span>
          <button type="button" disabled={page >= lastPage} onClick={() => onPage(page + 1)} className={cn(button, page >= lastPage ? 'opacity-40' : active)}>
            Berikutnya
            <Icon name="chevron_right" className="text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
