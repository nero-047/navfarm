'use client';

import * as React from 'react';
import { AlertCircle, Calendar, Inbox, LoaderCircle, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function IconButton({
  label,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      {...props}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-(--text-secondary) transition-colors hover:bg-(--surface-raised) disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-24 w-full resize-y rounded-[var(--radius-sm)] border border-(--input-border) bg-(--input-bg) px-3.5 py-3 text-[15px] text-(--input-text) placeholder:text-(--input-placeholder)',
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-11 rounded-[var(--radius-sm)] border border-(--input-border) bg-(--input-bg) px-3.5 text-sm text-(--input-text)',
        props.className,
      )}
    />
  );
}

export function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      {...props}
      className={cn('h-4 w-4 accent-(--accent)', props.className)}
    />
  );
}

export function Radio(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="radio"
      {...props}
      className={cn('h-4 w-4 accent-(--accent)', props.className)}
    />
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 rounded-full border transition-colors',
        checked
          ? 'border-(--accent) bg-(--accent)'
          : 'border-(--border) bg-(--surface-raised)',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-[13px] font-medium text-(--text-secondary)">
      <span>{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-(--danger)">{error}</span>
      ) : hint ? (
        <span className="text-xs font-normal text-(--text-muted)">{hint}</span>
      ) : null}
    </label>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex h-11 min-w-56 items-center gap-2 rounded-[var(--radius-sm)] border border-(--input-border) bg-(--input-bg) px-3.5 focus-within:border-(--accent)">
      <Search size={15} className="text-(--text-muted)" />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="nf-embedded-input min-w-0 flex-1 border-0 bg-transparent text-sm text-(--input-text) outline-none"
      />
    </label>
  );
}

export function Surface({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-[var(--radius-md)] border border-(--border) bg-(--surface)',
        className,
      )}
    />
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const tones = {
    neutral: 'bg-(--badge-bg) text-(--text-secondary)',
    accent: 'bg-(--accent-muted) text-(--accent)',
    success: 'bg-emerald-500/10 text-(--success)',
    warning: 'bg-amber-500/10 text-(--warning)',
    danger: 'bg-red-500/10 text-(--danger)',
    info: 'bg-blue-500/10 text-(--info)',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export const StatusBadge = Badge;

export function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-[var(--radius-sm)] bg-(--surface-raised) p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-9 whitespace-nowrap rounded-md px-3 text-[13px] font-medium',
            value === option.value
              ? 'bg-(--surface) text-(--text-primary) shadow-[var(--shadow-sm)]'
              : 'text-(--text-secondary)',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const Tabs = SegmentedControl;

export function TableShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-md)] border border-(--border) bg-(--surface)',
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export const DataGrid = TableShell;

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close sheet" className="absolute inset-0 bg-black/35" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label={title} className="absolute inset-y-0 right-0 w-[min(480px,94vw)] border-l border-(--border) bg-(--surface) shadow-[var(--shadow-md)]">
        <header className="flex min-h-14 items-center justify-between border-b border-(--border-subtle) px-5">
          <h2 className="text-lg font-semibold text-(--text-primary)">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </header>
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}

export function Popover({
  trigger,
  children,
  align = 'left',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <details className="relative">
      <summary className="list-none">{trigger}</summary>
      <div className={cn('absolute top-[calc(100%+8px)] z-40 min-w-56 rounded-[var(--radius-md)] border border-(--border) bg-(--surface) p-2 shadow-[var(--shadow-md)]', align === 'right' ? 'right-0' : 'left-0')}>{children}</div>
    </details>
  );
}

export const Dropdown = Popover;

export function Command({
  value,
  onChange,
  children,
  placeholder = 'Search commands',
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-(--border) bg-(--surface)">
      <label className="flex h-12 items-center gap-2 border-b border-(--border-subtle) px-4">
        <Search size={16} className="text-(--text-muted)" />
        <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="nf-embedded-input min-w-0 flex-1 border-0 bg-transparent text-sm text-(--text-primary) outline-none" />
      </label>
      <div className="max-h-80 overflow-y-auto p-2">{children}</div>
    </div>
  );
}

export function DateField(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <label className="relative block">
      <Calendar size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)" />
      <input type="date" {...props} className={cn('h-11 w-full rounded-[var(--radius-sm)] border border-(--input-border) bg-(--input-bg) pl-10 pr-3.5 text-sm text-(--input-text)', props.className)} />
    </label>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-(--surface-raised) text-(--text-muted)">
        <Inbox size={20} />
      </span>
      <h3 className="text-base font-semibold text-(--text-primary)">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-(--text-secondary)">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <AlertCircle size={22} className="text-(--danger)" />
      <h3 className="mt-3 text-base font-semibold text-(--text-primary)">
        Unable to load this view
      </h3>
      <p className="mt-1 max-w-md text-sm text-(--text-secondary)">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-(--badge-bg)', className)}
    />
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-(--text-secondary)">
      <LoaderCircle size={17} className="animate-spin" />
      {label}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[13px] font-semibold text-(--accent)">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[clamp(1.75rem,3vw,2.125rem)] font-semibold leading-tight tracking-[-0.025em] text-(--text-primary)">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-[15px] leading-6 text-(--text-secondary)">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Toast({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'danger' | 'success';
}) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-[var(--radius-sm)] border px-4 py-3 text-sm',
        tone === 'danger'
          ? 'border-red-500/25 bg-red-500/10 text-(--danger)'
          : tone === 'success'
            ? 'border-emerald-500/25 bg-emerald-500/10 text-(--success)'
            : 'border-(--border) bg-(--surface) text-(--text-secondary)',
      )}
    >
      {children}
    </div>
  );
}
