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
  ['Operations Manager', 'Green Valley production workspace', 'manager@navfarm.demo'],
  ['Read-only Viewer', 'View-only company workspace', 'viewer@navfarm.demo'],
  ['Multi-company User', 'Context selection across companies', 'multi@navfarm.demo'],
  ['MFA Administrator', 'Verification code 123456 or recovery NAVFARM-RECOVERY', 'mfa@navfarm.demo'],
  ['Suspended User', 'Protected suspended-tenant outcome', 'suspended@navfarm.demo'],
  ['Onboarding Admin', 'Incomplete Bluewater setup workflow', 'onboarding@navfarm.demo'],
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
      const signedInUser = await login(email, password);
      if (signedInUser.mfaRequired && signedInUser.challengeId) {
        router.push(`/mfa/verify?challengeId=${encodeURIComponent(signedInUser.challengeId)}`);
        return;
      }
      const returnTo = searchParams.get('returnTo');
      const session = await refreshSession();
      router.push(returnTo?.startsWith('/') ? returnTo : session ? destinationForSession(session) : '/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-[#2e313f] tracking-tight mb-2">
          Welcome back
        </h1>
        <p className="text-[#707070] text-[15px]">
          Sign in to your NAVFarm account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-[#c24332] py-1">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[13px] font-medium text-[#2e313f]">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-[13px] font-medium text-[#2e313f]">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[13px] text-[#707070] hover:text-[#2e313f] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {showDemoAccounts && (
        <section aria-labelledby="demo-accounts-title" className="mt-8 border-t border-[#e7e9ee] pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 id="demo-accounts-title" className="text-sm font-semibold text-[#2e313f]">Demo accounts</h2>
              <p className="mt-1 text-xs text-[#707070]">Mock mode only · common password: <span className="font-semibold text-[#2e313f]">Demo123!</span></p>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1c4aa9]">Demo data</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map(([name, purpose, demoEmail]) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => { setEmail(demoEmail); setPassword('Demo123!'); setError(''); }}
                className="min-h-24 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1c4aa9] focus:ring-offset-2"
                aria-label={`Fill credentials for ${name}`}
              >
                <span className="block text-xs font-semibold text-[#2e313f]">{name}</span>
                <span className="mt-1 block text-[11px] leading-4 text-[#707070]">{purpose}</span>
                <span className="mt-2 block break-all text-[10px] font-medium text-[#1c4aa9]">{demoEmail}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-[14px] text-[#707070]">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-[#2e313f] hover:text-[#c24332] transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
