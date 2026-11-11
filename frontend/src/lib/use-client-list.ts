'use client';

import { useMemo, useState } from 'react';

const normalize = (text: string) => text.toLocaleLowerCase('id-ID').normalize('NFKD').replace(/\s+/g, ' ').trim();

/**
 * Search and pagination for lists the page already holds in full (master
 * data, users). Every word typed must appear somewhere in the row's text,
 * so "uts pengawas" finds "UTS · Pengawas Ujian".
 */
export function useClientList<T>(items: T[], toText: (item: T) => string, pageSize = 20) {
  const [query, setQueryState] = useState('');
  const [page, setPage] = useState(1);

  const words = normalize(query).split(' ').filter(Boolean);
  const key = words.join(' ');

  const filtered = useMemo(
    () =>
      key === ''
        ? items
        : items.filter((item) => {
            const text = normalize(toText(item));
            return key.split(' ').every((word) => text.includes(word));
          }),
    // toText is an inline function at every call site; the result only
    // depends on the items and the normalized query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, key],
  );

  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, lastPage);

  return {
    query,
    setQuery: (value: string) => {
      setQueryState(value);
      setPage(1);
    },
    page: current,
    setPage,
    lastPage,
    pageSize,
    pageItems: filtered.slice((current - 1) * pageSize, current * pageSize),
    matched: filtered.length,
    total: items.length,
  };
}
