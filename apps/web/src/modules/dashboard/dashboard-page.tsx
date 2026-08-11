'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

function number(value: unknown) {
  return Number(value || 0);
}

export function DashboardPage() {
  const { company } = useCompanyContext();
  const companyId = company?.id;
  const batches = useApiResource<DataRow[]>(
    companyId
      ? `/batch?companyId=${encodeURIComponent(companyId)}&limit=200`
      : null,
  );
  const alerts = useApiResource<DataRow[]>(
    companyId
      ? `/alert?companyId=${encodeURIComponent(companyId)}&limit=50`
      : null,
  );
  const rows = batches.data ?? [];
  const alertRows = alerts.data ?? [];
  const active = rows.filter((row) => row.status === 'ACTIVE');
  const draft = rows.filter((row) => row.status === 'DRAFT');
  const closed = rows.filter((row) => row.status === 'CLOSED');
  const unread = alertRows.filter((row) => !row.is_read);

  if (batches.loading || alerts.loading)
    return <LoadingState label="Loading operational overview" />;
  if (batches.error)
    return (
      <Surface>
        <ErrorState message={batches.error} onRetry={batches.reload} />
      </Surface>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={company?.nobName}
        title="Operational overview"
        description="Live production status, scheduler exceptions and recent batch activity for this company."
        actions={
          <Link
            href={`/${company?.slug}/operations`}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-(--accent) px-4 text-sm font-semibold text-white hover:bg-(--accent-hover)"
          >
            Record data
          </Link>
        }
      />

      <Surface className="grid divide-y divide-(--border-subtle) sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {(
          [
            ['Active batches', active.length, Boxes, 'Production in progress'],
            ['Draft batches', draft.length, Clock3, 'Awaiting activation'],
            [
              'Closed batches',
              closed.length,
              CheckCircle2,
              'Completed production',
            ],
            [
              'Open alerts',
              unread.length,
              AlertTriangle,
              alerts.error
                ? 'Alert service unavailable'
                : 'Unacknowledged KPI exceptions',
            ],
          ] as Array<[string, number, LucideIcon, string]>
        ).map(([label, value, Icon, detail]) => (
          <div key={String(label)} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] text-(--text-secondary)">
                  {String(label)}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-(--text-primary)">
                  {String(value)}
                </p>
              </div>
              <Icon size={19} className="text-(--accent)" />
            </div>
            <p className="mt-3 text-xs text-(--text-muted)">{String(detail)}</p>
          </div>
        ))}
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-(--text-primary)">
                Current batches
              </h2>
              <p className="mt-1 text-sm text-(--text-secondary)">
                Lifecycle and cost method at a glance.
              </p>
            </div>
            <Link
              href={`/${company?.slug}/batches`}
              className="flex items-center gap-1 text-sm font-semibold text-(--accent)"
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <TableShell>
            {!rows.length ? (
              <EmptyState
                title="No batches yet"
                description="Create a production batch when company setup and master data are ready."
                action={
                  <Link
                    href={`/${company?.slug}/batches`}
                    className="text-sm font-semibold text-(--accent)"
                  >
                    Open batch workspace
                  </Link>
                }
              />
            ) : (
              <table className="w-full min-w-[680px] text-left text-[13px]">
                <thead className="border-b border-(--border-subtle) bg-(--surface-raised) text-(--text-secondary)">
                  <tr>
                    <th className="px-4 py-3 font-medium">Batch</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Costing</th>
                    <th className="px-4 py-3 font-medium">Opening quantity</th>
                    <th className="px-4 py-3 font-medium">Start date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-subtle)">
                  {rows.slice(0, 8).map((row) => (
                    <tr
                      key={String(row.batch_id)}
                      className="hover:bg-(--row-hover)"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/${company?.slug}/batches/${String(row.batch_id)}`}
                          className="font-semibold text-(--text-primary) hover:text-(--accent)"
                        >
                          {String(row.batch_no || row.batch_id)}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          tone={
                            row.status === 'ACTIVE'
                              ? 'success'
                              : row.status === 'DRAFT'
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          {String(row.status || 'Unknown')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-(--text-secondary)">
                        {String(row.costing_method || '—')}
                      </td>
                      <td className="px-4 py-3.5 text-(--text-secondary)">
                        {number(row.opening_quantity).toLocaleString()}{' '}
                        {String(row.uom || '')}
                      </td>
                      <td className="px-4 py-3.5 text-(--text-secondary)">
                        {String(row.start_date || '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableShell>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-(--text-primary)">
              KPI exceptions
            </h2>
            <p className="mt-1 text-sm text-(--text-secondary)">
              Scheduler alerts requiring attention.
            </p>
          </div>
          <Surface className="overflow-hidden">
            {alerts.error ? (
              <ErrorState message={alerts.error} onRetry={alerts.reload} />
            ) : !alertRows.length ? (
              <EmptyState
                title="No KPI exceptions"
                description="Scheduler alerts will appear here when live observations exceed configured thresholds."
              />
            ) : (
              <div className="divide-y divide-(--border-subtle)">
                {alertRows.slice(0, 8).map((alert) => (
                  <div key={String(alert.alert_id)} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-(--text-primary)">
                        {String(
                          alert.alert_title || alert.message || 'KPI deviation',
                        )}
                      </p>
                      <Badge
                        tone={
                          alert.severity === 'CRITICAL' ? 'danger' : 'warning'
                        }
                      >
                        {String(alert.severity || 'Alert')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-(--text-secondary)">
                      {String(alert.alert_message || alert.message || '')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </section>
      </div>
    </div>
  );
}
