'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export function SignupForm() {
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tenantName || !tenantCode || !name || !email || !password) {
      setError(t('authFillAllFields'));
      return;
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(t('authPasswordRules'));
      return;
    }
    setSubmitting(true);
    try {
      const signedInUser = await signup({ tenantName, tenantCode, name, email, password });
      router.push(signedInUser.userType === 'SYSTEM_ADMIN' ? '/admin' : '/console');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-(--text-primary) tracking-tight mb-2">
          {t('authCreateAccount')}
        </h1>
        <p className="text-(--text-secondary) text-[15px]">
          {t('authCreateAccountSubtitle')}
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
          <label htmlFor="tenant-name" className="block text-[13px] font-medium text-(--text-primary)">
            {t('authOrgName')}
          </label>
          <Input
            id="tenant-name"
            type="text"
            placeholder="Green Valley Holdings"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tenant-code" className="block text-[13px] font-medium text-(--text-primary)">
            {t('authWorkspaceCode')}
          </label>
          <Input
            id="tenant-code"
            type="text"
            placeholder="greenvalley"
            value={tenantCode}
            onChange={(e) => setTenantCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-[13px] font-medium text-(--text-primary)">
            {t('authFullName')}
          </label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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
          <Input
            id="password"
            type="password"
            placeholder="8+ chars, uppercase, number, special"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t('authCreatingAccount') : t('authCreateAccountBtn')}
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-(--text-secondary)">
        {t('authAlreadyHaveAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-(--text-primary) hover:text-[#c24332] transition-colors"
        >
          {t('authSignInLink')}
        </Link>
      </p>
    </div>
  );
}
