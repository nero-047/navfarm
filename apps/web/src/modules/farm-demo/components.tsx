import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ArrowUpRight, CircleHelp, Database } from 'lucide-react';
import type { Tone } from './data';

const TONES: Record<Tone, string> = {
  green: 'nf-success-state',
  amber: 'nf-warning-state',
  red: 'nf-danger-state',
  blue: 'nf-info-state',
  gray: 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]',
};

export function DemoBadge() {
  return (
    <span className="nf-info-state inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
      <Database size={12} aria-hidden /> Demo data
    </span>
  );
}

export function StatusBadge({
  label,
  tone = 'gray',
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {action ?? <DemoBadge />}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
          <div>
            {title && (
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  const iconClass: Record<Tone, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-[#1c4aa9]',
    gray: 'bg-slate-50 text-slate-600',
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <span
        className={`absolute inset-x-0 top-0 h-0.5 ${tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'red' ? 'bg-red-500' : tone === 'gray' ? 'bg-slate-400' : 'bg-[#2f66d0]'}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${iconClass[tone]}`}
        >
          <Icon size={19} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = 'blue',
}: {
  value: number;
  tone?: Tone;
}) {
  const fill: Record<Tone, string> = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-[#1c4aa9]',
    gray: 'bg-slate-400',
  };
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]" role="progressbar" aria-label="Progress" aria-valuenow={Math.max(0, Math.min(100, value))} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full ${fill[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyCompany() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <CircleHelp size={24} />
      </div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Company not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
        Select a company workspace to continue.
      </p>
    </div>
  );
}

export function TextButton({ children }: { children: ReactNode }) {
  return (
    <button type="button" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[var(--accent)] transition-colors hover:text-[var(--color-primary)]">
      {children} <ArrowUpRight size={13} />
    </button>
  );
}

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
      role="region"
      aria-label="Scrollable data table"
      tabIndex={0}
    >
      <table className="w-full min-w-[920px] border-collapse text-left">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="bg-[var(--surface-raised)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`border-t border-[var(--border-subtle)] px-5 py-3.5 text-[13px] text-[var(--text-secondary)] ${className}`}
    >
      {children}
    </td>
  );
}
