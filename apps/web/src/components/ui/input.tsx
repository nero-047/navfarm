import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border border-(--input-border) bg-(--input-bg) px-4 py-2.5 text-sm text-(--input-text) file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-(--input-placeholder) transition-all duration-200 focus-visible:border-(--input-border-focus) focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(47,102,208,0.12)] disabled:cursor-not-allowed disabled:opacity-50',
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
