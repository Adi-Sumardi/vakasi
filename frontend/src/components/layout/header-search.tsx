'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { search, type SearchResults } from '@/lib/api/search';

const EMPTY_RESULTS: SearchResults = { activities: [], employees: [], documents: [] };

export function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();

    const timeout = setTimeout(() => {
      if (trimmed.length < 2) {
        setResults(EMPTY_RESULTS);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      search(trimmed)
        .then(setResults)
        .catch(() => setResults(EMPTY_RESULTS))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = results.activities.length > 0 || results.employees.length > 0 || results.documents.length > 0;
  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative hidden md:flex items-center">
      <Icon name="search" className="absolute left-space-md text-outline text-lg pointer-events-none z-10" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Cari kegiatan, penerima, SK, SPD..."
        className="w-72 lg:w-80 h-9 pl-9 pr-14 py-space-xs bg-surface-container-low/60 border border-outline-variant/50 rounded-lg text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all"
      />
      {!query && (
        <kbd className="absolute right-space-md px-1.5 py-0.5 text-[10px] font-mono font-semibold text-outline bg-surface-container-lowest border border-outline-variant rounded shadow-xs">
          Ctrl+K
        </kbd>
      )}

      {showDropdown && (
        <div className="absolute top-full mt-1 left-0 w-96 max-h-112 overflow-y-auto bg-surface-container-lowest border border-outline-variant/40 rounded-lg shadow-lg z-50">
          {isLoading ? (
            <div className="px-space-md py-space-lg text-center text-sm text-on-surface-variant">Mencari...</div>
          ) : !hasResults ? (
            <div className="px-space-md py-space-lg text-center text-sm text-on-surface-variant">Tidak ada hasil untuk &quot;{query}&quot;.</div>
          ) : (
            <>
              {results.activities.length > 0 && (
                <div className="py-space-xs">
                  <p className="px-space-md py-1 text-[10px] font-semibold uppercase tracking-wider text-outline">Kegiatan</p>
                  {results.activities.map((a) => (
                    <Link
                      key={a.id}
                      href={`/kegiatan/${a.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-space-sm px-space-md py-space-sm hover:bg-surface-container transition-colors"
                    >
                      <Icon name="event_note" className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{a.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{a.activity_code} &bull; {a.unit?.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.employees.length > 0 && (
                <div className="py-space-xs border-t border-outline-variant/20">
                  <p className="px-space-md py-1 text-[10px] font-semibold uppercase tracking-wider text-outline">Pegawai</p>
                  {results.employees.map((e) => (
                    <Link
                      key={e.id}
                      href="/master-data/pegawai"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-space-sm px-space-md py-space-sm hover:bg-surface-container transition-colors"
                    >
                      <Icon name="person" className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{e.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{e.employee_code} &bull; {e.position?.name ?? e.employee_type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.documents.length > 0 && (
                <div className="py-space-xs border-t border-outline-variant/20">
                  <p className="px-space-md py-1 text-[10px] font-semibold uppercase tracking-wider text-outline">Dokumen</p>
                  {results.documents.map((d) => (
                    <a
                      key={d.id}
                      href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${d.id}/download`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-space-sm px-space-md py-space-sm hover:bg-surface-container transition-colors"
                    >
                      <Icon name="description" className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{d.file_name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{d.activity?.name ?? 'Tanpa kegiatan'}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
