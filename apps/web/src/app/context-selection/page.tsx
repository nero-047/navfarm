'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, ChevronRight, Layers3, LogOut, Settings2, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthSession } from '../../contracts/api';
import ThemeToggle from '../../components/source-ui/theme-toggle';

export default function ContextSelectionPage() {
  const {
    session, status, loading, mfaChallengeId, selectContext, logout,
  } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (status === 'mfa_pending') {
      router.replace(`/mfa/verify?challengeId=${encodeURIComponent(mfaChallengeId || '')}`);
    }
    if (status === 'suspended') {
      router.replace('/access-denied?reason=account_suspended');
    }
  }, [mfaChallengeId, router, status]);

  if (loading || !session) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-sm text-[var(--text-secondary)]"
      >
        Loading companies and workspaces…
      </div>
    );
  }

  const companies = session.companies.filter((company) => company.status === 'ACTIVE');

  async function chooseCompany(
    tenantId: string,
    companyId: string,
    companySlug: string,
    onboardingStatus: string,
  ) {
    setError('');
    setSelecting(`company:${companyId}`);
    try {
      await selectContext(tenantId, companyId, null);
      router.push(
        onboardingStatus === 'COMPLETED'
          ? `/${companySlug}/overview`
          : `/${companySlug}/setup/profile`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Company selection was rejected.');
      setSelecting(null);
    }
  }

  async function chooseWorkspace(
    company: (typeof companies)[number],
    workspace: AuthSession['workspaces'][number],
  ) {
    setError('');
    setSelecting(`workspace:${workspace.workspaceId}`);
    try {
      await selectContext(company.tenantId, company.companyId, workspace.workspaceId);
      router.push(
        `/${company.companySlug}/workspaces/${workspace.workspaceSlug}/dashboard`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Workspace selection was rejected.');
      setSelecting(null);
    }
  }

  return (
    <main className="nf-context-page min-h-screen bg-[var(--bg)] px-5 py-8 text-[var(--text-secondary)] sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex justify-end"><ThemeToggle /></div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c4aa9]">
              Company and workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              Where would you like to work?
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              Open company administration or choose an assigned operational workspace.
              The full context is validated before navigation.
            </p>
            <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]">
              Signed in as {session.user.fullName} · {session.user.email}
            </p>
          </div>
          <button
            onClick={() => void logout()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--text-primary)]"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>

        {error ? (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {session.user.platformRole === 'SYSTEM_ADMIN' ? (
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="mt-8 flex min-h-20 w-full items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-sm)]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b1248] text-white">
              <ShieldAlert size={20} />
            </span>
            <span className="flex-1">
              <strong className="block text-sm">NAVFarm platform</strong>
              <span className="mt-1 block text-xs text-[#707789]">Platform administration</span>
            </span>
            <ChevronRight size={17} />
          </button>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {companies.map((company) => {
            const workspaces = session.workspaces.filter(
              (workspace) =>
                workspace.companyId === company.companyId &&
                workspace.status === 'ACTIVE',
            );
            return (
              <section
                key={company.companyId}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1c4aa9]">
                    <Building2 size={19} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{company.companyName}</h2>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7c8393]">
                      {company.role.replaceAll('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    aria-label={`${company.companyName} company administration`}
                    disabled={selecting !== null}
                    onClick={() => void chooseCompany(
                      company.tenantId,
                      company.companyId,
                      company.companySlug,
                      company.onboardingStatus,
                    )}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-[var(--border)] px-3 text-left text-xs enabled:hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Settings2 size={15} className="text-[#1c4aa9]" />
                    <span className="flex-1">
                      <strong className="block">Company administration</strong>
                      <span className="mt-0.5 block text-[10px] text-[#7c8393]">
                        {company.onboardingStatus === 'COMPLETED'
                          ? 'Setup, accounting and shared configuration'
                          : 'Continue company setup'}
                      </span>
                    </span>
                    <ChevronRight size={14} />
                  </button>

                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.workspaceId}
                      aria-label={`${company.companyName} workspace ${workspace.workspaceName}`}
                      disabled={selecting !== null}
                      onClick={() => void chooseWorkspace(company, workspace)}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-[var(--border)] px-3 text-left text-xs enabled:hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Layers3 size={15} className="text-[#1c4aa9]" />
                      <span className="flex-1">
                        <strong className="block">{workspace.workspaceName}</strong>
                        <span className="mt-0.5 block text-[10px] text-[#7c8393]">
                          {workspace.role} · Workspace operations
                        </span>
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  ))}

                  {!workspaces.length ? (
                    <p className="rounded-xl bg-[var(--surface-raised)] px-3 py-3 text-[11px] leading-5 text-[var(--text-secondary)]">
                      No active operational workspace is assigned. Company administration
                      remains available when permitted.
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>

        {!companies.length && session.user.platformRole !== 'SYSTEM_ADMIN' ? (
          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">No company assigned</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Your account has no active company membership. Contact an administrator for access.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
