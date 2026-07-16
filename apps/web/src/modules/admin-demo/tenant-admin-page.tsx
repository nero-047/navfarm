'use client';

import Link from 'next/link';
import { BarChart3, Building2, CheckCircle2, Users } from 'lucide-react';
import { AdminShell } from './admin-shell';
import { getAllCompanies } from '@/modules/company/use-current-company';

export function TenantAdminPage() {
  const companies = Object.values(getAllCompanies());
  return <AdminShell title="Tenant administration" eyebrow="Green Valley Holdings">
    <p className="mt-2 text-sm text-[#707070]">Manage a tenant’s company portfolio, plan capacity and consolidated demo performance.</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Companies', companies.length, Building2, '8 of 10 plan limit'], ['Users', 18, Users, '18 of 25 plan limit'], ['Setup ready', companies.filter((item)=>item.setupProgress===100).length, CheckCircle2, 'Operational companies'], ['Consolidated output', '₹ 1.24Cr', BarChart3, 'Demo management value'],
    ].map(([label,value,Icon,detail]) => <div key={String(label)} className="rounded-2xl border border-[#e7e7e7] bg-white p-5"><div className="flex justify-between"><div><p className="text-xs text-[#707070]">{String(label)}</p><p className="mt-2 text-2xl font-semibold">{String(value)}</p></div><Icon size={19} className="text-[#1c4aa9]"/></div><p className="mt-3 text-xs text-[#707070]">{String(detail)}</p></div>)}</div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white"><header className="border-b border-[#ededed] px-6 py-4"><h2 className="font-semibold">Company portfolio</h2><p className="mt-1 text-xs text-[#707070]">One tenant can contain multiple legal or operating companies.</p></header><div className="divide-y divide-[#ededed]">{companies.map((company) => <div key={company.slug} className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_160px_140px_auto] sm:items-center"><div><p className="text-sm font-semibold">{company.icon} {company.name}</p><p className="mt-1 text-xs text-[#707070]">{company.location}</p></div><span className="text-xs text-[#515463]">{company.nobName}</span><span className="text-xs text-[#515463]">Setup {company.setupProgress}%</span><Link href={`/${company.slug}/dashboard`} className="text-xs font-semibold text-[#1c4aa9]">Open workspace</Link></div>)}</div></section>
  </AdminShell>;
}
