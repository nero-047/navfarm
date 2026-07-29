'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { api } from '../../lib/api-client';
import type { Plan, PlatformTenantList } from '../../contracts/phase2';
import {
  EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge,
  inputClass, primaryButtonClass,
} from './common';

export function PlatformTenantListView() {
  const [data, setData] = useState<PlatformTenantList | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('name');
  const [direction, setDirection] = useState('asc');
  const [page, setPage] = useState(1);

  const query = useMemo(() => new URLSearchParams({
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(planId ? { planId } : {}),
    ...(type ? { type } : {}),
    sort, direction, page: String(page), pageSize: '5',
  }).toString(), [direction, page, planId, search, sort, status, type]);

  const load = useCallback(async () => {
    setError('');
    try {
      const [tenantData, planData] = await Promise.all([
        api.get<PlatformTenantList>(`/platform/tenants?${query}`),
        api.get<Plan[]>('/platform/plans'),
      ]);
      setData(tenantData);
      setPlans(planData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tenant registry failed to load.');
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, planId, type, sort, direction]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader
        eyebrow="Platform administration"
        title="Tenant registry"
        description="Search, review, and manage tenant lifecycle, subscriptions, and allocation limits."
        actions={<Link href="/admin/tenants/new" className={primaryButtonClass}><Plus className="mr-2 h-4 w-4" />Create tenant</Link>}
      />

      <section aria-label="Tenant filters" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-6">
        <label className="relative sm:col-span-2">
          <span className="sr-only">Search tenants</span>
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden />
          <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, name, or billing email" />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option>ACTIVE</option><option>TRIAL</option><option>SUSPENDED</option><option>INACTIVE</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Plan</span>
          <select className={inputClass} value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="">All plans</option>
            {plans.map((plan) => <option key={plan.planId} value={plan.planId}>{plan.name}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Tenant type</span>
          <select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All types</option>
            <option>INDIVIDUAL</option><option>SME</option><option>ENTERPRISE</option><option>COOPERATIVE</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort tenants</span>
          <select className={inputClass} value={`${sort}:${direction}`} onChange={(event) => {
            const [nextSort, nextDirection] = event.target.value.split(':');
            setSort(nextSort); setDirection(nextDirection);
          }}>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="createdAt:desc">Newest first</option>
            <option value="status:asc">Status</option>
          </select>
        </label>
      </section>

      {!data && !error ? <LoadingState label="Loading tenant registry…" /> : null}
      {!data && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {data && data.items.length === 0 ? <EmptyState title="No tenants match these filters" description="Clear one or more filters or create a new tenant." /> : null}

      {data && data.items.length > 0 ? (
        <>
          <div
            role="region"
            aria-label="Tenant registry table"
            tabIndex={0}
            className="hidden min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] xl:block [contain:inline-size]"
          >
            <table className="w-full min-w-[790px] text-left text-sm">
              <caption className="sr-only">NAVFarm tenants</caption>
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Tenant</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Plan</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Companies</th>
                  <th scope="col" className="px-4 py-3">Users</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((tenant) => (
                  <tr key={tenant.tenantId}>
                    <td className="px-4 py-4"><p className="font-bold text-slate-900">{tenant.name}</p><p className="text-xs text-slate-500">{tenant.code} · {tenant.billingEmail}</p></td>
                    <td className="px-4 py-4 text-slate-600">{tenant.type}</td>
                    <td className="px-4 py-4 text-slate-600">{tenant.planName}</td>
                    <td className="px-4 py-4"><StatusBadge status={tenant.status} /></td>
                    <td className="px-4 py-4 text-slate-600">{tenant.usage.companies.used} / {tenant.usage.companies.limit}</td>
                    <td className="px-4 py-4 text-slate-600">{tenant.usage.users.used} / {tenant.usage.users.limit}</td>
                    <td className="px-4 py-4 text-right"><Link className="font-bold text-blue-700 hover:underline" href={`/admin/tenants/${tenant.tenantId}/overview`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 xl:hidden">
            {data.items.map((tenant) => (
              <article key={tenant.tenantId} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="font-bold text-slate-950">{tenant.name}</h2><p className="text-xs text-slate-500">{tenant.code}</p></div>
                  <StatusBadge status={tenant.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs text-slate-500">Plan</dt><dd className="font-semibold">{tenant.planName}</dd></div>
                  <div><dt className="text-xs text-slate-500">Type</dt><dd className="font-semibold">{tenant.type}</dd></div>
                  <div><dt className="text-xs text-slate-500">Companies</dt><dd>{tenant.usage.companies.used} / {tenant.usage.companies.limit}</dd></div>
                  <div><dt className="text-xs text-slate-500">Users</dt><dd>{tenant.usage.users.used} / {tenant.usage.users.limit}</dd></div>
                </dl>
                <Link className="mt-4 inline-flex font-bold text-blue-700" href={`/admin/tenants/${tenant.tenantId}/overview`}>Open tenant →</Link>
              </article>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{data.total} tenant{data.total === 1 ? '' : 's'} · page {data.page} of {Math.max(1, data.totalPages)}</p>
            <div className="flex gap-2">
              <button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-300 bg-white p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <button aria-label="Next page" disabled={page >= data.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-300 bg-white p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
