import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const TONES = {
  blue: 'bg-primary-fixed text-primary',
  amber: 'bg-gold-soft text-on-gold',
  green: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  red: 'bg-error-container text-on-error-container',
  slate: 'bg-surface-container text-on-surface-variant',
} as const;

export type Tone = keyof typeof TONES;

/**
 * A single figure with a tinted icon. The tint carries meaning (amber =
 * waiting, green = done, red = needs attention), so the number is read
 * together with its state.
 */
export function StatCard({
  label,
  value,
  icon,
  tone = 'blue',
  href,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  tone?: Tone;
  href?: string;
  hint?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-space-sm">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
        <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', TONES[tone])}>
          <Icon name={icon} className="text-[20px]" />
        </span>
      </div>
      <div className="font-headline-lg text-headline-lg text-on-surface font-bold tabular-nums">{value}</div>
      {hint && <div className="font-body-sm text-body-sm text-on-surface-variant">{hint}</div>}
    </>
  );

  const className = 'bg-surface-container-lowest p-space-lg rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col gap-space-xs';

  return href ? (
    <Link href={href} className={cn(className, 'lift')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
