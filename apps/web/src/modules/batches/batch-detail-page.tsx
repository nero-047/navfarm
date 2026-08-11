'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  Badge,
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

const SECTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'data', label: 'Data' },
  { value: 'animals', label: 'Animals' },
  { value: 'cost', label: 'Cost' },
  { value: 'qc', label: 'QC' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'documents', label: 'Documents' },
];

function sum(rows: DataRow[], field: string) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

export function BatchDetailPage({ batchId }: { batchId: string }) {
  const { company } = useCompanyContext();
  const resource = useApiResource<DataRow>(
    batchId ? `/batch/${encodeURIComponent(batchId)}` : null,
  );
  const [section, setSection] = useState('overview');
  if (resource.loading) return <LoadingState label="Loading batch" />;
  if (resource.error)
    return (
      <Surface>
        <ErrorState message={resource.error} onRetry={resource.reload} />
      </Surface>
    );
  if (!resource.data)
    return (
      <Surface>
        <EmptyState
          title="Batch not found"
          description="This batch does not exist or you do not have permission to view it."
        />
      </Surface>
    );
  const batch = resource.data;
  const transactions = (batch.transactions as DataRow[] | undefined) ?? [];
  const inputs = (batch.input_lines as DataRow[] | undefined) ?? [];
  const outputs = (batch.output_lines as DataRow[] | undefined) ?? [];
  const variances = (batch.variances as DataRow[] | undefined) ?? [];
  const alerts = (batch.alerts as DataRow[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <Link
        href={`/${company?.slug}/batches`}
        className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary) hover:text-(--accent)"
      >
        <ArrowLeft size={16} />
        Back to batches
      </Link>
      <PageHeader
        eyebrow="Production batch"
        title={String(batch.batch_no || 'Batch')}
        description={String(
          batch.remarks || `${company?.name ?? 'Company'} production lifecycle`,
        )}
        actions={
          <Badge
            tone={
              batch.status === 'ACTIVE'
                ? 'success'
                : batch.status === 'DRAFT'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {String(batch.status || 'Unknown')}
          </Badge>
        }
      />
      <Surface className="grid divide-y divide-(--border-subtle) sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {[
          ['Costing method', batch.costing_method],
          ['Start date', batch.start_date],
          ['Expected end', batch.expected_end_date || 'Not set'],
          [
            'Opening quantity',
            `${Number(batch.opening_quantity || 0).toLocaleString()} ${String(batch.uom || '')}`,
          ],
        ].map(([label, value]) => (
          <div key={String(label)} className="p-4 sm:p-5">
            <p className="text-xs text-(--text-muted)">{String(label)}</p>
            <p className="mt-1 text-sm font-semibold text-(--text-primary)">
              {String(value || '—')}
            </p>
          </div>
        ))}
      </Surface>
      <SegmentedControl
        value={section}
        options={SECTIONS}
        onChange={setSection}
      />

      {section === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Surface className="p-5">
            <p className="text-[13px] text-(--text-secondary)">Input value</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">
              {sum(inputs, 'amount').toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </p>
          </Surface>
          <Surface className="p-5">
            <p className="text-[13px] text-(--text-secondary)">
              Recorded transactions
            </p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">
              {transactions.length}
            </p>
          </Surface>
          <Surface className="p-5">
            <p className="text-[13px] text-(--text-secondary)">
              Output quantity
            </p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">
              {sum(outputs, 'quantity').toLocaleString()}
            </p>
          </Surface>
        </div>
      )}
      {(section === 'timeline' || section === 'data') && (
        <RecordTable
          title="Batch activity"
          rows={transactions}
          columns={[
            'transaction_date',
            'transaction_type',
            'quantity',
            'uom',
            'amount',
            'remarks',
          ]}
          empty="No daily transactions have been recorded for this batch."
        />
      )}
      {section === 'animals' && (
        <RecordTable
          title="Biological asset ledger"
          rows={(batch.bio_asset_entries as DataRow[] | undefined) ?? []}
          columns={[
            'posting_date',
            'entry_type',
            'stage',
            'quantity',
            'cost_amount',
          ]}
          empty="This batch has no biological-asset ledger entries."
        />
      )}
      {section === 'cost' && (
        <RecordTable
          title="Cost variances"
          rows={variances}
          columns={[
            'variance_type',
            'standard_amount',
            'actual_amount',
            'variance_amount',
          ]}
          empty="No close-time variances have been calculated."
        />
      )}
      {section === 'qc' && (
        <RecordTable
          title="Quality alerts"
          rows={alerts}
          columns={['created_at', 'severity', 'alert_message', 'is_read']}
          empty="No quality or KPI alerts are linked to this batch."
        />
      )}
      {section === 'inventory' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <RecordTable
            title="Input lines"
            rows={inputs}
            columns={[
              'item_id',
              'source_batch_id',
              'quantity',
              'uom',
              'amount',
            ]}
            empty="No input lines."
          />
          <RecordTable
            title="Output lines"
            rows={outputs}
            columns={['item_id', 'output_type', 'quantity', 'uom', 'amount']}
            empty="No output lines yet."
          />
        </div>
      )}
      {section === 'documents' && (
        <Surface>
          <EmptyState
            title="No documents attached"
            description="Documents will appear here when a production document service is connected to this batch."
          />
        </Surface>
      )}
    </div>
  );
}

function RecordTable({
  title,
  rows,
  columns,
  empty,
}: {
  title: string;
  rows: DataRow[];
  columns: string[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-(--text-primary)">
        {title}
      </h2>
      <TableShell>
        {!rows.length ? (
          <EmptyState title="Nothing to show" description={empty} />
        ) : (
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-(--border-subtle) bg-(--surface-raised) text-(--text-secondary)">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">
                    {column.replaceAll('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-subtle)">
              {rows.map((row, index) => (
                <tr
                  key={String(
                    row.transaction_id || row.line_id || row.entry_id || index,
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="max-w-sm px-4 py-3.5 text-(--text-secondary)"
                    >
                      {row[column] === null ||
                      row[column] === undefined ||
                      row[column] === ''
                        ? '—'
                        : String(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableShell>
    </section>
  );
}
