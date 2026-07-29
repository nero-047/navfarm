'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AccessState } from '../../components/access/access-state';
import { accessReasonCodes, type AccessReason } from '../../lib/access-reasons';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const value = searchParams.get('reason');
  const companySlug = searchParams.get('company') ?? undefined;
  const reason: AccessReason = accessReasonCodes.includes(value as AccessReason)
    ? value as AccessReason
    : 'insufficient_permission';
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5f8] p-6">
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
