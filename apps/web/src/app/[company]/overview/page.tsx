'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Building2, CheckCircle2, Landmark, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { capabilities } from '@/lib/authorization';
import { PageHeader } from '@/components/phase2/common';
import { DemoDataNotice } from '@/modules/company-admin/shared';

export default function CompanyOverviewPage() {
  const { company } = useParams<{ company: string }>();
  const { session } = useAuth();
  const membership = session?.companies.find((item) => item.companySlug === company);
  const workspaces = session?.workspaces.filter((item) => item.companyId === membership?.companyId) ?? [];
  const canManageWorkspaces = capabilities(session).canManageWorkspaces;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Company administration"
        title={membership?.companyName ?? 'Company overview'}
        description="Manage company configuration, shared master data, accounting, memberships and operational workspaces. Company administration does not require an active workspace."
        actions={<span className="nf-info-state inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-bold">Company scope</span>}
      />
      <DemoDataNotice />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Workspaces', canManageWorkspaces ? 'Manage' : String(workspaces.length), Layers],
          ['Company setup', membership?.onboardingStatus.replaceAll('_', ' ') ?? '—', Building2],
          ['Accounting', membership?.permissions.includes('finance.view') ? 'Available' : 'Restricted', Landmark],
          ['Readiness', membership?.onboardingStatus === 'COMPLETED' ? 'Configured' : 'Action required', CheckCircle2],
        ].map(([label, value, Icon]) => <section key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-blue-700" /><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{String(label)}</p><p className="mt-2 text-xl font-semibold">{String(value)}</p></section>)}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/${company}/workspaces`} className="min-h-28 rounded-2xl border border-slate-200 bg-white p-5 font-semibold shadow-sm">Manage workspaces<span className="mt-2 block text-sm font-normal text-slate-600">Configure business areas and memberships.</span></Link>
        <Link href={`/${company}/masters`} className="min-h-28 rounded-2xl border border-slate-200 bg-white p-5 font-semibold shadow-sm">Shared master data<span className="mt-2 block text-sm font-normal text-slate-600">Maintain company-level reference data.</span></Link>
        <Link href={`/${company}/accounting/readiness`} className="min-h-28 rounded-2xl border border-slate-200 bg-white p-5 font-semibold shadow-sm">Accounting readiness<span className="mt-2 block text-sm font-normal text-slate-600">Review company accounting prerequisites.</span></Link>
      </div>
    </div>
  );
}
