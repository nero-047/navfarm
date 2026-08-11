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

export function QualityPage() {
  const { company } = useCompanyContext();
  const resource = useApiResource<DataRow[]>(
    company?.id
      ? `/qc?companyId=${encodeURIComponent(company.id)}&limit=200`
      : null,
  );
  if (resource.loading) return <LoadingState label="Loading quality records" />;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quality assurance"
        title="Quality control"
        description="Inspection outcomes linked to production outputs and traceability packs."
      />
      {resource.error ? (
        <Surface>
          <ErrorState message={resource.error} onRetry={resource.reload} />
        </Surface>
      ) : (
        <TableShell>
          {!resource.data?.length ? (
            <EmptyState
              title="No quality inspections"
              description="QC records will appear after an inspection is submitted against a batch output."
            />
          ) : (
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b border-(--border-subtle) bg-(--surface-raised) text-(--text-secondary)">
                <tr>
                  {[
                    'Inspection',
                    'Date',
                    'Batch output',
                    'Result',
                    'Notes',
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-subtle)">
                {resource.data.map((row) => (
                  <tr key={String(row.qc_id)}>
                    <td className="px-4 py-3.5 font-semibold text-(--text-primary)">
                      {String(row.qc_no || row.qc_id)}
                    </td>
                    <td className="px-4 py-3.5 text-(--text-secondary)">
                      {String(row.qc_date || '—')}
                    </td>
                    <td className="px-4 py-3.5 text-(--text-secondary)">
                      {String(row.batch_output_line_id || '—')}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        tone={
                          row.overall_result === 'PASS'
                            ? 'success'
                            : row.overall_result === 'FAIL'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {String(row.overall_result || 'Pending')}
                      </Badge>
                    </td>
                    <td className="max-w-sm px-4 py-3.5 text-(--text-secondary)">
                      {String(row.qc_notes || '—')}
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
