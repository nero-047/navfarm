'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, AlertCircle, Loader2, Inbox } from 'lucide-react';
import { api } from '@/services/api-client';
import { Dialog } from '@/components/ui/dialog';
import { getActiveCompanyId } from '@/hooks/useAuth';

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' },
  primary: { color: 'var(--text-primary)' },
  sub: { color: 'var(--text-secondary)' },
  muted: { color: 'var(--text-muted)' },
  accent: { color: 'var(--accent)' },
  input: {
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text)',
    borderColor: 'var(--input-border)',
  },
};

const inputCls =
  'w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm outline-none transition focus:border-(--input-border-focus)';

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : (res?.data ?? res)) as T;
}

const PARAMETER_TYPES = [
  'CONSUMPTION',
  'MORTALITY',
  'OUTPUT',
  'OVERHEAD',
  'OBSERVATION',
];
const QTY_METHODS = ['PER_UNIT', 'PER_BATCH', 'MANUAL_AT_ENTRY'];

const emptyForm = () => ({
  parameter_code: '',
  parameter_name: '',
  parameter_type: 'CONSUMPTION',
  item_id: '',
  resource_id: '',
  default_uom: '',
  qty_method: 'PER_UNIT',
  default_qty_per_unit: '',
  default_qty_per_batch: '',
  description: '',
  is_mandatory: false,
});

