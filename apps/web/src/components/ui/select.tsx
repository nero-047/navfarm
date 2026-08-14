import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-11 w-full appearance-none rounded-[var(--radius-sm)] border border-(--input-border) bg-(--input-bg) px-4 pr-9 text-[15px] text-(--input-text) transition-colors focus-visible:border-(--input-border-focus) disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)" />
    </div>
  )
);
Select.displayName = 'Select';

export { Select };
