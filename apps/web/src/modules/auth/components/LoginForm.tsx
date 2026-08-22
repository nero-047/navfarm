'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { clearAuthSession } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { setTenantCompanyMode } from '@/hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(t('authFillAllFields'));
      return;
    }
    setSubmitting(true);
    try {
      // Clear any stale tenant/auth context so a fresh DB seed isn't
      // blocked by orphaned localStorage UUIDs from a previous session.
      clearAuthSession();
      setTenantCompanyMode(false);
      const signedInUser = await login(email, password);
      router.push(signedInUser.userType === 'SYSTEM_ADMIN' ? '/admin' : '/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-(--text-primary) tracking-tight mb-2">
          {t('authWelcomeBack')}
        </h1>
        <p className="text-(--text-secondary) text-[15px]">
          {t('authSignInSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-(--danger) py-1">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[13px] font-medium text-(--text-primary)">
            {t('authEmail')}
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
          <label htmlFor="password" className="block text-[13px] font-medium text-(--text-primary)">
            {t('authPassword')}
          </label>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/reset-password"
            className="text-[13px] text-(--text-secondary) hover:text-(--text-primary) transition-colors"
          >
            {t('authForgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t('authSigningIn') : t('authSignIn')}
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-(--text-secondary)">
        {t('authNoAccount')}{' '}
        <Link
          href="/signup"
          className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors"
        >
          {t('authCreateOne')}
        </Link>
      </p>
    </div>
  );
}
