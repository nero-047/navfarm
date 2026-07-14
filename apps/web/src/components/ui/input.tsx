import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-[#ebebeb] bg-white px-3 py-2 text-sm text-[#2e313f] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#b1b1b1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c4aa9] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
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
