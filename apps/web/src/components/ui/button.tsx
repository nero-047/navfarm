import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(194,67,50,0.2)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#0b1248] text-white shadow-sm hover:bg-[#151d5e] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-[#e5e5e5] bg-white hover:bg-[#f8f8f8] text-[#2e313f]',
        secondary: 'bg-[#0b1248] text-white hover:bg-[#151d5e]',
        ghost: 'hover:bg-[#f8f8f8] text-[#707070]',
        link: 'text-[#1c4aa9] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 py-2.5',
        sm: 'h-9 rounded-lg px-4',
        lg: 'h-12 rounded-xl px-8',
        icon: 'h-10 w-10 rounded-xl',
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
