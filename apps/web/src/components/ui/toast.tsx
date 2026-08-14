'use client';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'danger' | 'info';

interface ToastProps {
  variant?: ToastVariant;
  message: string;
  onClose?: () => void;
  className?: string;
}

const icons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  danger: AlertCircle,
  info: Info,
};

/** Presentational toast — render conditionally from local page state (no global provider). */
export function Toast({ variant = 'info', message, onClose, className }: ToastProps) {
  const Icon = icons[variant];
  const colorVar = variant === 'success' ? '--success' : variant === 'danger' ? '--danger' : '--info';

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-sm)] border bg-(--surface) px-4 py-3 text-[13px] shadow-[var(--shadow-md)]',
        className
      )}
      style={{ borderColor: `var(${colorVar})`, color: `var(${colorVar})` }}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 text-(--text-primary)">{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="nf-press shrink-0 text-(--text-muted) hover:text-(--text-primary)">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
