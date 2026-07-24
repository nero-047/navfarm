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
        {eyebrow ? <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-xl border border-slate-200 bg-white">
      <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-blue-600" aria-hidden />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">Unable to load this view</p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <button onClick={onRetry} className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-2 font-semibold">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="font-bold text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SuccessNotice({ message }: { message: string }) {
  return (
    <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      <CheckCircle2 className="h-4 w-4" aria-hidden />
      {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const style =
    status === 'ACTIVE' || status === 'COMPLETED'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'SUSPENDED' || status === 'INACTIVE' || status === 'EXPIRED'
        ? 'border-red-200 bg-red-50 text-red-700'
        : status === 'TRIAL' || status === 'IN_PROGRESS' || status === 'PENDING'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-slate-50 text-slate-700';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${style}`}>{status.replaceAll('_', ' ')}</span>;
}

export function UsageBar({ used, limit, label }: { used: number; limit: number | null; label: string }) {
  const percentage = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = !limit ? 'bg-slate-400' : percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="mb-1 flex justify-between gap-4 text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-500">{used} / {limit ?? 'Unlimited'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuenow={percentage}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${limit ? percentage : 100}%` }} />
      </div>
    </div>
  );
}

export const inputClass =
  'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100';

export const primaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-lg bg-[#101b52] px-4 text-sm font-bold text-white hover:bg-[#17266d] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50';
