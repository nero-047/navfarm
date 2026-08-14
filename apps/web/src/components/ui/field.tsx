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
