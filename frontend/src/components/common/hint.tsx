'use client';

import type { ReactElement, ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Tooltip for icon-only buttons and links, so a pencil or a trash can
 * says what it does. Rendered through a portal, so it is never clipped
 * by a scrolling table. The label also becomes the accessible name.
 *
 * Note: a disabled <button> fires no pointer events, so its tooltip
 * cannot show; explain a disabled action in visible text instead.
 */
export function Hint({
  label,
  children,
  side = 'top',
}: {
  label?: ReactNode;
  children: ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  if (!label) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={children} aria-label={typeof label === 'string' ? label : undefined} />
      {/* text-white last: tailwind-merge reads text-label-sm as a colour
          and would otherwise drop it. */}
      <TooltipContent side={side} className="bg-navy-deep font-label-sm text-label-sm font-semibold text-white">

        {label}
      </TooltipContent>
    </Tooltip>
  );
}
