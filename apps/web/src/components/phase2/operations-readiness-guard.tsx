'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api-client';
import type { SetupStatus } from '../../contracts/phase2';

export function OperationsReadinessGuard({ companySlug, children }: { companySlug: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const company = session?.companies.find((item) => item.companySlug === companySlug);
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const operationalRoute = ['/batches', '/operations', '/quality', '/traceability', '/resources'].some((route) => pathname.includes(route));
  useEffect(() => {
    if (!company || !operationalRoute) return;
    api.get<SetupStatus>(`/companies/${company.companyId}/setup/status`).then(setStatus).catch(() => setStatus(null));
  }, [company, operationalRoute]);
  const blocked = operationalRoute && status && !status.operationsReady;
  useEffect(() => {
    if (blocked) router.replace(`/${companySlug}/setup/review`);
  }, [blocked, companySlug, router]);
  return (
    <>
      {blocked ? <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" />Returning to company setup because operations are not ready.</div> : null}
      <div aria-busy={Boolean(blocked)}>{children}</div>
    </>
  );
}
