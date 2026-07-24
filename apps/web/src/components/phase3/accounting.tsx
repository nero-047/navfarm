'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, GitBranch, List, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../lib/authorization';
import { api } from '../../lib/api-client';
import type {
  Account, CostingConfiguration, GlMapping, OperationsReadiness,
} from '../../contracts/phase3';
import {
  ErrorState, LoadingState, PageHeader, StatusBadge, inputClass,
  primaryButtonClass, secondaryButtonClass,
} from '../phase2/common';

function useAccountingCompany(companySlug: string) {
  const { session } = useAuth();
  const membership = session?.companies.find((item) => item.companySlug === companySlug);
  return {
    companyId: membership?.companyId,
    canView: can(session, 'finance.view') || can(session, 'company.manage'),
    canManage: can(session, 'finance.manage') || can(session, 'company.manage'),
  };
}

export function ChartOfAccountsView({ companySlug, accountId, create = false }: { companySlug: string; accountId?: string; create?: boolean }) {
  const { companyId, canManage } = useAccountingCompany(companySlug);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mode, setMode] = useState<'TREE' | 'FLAT'>('TREE');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({
    code: '', name: '', accountType: 'ASSET', category: 'CURRENT_ASSET',
    normalBalance: 'DEBIT', parentAccountId: null as string | null, posting: true,
    currency: 'INR' as string | null,
  });
  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const rows = await api.get<Account[]>(`/companies/${companyId}/accounting/accounts`);
      setAccounts(rows);
      const selected = accountId ? rows.find((row) => row.accountId === accountId) : undefined;
      if (selected) setDraft({
        code: selected.code, name: selected.name, accountType: selected.accountType,
        category: selected.category, normalBalance: selected.normalBalance,
        parentAccountId: selected.parentAccountId, posting: selected.posting, currency: selected.currency,
      });
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chart of accounts failed to load.'); }
  }, [accountId, companyId]);
  useEffect(() => { void load(); }, [load]);
  const save = async () => {
    if (!companyId) return;
    try {
      if (accountId) await api.patch(`/companies/${companyId}/accounting/accounts/${accountId}`, draft);
      else await api.post(`/companies/${companyId}/accounting/accounts`, draft);
      window.location.assign(`/${companySlug}/accounting/chart-of-accounts`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Account could not be saved.'); }
  };
  if (!accounts.length && !error && !create) return <LoadingState label="Loading chart of accounts…" />;
  const form = create || accountId;
  const shown = accounts.filter((account) => !search || `${account.code} ${account.name}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Accounting configuration" title={form ? accountId ? 'Account detail' : 'Create account' : 'Chart of accounts'} description="Hierarchical company accounts used by GL mappings. No journals are generated or posted in Phase 3." />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {form ? (
        <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account code"><input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} className={inputClass} /></Field>
            <Field label="Account name"><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={inputClass} /></Field>
            <Field label="Account type"><select value={draft.accountType} onChange={(event) => setDraft({ ...draft, accountType: event.target.value })} className={inputClass}>{['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'CONTRA_ASSET'].map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field label="Parent account"><select value={draft.parentAccountId ?? ''} onChange={(event) => setDraft({ ...draft, parentAccountId: event.target.value || null })} className={inputClass}><option value="">No parent</option>{accounts.filter((account) => account.accountId !== accountId && account.status === 'ACTIVE').map((account) => <option key={account.accountId} value={account.accountId}>{account.code} — {account.name}</option>)}</select></Field>
            <Field label="Category"><input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className={inputClass} /></Field>
            <Field label="Normal balance"><select value={draft.normalBalance} onChange={(event) => setDraft({ ...draft, normalBalance: event.target.value })} className={inputClass}><option>DEBIT</option><option>CREDIT</option></select></Field>
          </div>
          <div className="mt-5 flex gap-3"><button disabled={!canManage} onClick={() => void save()} className={primaryButtonClass}>Save account</button><Link href={`/${companySlug}/accounting/chart-of-accounts`} className={secondaryButtonClass}>Cancel</Link></div>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row"><input aria-label="Search accounts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search account…" className={`${inputClass} sm:max-w-sm`} /><div className="flex-1" /><button onClick={() => setMode(mode === 'TREE' ? 'FLAT' : 'TREE')} className={secondaryButtonClass}>{mode === 'TREE' ? <List className="h-4 w-4" /> : <GitBranch className="h-4 w-4" />} {mode === 'TREE' ? 'Flat view' : 'Tree view'}</button>{canManage ? <Link href={`/${companySlug}/accounting/chart-of-accounts/new`} className={primaryButtonClass}><Plus className="h-4 w-4" /> Add account</Link> : null}</div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Account</th><th className="p-4">Type</th><th className="p-4">Parent</th><th className="p-4">Posting</th><th className="p-4">Status</th></tr></thead><tbody>{shown.map((account) => <tr key={account.accountId} className="border-t border-slate-100"><td className="p-4" style={{ paddingLeft: mode === 'TREE' && account.parentAccountId ? '2.5rem' : '1rem' }}><Link href={`/${companySlug}/accounting/chart-of-accounts/${account.accountId}`} className="font-bold text-blue-800"><span className="font-mono">{account.code}</span> — {account.name}</Link></td><td className="p-4">{account.accountType}</td><td className="p-4 text-slate-500">{accounts.find((row) => row.accountId === account.parentAccountId)?.code ?? 'Root'}</td><td className="p-4">{account.posting ? 'Posting' : 'Header'}</td><td className="p-4"><StatusBadge status={account.status} /></td></tr>)}</tbody></table></div></div>
        </>
      )}
    </div>
  );
}

export function GlMappingsView({ companySlug }: { companySlug: string }) {
  const { companyId, canManage } = useAccountingCompany(companySlug);
  const [mappings, setMappings] = useState<GlMapping[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [nextMappings, nextAccounts] = await Promise.all([
        api.get<GlMapping[]>(`/companies/${companyId}/accounting/gl-mappings`),
        api.get<Account[]>(`/companies/${companyId}/accounting/accounts`),
      ]);
      setMappings(nextMappings); setAccounts(nextAccounts); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'GL mappings failed to load.'); }
  }, [companyId]);
  useEffect(() => { void load(); }, [load]);
  const requiredEvents = ['GRN_IN', 'CONSUMPTION_OUT', 'PRODUCTION_OUTPUT', 'MORTALITY', 'WASTAGE', 'PRICE_VARIANCE', 'USAGE_VARIANCE', 'OUTPUT_VARIANCE'];
  const completeness = Math.round((new Set(mappings.filter((item) => item.status === 'ACTIVE').map((item) => item.eventType)).size / requiredEvents.length) * 100);
  const add = async () => {
    if (!companyId || !accounts[0] || !accounts[2]) return;
    try {
      const eventType = requiredEvents.find((event) => !mappings.some((mapping) => mapping.eventType === event)) ?? 'GRN_IN';
      await api.post(`/companies/${companyId}/accounting/gl-mappings`, {
        eventType, companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler',
        inventoryAccountId: accounts[0].accountId, consumptionAccountId: accounts[2].accountId,
        outputAccountId: null, varianceAccountId: null, wastageMortalityAccountId: null,
        debitPreview: accounts[2].name, creditPreview: accounts[0].name,
      });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'GL mapping could not be created.'); }
  };
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Accounting configuration" title="GL mapping matrix" description="Mappings are configuration previews only. The future backend remains responsible for generating and balancing journals." />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span><h2 className="font-black">Mapping completeness</h2><p className="text-sm text-slate-500">{mappings.length} configured of {requiredEvents.length} documented event types</p></span><strong className="text-3xl text-blue-800">{completeness}%</strong></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${completeness}%` }} /></div></section>
      {canManage ? <button onClick={() => void add()} className={primaryButtonClass}><Plus className="h-4 w-4" /> Add next missing mapping</button> : null}
      <div className="grid gap-4 lg:grid-cols-2">{requiredEvents.map((event) => {
        const mapping = mappings.find((item) => item.eventType === event);
        return <article key={event} className={`rounded-xl border bg-white p-5 shadow-sm ${mapping ? 'border-slate-200' : 'border-amber-200'}`}><div className="flex justify-between"><h2 className="font-mono font-black">{event}</h2><StatusBadge status={mapping ? mapping.status : 'MISSING'} /></div>{mapping ? <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm"><div className="rounded-lg bg-emerald-50 p-3"><span className="text-xs text-emerald-700">Debit preview</span><p className="font-bold">{mapping.debitPreview}</p></div><span>↔</span><div className="rounded-lg bg-blue-50 p-3"><span className="text-xs text-blue-700">Credit preview</span><p className="font-bold">{mapping.creditPreview}</p></div></div> : <p className="mt-3 flex items-center gap-2 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" /> Required mapping is missing.</p>}</article>;
      })}</div>
    </div>
  );
}

