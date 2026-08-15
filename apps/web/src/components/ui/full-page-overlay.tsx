'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useScrollLock } from '../../hooks/useScrollLock';

export function FullPageOverlay({
  children,
  onClose,
  className = '',
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const { t } = useLanguage();
  const closeRef = useRef(onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  closeRef.current = onClose;

  useScrollLock();
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab' || !panelRef.current) return;
      // Rendered boxes only — see Dialog. This overlay is the one that actually
      // wraps such an element today: the company edit form's upload control is
      // a label around a `display: none` file input.
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.getClientRects().length > 0);
      // Same trap correction as Dialog: own every Tab, because boundary-only
      // wrapping leaks focus whenever the browser's tab order does not keep it
      // inside the panel on its own.
      event.preventDefault();
      if (!focusable.length) return;
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      const step = event.shiftKey ? -1 : 1;
      const next = index === -1
        ? (event.shiftKey ? focusable.length - 1 : 0)
        : (index + step + focusable.length) % focusable.length;
      focusable[next].focus();
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      previousFocus?.focus();
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] grid h-[100dvh] w-screen place-items-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label={t("closeDialog")}
        className="fixed inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div ref={panelRef} tabIndex={-1} className={`relative my-auto w-full outline-none ${className}`}>{children}</div>
    </div>,
    document.body,
  );
}

export function FullPageDialogBoundary({
  open,
  children,
  onClose,
  className = '',
}: {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return <>{children}</>;
  return <FullPageOverlay onClose={onClose} className={className}>{children}</FullPageOverlay>;
}
