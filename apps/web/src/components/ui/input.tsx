import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm text-[#2e313f] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#b1b1b1] transition-all duration-200 focus-visible:outline-none focus-visible:border-[#c24332] focus-visible:shadow-[0_0_0_3px_rgba(194,67,50,0.08)] disabled:cursor-not-allowed disabled:opacity-50',
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
