import Link from 'next/link';

import { Icon } from '@/components/ui/icon';

export type Crumb = { label: string; href?: string };

/**
 * The navy hero every page opens with: where you are, what this page is
 * for, and its main actions. Actions should use <HeroButton> so they read
 * on the dark background.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumb = [],
  actions,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small label above the title (e.g. role and unit). */
  eyebrow?: React.ReactNode;
  breadcrumb?: Crumb[];
  actions?: React.ReactNode;
  /** Extra content inside the hero, e.g. summary figures. */
  children?: React.ReactNode;
}) {
  return (
    <section className="hero-surface rounded-2xl px-space-lg py-space-lg sm:px-space-xl sm:py-space-xl shadow-[0_12px_32px_-18px_rgb(10_31_82_/_0.6)] flex flex-col gap-space-lg">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-space-md">
        <div className="flex flex-col gap-space-2xs min-w-0">
          {breadcrumb.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 font-label-sm text-label-sm text-white/70">
              <Link href="/" className="hover:text-white" aria-label="Dashboard">
                <Icon name="grid_view" className="text-sm" />
              </Link>
              {breadcrumb.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  <Icon name="chevron_right" className="text-xs text-white/50" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white font-semibold">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {eyebrow && (
            <span className="w-fit px-space-sm py-0.5 rounded-full bg-gold text-on-gold font-label-sm text-label-sm font-bold uppercase tracking-wider">
              {eyebrow}
            </span>
          )}
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-white text-balance">{title}</h1>
          {description && <p className="font-body-md text-body-md text-white/80 max-w-3xl">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-space-sm shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** Primary action on the hero: gold, so it is the first thing the eye finds. */
export function HeroButton({
  href,
  icon,
  children,
  variant = 'gold',
  external,
}: {
  href: string;
  icon?: string;
  children: React.ReactNode;
  variant?: 'gold' | 'ghost';
  /** Plain <a> (API downloads) instead of client navigation. */
  external?: boolean;
}) {
  const className =
    variant === 'gold'
      ? 'inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-gold text-on-gold font-label-lg text-label-lg font-bold shadow-sm hover:brightness-105 transition'
      : 'inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-white/10 text-white border border-white/25 font-label-lg text-label-lg font-semibold hover:bg-white/20 transition';

  const content = (
    <>
      {icon && <Icon name={icon} className="text-base" />}
      <span>{children}</span>
    </>
  );

  return external ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/** A figure shown inside the hero (e.g. "Total honor"). */
export function HeroStat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-space-md py-space-sm rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm min-w-0">
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-white/70">{label}</span>
      <span className="font-headline-sm text-headline-sm font-bold text-white tabular-nums truncate">{value}</span>
      {hint && <span className="font-body-sm text-body-sm text-white/70">{hint}</span>}
    </div>
  );
}
