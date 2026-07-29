'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AccessState } from '../../components/access/access-state';
import ThemeToggle from '../../components/source-ui/theme-toggle';
import { accessReasonCodes, type AccessReason } from '../../lib/access-reasons';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const value = searchParams.get('reason');
  const companySlug = searchParams.get('company') ?? undefined;
  const reason: AccessReason = accessReasonCodes.includes(value as AccessReason)
    ? value as AccessReason
    : 'insufficient_permission';
  return (
    <main className="nf-context-page relative flex min-h-screen items-center justify-center bg-[var(--bg)] p-5 sm:p-6">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <div className="w-full max-w-2xl">
        <AccessState reason={reason} companySlug={companySlug} />
      </div>
    </main>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense>
      <AccessDeniedContent />
    </Suspense>
  );
}
