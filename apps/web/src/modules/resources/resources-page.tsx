'use client';

import { useState } from 'react';
import AlertPanel from '@/components/console/production/alert-panel';
import ParameterPanel from '@/components/console/production/parameter-panel';
import QcParameterPanel from '@/components/console/production/qc-parameter-panel';
import SchedulerPanel from '@/components/console/production/scheduler-panel';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SegmentedControl,
  Surface,
  TableShell,
} from '@/components/ui/primitives';
import { useCompanyContext } from '@/modules/company';
import {
  useApiResource,
  type DataRow,
} from '@/modules/workspace/use-api-resource';

const tabs = [
  { value: 'resources', label: 'Resources' },
  { value: 'schedulers', label: 'Schedulers' },
  { value: 'parameters', label: 'Parameters' },
  { value: 'qc', label: 'QC parameters' },
  { value: 'alerts', label: 'KPI alerts' },
];

export function ResourcesPage() {
  const { company } = useCompanyContext();
  const [tab, setTab] = useState('resources');
  const resources = useApiResource<DataRow[]>(
    company?.id
      ? `/resource?companyId=${encodeURIComponent(company.id)}&limit=500`
      : null,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Resources & KPIs"
        description="Manage operating resources and the scheduler-driven parameters that govern production data entry and alerts."
      />
      <SegmentedControl value={tab} options={tabs} onChange={setTab} />
      {tab === 'resources' &&
        (resources.loading ? (
          <LoadingState label="Loading resources" />
        ) : resources.error ? (
          <Surface>
            <ErrorState message={resources.error} onRetry={resources.reload} />
          </Surface>
        ) : (
          <TableShell>
            {!resources.data?.length ? (
              <EmptyState
                title="No resources configured"
                description="Add labour, equipment or facility resources in master data before assigning overheads to batches."
              />
            ) : (
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-(--border-subtle) bg-(--surface-raised) text-(--text-secondary)">
                  <tr>
                    {['Code', 'Resource', 'Type', 'Rate', 'Status'].map(
                      (label) => (
                        <th key={label} className="px-4 py-3 font-medium">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-subtle)">
                  {resources.data.map((row) => (
                    <tr key={String(row.resource_id)}>
                      <td className="px-4 py-3.5 font-medium text-(--text-primary)">
                        {String(row.resource_code || '—')}
                      </td>
                      <td className="px-4 py-3.5 text-(--text-secondary)">
                        {String(row.resource_name || '—')}
                      </td>
                      <td className="px-4 py-3.5 text-(--text-secondary)">
                        {String(row.resource_type || '—')}
                      </td>
                      <td className="px-4 py-3.5 text-(--text-secondary)">
                        {String(row.cost_rate || row.rate || '—')}
                      </td>
                      <td className="px-4 py-3.5 text-(--text-secondary)">
                        {row.is_active === false ? 'Inactive' : 'Active'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableShell>
        ))}
      {tab === 'schedulers' && <SchedulerPanel />}
      {tab === 'parameters' && <ParameterPanel />}
      {tab === 'qc' && <QcParameterPanel />}
      {tab === 'alerts' && <AlertPanel />}
    </div>
  );
}
