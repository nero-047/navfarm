'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api-client';
import type { CompanySummary } from '../../contracts/phase2';
import { ErrorState, LoadingState, PageHeader, StatusBadge, primaryButtonClass, secondaryButtonClass } from './common';

export function TenantCompanyDetail({ companyId }: { companyId: string }) {
  const { session } = useAuth();
  const tenantId = session?.activeTenantId;
  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!tenantId) return;
    api.get<CompanySummary[]>(`/tenants/${tenantId}/companies`)
      .then((items) => {
        const match = items.find((item) => item.companyId === companyId);
        if (!match) throw new Error('Company not found in the active tenant.');
        setCompany(match);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Company details failed to load.'));
  }, [companyId, tenantId]);
  if (!company && !error) return <LoadingState label="Loading company details…" />;
  if (!company) return <div className="p-6"><ErrorState message={error} /></div>;
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow={company.code} title={company.name} description="Tenant-level company readiness and configuration summary." actions={<StatusBadge status={company.status} />} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Readiness</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-slate-500">Setup completion</dt><dd className="font-black">{company.setupPercentage}%</dd></div>
            <div><dt className="text-xs text-slate-500">Administrator</dt><dd className="font-semibold">{company.primaryAdministrator ?? 'Unassigned'}</dd></div>
            <div><dt className="text-xs text-slate-500">Workspace</dt><dd>{company.workspaceReady ? 'Ready' : 'Blocked'}</dd></div>
            <div><dt className="text-xs text-slate-500">Operations</dt><dd>{company.operationsReady ? 'Ready' : 'Blocked'}</dd></div>
          </dl>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Enabled configuration</h2>
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Nature of business</p>
          <p className="mt-1 text-sm">{company.enabledNobs.join(', ') || 'Not configured'}</p>
          <p className="mt-4 text-xs font-bold uppercase text-slate-500">Modules</p>
          <p className="mt-1 text-sm">{company.enabledModules.join(', ') || 'Not configured'}</p>
        </section>
      </div>
      <div className="flex flex-wrap gap-2"><Link href="/console/companies" className={secondaryButtonClass}>Back to companies</Link>{company.status === 'DRAFT' ? <Link href={`/${company.slug}/setup`} className={primaryButtonClass}>Continue onboarding</Link> : <Link href={`/${company.slug}/dashboard`} className={primaryButtonClass}>Open workspace</Link>}</div>
    </div>
  );
}
