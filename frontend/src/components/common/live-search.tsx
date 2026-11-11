'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useTransition } from 'react';

import { SearchInput } from '@/components/common/search-input';

type LiveSearchProps = {
  placeholder?: string;
  label?: string;
  param?: string;
  className?: string;
};

/**
 * Search for server-paginated lists: typing updates `?search=` after a
 * short pause, keeps every other filter, and returns to page 1. The page
 * re-renders on the server, so results always come from the API.
 */
export function LiveSearch(props: LiveSearchProps) {
  // useSearchParams needs a Suspense boundary to keep prerendering intact.
  return (
    <Suspense fallback={<SearchInput value="" onChange={() => {}} placeholder={props.placeholder} label={props.label} className={props.className} />}>
      <LiveSearchField {...props} />
    </Suspense>
  );
}

function LiveSearchField({ placeholder, label, param = 'search', className }: LiveSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(param) ?? '';
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();
  // The last term this box wrote to the URL, and the URL term seen last.
  const [pushed, setPushed] = useState(current);
  const [seen, setSeen] = useState(current);

  // The URL changed without this box (Reset link, tab, back button):
  // show what the URL says instead of re-applying the old text.
  if (current !== seen) {
    setSeen(current);

    if (current !== pushed) {
      setPushed(current);
      setValue(current);
    }
  }

  useEffect(() => {
    const term = value.trim();

    if (term === current) {
      return;
    }

    const timeout = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());

      if (term) {
        next.set(param, term);
      } else {
        next.delete(param);
      }

      next.delete('page');
      const query = next.toString();

      setPushed(term);
      startTransition(() =>
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        }),
      );
    }, 350);

    return () => clearTimeout(timeout);
  }, [value, current, param, pathname, router, searchParams]);

  return <SearchInput value={value} onChange={setValue} placeholder={placeholder} label={label} pending={pending} className={className} />;
}
