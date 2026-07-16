'use client';

import { useState } from 'react';
import { Boxes, Building2, Languages, Layers3, Plus, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminShell } from './admin-shell';
import { getNobCatalog, removeCustomNob, saveCustomNob, NOB_OPTIONS, type NobOption } from '@/modules/company';

const fieldClass = 'h-11 rounded-xl border border-[#dedede] bg-white px-3 text-xs outline-none focus:border-[#1c4aa9]';

export function OperatorPage() {
  const [catalog, setCatalog] = useState<NobOption[]>(() => getNobCatalog());
  const [form, setForm] = useState({ code: '', name: '', icon: '🌱', lobs: '' });
  const metrics: Array<[string, string, LucideIcon, string]> = [
    ['Active tenants', '6', Building2, '1 trial'],
    ['Companies', '8', Boxes, 'Across 6 NOBs'],
    ['Active users', '42', Users, 'Plan capacity 75'],
    ['Languages', '16', Languages, 'English fallback'],
  ];
  const add = () => {
    if (!form.code.trim() || !form.name.trim() || !form.lobs.trim()) return;
    const option: NobOption = { code: form.code.trim().toUpperCase().replace(/\W+/g, '_'), name: form.name.trim(), icon: form.icon || '🌱', description: `Operator-configured ${form.name.trim()} production domain.`, lobs: form.lobs.split(',').map((item) => item.trim()).filter(Boolean) };
    saveCustomNob(option); setCatalog(getNobCatalog()); setForm({ code: '', name: '', icon: '🌱', lobs: '' });
  };
  return <AdminShell title="Platform operator" eyebrow="Cross-tenant control plane">
    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#707070]">Frontend-only simulation for tenant oversight, subscriptions, global catalogues and configuration templates. It does not change a backend or bill customers.</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, Icon, detail]) => <div key={label} className="rounded-2xl border border-[#e7e7e7] bg-white p-5"><div className="flex justify-between"><div><p className="text-xs text-[#707070]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1c4aa9]"><Icon size={18}/></div></div><p className="mt-3 text-xs text-[#707070]">{detail}</p></div>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
      <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6"><div className="flex items-center gap-2"><Plus size={17} className="text-[#1c4aa9]"/><h2 className="font-semibold">Add NOB configuration</h2></div><p className="mt-1 text-xs leading-5 text-[#707070]">New types become available in company creation with a safe generic production workflow.</p><div className="mt-5 grid gap-3"><input className={fieldClass} placeholder="Code, e.g. FORESTRY" value={form.code} onChange={(e) => setForm({...form, code:e.target.value})}/><input className={fieldClass} placeholder="Display name" value={form.name} onChange={(e) => setForm({...form, name:e.target.value})}/><input className={fieldClass} placeholder="Icon" value={form.icon} onChange={(e) => setForm({...form, icon:e.target.value})}/><input className={fieldClass} placeholder="LOBs separated by commas" value={form.lobs} onChange={(e) => setForm({...form, lobs:e.target.value})}/><button onClick={add} className="h-11 rounded-xl bg-[#0b1248] text-xs font-semibold text-white">Save to demo catalogue</button></div></section>
      <section className="overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white"><header className="border-b border-[#ededed] px-6 py-4"><div className="flex items-center gap-2"><Layers3 size={17} className="text-[#1c4aa9]"/><h2 className="font-semibold">Global NOB / LOB catalogue</h2></div><p className="mt-1 text-xs text-[#707070]">Versionable catalogue boundary described by nob_lob_extension_config.</p></header><div className="divide-y divide-[#ededed]">{catalog.map((item) => { const custom = !NOB_OPTIONS.some((seed) => seed.code === item.code); return <div key={item.code} className="flex items-start gap-4 px-6 py-4"><span className="text-xl">{item.icon}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-[#2e313f]">{item.name}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${custom ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>{custom ? 'CUSTOM' : 'SYSTEM'}</span></div><p className="mt-1 text-xs text-[#707070]">{item.lobs.join(' · ')}</p></div>{custom && <button onClick={() => { removeCustomNob(item.code); setCatalog(getNobCatalog()); }} className="text-[10px] font-semibold text-[#c24332]">Archive</button>}</div>; })}</div></section>
    </div>
    <section className="mt-6 rounded-2xl border border-[#e7e7e7] bg-white p-6"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#1c4aa9]"/><h2 className="font-semibold">Operator template domains</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['Plans & feature limits','Costing methods','Scheduler & KPI templates','QC, QR & GL templates'].map((item) => <div key={item} className="rounded-xl border border-[#ededed] p-4 text-xs font-semibold text-[#515463]">{item}<p className="mt-2 text-[10px] font-normal text-[#8a8a8a]">Demo configuration surface</p></div>)}</div></section>
  </AdminShell>;
}
