'use client';

import { cn } from '@/lib/utils';

const format = (value: number) => (value > 0 ? value.toLocaleString('id-ID') : '');

/**
 * Rupiah amount field: shows "Rp 1.500.000" while typing but hands the
 * parent a plain integer, which is what the API stores (whole Rupiah,
 * never a formatted string). Anything that is not a digit is ignored,
 * so pasting "Rp 25.000,-" still yields 25000.
 */
export function CurrencyInput({
  id,
  value,
  onChange,
  required,
  placeholder = '0',
  className,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center h-10 rounded-lg bg-surface-container-low border border-outline-variant/40 focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/30',
        className
      )}
    >
      <span className="pl-3 pr-2 font-label-md text-label-md font-semibold text-on-surface-variant select-none">Rp</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={format(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
          onChange(digits ? Number(digits) : 0);
        }}
        className="w-full h-full pr-3 bg-transparent text-on-surface font-body-sm text-body-sm tabular-nums focus:outline-none"
      />
    </div>
  );
}
