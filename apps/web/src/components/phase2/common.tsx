'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--text-primary)] sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-56 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[var(--accent)]" aria-hidden />
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="nf-danger-state rounded-xl border p-5 text-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">Unable to load this view</p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <button onClick={onRetry} className="mt-4 min-h-11 rounded-lg border border-[var(--danger-border)] bg-[var(--surface)] px-4 py-2 font-semibold">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
      <p className="font-bold text-[var(--text-primary)]">{title}</p>
      <p className="mx-auto mt-1 max-w-lg text-sm text-[var(--text-secondary)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SuccessNotice({ message }: { message: string }) {
  return (
    <div role="status" className="nf-success-state flex items-center gap-2 rounded-lg border p-3 text-sm">
      <CheckCircle2 className="h-4 w-4" aria-hidden />
      {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const style =
    status === 'ACTIVE' || status === 'COMPLETED'
      ? 'nf-success-state'
      : status === 'SUSPENDED' || status === 'INACTIVE' || status === 'EXPIRED'
        ? 'nf-danger-state'
        : status === 'TRIAL' || status === 'IN_PROGRESS' || status === 'PENDING'
          ? 'nf-warning-state'
          : 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)]';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${style}`}>{status.replaceAll('_', ' ')}</span>;
}

export function UsageBar({ used, limit, label }: { used: number; limit: number | null; label: string }) {
  const percentage = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = !limit ? 'bg-slate-400' : percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="mb-1 flex justify-between gap-4 text-xs">
        <span className="font-semibold text-[var(--text-primary)]">{label}</span>
        <span className="text-[var(--text-secondary)]">{used} / {limit ?? 'Unlimited'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]" role="progressbar" aria-label={label} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${limit ? percentage : 100}%` }} />
      </div>
    </div>
  );
}

export const inputClass =
  'min-h-11 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--input-text)] outline-none placeholder:text-[var(--input-placeholder)] disabled:cursor-not-allowed disabled:bg-[var(--surface-raised)] disabled:opacity-70';

export const primaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-lg bg-[#101b52] px-4 text-sm font-bold text-white hover:bg-[#17266d] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--surface-raised)] focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50';