export default function ParameterPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [items, setItems] = useState<Row[]>([]);
  const [resources, setResources] = useState<Row[]>([]);
  const [uoms, setUoms] = useState<Row[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<Row>(emptyForm());

  const companyId = getActiveCompanyId();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      if (search) params.set('search', search);
      if (typeFilter) params.set('parameterType', typeFilter);
      params.set('limit', '200');
      const res = await api.get(`/parameter?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, typeFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    params.set('limit', '500');
    const qs = params.toString();
    api
      .get(`/item?${qs}`)
      .then((r) => setItems(unwrap<Row[]>(r) || []))
      .catch(() => undefined);
    api
      .get(`/resource?${qs}`)
      .then((r) => setResources(unwrap<Row[]>(r) || []))
      .catch(() => undefined);
    api
      .get(`/uom?${qs}`)
      .then((r) => setUoms(unwrap<Row[]>(r) || []))
      .catch(() => undefined);
  }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (!form.parameter_code || !form.parameter_name)
        throw new Error('Code and name are required.');
      if (!form.qty_method) throw new Error('Quantity method is required.');
      await api.post('/parameter', {
        company_id: companyId,
        parameter_code: form.parameter_code,
        parameter_name: form.parameter_name,
        parameter_type: form.parameter_type,
        item_id: form.item_id || undefined,
        resource_id: form.resource_id || undefined,
        default_uom: form.default_uom || undefined,
        qty_method: form.qty_method,
        default_qty_per_unit: form.default_qty_per_unit
          ? Number(form.default_qty_per_unit)
          : undefined,
        default_qty_per_batch: form.default_qty_per_batch
          ? Number(form.default_qty_per_batch)
          : undefined,
        description: form.description || undefined,
        is_mandatory: form.is_mandatory,
      });
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save parameter.');
    } finally {
      setSaving(false);
    }
  };

  const itemLabel = (id: string) => {
    const it = items.find((i) => i.item_id === id);
    return it ? it.item_code : '—';
  };
  const resourceLabel = (id: string) => {
    const r = resources.find((x) => x.resource_id === id);
    return r ? r.resource_code : '—';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={S.primary}>
            Parameters
          </h2>
          <p className="mt-0.5 text-xs" style={S.sub}>
            Reusable expected-value definitions used to build Schedulers (e.g.
            &quot;Starter Feed Consumption&quot;).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border py-1.5 px-2 text-xs outline-none"
            style={S.input}
          >
            <option value="">All types</option>
            {PARAMETER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={S.muted}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="rounded-[var(--radius-sm)] border py-1.5 pl-8 pr-3 text-xs outline-none"
              style={S.input}
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="h-3.5 w-3.5" /> New Parameter
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div
        className="overflow-hidden rounded-[var(--radius-lg)] border"
        style={S.surface}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="border-b text-xs font-bold uppercase tracking-wider"
                style={{ ...S.sub, borderColor: 'var(--border)' }}
              >
                <th className="whitespace-nowrap px-4 py-3">Code</th>
                <th className="whitespace-nowrap px-4 py-3">Name</th>
                <th className="whitespace-nowrap px-4 py-3">Type</th>
                <th className="whitespace-nowrap px-4 py-3">Item / Resource</th>
                <th className="whitespace-nowrap px-4 py-3">Method</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">
                  Default Qty
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-xs"
                    style={S.sub}
                  >
                    <Loader2
                      className="mx-auto mb-2 h-5 w-5 animate-spin"
                      style={S.accent}
                    />{' '}
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-xs"
                    style={S.sub}
                  >
                    <Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} />{' '}
                    No parameters yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.parameter_id}
                    className="border-b text-xs transition-colors hover:bg-(--surface-raised)"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td
                      className="whitespace-nowrap px-4 py-3 font-semibold"
                      style={S.primary}
                    >
                      {row.parameter_code}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3"
                      style={S.primary}
                    >
                      {row.parameter_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>
                      {row.parameter_type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>
                      {row.item_id
                        ? itemLabel(row.item_id)
                        : row.resource_id
                          ? resourceLabel(row.resource_id)
                          : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>
                      {row.qty_method}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right"
                      style={S.primary}
                    >
                      {row.default_qty_per_unit
                        ? `${row.default_qty_per_unit}/unit`
                        : row.default_qty_per_batch
                          ? `${row.default_qty_per_batch}/batch`
                          : '—'}{' '}
                      {row.default_uom || ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="New Parameter"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-medium"
              style={S.surface}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {formError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Code <span className="text-red-500">*</span>
              </label>
              <input
                value={form.parameter_code}
                onChange={(e) =>
                  setForm((f: Row) => ({
                    ...f,
                    parameter_code: e.target.value,
                  }))
                }
                placeholder="PARAM-CONS-FEED-STARTER"
                className={inputCls}
                style={S.input}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.parameter_name}
                onChange={(e) =>
                  setForm((f: Row) => ({
                    ...f,
                    parameter_name: e.target.value,
                  }))
                }
                placeholder="Starter Feed Consumption"
                className={inputCls}
                style={S.input}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Type
              </label>
              <select
                value={form.parameter_type}
                onChange={(e) =>
                  setForm((f: Row) => ({
                    ...f,
                    parameter_type: e.target.value,
                    item_id: '',
                    resource_id: '',
                  }))
                }
                className={inputCls}
                style={S.input}
              >
                {PARAMETER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Quantity Method
              </label>
              <select
                value={form.qty_method}
                onChange={(e) =>
                  setForm((f: Row) => ({ ...f, qty_method: e.target.value }))
                }
                className={inputCls}
                style={S.input}
              >
                {QTY_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {['CONSUMPTION', 'OUTPUT'].includes(form.parameter_type) && (
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={S.sub}
                >
                  Item
                </label>
                <select
                  value={form.item_id}
                  onChange={(e) =>
                    setForm((f: Row) => ({ ...f, item_id: e.target.value }))
                  }
                  className={inputCls}
                  style={S.input}
                >
                  <option value="">Select…</option>
                  {items.map((it) => (
                    <option key={it.item_id} value={it.item_id}>
                      {it.item_code} — {it.item_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {form.parameter_type === 'OVERHEAD' && (
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={S.sub}
                >
                  Resource (optional)
                </label>
                <select
                  value={form.resource_id}
                  onChange={(e) =>
                    setForm((f: Row) => ({ ...f, resource_id: e.target.value }))
                  }
                  className={inputCls}
                  style={S.input}
                >
                  <option value="">None</option>
                  {resources.map((r) => (
                    <option key={r.resource_id} value={r.resource_id}>
                      {r.resource_code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Default UOM
              </label>
              <select
                value={form.default_uom}
                onChange={(e) =>
                  setForm((f: Row) => ({ ...f, default_uom: e.target.value }))
                }
                className={inputCls}
                style={S.input}
              >
                <option value="">Select…</option>
                {uoms.map((u) => (
                  <option key={u.uom_code} value={u.uom_code}>
                    {u.uom_code}
                  </option>
                ))}
              </select>
            </div>

            {form.qty_method === 'PER_UNIT' && (
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={S.sub}
                >
                  Default Qty / Unit / Day
                </label>
                <input
                  type="number"
                  value={form.default_qty_per_unit}
                  onChange={(e) =>
                    setForm((f: Row) => ({
                      ...f,
                      default_qty_per_unit: e.target.value,
                    }))
                  }
                  className={inputCls}
                  style={S.input}
                />
              </div>
            )}
            {form.qty_method === 'PER_BATCH' && (
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={S.sub}
                >
                  Default Qty / Batch
                </label>
                <input
                  type="number"
                  value={form.default_qty_per_batch}
                  onChange={(e) =>
                    setForm((f: Row) => ({
                      ...f,
                      default_qty_per_batch: e.target.value,
                    }))
                  }
                  className={inputCls}
                  style={S.input}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Description
              </label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm((f: Row) => ({ ...f, description: e.target.value }))
                }
                className={inputCls}
                style={S.input}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
