'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, MailCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('authEnterEmail'));
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-(--accent-muted) flex items-center justify-center">
            <MailCheck size={28} className="text-(--accent)" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-(--text-primary) tracking-tight mb-2">
          {t('authCheckEmail')}
        </h1>
        <p className="text-(--text-secondary) text-[15px] mb-1">
          {t('authResetLinkSentTo')}
        </p>
        <p className="text-(--text-primary) font-medium text-[15px] mb-8">
          {email}
        </p>
        <p className="text-[13px] text-(--text-secondary) mb-8 leading-relaxed">
          {t('authDidntReceiveEmail')}
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)} className="mx-auto">
          {t('authTryAgain')}
        </Button>
        <p className="mt-8 text-[14px]">
          <Link
            href="/login"
            className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors"
          >
            {t('authBackToSignIn')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-(--text-primary) tracking-tight mb-2">
          {t('authResetPassword')}
        </h1>
        <p className="text-(--text-secondary) text-[15px]">
          {t('authResetPasswordSubtitle')}
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

        <Button type="submit" className="w-full">
          {t('authSendResetLink')}
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-(--text-secondary)">
        <Link
          href="/login"
          className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors"
        >
          {t('authBackToSignIn')}
        </Link>
      </p>
    </div>
  );
}
