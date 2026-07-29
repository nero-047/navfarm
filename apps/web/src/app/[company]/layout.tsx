'use client';

import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { ApplicationShell } from '../../components/shell/application-shell';
import { useCurrentCompany } from '../../modules/company/use-current-company';
import { DemoStoreProvider } from '../../modules/farm-demo/demo-store';

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const company = useCurrentCompany();
  const { company: requestedCompanySlug } = useParams<{ company: string }>();

  return (
    <ApplicationShell scope="company" companySlug={requestedCompanySlug}>
      {company ? (
        <DemoStoreProvider company={company}>{children}</DemoStoreProvider>
      ) : children}
    </ApplicationShell>
  );
}
