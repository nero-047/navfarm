'use client';

import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Surface,
  TableShell,
} from '@/components/ui/primitives';
import { useCompanyContext } from '@/modules/company';
import {
  useApiResource,
  type DataRow,
} from '@/modules/workspace/use-api-resource';

export function TraceabilityPage() {
  const { company } = useCompanyContext();
  const resource = useApiResource<DataRow[]>(
    company?.id
      ? `/qr-code?companyId=${encodeURIComponent(company.id)}&limit=200`
      : null,
  );
  if (resource.loading)
    return <LoadingState label="Loading traceability packs" />;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Farm to fork"
        title="Traceability"
        description="Production packs generated from batch outputs, with linked quality status and immutable pack identity."
      />
      {resource.error ? (
        <Surface>
          <ErrorState message={resource.error} onRetry={resource.reload} />
        </Surface>
      ) : (
        <TableShell>
          {!resource.data?.length ? (
            <EmptyState
              title="No traceability packs"
              description="Generate a pack from a completed batch output after the relevant quality checks are available."
            />
          ) : (
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead className="border-b border-(--border-subtle) bg-(--surface-raised) text-(--text-secondary)">
                <tr>
                  {[
                    'Pack',
                    'Lot',
                    'Production date',
                    'Weight',
                    'QC',
                    'Status',
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-subtle)">
                {resource.data.map((row) => (
                  <tr key={String(row.qr_id)}>
                    <td className="px-4 py-3.5 font-semibold text-(--text-primary)">
                      {String(row.pack_no || row.qr_id)}
                    </td>
                    <td className="px-4 py-3.5 text-(--text-secondary)">
                      {String(row.lot_no || '—')}
                    </td>
                    <td className="px-4 py-3.5 text-(--text-secondary)">
                      {String(row.production_date || '—')}
                    </td>
                    <td className="px-4 py-3.5 text-(--text-secondary)">
                      {String(row.net_weight || '—')}{' '}
                      {String(row.pack_uom || '')}
                    </td>
                    <td className="px-4 py-3.5 text-(--text-secondary)">
                      {String(row.qc_id || 'Not linked')}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={row.is_void ? 'danger' : 'success'}>
                        {row.is_void ? 'Void' : 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableShell>
      )}
    </div>
  );
}
