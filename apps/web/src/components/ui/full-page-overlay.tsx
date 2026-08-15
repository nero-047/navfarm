'use client';

import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useOverlayFocus, useTopmostEscape } from '../../hooks/useOverlayFocus';

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
  // Shared with Dialog and Drawer. This overlay is the one that actually wraps
  // an unfocusable match for the trap's selector today: the company edit form's
  // upload control is a label around a `display: none` file input.
  useOverlayFocus(panelRef);
  useTopmostEscape(true, () => closeRef.current());

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
