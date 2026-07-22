import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(36,87,183,0.16)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98]',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-raised)]',
        secondary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[#ffe5df]',
        ghost: 'text-[var(--text-secondary)] hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)]',
        link: 'min-h-0 text-[var(--color-blue-accent)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 min-h-9 rounded-lg px-3.5 text-xs',
        lg: 'h-12 rounded-xl px-7',
        icon: 'h-11 w-11 rounded-xl p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
