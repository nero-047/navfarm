import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + supporting text, in the one arrangement the application
 * uses. Forms across the console previously repeated this markup inline, which
 * is how their label sizes and spacing drifted apart from each other.
 */
export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="nf-text-label text-(--text-secondary)">
        {label}
        {required && <span className="ml-0.5 text-(--accent)">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-(--danger)">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-(--text-muted)">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * The read-only counterpart to `Field`, for users who may see a form but not
 * change it.
 *
 * It exists because the alternative in practice was not "one component" but
 * "two visual languages": company settings hand-typed 45 read-only value spans
 * whose label spacing, text size and mono/non-mono treatment had all drifted
 * apart from each other and from the editable form beside them, so the same
 * page looked like a different product depending on your role.
 *
 * Disabling the real inputs was the other option and is worse to read — our
 * controls dim to 50% opacity when disabled, which is the correct signal for a
 * control you could otherwise use, and the wrong one for a value you are simply
 * being shown.
 *
 * `mono` is for machine-shaped values — codes, ids, timezones — where character
 * alignment aids comparison. Prose does not take it.
 */
export function ReadField({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="nf-text-label text-(--text-secondary)">{label}</span>
      <span
        className={cn(
          'min-w-0 break-words text-sm',
          mono && 'font-mono',
          empty ? 'text-(--text-muted)' : 'font-medium text-(--text-primary)'
        )}
      >
        {empty ? '—' : value}
      </span>
    </div>
  );
}
