'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Building2, CheckCircle2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminShell } from './admin-shell';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import { fetchTenantCompanies } from '@/modules/company';
import { saveApiCompanies } from '@/modules/company/use-current-company';
import type { CompanyMeta } from '@/modules/company';

interface TenantDetails {
  tenant_id: string;
  tenant_code: string;
  tenant_name: string;
  tenant_type: string;
  plan_id: string;
  max_companies: number;
  max_users: number;
  billing_email: string;
  subscription?: { plan_code?: string; support_tier?: string };
}

interface UserRow {
  userId?: string;
  user_id?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  userType?: string;
  user_type?: string;
  is_active?: boolean;
}

export function TenantAdminPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [companies, setCompanies] = useState<CompanyMeta[]>([]);
  const [members, setMembers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.tenantId) return;
    Promise.all([
      api.get<TenantDetails>(`/tenant/${user.tenantId}`),
      fetchTenantCompanies(user.tenantId),
      api.get<UserRow[]>('/auth/users'),
    ])
      .then(([tenantDetails, companyRows, userRows]) => {
        setTenant(tenantDetails);
        setCompanies(companyRows);
        saveApiCompanies(companyRows);
        setMembers(userRows);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load organization'));
  }, [user?.tenantId]);

  const metrics: Array<[string, string | number, LucideIcon, string]> = [
    ['Companies', companies.length, Building2, tenant ? `${companies.length} of ${tenant.max_companies} plan limit` : 'Loading plan'],
    ['Users', members.length, Users, tenant ? `${members.length} of ${tenant.max_users} plan limit` : 'Loading plan'],
    ['Setup ready', companies.filter((item) => item.setupProgress === 100).length, CheckCircle2, 'Operational companies'],
    ['Backend status', tenant ? 'Live' : 'Loading', BarChart3, 'Tenant-scoped API'],
  ];

  return (
    <AdminShell title="Organization" eyebrow={tenant?.tenant_name || 'Tenant workspace'}>
      <p className="mt-2 text-sm text-[#707070]">Manage companies, members and plan capacity using tenant-scoped backend data.</p>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, detail]) => (
          <div key={label} className="rounded-2xl border border-[#e7e7e7] bg-white p-5"><div className="flex justify-between"><div><p className="text-xs text-[#707070]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div><Icon size={19} className="text-[#1c4aa9]" /></div><p className="mt-3 text-xs text-[#707070]">{detail}</p></div>
        ))}
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white">
        <header className="border-b border-[#ededed] px-6 py-4"><h2 className="font-semibold">Company portfolio</h2><p className="mt-1 text-xs text-[#707070]">Active companies returned by the API.</p></header>
        <div className="divide-y divide-[#ededed]">
          {companies.length === 0 && <p className="px-6 py-5 text-xs text-[#707070]">No operating companies yet. Create one from Company workspaces.</p>}
          {companies.map((company) => (
            <div key={company.slug} className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_160px_140px_auto] sm:items-center"><div><p className="text-sm font-semibold">{company.icon} {company.name}</p><p className="mt-1 text-xs text-[#707070]">{company.location}</p></div><span className="text-xs text-[#515463]">{company.nobName}</span><span className="text-xs text-[#515463]">Setup {company.setupProgress}%</span><Link href={`/${company.slug}/dashboard`} className="text-xs font-semibold text-[#1c4aa9]">Open workspace</Link></div>
          ))}
        </div>
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6"><h2 className="font-semibold">Organization profile</h2><p className="mt-1 text-xs text-[#707070]">Identity and subscription from tenant master.</p><div className="mt-5 grid grid-cols-2 gap-4 text-xs">{[['Legal name',tenant?.tenant_name || 'Loading…'],['Workspace code',tenant?.tenant_code || '—'],['Tenant type',tenant?.tenant_type || '—'],['Plan',tenant?.subscription?.plan_code || tenant?.plan_id || '—'],['Billing email',tenant?.billing_email || '—'],['Support tier',tenant?.subscription?.support_tier || '—']].map(([label,value])=><div key={label}><p className="text-[10px] uppercase tracking-wide text-[#9298a8]">{label}</p><p className="mt-1 font-semibold text-[#30364b]">{value}</p></div>)}</div></section>
        <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6"><h2 className="font-semibold">Organization members</h2><p className="mt-1 text-xs text-[#707070]">Users from the active tenant database.</p><div className="mt-4 divide-y divide-[#ededed]">{members.map((member)=><div key={member.userId || member.user_id || member.email} className="flex items-center gap-3 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-[#1c4aa9]">{(member.fullName || member.full_name || member.email).charAt(0)}</span><div className="flex-1"><p className="text-xs font-semibold text-[#30364b]">{member.fullName || member.full_name || member.email}</p><p className="mt-0.5 text-[10px] text-[#8a8a8a]">{member.userType || member.user_type || 'User'} · {member.email}</p></div><span className={`text-[10px] font-semibold ${member.is_active === false ? 'text-slate-500' : 'text-emerald-600'}`}>{member.is_active === false ? 'Inactive' : 'Active'}</span></div>)}</div></section>
      </div>
    </AdminShell>
  );
}
