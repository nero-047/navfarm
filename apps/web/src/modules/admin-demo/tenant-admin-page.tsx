'use client';

import Link from 'next/link';
import { BarChart3, Building2, CheckCircle2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminShell } from './admin-shell';
import { getAllCompanies } from '@/modules/company/use-current-company';

export function TenantAdminPage() {
  const companies = Object.values(getAllCompanies());
  const metrics: Array<[string, string | number, LucideIcon, string]> = [
    ['Companies', companies.length, Building2, '8 of 10 plan limit'],
    ['Users', 18, Users, '18 of 25 plan limit'],
    [
      'Setup ready',
      companies.filter((item) => item.setupProgress === 100).length,
      CheckCircle2,
      'Operational companies',
    ],
    ['Consolidated output', '₹ 1.24Cr', BarChart3, 'Across all companies'],
  ];
  return (
    <AdminShell title="Organization" eyebrow="Green Valley Holdings">
      <p className="mt-2 text-sm text-[#707070]">
        Manage companies, members, plan capacity and organization-wide
        performance.
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, detail]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#e7e7e7] bg-white p-5"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-[#707070]">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
              <Icon size={19} className="text-[#1c4aa9]" />
            </div>
            <p className="mt-3 text-xs text-[#707070]">{detail}</p>
          </div>
        ))}
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white">
        <header className="border-b border-[#ededed] px-6 py-4">
          <h2 className="font-semibold">Company portfolio</h2>
          <p className="mt-1 text-xs text-[#707070]">
            Legal and operating companies managed by this organization.
          </p>
        </header>
        <div className="divide-y divide-[#ededed]">
          {companies.map((company) => (
            <div
              key={company.slug}
              className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_160px_140px_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-semibold">
                  {company.icon} {company.name}
                </p>
                <p className="mt-1 text-xs text-[#707070]">
                  {company.location}
                </p>
              </div>
              <span className="text-xs text-[#515463]">{company.nobName}</span>
              <span className="text-xs text-[#515463]">
                Setup {company.setupProgress}%
              </span>
              <Link
                href={`/${company.slug}/dashboard`}
                className="text-xs font-semibold text-[#1c4aa9]"
              >
                Open workspace
              </Link>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Organization profile</h2><p className="mt-1 text-xs text-[#707070]">Identity, plan and regional defaults</p></div><Link href="#" className="text-xs font-semibold text-[#1c4aa9]">Edit profile</Link></div><div className="mt-5 grid grid-cols-2 gap-4 text-xs">{[['Legal name','Green Valley Holdings Pvt. Ltd.'],['Organization ID','ORG-IN-00428'],['Plan','Enterprise'],['Base region','India West'],['Default currency','INR'],['Fiscal year','Apr–Mar']].map(([label,value])=><div key={label}><p className="text-[10px] uppercase tracking-wide text-[#9298a8]">{label}</p><p className="mt-1 font-semibold text-[#30364b]">{value}</p></div>)}</div></section>
        <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Organization members</h2><p className="mt-1 text-xs text-[#707070]">People with cross-company access</p></div><button className="rounded-lg bg-[#0b1248] px-3 py-2 text-xs font-semibold text-white">Invite member</button></div><div className="mt-4 divide-y divide-[#ededed]">{[['Rishi Gurung','Organization owner'],['Rajesh Sharma','Company administrator'],['Meera Iyer','Finance administrator']].map(([name,role])=><div key={name} className="flex items-center gap-3 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-[#1c4aa9]">{name.charAt(0)}</span><div className="flex-1"><p className="text-xs font-semibold text-[#30364b]">{name}</p><p className="mt-0.5 text-[10px] text-[#8a8a8a]">{role}</p></div><span className="text-[10px] font-semibold text-emerald-600">Active</span></div>)}</div></section>
      </div>
    </AdminShell>
  );
}
