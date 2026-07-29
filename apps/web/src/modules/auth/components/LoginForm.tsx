'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { destinationForSession, useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const DEMO_ACCOUNTS = [
  ['Platform Admin', 'Platform-wide tenant administration', 'system@navfarm.demo'],
  ['Tenant Admin', 'Tenant console and company setup', 'tenant@navfarm.demo'],
  ['Company Admin', 'Company administration without operational access', 'companyadmin@navfarm.demo'],
  ['Accountant', 'Company accounting without operational access', 'accountant@navfarm.demo'],
  ['Auditor', 'Company audit and read-only finance access', 'auditor@navfarm.demo'],
  ['Operations Manager', 'Green Valley production workspace', 'manager@navfarm.demo'],
  ['Read-only Viewer', 'View-only company workspace', 'viewer@navfarm.demo'],
  ['Multi-company User', 'Context selection across companies', 'multi@navfarm.demo'],
  ['MFA Administrator', 'Verification code 123456 or recovery NAVFARM-RECOVERY', 'mfa@navfarm.demo'],
  ['Suspended User', 'Protected suspended-tenant outcome', 'suspended@navfarm.demo'],
  ['Onboarding Admin', 'Incomplete Bluewater setup workflow', 'onboarding@navfarm.demo'],
  ['No-workspace User', 'Company access with no operational assignment', 'noworkspace@navfarm.demo'],
] as const;

export function LoginForm({ showDemoAccounts = false }: { showDemoAccounts?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, refreshSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.status === 'mfa_pending') {
        router.push(`/mfa/verify?challengeId=${encodeURIComponent(result.challengeId)}`);
        return;
      }
      const returnTo = searchParams.get('returnTo');
      const session = result.session ?? await refreshSession();
      router.push(
        result.status !== 'suspended' && returnTo?.startsWith('/')
          ? returnTo
          : session ? destinationForSession(session) : '/login',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="max-w-md">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Welcome back
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Sign in to your NAVFarm account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div id="login-error" role="alert" className="nf-danger-state flex items-center gap-2 rounded-xl border p-3 text-sm">
              <AlertCircle size={16} aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[13px] font-medium text-[var(--text-primary)]">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              aria-describedby={error ? 'login-error' : undefined}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-[var(--text-primary)]">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-describedby={error ? 'login-error' : undefined}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
      {showDemoAccounts && (
        <section aria-labelledby="demo-accounts-title" className="mt-8 border-t border-[var(--border)] pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 id="demo-accounts-title" className="text-sm font-semibold text-[var(--text-primary)]">Demo accounts</h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Mock mode only · common password: <span className="font-semibold text-[var(--text-primary)]">Demo123!</span></p>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1c4aa9]">Demo data</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map(([name, purpose, demoEmail]) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => { setEmail(demoEmail); setPassword('Demo123!'); setError(''); }}
                className="min-h-24 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]"
                aria-label={`Fill credentials for ${name}`}
              >
                <span className="block text-xs font-semibold text-[var(--text-primary)]">{name}</span>
                <span className="mt-1 block text-[11px] leading-4 text-[var(--text-secondary)]">{purpose}</span>
                <span className="mt-2 block break-all text-[10px] font-medium text-[var(--accent)]">{demoEmail}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">
        Demo credentials and local mock sessions are presentation fixtures, not production authentication or email delivery.
      </p>

      <p className="mt-6 max-w-md text-center text-[14px] text-[var(--text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)]"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
