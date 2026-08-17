import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // The focus ring matches Button's, so the application has one focus
          // vocabulary rather than a border shift here and a ring there.
          'flex h-11 w-full rounded-[var(--radius-sm)] border border-(--input-border) bg-(--input-bg) px-4 text-[15px] text-(--input-text) file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-(--input-placeholder) transition-colors focus-visible:border-(--input-border-focus) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(194,67,50,0.3)] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
