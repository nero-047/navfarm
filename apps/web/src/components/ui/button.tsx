import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'nf-press inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(194,67,50,0.3)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-[var(--radius-pill)] bg-(--accent) text-white hover:bg-(--accent-hover)',
        destructive: 'rounded-[var(--radius-pill)] bg-(--danger) text-white hover:opacity-90',
        outline: 'rounded-[var(--radius-sm)] border border-(--border) bg-(--surface) hover:bg-(--surface-secondary) text-(--text-primary)',
        secondary: 'rounded-[var(--radius-sm)] bg-(--surface-secondary) text-(--text-primary) hover:bg-(--border)',
        ghost: 'rounded-[var(--radius-sm)] hover:bg-(--surface-secondary) text-(--text-secondary)',
        link: 'text-(--accent) underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-[var(--radius-xs)] px-4 text-[13px]',
        lg: 'h-12 px-7',
        icon: 'h-10 w-10 rounded-full p-0',
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
