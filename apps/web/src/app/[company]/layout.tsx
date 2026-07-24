'use client';

import { useEffect, type ReactNode } from 'react';
import { ApplicationShell } from '../../components/shell/application-shell';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentCompany } from '../../modules/company/use-current-company';
import { DemoStoreProvider } from '../../modules/farm-demo/demo-store';
import { OperationsReadinessGuard } from '../../components/phase2/operations-readiness-guard';

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const company = useCurrentCompany();
  const { session, selectContext } = useAuth();

  useEffect(() => {
    const membership = session?.companies.find((item) => item.companySlug === company?.slug);
    if (membership && session?.activeCompanyId !== membership.companyId) {
      void selectContext(membership.tenantId, membership.companyId);
    }
  }, [company?.slug, selectContext, session]);

  return (
    <ApplicationShell scope="company" companySlug={company?.slug}>
      <div className="mb-5 flex flex-col gap-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold">Interactive frontend demo</span>
        <span>Seeded process-memory data through the contract-first API; no production backend is connected.</span>
      </div>
      {company ? (
        <OperationsReadinessGuard companySlug={company.slug}>
          <DemoStoreProvider company={company}>{children}</DemoStoreProvider>
        </OperationsReadinessGuard>
      ) : children}
    </ApplicationShell>
  );
}
