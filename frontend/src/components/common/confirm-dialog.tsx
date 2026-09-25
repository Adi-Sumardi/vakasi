'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export type ConfirmTone = 'danger' | 'warning' | 'primary';

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = cannot be undone, warning = changes something visible, primary = normal step. */
  tone?: ConfirmTone;
};

const TONE: Record<ConfirmTone, { icon: string; badge: string; button: string }> = {
  danger: { icon: 'delete', badge: 'bg-error-container text-on-error-container', button: 'bg-error hover:opacity-90 text-white' },
  warning: { icon: 'error', badge: 'bg-gold-soft text-on-gold', button: 'bg-gold hover:brightness-105 text-on-gold' },
  primary: { icon: 'send', badge: 'bg-primary-fixed text-primary', button: 'bg-primary hover:bg-primary-container text-white' },
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

/**
 * `const confirm = useConfirm(); if (!(await confirm({...}))) return;`
 * Replaces window.confirm with a dialog in the app's own style, so
 * every destructive or irreversible action asks the same way.
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);

  if (!confirm) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>.');
  }

  return confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false);
    setOptions(next);

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }, []);

  useEffect(() => {
    if (!options) return;

    confirmButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [options, close]);

  const tone = TONE[options?.tone ?? 'primary'];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-deep/40 backdrop-blur-sm animate-in fade-in-0"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 p-space-xl flex flex-col gap-space-md animate-in zoom-in-95 fade-in-0"
          >
            <div className="flex items-start gap-space-md">
              <span className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', tone.badge)}>
                <Icon name={tone.icon} className="text-[22px]" />
              </span>
              <div className="flex flex-col gap-space-2xs pt-1 min-w-0">
                <h2 id="confirm-title" className="font-headline-sm text-headline-sm font-bold text-on-surface text-balance">
                  {options.title}
                </h2>
                {options.description && (
                  <div className="font-body-sm text-body-sm text-on-surface-variant">{options.description}</div>
                )}
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-space-lg py-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold"
              >
                {options.cancelLabel ?? 'Batal'}
              </button>
              <button
                ref={confirmButton}
                type="button"
                onClick={() => close(true)}
                className={cn('px-space-lg py-space-sm rounded-xl font-label-md text-label-md font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary', tone.button)}
              >
                {options.confirmLabel ?? 'Ya, lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
