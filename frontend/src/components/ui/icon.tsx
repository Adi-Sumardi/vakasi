import React from 'react';
import { cn } from '@/lib/utils';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  className?: string;
  fill?: boolean;
}

export function Icon({ name, className, fill, style, ...props }: IconProps) {
  return (
    <span
      className={cn('material-symbols-outlined select-none inline-block leading-none', className)}
      style={{
        fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}

export default Icon;
