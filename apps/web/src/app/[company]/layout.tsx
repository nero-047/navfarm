'use client';

import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { ApplicationShell } from '../../components/shell/application-shell';

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const { company: requestedCompanySlug } = useParams<{ company: string }>();

  return (
    <ApplicationShell scope="company" companySlug={requestedCompanySlug}>
      {children}
    </ApplicationShell>
  );
}
