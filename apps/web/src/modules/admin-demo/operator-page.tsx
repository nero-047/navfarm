'use client';

import { useCallback, useEffect, useState } from 'react';
import { Boxes, Building2, Languages, Layers3, Plus, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminShell } from './admin-shell';
import { api } from '@/lib/api-client';

const fieldClass =
  'h-11 rounded-xl border border-[#dedede] bg-white px-3 text-xs outline-none focus:border-[#1c4aa9]';

interface TenantRow { tenant_id: string; is_active: boolean }
interface NobRow { nob_id: string; nob_code: string; nob_name: string; description?: string; is_system: boolean }
interface LobRow { lob_id: string; lob_name: string }
interface LanguageRow { lang_id: string }
interface CatalogRow extends NobRow { lobs: LobRow[] }

export function OperatorPage() {
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [counts, setCounts] = useState({ tenants: 0, companies: 0, users: 0, languages: 0 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', icon: '🌱', lobs: '' });

  const load = useCallback(async () => {
    setError('');
    try {
      const [tenants, nobs, languages] = await Promise.all([
        api.get<TenantRow[]>('/tenant'),
        api.get<NobRow[]>('/setup/wizard/nobs'),
        api.get<LanguageRow[]>('/language'),
      ]);
      const activeTenants = tenants.filter((tenant) => tenant.is_active);
      const [companyLists, userLists, withLobs] = await Promise.all([
        Promise.all(activeTenants.map((tenant) => api.get<unknown[]>(`/tenant/${tenant.tenant_id}/companies`).catch(() => []))),
        Promise.all(activeTenants.map((tenant) => api.get<unknown[]>(`/tenant/${tenant.tenant_id}/users`).catch(() => []))),
        Promise.all(nobs.map(async (nob) => ({ ...nob, lobs: await api.get<LobRow[]>(`/setup/wizard/lobs/${nob.nob_id}`) }))),
      ]);
      setCatalog(withLobs);
      setCounts({
        tenants: activeTenants.length,
        companies: companyLists.reduce((sum, rows) => sum + rows.length, 0),
        users: userLists.reduce((sum, rows) => sum + rows.length, 0),
        languages: languages.length,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load platform data');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.lobs.trim()) return;
    setBusy(true);
    setError('');
    try {
      const code = form.code.trim().toUpperCase().replace(/\W+/g, '_');
      const nob = await api.post<NobRow>('/setup/wizard/nobs', {
        nob_code: code,
        nob_name: form.name.trim(),
        description: `Operator-configured ${form.name.trim()} production domain.`,
        default_costing_method: 'STANDARD',
        is_system: false,
      });
      const names = form.lobs.split(',').map((item) => item.trim()).filter(Boolean);
      await Promise.all(names.map((name, index) => api.post('/setup/wizard/lobs', {
        nob_id: nob.nob_id,
        lob_code: `${code}_${name.toUpperCase().replace(/\W+/g, '_')}`.slice(0, 50),
        lob_name: name,
        costing_method_allowed: 'STANDARD,FIFO',
        traceability_required: 'YES',
        sort_order: index + 1,
        is_system: false,
      })));
      setForm({ code: '', name: '', icon: '🌱', lobs: '' });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save business type');
    } finally {
      setBusy(false);
    }
  };

  const archive = async (item: CatalogRow) => {
    setBusy(true);
    try {
      await Promise.all(item.lobs.map((lob) => api.delete(`/setup/wizard/lobs/${lob.lob_id}`)));
      await api.delete(`/setup/wizard/nobs/${item.nob_id}`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not archive business type');
    } finally {
      setBusy(false);
    }
  };

  const metrics: Array<[string, number, LucideIcon, string]> = [
    ['Active tenants', counts.tenants, Building2, 'Live API data'],
    ['Companies', counts.companies, Boxes, 'Across active tenants'],
    ['Active users', counts.users, Users, 'Across active tenants'],
    ['Languages', counts.languages, Languages, 'English fallback'],
  ];

  return (
    <AdminShell title="Platform operator" eyebrow="Cross-tenant control plane">
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#707070]">Oversee organizations and the licensed NOB / LOB catalogue.</p>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, detail]) => (
          <div key={label} className="rounded-2xl border border-[#e7e7e7] bg-white p-5">
            <div className="flex justify-between"><div><p className="text-xs text-[#707070]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div><Icon size={19} className="text-[#1c4aa9]" /></div>
            <p className="mt-3 text-xs text-[#707070]">{detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6">
          <div className="flex items-center gap-2"><Plus size={17} className="text-[#1c4aa9]" /><h2 className="font-semibold">Add business type</h2></div>
          <p className="mt-1 text-xs leading-5 text-[#707070]">Saved directly to the global NOB and LOB masters.</p>
          <div className="mt-5 grid gap-3">
            <input className={fieldClass} placeholder="Code, e.g. FORESTRY" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className={fieldClass} placeholder="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={fieldClass} placeholder="LOBs separated by commas" value={form.lobs} onChange={(e) => setForm({ ...form, lobs: e.target.value })} />
            <button onClick={add} disabled={busy} className="h-11 rounded-xl bg-[#0b1248] text-xs font-semibold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save business type'}</button>
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white">
          <header className="border-b border-[#ededed] px-6 py-4"><div className="flex items-center gap-2"><Layers3 size={17} className="text-[#1c4aa9]" /><h2 className="font-semibold">Global NOB / LOB catalogue</h2></div><p className="mt-1 text-xs text-[#707070]">Loaded from the backend master tables.</p></header>
          <div className="divide-y divide-[#ededed]">
            {catalog.map((item) => (
              <div key={item.nob_id} className="flex items-start gap-4 px-6 py-4">
                <span className="text-xl">🌱</span>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-[#2e313f]">{item.nob_name}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">{item.is_system ? 'SYSTEM' : 'CUSTOM'}</span></div><p className="mt-1 text-xs text-[#707070]">{item.lobs.map((lob) => lob.lob_name).join(' · ') || 'No LOBs configured'}</p></div>
                {!item.is_system && <button disabled={busy} onClick={() => archive(item)} className="text-[10px] font-semibold text-[#c24332]">Archive</button>}
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-2xl border border-[#e7e7e7] bg-white p-6"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#1c4aa9]" /><h2 className="font-semibold">Backend coverage</h2></div><p className="mt-3 text-xs leading-5 text-[#707070]">Tenant administration, plans, onboarding, companies, users, roles, localization, currency, notifications, audit logs and multi-company assignments are live. Farm batches, daily operations, QC, QR, resources and accounting remain clearly marked demo workflows until matching APIs exist.</p></section>
    </AdminShell>
  );
}
