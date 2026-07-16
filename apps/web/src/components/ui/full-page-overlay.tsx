'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function FullPageOverlay({
  children,
  onClose,
  className = '',
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] grid h-[100dvh] w-screen place-items-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative my-auto w-full ${className}`}>{children}</div>
    </div>,
    document.body,
  );
}
