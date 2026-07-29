'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../lib/authorization';

export function useCompanyAdminScope() {
  const { company: companySlug } = useParams<{ company: string }>();
  const { session, refreshSession } = useAuth();
  const membership = session?.companies.find(
    (item) => item.companySlug === companySlug,
  );

  return {
    companySlug,
    companyId: membership?.companyId ?? null,
    tenantId: membership?.tenantId ?? null,
    companyName: membership?.companyName ?? 'Company',
    membership,
    session,
    refreshSession,
    canViewCompany: can(session, 'company.view'),
    canManageCompany: can(session, 'company.manage'),
    canViewMembers: can(session, 'users.view'),
    canManageMembers: can(session, 'users.manage'),
    canViewRoles: can(session, 'roles.view'),
    canManageRoles: can(session, 'roles.manage'),
    canManageWorkspaces: can(session, 'workspaces.manage'),
  };
}

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}

export function CompanyAdminBadge({
  value,
}: {
  value: string;
}) {
  const tone =
    value === 'ACTIVE' || value === 'ACCEPTED' || value === 'READY'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : value === 'INACTIVE' || value === 'SUSPENDED' ||
          value === 'EXPIRED' || value === 'CANCELLED' ||
          value === 'ACTION_NEEDED' || value === 'BLOCKING'
        ? 'border-red-200 bg-red-50 text-red-700'
        : value === 'PENDING' || value === 'IN_PROGRESS' ||
            value === 'RECOMMENDED' || value === 'POLICY_PENDING'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-slate-200 bg-slate-50 text-slate-700';
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}
    >
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export function DemoDataNotice({
  children = 'Demo data · Changes persist only in the local mock session and reset with the demo fixtures.',
}: {
  children?: ReactNode;
}) {
  return (
    <p className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-900">
      {children}
    </p>
  );
}

export function AdminDialog({
  title,
  description,
  children,
  onClose,
  footer,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-admin-dialog-title"
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${
          wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'
        }`}
      >
        <header className="sticky top-0 z-10 flex items-start gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              id="company-admin-dialog-title"
              className="text-lg font-black text-slate-950"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
        {footer ? (
          <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
