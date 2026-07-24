'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function OnboardingPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading || !session) return;
    const company = session.companies.find((item) => item.companyId === session.activeCompanyId);
    router.replace(company ? `/${company.companySlug}/setup` : '/context-selection');
  }, [loading, router, session]);
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">Opening the company setup workflow…</div>;
}
