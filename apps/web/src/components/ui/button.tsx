import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-semibold transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-(--accent) text-white hover:bg-(--accent-hover)',
        primary: 'bg-(--accent) text-white hover:bg-(--accent-hover)',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline:
          'border border-(--border) bg-(--surface) hover:bg-(--surface-raised) text-(--text-primary)',
        secondary:
          'bg-(--surface-raised) text-(--text-primary) hover:bg-(--badge-bg)',
        ghost: 'hover:bg-(--surface-raised) text-(--text-secondary)',
        link: 'text-(--accent) underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'min-h-9 h-9 px-3.5 text-[13px]',
        lg: 'h-12 px-7',
        icon: 'h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
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
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
