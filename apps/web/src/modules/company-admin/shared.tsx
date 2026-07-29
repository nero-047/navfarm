'use client';

import { useEffect, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { Dialog } from '../../components/ui/dialog';
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
      ? 'nf-success-state'
      : value === 'INACTIVE' || value === 'SUSPENDED' ||
          value === 'EXPIRED' || value === 'CANCELLED' ||
          value === 'ACTION_NEEDED' || value === 'BLOCKING'
        ? 'nf-danger-state'
        : value === 'PENDING' || value === 'IN_PROGRESS' ||
            value === 'RECOMMENDED' || value === 'POLICY_PENDING'
          ? 'nf-warning-state'
          : 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)]';
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
    <p className="nf-info-state rounded-xl border px-4 py-3 text-xs">
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
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      maxWidth={wide ? 'lg' : 'md'}
    >
      {children}
    </Dialog>
  );
}
