'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Search,
  AlertCircle,
  Loader2,
  Inbox,
  Eye,
} from 'lucide-react';
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

const emptyLine = () => ({
  parameter_id: '',
  period_no: '1',
  period_from: '',
  period_to: '',
  period_label: '',
  expected_qty_override: '',
  kpi_mode: 'PCT',
  kpi_min_pct: '',
  kpi_max_pct: '',
  kpi_min_value: '',
  kpi_max_value: '',
  critical_threshold_pct: '',
});

export default function SchedulerPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [nobs, setNobs] = useState<Row[]>([]);
  const [lobs, setLobs] = useState<Row[]>([]);
  const [breeds, setBreeds] = useState<Row[]>([]);
  const [parameters, setParameters] = useState<Row[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [nobId, setNobId] = useState('');
  const [header, setHeader] = useState<Row>({
    lob_id: '',
    scheduler_code: '',
    scheduler_name: '',
    duration_value: '',
    duration_unit: 'DAY',
    breed_id: '',
    description: '',
  });
  const [lines, setLines] = useState<Row[]>([emptyLine()]);

  const [viewing, setViewing] = useState<Row | null>(null);

  const companyId = getActiveCompanyId();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      if (search) params.set('search', search);
      params.set('limit', '200');
      const res = await api.get(`/scheduler?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load schedulers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    params.set('limit', '500');
    const qs = params.toString();
    api
      .get(`/setup/wizard/nobs?${qs}`)
      .then((r) => setNobs(unwrap<Row[]>(r) || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!nobId) {
      setLobs([]);
      return;
    }
    api
      .get(`/setup/wizard/lobs/${nobId}`)
      .then((r) => setLobs(unwrap<Row[]>(r) || []))
      .catch(() => setLobs([]));
  }, [nobId]);

  // Breed/Parameter are scoped by Nature of Business and Line of Business —
  // re-fetched whenever either selection changes. The "active" scope prefers
  // whichever scheduler is currently open for viewing (so its own parameter
  // lines resolve to the right names) and falls back to the create form's
  // current selection otherwise.
  const activeNobId = viewing?.nob_id || nobId;
  const activeLobId = viewing?.lob_id || header.lob_id;
  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    if (activeNobId) params.set('nobId', activeNobId);
    if (activeLobId) params.set('lobId', activeLobId);
    params.set('limit', '500');
    const qs = params.toString();
    api
      .get(`/breed?${qs}`)
      .then((r) => setBreeds(unwrap<Row[]>(r) || []))
      .catch(() => setBreeds([]));
    api
      .get(`/parameter?${qs}`)
      .then((r) => setParameters(unwrap<Row[]>(r) || []))
      .catch(() => setParameters([]));
  }, [activeNobId, activeLobId]);

  const openCreate = () => {
    setNobId('');
    setHeader({
      lob_id: '',
      scheduler_code: '',
      scheduler_name: '',
      duration_value: '',
      duration_unit: 'DAY',
      breed_id: '',
      description: '',
    });
    setLines([emptyLine()]);
    setFormError('');
    setModalOpen(true);
  };

  const setLineField = (idx: number, key: string, value: any) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)),
    );
  };
  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { ...emptyLine(), period_no: String(prev.length + 1) },
    ]);
  const removeLine = (idx: number) =>
    setLines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (!header.lob_id) throw new Error('Line of Business is required.');
      if (!header.scheduler_code || !header.scheduler_name)
        throw new Error('Code and name are required.');
      if (!header.duration_value) throw new Error('Duration is required.');
      const cleanLines = lines
        .filter((l) => l.parameter_id && l.period_from && l.period_to)
        .map((l) => ({
          parameter_id: l.parameter_id,
          period_no: Number(l.period_no) || 1,
          period_from: Number(l.period_from),
          period_to: Number(l.period_to),
          period_label: l.period_label || undefined,
          expected_qty_override: l.expected_qty_override
            ? Number(l.expected_qty_override)
            : undefined,
          kpi_mode: l.kpi_mode || undefined,
          kpi_min_pct: l.kpi_min_pct ? Number(l.kpi_min_pct) : undefined,
          kpi_max_pct: l.kpi_max_pct ? Number(l.kpi_max_pct) : undefined,
          kpi_min_value: l.kpi_min_value ? Number(l.kpi_min_value) : undefined,
          kpi_max_value: l.kpi_max_value ? Number(l.kpi_max_value) : undefined,
          critical_threshold_pct: l.critical_threshold_pct
            ? Number(l.critical_threshold_pct)
            : undefined,
        }));
      if (cleanLines.length === 0)
        throw new Error('Add at least one parameter line.');

      await api.post('/scheduler', {
        company_id: companyId,
        nob_id: nobId,
        lob_id: header.lob_id,
        scheduler_code: header.scheduler_code,
        scheduler_name: header.scheduler_name,
        duration_value: Number(header.duration_value),
        duration_unit: header.duration_unit,
        breed_id: header.breed_id || undefined,
        description: header.description || undefined,
        parameter_lines: cleanLines,
      });
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save scheduler.');
    } finally {
      setSaving(false);
    }
  };

  const openView = async (row: Row) => {
    try {
      const res = await api.get(`/scheduler/${row.scheduler_id}`);
      setViewing(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || 'Failed to load scheduler details.');
    }
  };

  const parameterLabel = (id: string) => {
    const p = parameters.find((x) => x.parameter_id === id);
    return p ? `${p.parameter_code} — ${p.parameter_name}` : '—';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={S.primary}>
            Schedulers
          </h2>
          <p className="mt-0.5 text-xs" style={S.sub}>
            Period-based KPI monitoring plans, attached to a batch at creation.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            <Plus className="h-3.5 w-3.5" /> New Scheduler
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
                <th className="whitespace-nowrap px-4 py-3">Duration</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">
                  Locked
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
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
                    colSpan={5}
                    className="px-4 py-10 text-center text-xs"
                    style={S.sub}
                  >
                    <Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} />{' '}
                    No schedulers yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.scheduler_id}
                    className="border-b text-xs transition-colors hover:bg-(--surface-raised)"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td
                      className="whitespace-nowrap px-4 py-3 font-semibold"
                      style={S.primary}
                    >
                      {row.scheduler_code}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3"
                      style={S.primary}
                    >
                      {row.scheduler_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>
                      {row.duration_value} {row.duration_unit}(S)
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {row.is_locked ? (
                        <span
                          className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                          style={{
                            color: 'var(--danger)',
                            borderColor: 'var(--danger)',
                          }}
                        >
                          LOCKED
                        </span>
                      ) : (
                        <span
                          className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                          style={{
                            color: 'var(--success)',
                            borderColor: 'var(--success)',
                          }}
                        >
                          EDITABLE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openView(row)}
                        title="View"
                        className="rounded-[var(--radius-sm)] p-1.5 transition hover:bg-(--surface-raised)"
                        style={S.sub}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="New Scheduler"
        maxWidth="xl"
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
                Nature of Business <span className="text-red-500">*</span>
              </label>
              <select
                value={nobId}
                onChange={(e) => {
                  setNobId(e.target.value);
                  setHeader((h) => ({ ...h, lob_id: '' }));
                }}
                className={inputCls}
                style={S.input}
              >
                <option value="">Select…</option>
                {nobs.map((n) => (
                  <option key={n.nob_id} value={n.nob_id}>
                    {n.nob_code} — {n.nob_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Line of Business <span className="text-red-500">*</span>
              </label>
              <select
                value={header.lob_id}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, lob_id: e.target.value }))
                }
                className={inputCls}
                style={S.input}
                disabled={!nobId}
              >
                <option value="">
                  {nobId ? 'Select…' : 'Select Nature of Business first…'}
                </option>
                {lobs.map((l) => (
                  <option key={l.lob_id} value={l.lob_id}>
                    {l.lob_code} — {l.lob_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Code <span className="text-red-500">*</span>
              </label>
              <input
                value={header.scheduler_code}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, scheduler_code: e.target.value }))
                }
                placeholder="SCH-PLT-CB-42D"
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
                value={header.scheduler_name}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, scheduler_name: e.target.value }))
                }
                placeholder="Broiler 42-Day Standard"
                className={inputCls}
                style={S.input}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={header.duration_value}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, duration_value: e.target.value }))
                }
                placeholder="42"
                className={inputCls}
                style={S.input}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Duration Unit
              </label>
              <select
                value={header.duration_unit}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, duration_unit: e.target.value }))
                }
                className={inputCls}
                style={S.input}
              >
                <option value="DAY">Day</option>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Breed (optional)
              </label>
              <select
                value={header.breed_id}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, breed_id: e.target.value }))
                }
                className={inputCls}
                style={S.input}
              >
                <option value="">Select…</option>
                {breeds.map((b) => (
                  <option key={b.breed_id} value={b.breed_id}>
                    {b.breed_code} — {b.breed_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={S.sub}
              >
                Description
              </label>
              <input
                value={header.description}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, description: e.target.value }))
                }
                className={inputCls}
                style={S.input}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={S.sub}
            >
              Parameter Lines
            </p>
            <button
              onClick={addLine}
              type="button"
              className="flex items-center gap-1 rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-semibold"
              style={S.surface}
            >
              <Plus className="h-3 w-3" /> Add Line
            </button>
          </div>

          <div
            className="overflow-x-auto rounded-[var(--radius-md)] border"
            style={S.surface}
          >
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    Parameter
                  </th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    Day From
                  </th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    Day To
                  </th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    Label
                  </th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    Expected Qty (override)
                  </th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    KPI Mode
                  </th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    Min
                  </th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    Max
                  </th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>
                    Critical %
                  </th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-2 py-1.5 min-w-[180px]">
                      <select
                        value={line.parameter_id}
                        onChange={(e) =>
                          setLineField(idx, 'parameter_id', e.target.value)
                        }
                        className={inputCls}
                        style={S.input}
                      >
                        <option value="">Select…</option>
                        {parameters.map((p) => (
                          <option key={p.parameter_id} value={p.parameter_id}>
                            {p.parameter_code}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-20">
                      <input
                        type="number"
                        value={line.period_from}
                        onChange={(e) =>
                          setLineField(idx, 'period_from', e.target.value)
                        }
                        className={inputCls}
                        style={S.input}
                      />
                    </td>
                    <td className="px-2 py-1.5 w-20">
                      <input
                        type="number"
                        value={line.period_to}
                        onChange={(e) =>
                          setLineField(idx, 'period_to', e.target.value)
                        }
                        className={inputCls}
                        style={S.input}
                      />
                    </td>
                    <td className="px-2 py-1.5 w-32">
                      <input
                        value={line.period_label}
                        onChange={(e) =>
                          setLineField(idx, 'period_label', e.target.value)
                        }
                        placeholder="Week 1"
                        className={inputCls}
                        style={S.input}
                      />
                    </td>
                    <td className="px-2 py-1.5 w-28">
                      <input
                        type="number"
                        value={line.expected_qty_override}
                        onChange={(e) =>
                          setLineField(
                            idx,
                            'expected_qty_override',
                            e.target.value,
                          )
                        }
                        placeholder="From param"
                        className={inputCls}
                        style={S.input}
                      />
                    </td>
                    <td className="px-2 py-1.5 w-24">
                      <select
                        value={line.kpi_mode}
                        onChange={(e) =>
                          setLineField(idx, 'kpi_mode', e.target.value)
                        }
                        className={inputCls}
                        style={S.input}
                      >
                        <option value="PCT">PCT</option>
                        <option value="VALUE">VALUE</option>
                      </select>
                    </td>
                    {line.kpi_mode === 'VALUE' ? (
                      <>
                        <td className="px-2 py-1.5 w-20">
                          <input
                            type="number"
                            value={line.kpi_min_value}
                            onChange={(e) =>
                              setLineField(idx, 'kpi_min_value', e.target.value)
                            }
                            className={inputCls}
                            style={S.input}
                          />
                        </td>
                        <td className="px-2 py-1.5 w-20">
                          <input
                            type="number"
                            value={line.kpi_max_value}
                            onChange={(e) =>
                              setLineField(idx, 'kpi_max_value', e.target.value)
                            }
                            className={inputCls}
                            style={S.input}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-1.5 w-20">
                          <input
                            type="number"
                            value={line.kpi_min_pct}
                            onChange={(e) =>
                              setLineField(idx, 'kpi_min_pct', e.target.value)
                            }
                            placeholder="90"
                            className={inputCls}
                            style={S.input}
                          />
                        </td>
                        <td className="px-2 py-1.5 w-20">
                          <input
                            type="number"
                            value={line.kpi_max_pct}
                            onChange={(e) =>
                              setLineField(idx, 'kpi_max_pct', e.target.value)
                            }
                            placeholder="110"
                            className={inputCls}
                            style={S.input}
                          />
                        </td>
                      </>
                    )}
                    <td className="px-2 py-1.5 w-20">
                      <input
                        type="number"
                        value={line.critical_threshold_pct}
                        onChange={(e) =>
                          setLineField(
                            idx,
                            'critical_threshold_pct',
                            e.target.value,
                          )
                        }
                        placeholder="20"
                        className={inputCls}
                        style={S.input}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => removeLine(idx)}
                        type="button"
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Dialog>

      {/* View modal */}
      <Dialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Scheduler ${viewing.scheduler_code}` : ''}
        maxWidth="xl"
        footer={
          <button
            onClick={() => setViewing(null)}
            className="rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-medium"
            style={S.surface}
          >
            Close
          </button>
        }
      >
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <p
                  className="font-semibold uppercase tracking-wider"
                  style={S.muted}
                >
                  Duration
                </p>
                <p style={S.primary}>
                  {viewing.duration_value} {viewing.duration_unit}(S)
                </p>
              </div>
              <div>
                <p
                  className="font-semibold uppercase tracking-wider"
                  style={S.muted}
                >
                  Status
                </p>
                <p style={S.primary}>
                  {viewing.is_locked ? 'Locked' : 'Editable'}
                </p>
              </div>
            </div>
            <div
              className="overflow-x-auto rounded-[var(--radius-md)] border"
              style={S.surface}
            >
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className="border-b"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <th className="px-3 py-2 font-semibold" style={S.sub}>
                      Parameter
                    </th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>
                      Days
                    </th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>
                      Label
                    </th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>
                      KPI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(viewing.parameter_lines || []).map((l: Row) => (
                    <tr
                      key={l.spl_id}
                      className="border-b last:border-0"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="px-3 py-2" style={S.primary}>
                        {parameterLabel(l.parameter_id)}
                      </td>
                      <td className="px-3 py-2" style={S.sub}>
                        {l.period_from}–{l.period_to}
                      </td>
                      <td className="px-3 py-2" style={S.sub}>
                        {l.period_label || '—'}
                      </td>
                      <td className="px-3 py-2" style={S.primary}>
                        {l.kpi_mode === 'VALUE'
                          ? `${l.kpi_min_value ?? '-∞'} – ${l.kpi_max_value ?? '∞'}`
                          : l.kpi_mode === 'PCT'
                            ? `${l.kpi_min_pct ?? 0}% – ${l.kpi_max_pct ?? '∞'}%`
                            : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
