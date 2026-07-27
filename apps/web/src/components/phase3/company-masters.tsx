'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Download, FileUp, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../lib/authorization';
import { api } from '../../lib/api-client';
import {
  type CompanyLob, type CompanyNob, type ImportPreview, type MasterDashboard, type MasterResource,
} from '../../contracts/phase3';
import { ErrorState, LoadingState, PageHeader, StatusBadge, inputClass, primaryButtonClass, secondaryButtonClass } from '../phase2/common';

const resourceLabels: Record<MasterResource, string> = {
  uoms: 'Units of measure', 'uom-conversions': 'UOM conversions', 'item-categories': 'Item categories',
  items: 'Items', attributes: 'Item attributes', breeds: 'Breeds', locations: 'Locations',
  resources: 'Resources', 'operational-parameters': 'Operational parameters', 'qc-parameters': 'QC parameters',
};

function useCompany(companySlug: string) {
  const { session } = useAuth();
  const membership = session?.companies.find((item) => item.companySlug === companySlug);
  return { companyId: membership?.companyId, editable: can(session, 'company.manage') };
}

export function MasterDashboardView({ companySlug }: { companySlug: string }) {
  const { companyId } = useCompany(companySlug);
  const [dashboard, setDashboard] = useState<MasterDashboard | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!companyId) return;
    try { setDashboard(await api.get(`/companies/${companyId}/masters`)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Master dashboard failed to load.'); }
  }, [companyId]);
  useEffect(() => { void load(); }, [load]);
  if (!dashboard && !error) return <LoadingState label="Loading company master data…" />;
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Company configuration" title="Master-data dashboard" description="Stable company-owned reference records used by future batches, inventory, QC and costing APIs." />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboard?.categories.map((category) => (
          <Link key={category.resource} href={`/${companySlug}/masters/${category.resource}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
            <div className="flex items-start justify-between gap-3"><h2 className="font-black text-slate-950">{category.label}</h2><StatusBadge status={category.configured ? 'CONFIGURED' : 'BLOCKED'} /></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><span className="text-xs text-slate-500">Total</span><p className="font-black">{category.total}</p></div><div><span className="text-xs text-slate-500">Active</span><p className="font-black text-emerald-700">{category.active}</p></div><div><span className="text-xs text-slate-500">Inactive</span><p className="font-black">{category.inactive}</p></div></div>
            {category.blockingIssues[0] ? <p className="mt-3 flex gap-2 text-xs text-amber-800"><AlertTriangle className="h-4 w-4 shrink-0" />{category.blockingIssues[0]}</p> : <p className="mt-3 flex gap-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />Ready for use</p>}
            <p className="mt-4 text-xs text-slate-500">{category.canManage ? 'Manage permitted' : 'Read only'} · {category.importAvailable ? 'Import available' : 'Manual entry only'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

type MasterList = { resource: MasterResource; records: Array<Record<string, unknown>>; page: number; pageSize: number; total: number };
const defaults: Record<MasterResource, Record<string, unknown>> = {
  uoms: { code: '', name: '', symbol: '', decimalPlaces: 2 },
  'uom-conversions': { code: '', name: '', fromUomId: 'uom-bag', toUomId: 'uom-kg', itemId: null, factor: '1.00000000', effectiveFrom: '2026-07-24' },
  'item-categories': { code: '', name: '', parentCategoryId: null },
  items: { code: '', name: '', categoryId: 'category-feed', primaryUomId: 'uom-kg', secondaryUomId: null, itemType: 'CONSUMABLE', companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler', valuationMethod: 'FIFO', standardCost: null, lotTracking: true },
  attributes: { code: '', name: '', dataType: 'TEXT', unitUomId: null, allowedValues: [], mandatory: false, affectsCosting: false, companyNobId: null, companyLobId: null },
  breeds: { code: '', name: '', species: '', companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler' },
  locations: { code: '', name: '', locationType: 'FARM', parentLocationId: null },
  resources: { code: '', name: '', resourceType: 'MANPOWER', costPerUnit: '0.0000', costUomId: 'uom-kg', currency: 'INR', companyNobId: null, companyLobId: null },
  'operational-parameters': { code: '', name: '', parameterType: 'DESCRIPTIVE', entryTypeCode: 'DESCRIPTIVE', defaultUomId: 'uom-kg', defaultQuantityPerUnit: null, companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler', itemId: null, resourceId: null, essential: true },
  'qc-parameters': { code: '', name: '', resultType: 'NUMERIC', uomId: 'uom-kg', minValue: '0', maxValue: '100', passCriteria: '', companyLobId: 'company-lob-broiler', mandatory: true, essential: true },
};

export function MasterResourceView({ companySlug, resource }: { companySlug: string; resource: MasterResource }) {
  const { companyId, editable } = useCompany(companySlug);
  const [list, setList] = useState<MasterList | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...defaults[resource] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      setList(await api.get(`/companies/${companyId}/masters/${resource}?${params}`)); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Master records failed to load.'); }
  }, [companyId, resource, search, status]);
  useEffect(() => { void load(); }, [load]);
  const columns = useMemo(() => resource === 'items'
    ? ['code', 'name', 'itemType', 'primaryUomId', 'valuationMethod', 'status']
    : ['code', 'name', ...Object.keys(defaults[resource]).filter((key) => !['code', 'name'].includes(key)).slice(0, 2), 'status'], [resource]);
  const save = async () => {
    if (!companyId) return;
    try {
      if (editingId) await api.patch(`/companies/${companyId}/masters/${resource}/${editingId}`, draft);
      else await api.post(`/companies/${companyId}/masters/${resource}`, draft);
      setSuccess(`${resourceLabels[resource]} record ${editingId ? 'updated' : 'created'}.`);
      setShowForm(false); setEditingId(null); setDraft({ ...defaults[resource] }); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Record could not be created.'); }
  };
  const toggle = async (record: Record<string, unknown>) => {
    if (!companyId) return;
    try {
      const action = record.status === 'ACTIVE' ? 'deactivate' : 'activate';
      await api.post(`/companies/${companyId}/masters/${resource}/${record.id}/${action}`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Status could not be changed.'); }
  };
  const exportData = async () => {
    if (!companyId) return;
    try {
      const exported = await api.get<{ filename: string; contentType: string; content: string }>(
        `/companies/${companyId}/masters/${resource}/export`,
      );
      const url = URL.createObjectURL(new Blob([exported.content], { type: exported.contentType }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exported.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Export could not be prepared.'); }
  };
  const edit = (record: Record<string, unknown>) => {
    setEditingId(String(record.id));
    setDraft(Object.fromEntries(Object.keys(defaults[resource]).map((key) => [key, record[key]])));
    setShowForm(true);
    setSuccess('');
  };
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Company masters" title={resourceLabels[resource]} description="Company-owned, stable-ID records. Records are deactivated instead of permanently deleted." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input aria-label="Search masters" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code or name…" className={`${inputClass} sm:max-w-sm`} />
        <select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClass} sm:max-w-48`}><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option></select>
        <div className="flex-1" />
        <button onClick={() => void exportData()} className={secondaryButtonClass}><Download className="h-4 w-4" /> Export CSV</button>
        <Link href={`/${companySlug}/masters/${resource}/import`} className={secondaryButtonClass}><FileUp className="h-4 w-4" /> Import</Link>
        {editable ? <button onClick={() => { setEditingId(null); setDraft({ ...defaults[resource] }); setShowForm((value) => !value); }} className={primaryButtonClass}><Plus className="h-4 w-4" /> Add record</button> : null}
      </div>
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p> : null}
      {showForm ? <MasterForm resource={resource} editing={Boolean(editingId)} draft={draft} setDraft={setDraft} onSave={() => void save()} onCancel={() => { setShowForm(false); setEditingId(null); }} /> : null}
      {!list ? <LoadingState label="Loading records…" /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columns.map((column) => <th key={column} className="p-4">{column.replaceAll(/([A-Z])/g, ' $1')}</th>)}<th className="sticky right-0 bg-slate-50 p-4 shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">Actions</th></tr></thead>
            <tbody>{list.records.map((record) => <tr key={String(record.id)} className="border-t border-slate-100">{columns.map((column) => <td key={column} className={`p-4 ${column === 'code' ? 'font-mono font-bold' : ''}`}>{column === 'status' ? <StatusBadge status={String(record[column])} /> : formatCell(record[column])}</td>)}<td className="sticky right-0 bg-white p-4 shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">{editable ? <span className="flex gap-3"><button className="text-xs font-bold text-blue-700" onClick={() => edit(record)}>View / edit</button><button className="text-xs font-bold text-blue-700" onClick={() => void toggle(record)}>{record.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</button></span> : <span className="text-xs text-slate-400">Read only</span>}</td></tr>)}</tbody>
          </table></div>
          {!list.records.length ? <p className="p-8 text-center text-sm text-slate-500">No records match the current filters.</p> : null}
          <div className="border-t border-slate-100 p-3 text-xs text-slate-500">Showing {list.records.length} of {list.total} records</div>
        </div>
      )}
    </div>
  );
}

