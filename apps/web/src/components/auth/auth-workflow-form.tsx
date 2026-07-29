'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import { destinationForSession } from '../../lib/authorization';
import { useAuth } from '../../contexts/AuthContext';

type Kind = 'reset' | 'invitation' | 'verify-email' | 'mfa-setup' | 'mfa-verify' | 'mfa-recovery';

const COPY: Record<Kind, { title: string; description: string; action: string }> = {
  reset: { title: 'Choose a new password', description: 'Set a strong password for your NAVFarm account.', action: 'Reset password' },
  invitation: { title: 'Accept your invitation', description: 'Confirm your name and create a password to join NAVFarm.', action: 'Accept invitation' },
  'verify-email': { title: 'Verify your email', description: 'Confirm this email address for your NAVFarm account.', action: 'Verify email' },
  'mfa-setup': { title: 'Set up multi-factor authentication', description: 'Enter the six-digit code from your authenticator app.', action: 'Enable MFA' },
  'mfa-verify': { title: 'Verify it is you', description: 'Enter the six-digit code from your authenticator app.', action: 'Verify and continue' },
  'mfa-recovery': { title: 'Use a recovery code', description: 'Enter one of your unused NAVFarm recovery codes.', action: 'Recover account' },
};

export function AuthWorkflowForm({ kind }: { kind: Kind }) {
  const copy = COPY[kind];
  const params = useSearchParams();
  const router = useRouter();
  const { completeMfa, refreshSession } = useAuth();
  const [value, setValue] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (kind !== 'mfa-verify' && kind !== 'mfa-recovery') return;
    void refreshSession().then((session) => {
      if (session) router.replace(destinationForSession(session));
    });
  }, [kind, refreshSession, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (kind === 'mfa-verify' || kind === 'mfa-recovery') {
        const session = await completeMfa(params.get('challengeId') || '', {
          ...(kind === 'mfa-verify' ? { code: value } : { recoveryCode: value }),
        });
        router.push(destinationForSession(session));
        return;
      }
      const endpoint = {
        reset: '/auth/reset-password',
        invitation: '/auth/accept-invitation',
        'verify-email': '/auth/verify-email',
        'mfa-setup': '/auth/mfa/setup',
      }[kind];
      await api.post(endpoint, { token: params.get('token'), code: value, fullName: name, password });
      setStatus('Completed successfully. You can continue to NAVFarm.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to complete this request');
    }
  }

  const needsPassword = kind === 'reset' || kind === 'invitation';
  const needsCode = kind.startsWith('mfa');
  const codeLabel = kind === 'mfa-recovery' ? 'Recovery code' : 'Verification code';
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{copy.title}</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.description}</p>
      {status ? <div role="status" className="nf-success-state mt-7 rounded-xl border p-4 text-sm">{status}<Link href="/login" className="mt-4 block font-semibold">Continue to sign in</Link></div> : (
        <form onSubmit={submit} className="mt-7 space-y-4">
          {error && <div id="workflow-error" role="alert" className="nf-danger-state rounded-xl border p-3 text-xs">{error}</div>}
          {kind === 'invitation' && <label className="block text-sm font-semibold text-[var(--text-primary)]">Full name<input aria-describedby={error ? 'workflow-error' : undefined} value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="mt-1 h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--input-text)]" /></label>}
          {needsPassword && <label className="block text-sm font-semibold text-[var(--text-primary)]">New password<input aria-describedby={error ? 'workflow-error' : undefined} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" className="mt-1 h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--input-text)]" /></label>}
          {needsCode && <label className="block text-sm font-semibold text-[var(--text-primary)]">{codeLabel}<input aria-describedby={error ? 'workflow-error' : undefined} value={value} onChange={(event) => setValue(event.target.value)} required autoComplete="one-time-code" placeholder={kind === 'mfa-recovery' ? 'NAVFARM-RECOVERY' : '123456'} className="mt-1 h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm tracking-widest text-[var(--input-text)]" /></label>}
          <button className="h-12 w-full rounded-xl bg-[#0b1248] text-sm font-semibold text-white">{copy.action}</button>
          {kind === 'mfa-verify' && <Link href={`/mfa/recovery?challengeId=${encodeURIComponent(params.get('challengeId') || '')}`} className="block min-h-11 py-3 text-center text-xs font-medium text-[var(--accent)]">Use a recovery code</Link>}
        </form>
      )}
      <p className="mt-6 text-xs leading-5 text-[var(--text-muted)]">
        This demo uses typed local mock responses; no production email, identity provider, or authenticator service is connected.
      </p>
    </div>
  );
}
