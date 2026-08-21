import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-10 w-full appearance-none rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 pr-9 text-sm text-[var(--input-text)] transition-all focus-visible:border-[var(--input-border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
    </div>
  )
);
Select.displayName = 'Select';

export { Select };
