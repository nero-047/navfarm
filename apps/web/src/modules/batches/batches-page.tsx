'use client';

import BatchPanel from '@/components/console/production/batch-panel';
import { PageHeader } from '@/components/ui/primitives';
import { useCompanyContext } from '@/modules/company';

export function BatchesPage() {
  const { company } = useCompanyContext();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Production"
        title="Batches"
        description={`Manage the full lifecycle of ${company?.name ?? 'company'} production batches, from input placement through daily activity and close.`}
      />
      <BatchPanel showHeader={false} />
    </div>
  );
}