export function CostingView({ companySlug }: { companySlug: string }) {
  const { companyId, canManage } = useAccountingCompany(companySlug);
  const [config, setConfig] = useState<CostingConfiguration | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!companyId) return;
    try { setConfig(await api.get(`/companies/${companyId}/accounting/costing`)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Costing configuration failed to load.'); }
  }, [companyId]);
  useEffect(() => { void load(); }, [load]);
  const save = async (method: CostingConfiguration['method']) => {
    if (!companyId || !config) return;
    try {
      setConfig(await api.patch(`/companies/${companyId}/accounting/costing`, {
        ...config, method, standardCostReady: method === 'STANDARD' ? config.standardCostReady : true,
        explanation: method === 'FIFO' ? 'FIFO consumes the oldest available inventory layer first.' : method === 'STANDARD' ? 'STANDARD uses configured standard costs and variance mappings.' : 'BIO_ASSET requires documented biological-asset measurement policy.',
      })); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Costing configuration could not be saved.'); }
  };
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Accounting configuration" title="Costing policy" description="Configure the documented method by LOB. Phase 3 validates prerequisites but does not calculate cost or post journals." />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!config ? <LoadingState label="Loading costing configuration…" /> : <div className="grid gap-4 md:grid-cols-3">{([
        ['STANDARD', 'Standard costs plus price, usage and output variance mappings.'],
        ['FIFO', 'Oldest inventory lot or layer is consumed first.'],
        ['BIO_ASSET', 'Biological-asset measurement policy and applicable accounts are required.'],
      ] as const).map(([method, description]) => <button disabled={!canManage} onClick={() => void save(method)} key={method} className={`rounded-xl border p-5 text-left shadow-sm ${config.method === method ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}><div className="flex justify-between"><h2 className="font-black">{method}</h2>{config.method === method ? <CheckCircle2 className="h-5 w-5 text-blue-700" /> : null}</div><p className="mt-3 text-sm text-slate-600">{description}</p><p className="mt-4 text-xs font-bold text-slate-500">{method === 'STANDARD' ? config.standardCostReady ? 'Prerequisites ready' : 'Prerequisites incomplete' : 'Configuration supported'}</p></button>)}</div>}
    </div>
  );
}

export function AccountingReadinessView({ companySlug }: { companySlug: string }) {
  const { companyId } = useAccountingCompany(companySlug);
  const [status, setStatus] = useState<OperationsReadiness | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!companyId) return;
    try { setStatus(await api.get(`/companies/${companyId}/accounting/readiness`)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Readiness failed to load.'); }
  }, [companyId]);
  useEffect(() => { void load(); }, [load]);
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Operations gate" title="Configuration readiness" description="Readiness is recalculated from Phase 3 resources, not browser storage or onboarding checkboxes." />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!status ? <LoadingState label="Calculating readiness…" /> : <>
        <section className={`rounded-xl border p-6 ${status.operationsReady ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><span><h2 className="text-xl font-black">{status.operationsReady ? 'Operations ready' : 'Operations blocked'}</h2><p className="mt-1 text-sm">{status.operationsReady ? 'All confirmed prerequisites are configured.' : `${status.blockingRequirements.length} requirements still block operational writes.`}</p></span><strong className="text-5xl">{status.percentage}%</strong></div></section>
        <div className="grid gap-3">{status.blockingRequirements.map((blocker) => <Link key={blocker.code} href={blocker.href.replace(`/${companyId}/`, `/${companySlug}/`)} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><span><strong>{blocker.label}</strong><br /><span className="text-xs text-slate-500">{blocker.code}</span></span></span><span className="font-bold text-blue-700">Resolve →</span></Link>)}</div>
        {status.warnings.map((warning) => <p key={warning} className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{warning}</p>)}
      </>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}<div className="mt-1">{children}</div></label>;
}
