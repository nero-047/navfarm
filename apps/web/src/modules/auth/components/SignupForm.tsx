'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const CONTACT_EMAIL = 'sales@navfarm.com';

/**
 * NAVFarm workspaces are provisioned by our team, not through open
 * self-signup — a new tenant needs its farms, business lines, and first
 * administrator set up together with a real onboarding conversation. This
 * replaces what used to be a working signup form (still fully functional on
 * the backend, at POST /tenant/signup) with a direct path to that
 * conversation instead.
 */
export function SignupForm() {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-(--text-primary) tracking-tight mb-2">
          {t('authGetStarted')}
        </h1>
        <p className="text-(--text-secondary) text-[15px] leading-relaxed">
          {t('authGetStartedBody')}
        </p>
      </div>

      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('NAVFarm workspace — demo & consulting')}`}
        className="nf-btn-primary w-full flex items-center justify-center gap-2 h-11 rounded-[var(--radius-sm)] text-[15px] font-medium"
      >
        <Mail size={16} />
        {t('authContactUs')}
      </a>

      <p className="mt-4 text-center text-[13px] text-(--text-muted)">
        {CONTACT_EMAIL}
      </p>

      <p className="mt-8 text-center text-[14px] text-(--text-secondary)">
        {t('authAlreadyHaveAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors"
        >
          {t('authSignInLink')}
        </Link>
      </p>
    </div>
  );
}
