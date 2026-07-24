'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import type { AuthSession } from '../../contracts/api';
import { destinationForSession } from '../../lib/authorization';

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
  const [value, setValue] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      let response: AuthSession | { success: boolean };
      if (kind === 'mfa-verify' || kind === 'mfa-recovery') {
        response = await api.post<AuthSession>(`/auth/${kind === 'mfa-verify' ? 'mfa/verify' : 'mfa/recovery'}`, {
          challengeId: params.get('challengeId'),
          ...(kind === 'mfa-verify' ? { code: value } : { recoveryCode: value }),
        });
        router.push(destinationForSession(response));
        return;
      }
      const endpoint = {
        reset: '/auth/reset-password',
        invitation: '/auth/accept-invitation',
        'verify-email': '/auth/verify-email',
        'mfa-setup': '/auth/mfa/setup',
      }[kind];
      response = await api.post(endpoint, { token: params.get('token'), code: value, fullName: name, password });
      setStatus('Completed successfully. You can continue to NAVFarm.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to complete this request');
    }
  }

  const needsPassword = kind === 'reset' || kind === 'invitation';
  const needsCode = kind.startsWith('mfa');
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-[#2e313f]">{copy.title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#707070]">{copy.description}</p>
      {status ? <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{status}<Link href="/login" className="mt-4 block font-semibold">Continue to sign in</Link></div> : (
        <form onSubmit={submit} className="mt-7 space-y-4">
          {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
          {kind === 'invitation' && <input aria-label="Full name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Full name" className="h-12 w-full rounded-xl border border-[#dfe3ea] px-4 text-sm" />}
          {needsPassword && <input aria-label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} placeholder="New password" className="h-12 w-full rounded-xl border border-[#dfe3ea] px-4 text-sm" />}
          {needsCode && <input aria-label={kind === 'mfa-recovery' ? 'Recovery code' : 'Verification code'} value={value} onChange={(event) => setValue(event.target.value)} required placeholder={kind === 'mfa-recovery' ? 'NAVFARM-RECOVERY' : '123456'} className="h-12 w-full rounded-xl border border-[#dfe3ea] px-4 text-sm tracking-widest" />}
          <button className="h-12 w-full rounded-xl bg-[#0b1248] text-sm font-semibold text-white">{copy.action}</button>
          {kind === 'mfa-verify' && <Link href={`/mfa/recovery?challengeId=${encodeURIComponent(params.get('challengeId') || '')}`} className="block text-center text-xs font-medium text-[#1c4aa9]">Use a recovery code</Link>}
        </form>
      )}
    </div>
  );
}
