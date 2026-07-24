'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api-client';
import type { CompanySummary, TenantUsage } from '../../contracts/phase2';
import {
  ErrorState, LoadingState, PageHeader, inputClass, primaryButtonClass, secondaryButtonClass,
} from './common';

export function CreateCompanyForm() {
  const router = useRouter();
  const { session, refreshSession, selectContext } = useAuth();
  const tenantId = session?.activeTenantId;
  const [usage, setUsage] = useState<TenantUsage | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    api.get<TenantUsage>(`/tenants/${tenantId}/usage`)
      .then(setUsage)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Tenant limits failed to load.'));
  }, [tenantId]);

  if (!tenantId) return <ErrorState message="Select a tenant before creating a company." />;
  if (!usage && !error) return <LoadingState label="Checking company allocation…" />;
  const limitReached = Boolean(usage && usage.companies.used >= usage.companies.limit);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Tenant administration" title="Create company" description="Create a draft company and continue directly into the API-backed setup workflow." />
      {error ? <ErrorState message={error} /> : null}
      {usage ? <p className={`rounded-xl border p-4 text-sm ${limitReached ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>Company allocation: {usage.companies.used} of {usage.companies.limit} used.{limitReached ? ' Increase the tenant limit before creating another company.' : ''}</p> : null}
      <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7" onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true); setError('');
        const values = new FormData(event.currentTarget);
        try {
          const company = await api.post<CompanySummary>(`/tenants/${tenantId}/companies`, {
            code: String(values.get('code')).toUpperCase(),
            name: values.get('name'),
            type: values.get('type'),
          });
          await refreshSession();
          await selectContext(tenantId, company.companyId);
          router.push(`/${company.slug}/setup/profile`);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Company creation failed.');
        } finally {
          setSubmitting(false);
        }
      }}>
        <label className="block text-sm font-semibold">Company code<input name="code" required pattern="[A-Z0-9_]{3,30}" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''); }} className={`${inputClass} mt-1`} placeholder="VALLEY_FEED" /><span className="mt-1 block text-xs font-normal text-slate-500">Unique uppercase tenant-scoped code.</span></label>
        <label className="block text-sm font-semibold">Legal company name<input name="name" required minLength={2} className={`${inputClass} mt-1`} /></label>
        <label className="block text-sm font-semibold">Company type<select name="type" className={`${inputClass} mt-1`}><option>SOLE_PROPRIETORSHIP</option><option>PARTNERSHIP</option><option>PRIVATE_LIMITED</option><option>PUBLIC_LIMITED</option><option>COOPERATIVE</option></select></label>
        <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Creation assigns you as the permitted company administrator, creates a draft workspace, and stores setup progress in the mock repository—not browser storage.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => router.push('/console/companies')} className={secondaryButtonClass}>Cancel</button>
          <button disabled={submitting || limitReached} className={primaryButtonClass}>{submitting ? 'Creating…' : 'Create and start setup'}</button>
        </div>
      </form>
    </div>
  );
}
