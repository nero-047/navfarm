'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api-client';
import type { SetupStatus } from '../../contracts/phase2';

export function OperationsReadinessGuard({ companySlug, children }: { companySlug: string; children: ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const company = session?.companies.find((item) => item.companySlug === companySlug);
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const operationalRoute = pathname.includes('/batches') || pathname.includes('/operations');
  useEffect(() => {
    if (!company || !operationalRoute) return;
    api.get<SetupStatus>(`/companies/${company.companyId}/setup/status`).then(setStatus).catch(() => setStatus(null));
  }, [company, operationalRoute]);
  const blocked = operationalRoute && status && !status.operationsReady;
  return (
    <>
      {blocked ? (
        <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Batch creation and operational entry are read-only until chart of accounts/GL mappings, NOB/LOB configuration, and essential master data are ready.</span>
          <Link href={`/${companySlug}/setup/review`} className="shrink-0 rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white">Review blockers</Link>
        </div>
      ) : null}
      <div className={blocked ? 'pointer-events-none opacity-60' : ''} aria-disabled={Boolean(blocked)}>{children}</div>
    </>
  );
}
