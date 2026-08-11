import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, icon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const control = (
      <input
        id={inputId}
        type={type}
        className={cn(
          'flex h-11 w-full rounded-[var(--radius-sm)] border border-(--input-border) bg-(--input-bg) py-2.5 pr-3.5 text-[15px] text-(--input-text) file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-(--input-placeholder) focus-visible:border-(--input-border-focus) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          icon ? 'pl-10' : 'pl-3.5',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
    if (!label && !icon) return control;
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-(--text-secondary)"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)">
              {icon}
            </span>
          )}
          {control}
        </div>
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
export default Input;
