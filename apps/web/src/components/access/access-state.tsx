'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { accessReasonContent, type AccessReason } from '../../lib/access-reasons';

export function AccessState({
  reason,
  companySlug,
  noWorkspaceAssigned = false,
}: {
  reason: AccessReason;
  companySlug?: string;
  noWorkspaceAssigned?: boolean;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const content = accessReasonContent[reason];
  const heading = noWorkspaceAssigned && reason === 'workspace_not_assigned'
    ? 'No workspace assigned'
    : content.heading;
  const description = noWorkspaceAssigned && reason === 'workspace_not_assigned'
    ? 'Your account has no assigned operational workspace in this company.'
    : content.description;
  const workspaceAccess = reason === 'workspace_not_assigned' && !noWorkspaceAssigned;
  const actions = noWorkspaceAssigned
    ? ['choose_company', 'sign_out']
    : content.actions;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-sm)] sm:p-8">
      <ShieldX className="mx-auto h-11 w-11 text-[var(--danger)]" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">{heading}</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {reason === 'account_suspended' && user ? (
        <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]">
          Signed in as {user.fullName} · {user.email}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {workspaceAccess && companySlug ? (
          <>
            <Link href={`/${companySlug}/settings`} className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-xs font-semibold">Back to company</Link>
            <Link href={`/${companySlug}/workspaces`} className="inline-flex min-h-11 items-center rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white">Manage workspace access</Link>
          </>
        ) : null}
        {actions.includes('choose_company') ? (
          <Link href="/context-selection" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-xs font-semibold">Choose another company</Link>
        ) : null}
        {actions.includes('back_to_company') && companySlug && !workspaceAccess ? (
          <Link href={`/${companySlug}/settings`} className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-xs font-semibold">Back to company</Link>
        ) : null}
        {actions.includes('continue_onboarding') && companySlug ? (
          <Link href={`/${companySlug}/setup/review`} className="inline-flex min-h-11 items-center rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white">Continue company setup</Link>
        ) : null}
        {actions.includes('go_back') ? (
          <button onClick={() => router.back()} className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-xs font-semibold">Go back</button>
        ) : null}
        {actions.includes('sign_out') ? (
          <button onClick={() => void logout().then(() => router.replace('/login'))} className="inline-flex min-h-11 items-center rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white">Sign out</button>
        ) : null}
      </div>
    </div>
  );
}
