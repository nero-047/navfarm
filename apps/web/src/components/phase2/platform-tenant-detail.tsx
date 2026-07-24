'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '../../lib/api-client';
import type {
  ActivityEntry, CompanySummary, Plan, PlatformTenant, TenantUser,
} from '../../contracts/phase2';
import {
  EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, SuccessNotice,
  UsageBar, inputClass, primaryButtonClass, secondaryButtonClass,
} from './common';

type Section = 'overview' | 'subscription' | 'limits' | 'companies' | 'users' | 'audit';
const sections: Array<{ key: Section; label: string }> = [
  { key: 'overview', label: 'Overview' }, { key: 'subscription', label: 'Subscription' },
  { key: 'limits', label: 'Limits' }, { key: 'companies', label: 'Companies' },
  { key: 'users', label: 'Users' }, { key: 'audit', label: 'Audit' },
];

export function PlatformTenantDetail({ tenantId, section }: { tenantId: string; section: Section }) {
  const pathname = usePathname();
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [audit, setAudit] = useState<ActivityEntry[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const detail = await api.get<PlatformTenant>(`/platform/tenants/${tenantId}`);
      setTenant(detail);
      if (section === 'subscription') setPlans(await api.get<Plan[]>('/platform/plans'));
      if (section === 'companies') setCompanies(await api.get<CompanySummary[]>(`/platform/tenants/${tenantId}/companies`));
      if (section === 'users') setUsers(await api.get<TenantUser[]>(`/platform/tenants/${tenantId}/users`));
      if (section === 'audit') setAudit((await api.get<{ items: ActivityEntry[] }>(`/platform/tenants/${tenantId}/audit`)).items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tenant details failed to load.');
    }
  }, [section, tenantId]);
  useEffect(() => { void load(); }, [load]);

  const lifecycle = async (action: 'activate' | 'suspend' | 'reactivate') => {
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const updated = await api.post<PlatformTenant>(`/platform/tenants/${tenantId}/${action}`);
      setTenant(updated);
      setSuccess(`${updated.name} is now ${updated.status.toLowerCase()}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tenant status could not be updated.');
    } finally {
      setSubmitting(false);
    }
  };

  const patch = async (changes: Record<string, unknown>, message: string) => {
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const updated = await api.patch<PlatformTenant>(`/platform/tenants/${tenantId}`, changes);
      setTenant(updated); setSuccess(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tenant update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!tenant && !error) return <LoadingState label="Loading tenant details…" />;
  if (!tenant) return <div className="p-6"><ErrorState message={error} onRetry={() => void load()} /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader
        eyebrow={`${tenant.code} · ${tenant.type}`}
        title={tenant.name}
        description={`${tenant.planName} · billing ${tenant.billingCycle.toLowerCase()} in ${tenant.billingCurrency}`}
        actions={
          <>
            <StatusBadge status={tenant.status} />
            {(tenant.status === 'TRIAL' || tenant.status === 'INACTIVE') ? <button disabled={submitting} onClick={() => void lifecycle('activate')} className={primaryButtonClass}>Activate tenant</button> : null}
            {tenant.status === 'ACTIVE' || tenant.status === 'TRIAL' ? <button disabled={submitting} onClick={() => void lifecycle('suspend')} className="inline-flex min-h-10 items-center rounded-lg border border-red-300 bg-white px-4 text-sm font-bold text-red-700 disabled:opacity-50">Suspend tenant</button> : null}
            {tenant.status === 'SUSPENDED' ? <button disabled={submitting} onClick={() => void lifecycle('reactivate')} className={primaryButtonClass}>Reactivate tenant</button> : null}
          </>
        }
      />
      {success ? <SuccessNotice message={success} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      <nav aria-label="Tenant detail sections" className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-1">
          {sections.map((item) => {
            const href = `/admin/tenants/${tenantId}/${item.key}`;
            const active = pathname === href;
            return <Link key={item.key} href={href} aria-current={active ? 'page' : undefined} className={`border-b-2 px-4 py-3 text-sm font-bold ${active ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{item.label}</Link>;
          })}
        </div>
      </nav>

      {section === 'overview' ? (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-950">Tenant identity</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ['Tenant code', tenant.code], ['Tenant type', tenant.type], ['Billing email', tenant.billingEmail],
                ['Plan', tenant.planName], ['Subscription start', tenant.subscriptionStart],
                ['Subscription end', tenant.subscriptionEnd ?? 'Monthly rolling / unspecified'],
                ['Created', new Date(tenant.createdAt).toLocaleString()], ['Updated', new Date(tenant.updatedAt).toLocaleString()],
              ].map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd></div>)}
            </dl>
          </section>
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-950">Current allocation</h2>
            <UsageBar label="Companies" {...tenant.usage.companies} />
            <UsageBar label="Users" {...tenant.usage.users} />
            <UsageBar label="Batches this month" {...tenant.usage.batches} />
            <UsageBar label="API requests / minute" {...tenant.usage.apiRequests} />
          </section>
        </div>
      ) : null}

      {section === 'subscription' ? (
        <form className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          void patch({
            planId: values.get('planId'), billingEmail: values.get('billingEmail'),
            billingCurrency: values.get('billingCurrency'), billingCycle: values.get('billingCycle'),
            subscriptionStart: values.get('subscriptionStart'),
            subscriptionEnd: values.get('subscriptionEnd') || null,
          }, 'Subscription configuration updated.');
        }}>
          <label className="text-sm font-semibold">Plan<select name="planId" defaultValue={tenant.planId} className={`${inputClass} mt-1`}>{plans.map((plan) => <option key={plan.planId} value={plan.planId}>{plan.name}</option>)}</select></label>
          <label className="text-sm font-semibold">Billing email<input name="billingEmail" type="email" defaultValue={tenant.billingEmail} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm font-semibold">Billing currency<select name="billingCurrency" defaultValue={tenant.billingCurrency} className={`${inputClass} mt-1`}><option>INR</option><option>USD</option></select></label>
          <label className="text-sm font-semibold">Billing cycle<select name="billingCycle" defaultValue={tenant.billingCycle} className={`${inputClass} mt-1`}><option>MONTHLY</option><option>QUARTERLY</option><option>ANNUAL</option><option>CUSTOM</option></select></label>
          <label className="text-sm font-semibold">Start<input name="subscriptionStart" type="date" defaultValue={tenant.subscriptionStart} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm font-semibold">End<input name="subscriptionEnd" type="date" defaultValue={tenant.subscriptionEnd ?? ''} className={`${inputClass} mt-1`} /></label>
          <div className="sm:col-span-2"><p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Commercial pricing, taxes, payment collection, retry, invoice, overage, and proration rules are unresolved and are not simulated.</p><button disabled={submitting} className={primaryButtonClass}>{submitting ? 'Saving…' : 'Update subscription'}</button></div>
        </form>
      ) : null}

      {section === 'limits' ? (
        <form className="rounded-xl border border-slate-200 bg-white p-5" onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          void patch({ limits: {
            companies: Number(values.get('companies')), users: Number(values.get('users')),
            batchesPerMonth: values.get('batches') ? Number(values.get('batches')) : null,
            apiRequestsPerMinute: Number(values.get('api')),
            storageGb: values.get('storage') ? Number(values.get('storage')) : null,
          } }, 'Tenant limits updated.');
        }}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold">Maximum companies<input name="companies" type="number" min={tenant.usage.companies.used} defaultValue={tenant.usage.companies.limit} className={`${inputClass} mt-1`} /></label>
            <label className="text-sm font-semibold">Maximum users<input name="users" type="number" min={tenant.usage.users.used} defaultValue={tenant.usage.users.limit} className={`${inputClass} mt-1`} /></label>
            <label className="text-sm font-semibold">Batches / month<input name="batches" type="number" min={tenant.usage.batches.used} defaultValue={tenant.usage.batches.limit ?? ''} className={`${inputClass} mt-1`} /></label>
            <label className="text-sm font-semibold">API requests / minute<input name="api" type="number" min={1} defaultValue={tenant.usage.apiRequests.limit} className={`${inputClass} mt-1`} /></label>
            <label className="text-sm font-semibold">Storage GB<input name="storage" type="number" min={tenant.usage.storageGb.used ?? 0} defaultValue={tenant.usage.storageGb.limit ?? ''} className={`${inputClass} mt-1`} /></label>
          </div>
          <fieldset className="mt-5"><legend className="text-sm font-bold">Feature entitlements</legend><div className="mt-2 flex flex-wrap gap-2">{tenant.features.map((feature) => <span key={feature} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{feature}</span>)}</div></fieldset>
          <button disabled={submitting} className={`${primaryButtonClass} mt-6`}>{submitting ? 'Saving…' : 'Update limits'}</button>
        </form>
      ) : null}

      {section === 'companies' ? (
        companies.length ? <div className="grid gap-3 sm:grid-cols-2">{companies.map((company) => <article key={company.companyId} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><div><h2 className="font-bold">{company.name}</h2><p className="text-xs text-slate-500">{company.code}</p></div><StatusBadge status={company.status} /></div><p className="mt-4 text-sm text-slate-600">Setup {company.setupPercentage}% · workspace {company.workspaceReady ? 'ready' : 'blocked'} · operations {company.operationsReady ? 'ready' : 'blocked'}</p></article>)}</div> : <EmptyState title="No companies" description="This tenant has not created a company workspace." />
      ) : null}
      {section === 'users' ? (
        users.length ? <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.userId}><td className="px-4 py-3"><p className="font-semibold">{user.fullName}</p><p className="text-xs text-slate-500">{user.email}</p></td><td className="px-4 py-3">{user.tenantRole.replaceAll('_', ' ')}</td><td className="px-4 py-3"><StatusBadge status={user.status} /></td></tr>)}</tbody></table></div> : <EmptyState title="No users" description="No tenant users are currently active." />
      ) : null}
      {section === 'audit' ? (
        audit.length ? <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{audit.map((item) => <article key={item.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_12rem_1fr]"><time className="text-xs text-slate-500">{new Date(item.occurredAt).toLocaleString()}</time><span className="text-xs font-bold text-blue-700">{item.action.replaceAll('_', ' ')}</span><p className="text-sm">{item.summary}</p></article>)}</div> : <EmptyState title="No tenant audit events" description="Lifecycle and configuration mutations will appear here." />
      ) : null}
      <div><Link href="/admin/tenants" className={secondaryButtonClass}>Back to tenant registry</Link></div>
    </div>
  );
}
