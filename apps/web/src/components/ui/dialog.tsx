'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const widths = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function Dialog({ open, onClose, title, description, children, footer, maxWidth = 'md', className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button type="button" aria-label="Close dialog" onClick={onClose} className="absolute inset-0 cursor-default bg-[#070a20]/50 backdrop-blur-[2px]" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="nf-dialog-title" aria-describedby={description ? 'nf-dialog-description' : undefined} tabIndex={-1} className={cn('relative flex max-h-[min(88vh,900px)] w-full flex-col overflow-hidden rounded-2xl border border-[#dfe3ea] bg-white text-[#2e313f] shadow-[0_28px_90px_rgba(11,18,72,0.24)] outline-none animate-slide-up', widths[maxWidth], className)}>
        <header className="flex shrink-0 items-start gap-4 border-b border-[#edf0f4] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <h2 id="nf-dialog-title" className="text-lg font-semibold tracking-tight text-[#2e313f]">{title}</h2>
            {description && <p id="nf-dialog-description" className="mt-1 text-sm leading-5 text-[#707070]">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#707070] transition hover:bg-[#f3f5f8] hover:text-[#2e313f]"><X size={18} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[#edf0f4] bg-[#fafbfc] px-5 py-4 sm:px-6">{footer}</footer>}
      </div>
    </div>
  );
}
