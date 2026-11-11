'use client';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

/**
 * The search box used above every list. Controlled: the caller decides
 * whether typing filters in memory or updates the URL.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari...',
  label,
  pending = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name; defaults to the placeholder. */
  label?: string;
  /** Shows a spinning indicator while results load. */
  pending?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative flex items-center w-full sm:w-64', className)}>
      <Icon name="search" className="absolute left-3 text-outline text-base pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="h-9 w-full pl-9 pr-9 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {pending ? (
        <Icon name="refresh" className="absolute right-3 text-outline text-sm animate-spin" />
      ) : (
        value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Hapus pencarian"
            className="absolute right-2 p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container"
          >
            <Icon name="close" className="text-sm" />
          </button>
        )
      )}
    </div>
  );
}
