'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import type { Plan } from '../../contracts/phase2';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from './common';

export function PlatformPlansView({ planId }: { planId?: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setPlans(planId ? [await api.get<Plan>(`/platform/plans/${planId}`)] : await api.get<Plan[]>('/platform/plans'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Plan catalog failed to load.');
    }
  }, [planId]);
  useEffect(() => { void load(); }, [load]);
  if (!plans.length && !error) return <LoadingState label="Loading subscription configuration…" />;
  if (!plans.length) return <div className="p-6"><ErrorState message={error} onRetry={() => void load()} /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader
        eyebrow="Platform administration"
        title={planId ? plans[0].name : 'Plan and entitlement catalog'}
        description="Documented feature allocation and technical limits. Commercial pricing and payment behavior remain intentionally unresolved."
      />
      <div className={`grid gap-4 ${planId ? 'max-w-3xl' : 'lg:grid-cols-3'}`}>
        {plans.map((plan) => (
          <article key={plan.planId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-blue-700">{plan.code}</p><h2 className="mt-1 text-xl font-black text-slate-950">{plan.name}</h2></div><StatusBadge status={plan.status} /></div>
            <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-500">Companies</dt><dd className="font-bold">{plan.limits.companies}</dd></div>
              <div><dt className="text-xs text-slate-500">Users</dt><dd className="font-bold">{plan.limits.users}</dd></div>
              <div><dt className="text-xs text-slate-500">Monthly batches</dt><dd className="font-bold">{plan.limits.batchesPerMonth ?? 'Unlimited'}</dd></div>
              <div><dt className="text-xs text-slate-500">API rate</dt><dd className="font-bold">{plan.limits.apiRequestsPerMinute}/min</dd></div>
              <div><dt className="text-xs text-slate-500">Storage</dt><dd className="font-bold">{plan.limits.storageGb ?? 'Unspecified'} GB</dd></div>
            </dl>
            <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Feature entitlements</h3>
            <div className="mt-2 flex flex-wrap gap-2">{plan.features.map((feature) => <span key={feature} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{feature}</span>)}</div>
            {!planId ? <Link href={`/admin/plans/${plan.planId}`} className="mt-5 inline-flex text-sm font-bold text-blue-700">View plan →</Link> : null}
          </article>
        ))}
      </div>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">NAVFarm source documents identify plan-linked feature limits but do not define prices, GST, taxes, payment gateways, retries, proration, invoices, overage charging, or grace periods. This screen does not invent them.</p>
    </div>
  );
}