function MasterForm({ resource, editing, draft, setDraft, onSave, onCancel }: { resource: MasterResource; editing: boolean; draft: Record<string, unknown>; setDraft: (value: Record<string, unknown>) => void; onSave: () => void; onCancel: () => void }) {
  const fields = Object.keys(draft);
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
      <h2 className="font-black">{editing ? 'View / edit' : 'Create'} {resourceLabels[resource].toLowerCase()} record</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => <label key={field} className="text-xs font-bold uppercase tracking-wide text-slate-600">{field.replaceAll(/([A-Z])/g, ' $1')}<input value={draft[field] === null ? '' : Array.isArray(draft[field]) ? (draft[field] as string[]).join(',') : String(draft[field])} onChange={(event) => {
          const current = draft[field];
          const value = typeof current === 'boolean'
            ? event.target.value === 'true'
            : typeof current === 'number'
              ? Number(event.target.value)
              : Array.isArray(current)
                ? event.target.value.split(',').map((item) => item.trim()).filter(Boolean)
                : event.target.value || null;
          setDraft({ ...draft, [field]: value });
        }} className={`${inputClass} mt-1 normal-case`} /></label>)}
      </div>
      <div className="mt-5 flex gap-3"><button onClick={onSave} className={primaryButtonClass}>Save record</button><button onClick={onCancel} className={secondaryButtonClass}>Cancel</button></div>
    </section>
  );
}
function formatCell(value: unknown) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function BusinessStructureView({ companySlug }: { companySlug: string }) {
  const { companyId, editable } = useCompany(companySlug);
  const [structure, setStructure] = useState<{ completeness: number; blockingIssues: string[]; nobs: CompanyNob[]; lobs: CompanyLob[] } | null>(null);
  const [templates, setTemplates] = useState<Array<{ lobTemplateId: string; nobTemplateId: string; code: string; name: string; defaultCostingMethod: string }>>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const next = await api.get<typeof structure>(`/companies/${companyId}/business-structure`);
      setStructure(next);
      // Company users do not need platform-master permission; eligible template metadata
      // is already represented by the seeded RAK-backed company workflow.
      setTemplates([
        { lobTemplateId: 'lob-rearing', nobTemplateId: 'nob-poultry', code: 'PLT_REARING', name: 'Rearing & Breeding', defaultCostingMethod: 'STANDARD' },
        { lobTemplateId: 'lob-slaughter', nobTemplateId: 'nob-poultry', code: 'PLT_SLAUGHTER', name: 'Poultry Slaughter', defaultCostingMethod: 'FIFO' },
      ]);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Business structure failed to load.'); }
  }, [companyId]);
  useEffect(() => { void load(); }, [load]);
  const addLob = async (template: (typeof templates)[number]) => {
    if (!companyId || !structure?.nobs[0]) return;
    try {
      await api.post(`/companies/${companyId}/lobs`, { lobTemplateId: template.lobTemplateId, companyNobId: structure.nobs[0].companyNobId, costingMethod: template.defaultCostingMethod });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'LOB could not be enabled.'); }
  };
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Company settings" title="NOB & LOB business structure" description="Platform templates are enabled into company-owned records with stable IDs, independent status and audit history." />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!structure ? <LoadingState label="Loading business structure…" /> : <>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-black">Setup completeness</h2><strong className="text-2xl text-blue-800">{structure.completeness}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-700" style={{ width: `${structure.completeness}%` }} /></div>{structure.blockingIssues.map((issue) => <p key={issue} className="mt-2 text-sm text-amber-800">{issue}</p>)}</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Enabled NOBs</h2>{structure.nobs.map((nob) => <article key={nob.companyNobId} className="mt-4 rounded-lg border border-slate-200 p-4"><div className="flex justify-between"><span><strong>{nob.name}</strong><br /><span className="font-mono text-xs text-slate-500">{nob.code} · {nob.companyNobId}</span></span><StatusBadge status={nob.status} /></div><p className="mt-3 text-xs text-slate-500">Updated {new Date(nob.audit.updatedAt).toLocaleDateString()} by {nob.audit.updatedBy}</p></article>)}</section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Enabled LOBs</h2>{structure.lobs.map((lob) => <article key={lob.companyLobId} className="mt-4 rounded-lg border border-slate-200 p-4"><div className="flex justify-between"><span><strong>{lob.name}</strong><br /><span className="font-mono text-xs text-slate-500">{lob.code} · {lob.costingMethod}</span></span><StatusBadge status={lob.status} /></div><p className="mt-3 text-xs text-slate-500">QC {lob.qcRequired ? 'required' : 'optional'} · QR {lob.qrRequired ? 'required' : 'optional'}</p></article>)}</section>
        </div>
        {editable ? <section className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-5"><h2 className="font-black">Available LOB templates</h2><div className="mt-3 flex flex-wrap gap-3">{templates.filter((template) => !structure.lobs.some((lob) => lob.lobTemplateId === template.lobTemplateId)).map((template) => <button key={template.lobTemplateId} onClick={() => void addLob(template)} className={secondaryButtonClass}><Plus className="h-4 w-4" /> Enable {template.name}</button>)}</div></section> : null}
      </>}
    </div>
  );
}

