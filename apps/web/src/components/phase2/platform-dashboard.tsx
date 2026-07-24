'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Building2, Factory, Gauge, Layers3, Users } from 'lucide-react';
import { api } from '../../lib/api-client';
import type { PlatformDashboard } from '../../contracts/phase2';
import { ErrorState, LoadingState, PageHeader } from './common';

const metrics = [
  ['Total tenants', 'tenants', Building2],
  ['Active tenants', 'activeTenants', Activity],
  ['Suspended', 'suspendedTenants', AlertTriangle],
  ['Trial / expiring', 'trialOrExpiring', Gauge],
  ['Companies', 'companies', Factory],
  ['Active users', 'activeUsers', Users],
  ['Batches this month', 'batchesThisMonth', Layers3],
] as const;

export function PlatformDashboardView() {
  const [data, setData] = useState<PlatformDashboard | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setData(await api.get<PlatformDashboard>('/platform/dashboard'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Platform dashboard failed to load.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (!data && !error) return <LoadingState label="Loading platform administration…" />;
  if (!data) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">
      <PageHeader
        eyebrow="Platform administration"
        title="Control tower"
        description="Tenant health, subscription limits, onboarding exceptions, and recent control-plane activity."
        actions={<Link href="/admin/tenants/new" className="rounded-lg bg-[#101b52] px-4 py-2.5 text-sm font-bold text-white">Create tenant</Link>}
      />
      <section aria-label="Platform metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, key, Icon]) => (
          <article key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-blue-600" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-black text-slate-950">{data.totals[key]}</p>
          </article>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-950">Tenants approaching limits</h2>
            <p className="text-xs text-slate-500">Usage at or above 80% of configured allocation.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {data.approachingLimits.map((item) => (
              <Link key={`${item.tenantId}-${item.resource}`} href={`/admin/tenants/${item.tenantId}/limits`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.tenantName}</p>
                  <p className="text-xs text-slate-500">{item.resource}</p>
                </div>
                <span className="text-sm font-bold text-amber-700">{item.used} / {item.limit}</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-950">Setup exceptions</h2>
            <p className="text-xs text-slate-500">Companies needing platform or tenant-admin attention.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {data.setupExceptions.map((item) => (
              <Link key={item.tenantId} href={`/admin/tenants/${item.tenantId}/companies`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                <span className="text-sm font-semibold text-slate-900">{item.tenantName}</span>
                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">{item.count} exception{item.count === 1 ? '' : 's'}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Recent tenant activity</h2></div>
        <div className="divide-y divide-slate-100">
          {data.recentActivity.map((activity) => (
            <div key={activity.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_12rem_1fr] sm:items-center">
              <time className="text-xs text-slate-500">{new Date(activity.occurredAt).toLocaleString()}</time>
              <span className="text-xs font-bold text-blue-700">{activity.action.replaceAll('_', ' ')}</span>
              <p className="text-sm text-slate-700">{activity.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
