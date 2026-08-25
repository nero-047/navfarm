import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'nf-press inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-[var(--radius-pill)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-2xs',
        destructive: 'rounded-[var(--radius-pill)] bg-[var(--danger)] text-white hover:opacity-90',
        outline: 'rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-2xs',
        secondary: 'rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]',
        ghost: 'rounded-[var(--radius-sm)] hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        link: 'text-[var(--accent)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-4 text-[13px]',
        lg: 'h-12 px-7',
        icon: 'h-11 w-11 rounded-full p-0',
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
