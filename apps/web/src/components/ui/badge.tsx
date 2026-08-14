import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[12px] font-semibold leading-none',
  {
    variants: {
      variant: {
        neutral: 'bg-(--badge-bg) text-(--text-secondary)',
        accent: 'bg-(--accent-muted) text-(--accent)',
        success: 'bg-(--success-muted) text-(--success)',
        warning: 'bg-(--warning-muted) text-(--warning)',
        danger: 'bg-(--danger-muted) text-(--danger)',
        info: 'bg-(--color-blue-soft) text-(--info)',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
