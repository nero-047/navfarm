import { type ElementType } from 'react';
import { RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-16 text-center', className)}>
      <Icon size={22} className="mb-1 text-(--text-muted)" strokeWidth={1.5} />
      <p className="nf-text-body-strong text-(--text-primary)">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-(--text-secondary)">{description}</p>}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-3">
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-(--text-secondary)', className)}>
      <RefreshCw size={15} className="animate-spin text-(--accent)" />
      {label}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-sm)] border border-(--danger-muted) bg-(--danger-muted) px-4 py-3 text-[13px] text-(--danger)',
        className
      )}
    >
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="nf-press shrink-0 font-semibold underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[var(--radius-xs)] bg-(--surface-secondary)', className)} />;
}
