import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-[11px] font-semibold leading-normal',
  {
    variants: {
      variant: {
        neutral: 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]',
        accent: 'bg-[var(--accent-muted)] border-[var(--accent)]/20 text-[var(--accent)]',
        success: 'bg-[var(--success-muted)] border-[var(--success)]/20 text-[var(--success)]',
        warning: 'bg-[var(--warning-muted)] border-[var(--warning)]/20 text-[var(--warning)]',
        danger: 'bg-[var(--danger-muted)] border-[var(--danger)]/20 text-[var(--danger)]',
        info: 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--info)]',
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