export function MasterImportView({ companySlug, resource }: { companySlug: string; resource: MasterResource }) {
  const { companyId, editable } = useCompany(companySlug);
  const [scenario, setScenario] = useState('VALID');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState('');
  const validate = async () => {
    if (!companyId) return;
    try { setPreview(await api.post(`/companies/${companyId}/masters/${resource}/import/validate`, { scenario })); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Import validation failed.'); }
  };
  const confirm = async () => {
    if (!companyId || !preview) return;
    try { setPreview(await api.post(`/companies/${companyId}/masters/${resource}/import/confirm`, { importId: preview.importId })); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Import confirmation failed.'); }
  };
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Master-data import" title={`Import ${resourceLabels[resource]}`} description="Upload is always validated and previewed before confirmation. The demo provides deterministic valid, partial and invalid file scenarios." />
      {error ? <ErrorState message={error} /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {['Download template', 'Validate upload', 'Confirm import'].map((label, index) => <div key={label} className={`rounded-xl border p-4 ${preview && index < 2 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}><span className="text-xs font-bold text-slate-500">STEP {index + 1}</span><h2 className="mt-1 font-black">{label}</h2></div>)}
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase text-slate-600">CSV or XLSX file<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} className={`${inputClass} mt-1 normal-case`} /><span className="mt-1 block font-normal normal-case text-slate-500">{fileName || 'Optional in the deterministic demo; production will submit the selected file.'}</span></label>
          <label className="text-xs font-bold uppercase text-slate-600">Demo file scenario<select value={scenario} onChange={(event) => setScenario(event.target.value)} className={`${inputClass} mt-1`}><option value="VALID">Valid file</option><option value="PARTIAL">Partially invalid file</option><option value="INVALID">Completely invalid file</option></select></label>
        </div>
        <button disabled={!editable} onClick={() => void validate()} className={`${primaryButtonClass} mt-4`}><RefreshCw className="h-4 w-4" /> Validate upload</button>
        <Link href={`/api/v1/companies/${companyId}/masters/${resource}/import-template`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700"><Download className="h-4 w-4" /> Download CSV template</Link>
      </section>
      {preview ? <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><div><h2 className="font-black">Validation preview</h2><p className="mt-1 font-mono text-xs text-slate-500">{preview.importId}</p></div><StatusBadge status={preview.status} /></div><div className="mt-5 grid grid-cols-2 gap-4"><div className="rounded-lg bg-emerald-50 p-4"><span className="text-xs text-emerald-700">Valid rows</span><p className="text-3xl font-black text-emerald-800">{preview.validRows}</p></div><div className="rounded-lg bg-red-50 p-4"><span className="text-xs text-red-700">Invalid rows</span><p className="text-3xl font-black text-red-800">{preview.invalidRows}</p></div></div>{preview.errors.map((item) => <p key={`${item.row}-${item.field}`} className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">Row {item.row}, {item.field}: {item.message}</p>)}<button disabled={preview.invalidRows > 0 || preview.status === 'CONFIRMED'} onClick={() => void confirm()} className={`${primaryButtonClass} mt-5`}>Confirm import</button></section> : null}
    </div>
  );
}
