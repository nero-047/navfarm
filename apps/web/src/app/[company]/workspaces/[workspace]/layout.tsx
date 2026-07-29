'use client';

import type { ReactNode } from 'react';
import { DemoStoreProvider } from '@/modules/farm-demo/demo-store';
import { useCurrentCompany } from '@/modules/company/use-current-company';
import { WorkspaceIdentityBanner } from '@/modules/workspaces/route-content';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const company = useCurrentCompany();

  return company ? (
    <DemoStoreProvider company={company}>
      <WorkspaceIdentityBanner />
      {children}
    </DemoStoreProvider>
  ) : children;
}
