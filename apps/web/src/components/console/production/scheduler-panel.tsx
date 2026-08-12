"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search, Loader2, Inbox, Eye, Pencil } from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { InlineAlert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { getActiveCompanyId } from "@/hooks/useAuth";

const PAGE_SIZE = 25;

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
  accent: { color: "var(--accent)" },
  input: { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-(--input-border-focus)";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const OCCURRENCES = ["DAILY", "WEEKLY", "MONTHLY"];

const emptyLine = () => ({
  parameter_id: "", period_no: "1", period_from: "", period_to: "", period_label: "", occurrence: "WEEKLY",
  expected_qty_override: "", kpi_mode: "PCT", kpi_min_pct: "", kpi_max_pct: "",
  kpi_min_value: "", kpi_max_value: "", critical_threshold_pct: "",
});

const emptyHeader = () => ({ lob_id: "", scheduler_code: "", scheduler_name: "", duration_value: "", duration_unit: "DAY", breed_id: "", batch_start_from: "Start Date", is_active: true, description: "" });

export default function SchedulerPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [nobs, setNobs] = useState<Row[]>([]);
  const [lobs, setLobs] = useState<Row[]>([]);
  const [breeds, setBreeds] = useState<Row[]>([]);
  const [parameters, setParameters] = useState<Row[]>([]);
  const [items, setItems] = useState<Row[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLocked, setEditingLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [nobId, setNobId] = useState("");
  const [header, setHeader] = useState<Row>(emptyHeader());
  const [lines, setLines] = useState<Row[]>([emptyLine()]);

  const isLocked = !!editingId && editingLocked;

  const companyId = getActiveCompanyId();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      if (search) params.set("search", search);
      params.set("limit", "200");
      const res = await api.get(`/scheduler?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load schedulers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { setPage(1); }, [search, pageSize]);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("limit", "500");
    const qs = params.toString();
    api.get(`/setup/wizard/nobs?${qs}`).then((r) => setNobs(unwrap<Row[]>(r) || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!nobId) { setLobs([]); return; }
    api.get(`/setup/wizard/lobs/${nobId}`).then((r) => setLobs(unwrap<Row[]>(r) || [])).catch(() => setLobs([]));
  }, [nobId]);

  // Breed/Parameter are scoped by Nature of Business and Line of Business —
  // re-fetched whenever either selection changes (nobId/header.lob_id are set
  // by both openCreate and openEdit, so this covers viewing an existing
  // scheduler's own parameter lines too).
  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    if (nobId) params.set("nobId", nobId);
    if (header.lob_id) params.set("lobId", header.lob_id);
    params.set("limit", "500");
    const qs = params.toString();
    api.get(`/breed?${qs}`).then((r) => setBreeds(unwrap<Row[]>(r) || [])).catch(() => setBreeds([]));
    api.get(`/parameter?${qs}`).then((r) => setParameters(unwrap<Row[]>(r) || [])).catch(() => setParameters([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nobId, header.lob_id]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("limit", "500");
    api.get(`/item?${params.toString()}`).then((r) => setItems(unwrap<Row[]>(r) || [])).catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setEditingLocked(false);
    setNobId("");
    setHeader(emptyHeader());
    setLines([emptyLine()]);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = async (row: Row) => {
    setFormError("");
    try {
      const res = unwrap<Row>(await api.get(`/scheduler/${row.scheduler_id}`));
      setEditingId(res.scheduler_id);
      setEditingLocked(!!res.is_locked);
      setNobId(res.nob_id || "");
      setHeader({
        lob_id: res.lob_id || "",
        scheduler_code: res.scheduler_code || "",
        scheduler_name: res.scheduler_name || "",
        duration_value: String(res.duration_value ?? ""),
        duration_unit: res.duration_unit || "DAY",
        breed_id: res.breed_id || "",
        batch_start_from: res.batch_start_from || "Start Date",
        is_active: res.is_active !== false,
        description: res.description || "",
      });
      setLines(
        (res.parameter_lines || []).map((l: Row) => ({
          parameter_id: l.parameter_id || "",
          period_no: String(l.period_no ?? "1"),
          period_from: String(l.period_from ?? ""),
          period_to: String(l.period_to ?? ""),
          period_label: l.period_label || "",
          occurrence: l.occurrence || "WEEKLY",
          expected_qty_override: l.expected_qty_override ?? "",
          kpi_mode: l.kpi_mode || "PCT",
          kpi_min_pct: l.kpi_min_pct ?? "",
          kpi_max_pct: l.kpi_max_pct ?? "",
          kpi_min_value: l.kpi_min_value ?? "",
          kpi_max_value: l.kpi_max_value ?? "",
          critical_threshold_pct: l.critical_threshold_pct ?? "",
        })) || [emptyLine()]
      );
      setModalOpen(true);
    } catch (err: any) {
      setError(err?.message || "Failed to load scheduler for editing.");
    }
  };

  const setLineField = (idx: number, key: string, value: any) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine(), period_no: String(prev.length + 1) }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleSave = async () => {
    if (isLocked) return;
    setSaving(true);
    setFormError("");
    try {
      if (!header.lob_id) throw new Error("Line of Business is required.");
      if (!header.scheduler_code || !header.scheduler_name) throw new Error("Code and name are required.");
      if (!header.duration_value) throw new Error("Duration is required.");
      const cleanLines = lines
        .filter((l) => l.parameter_id && l.period_from && l.period_to)
        .map((l) => ({
          parameter_id: l.parameter_id,
          period_no: Number(l.period_no) || 1,
          period_from: Number(l.period_from),
          period_to: Number(l.period_to),
          period_label: l.period_label || undefined,
          occurrence: l.occurrence || undefined,
          expected_qty_override: l.expected_qty_override ? Number(l.expected_qty_override) : undefined,
          kpi_mode: l.kpi_mode || undefined,
          kpi_min_pct: l.kpi_min_pct ? Number(l.kpi_min_pct) : undefined,
          kpi_max_pct: l.kpi_max_pct ? Number(l.kpi_max_pct) : undefined,
          kpi_min_value: l.kpi_min_value ? Number(l.kpi_min_value) : undefined,
          kpi_max_value: l.kpi_max_value ? Number(l.kpi_max_value) : undefined,
          critical_threshold_pct: l.critical_threshold_pct ? Number(l.critical_threshold_pct) : undefined,
        }));
      if (cleanLines.length === 0) throw new Error("Add at least one parameter line.");

      if (editingId) {
        await api.put(`/scheduler/${editingId}`, {
          scheduler_name: header.scheduler_name,
          description: header.description || undefined,
          is_active: header.is_active,
          batch_start_from: header.batch_start_from || undefined,
          parameter_lines: cleanLines,
        });
      } else {
        await api.post("/scheduler", {
          company_id: companyId,
          nob_id: nobId,
          lob_id: header.lob_id,
          scheduler_code: header.scheduler_code,
          scheduler_name: header.scheduler_name,
          duration_value: Number(header.duration_value),
          duration_unit: header.duration_unit,
          breed_id: header.breed_id || undefined,
          batch_start_from: header.batch_start_from || undefined,
          description: header.description || undefined,
          parameter_lines: cleanLines,
        });
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save scheduler.");
    } finally {
      setSaving(false);
    }
  };


  const itemLabel = (id: string) => {
    const it = items.find((x) => x.item_id === id);
    return it ? `${it.item_code} — ${it.item_name}` : "—";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={S.primary}>Schedulers</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>Period-based KPI monitoring plans, attached to a batch at creation.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none" style={S.input} />
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: "var(--accent)" }}>
            <Plus className="h-3.5 w-3.5" /> New Scheduler
          </button>
        </div>
      </div>

      {error && (
        <InlineAlert>{error}</InlineAlert>
      )}

      <div className="overflow-hidden rounded-2xl border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ ...S.sub, borderColor: "var(--border)" }}>
                <th className="whitespace-nowrap px-4 py-3">Code</th>
                <th className="whitespace-nowrap px-4 py-3">Name</th>
                <th className="whitespace-nowrap px-4 py-3">Duration</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Locked</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-xs" style={S.sub}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-xs" style={S.sub}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No schedulers yet.</td></tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.scheduler_id} className="border-b text-xs transition-colors hover:bg-(--surface-raised)" style={{ borderColor: "var(--border)" }}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold" style={S.primary}>{row.scheduler_code}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.primary}>{row.scheduler_name}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>{row.duration_value} {row.duration_unit}(S)</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {row.is_active === false ? (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>INACTIVE</span>
                      ) : (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--success-muted)" }}>ACTIVE</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {row.is_locked ? (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>LOCKED</span>
                      ) : (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ color: "var(--success)", borderColor: "var(--success)" }}>EDITABLE</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(row)}
                        title={row.is_locked ? "View (locked)" : "View / Edit"}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition hover:bg-(--surface-raised)"
                        style={S.sub}
                      >
                        {row.is_locked ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                        {row.is_locked ? "View" : "Edit"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <div className="border-t px-2" style={{ borderColor: "var(--border)" }}>
            <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        )}
      </div>

      {/* Create/Edit/View modal — the same rich form is shown for locked schedulers too, just fully disabled, so nothing is hidden behind a bare read-only summary. */}
      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={isLocked ? `View Scheduler ${header.scheduler_code}` : editingId ? `Edit Scheduler ${header.scheduler_code}` : "New Scheduler"}
        maxWidth="xl"
        footer={
          isLocked ? (
            <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Close</button>
          ) : (
            <>
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <InlineAlert>{formError}</InlineAlert>
          )}

          {isLocked && (
            <InlineAlert variant="warning">
              This scheduler is locked — at least one ACTIVE batch is using it, so its plan must stay fixed while that batch is being KPI-tracked against it. Everything below is read-only. It unlocks automatically once every batch using it has closed or been cancelled, or you can create a new scheduler now if you don't want to wait.
            </InlineAlert>
          )}

          {editingId && !isLocked && (
            <p className="text-[11px]" style={S.muted}>Nature of Business, Line of Business, Code, Duration and Breed are locked after creation — create a new scheduler to change them.</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Nature of Business <span className="text-red-500">*</span></label>
              <select value={nobId} onChange={(e) => { setNobId(e.target.value); setHeader((h) => ({ ...h, lob_id: "" })); }} className={inputCls} style={S.input} disabled={!!editingId}>
                <option value="">Select…</option>
                {nobs.map((n) => <option key={n.nob_id} value={n.nob_id}>{n.nob_code} — {n.nob_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Line of Business <span className="text-red-500">*</span></label>
              <select value={header.lob_id} onChange={(e) => setHeader((h) => ({ ...h, lob_id: e.target.value }))} className={inputCls} style={S.input} disabled={!nobId || !!editingId}>
                <option value="">{nobId ? "Select…" : "Select Nature of Business first…"}</option>
                {lobs.map((l) => <option key={l.lob_id} value={l.lob_id}>{l.lob_code} — {l.lob_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Code <span className="text-red-500">*</span></label>
              <input value={header.scheduler_code} onChange={(e) => setHeader((h) => ({ ...h, scheduler_code: e.target.value }))} placeholder="SCH-PLT-CB-42D" className={inputCls} style={S.input} disabled={!!editingId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Name <span className="text-red-500">*</span></label>
              <input value={header.scheduler_name} onChange={(e) => setHeader((h) => ({ ...h, scheduler_name: e.target.value }))} placeholder="Broiler 42-Day Standard" className={inputCls} style={S.input} disabled={isLocked} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Duration <span className="text-red-500">*</span></label>
              <input type="number" value={header.duration_value} onChange={(e) => setHeader((h) => ({ ...h, duration_value: e.target.value }))} placeholder="42" className={inputCls} style={S.input} disabled={!!editingId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Duration Unit</label>
              <select value={header.duration_unit} onChange={(e) => setHeader((h) => ({ ...h, duration_unit: e.target.value }))} className={inputCls} style={S.input} disabled={!!editingId}>
                <option value="DAY">Day</option>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Breed (optional)</label>
              <select value={header.breed_id} onChange={(e) => setHeader((h) => ({ ...h, breed_id: e.target.value }))} className={inputCls} style={S.input} disabled={!!editingId}>
                <option value="">Select…</option>
                {breeds.map((b) => <option key={b.breed_id} value={b.breed_id}>{b.breed_code} — {b.breed_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Batch Start From</label>
              <input value={header.batch_start_from} onChange={(e) => setHeader((h) => ({ ...h, batch_start_from: e.target.value }))} placeholder="Start Date" className={inputCls} style={S.input} disabled={isLocked} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Description</label>
              <input value={header.description} onChange={(e) => setHeader((h) => ({ ...h, description: e.target.value }))} className={inputCls} style={S.input} disabled={isLocked} />
            </div>
            {editingId && (
              <div className="flex items-center gap-2 pt-1">
                <label className={`flex select-none items-center gap-2 text-sm ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`} style={S.primary}>
                  <input type="checkbox" checked={header.is_active} onChange={(e) => setHeader((h) => ({ ...h, is_active: e.target.checked }))} disabled={isLocked} className="h-4 w-4 rounded accent-(--accent)" />
                  Active
                </label>
                {!header.is_active && (
                  <span className="rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--danger-muted)", color: "var(--danger)", border: "1px solid var(--danger)" }}>Will be deactivated</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Parameter Lines</p>
            {!isLocked && (
              <button onClick={addLine} type="button" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={S.surface}>
                <Plus className="h-3 w-3" /> Add Line
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border" style={S.surface}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Parameter Type / Data Entry Type</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Item Name</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>UOM</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Occurrence</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Frequency Start Day</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Frequency End Day</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Label</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Expected Qty (override)</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>KPI Mode</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Min</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Max</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Critical %</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const selectedParam = parameters.find((p) => p.parameter_id === line.parameter_id);
                  return (
                  <tr key={idx} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-2 py-1.5 min-w-[200px]">
                      <select value={line.parameter_id} onChange={(e) => setLineField(idx, "parameter_id", e.target.value)} className={inputCls} style={S.input} disabled={isLocked}>
                        <option value="">Select…</option>
                        {parameters.map((p) => <option key={p.parameter_id} value={p.parameter_id}>{p.parameter_code} — {p.parameter_name}</option>)}
                      </select>
                      {selectedParam && (
                        <p className="mt-1 text-[10px]" style={S.muted}>Type: <span className="font-semibold" style={S.sub}>{selectedParam.parameter_type}</span></p>
                      )}
                    </td>
                    <td className="px-2 py-1.5 min-w-[140px] text-[11px]" style={S.sub}>{selectedParam?.item_id ? itemLabel(selectedParam.item_id) : "—"}</td>
                    <td className="px-2 py-1.5 w-16 text-[11px]" style={S.sub}>{selectedParam?.default_uom || "—"}</td>
                    <td className="px-2 py-1.5 w-28">
                      <select value={line.occurrence} onChange={(e) => setLineField(idx, "occurrence", e.target.value)} className={inputCls} style={S.input} disabled={isLocked}>
                        {OCCURRENCES.map((o) => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-20"><input type="number" value={line.period_from} onChange={(e) => setLineField(idx, "period_from", e.target.value)} className={inputCls} style={S.input} disabled={isLocked} /></td>
                    <td className="px-2 py-1.5 w-20"><input type="number" value={line.period_to} onChange={(e) => setLineField(idx, "period_to", e.target.value)} className={inputCls} style={S.input} disabled={isLocked} /></td>
                    <td className="px-2 py-1.5 w-32"><input value={line.period_label} onChange={(e) => setLineField(idx, "period_label", e.target.value)} placeholder="Week 1" className={inputCls} style={S.input} disabled={isLocked} /></td>
                    <td className="px-2 py-1.5 w-28"><input type="number" value={line.expected_qty_override} onChange={(e) => setLineField(idx, "expected_qty_override", e.target.value)} placeholder="From param" className={inputCls} style={S.input} disabled={isLocked} /></td>
                    <td className="px-2 py-1.5 w-24">
                      <select value={line.kpi_mode} onChange={(e) => setLineField(idx, "kpi_mode", e.target.value)} className={inputCls} style={S.input} disabled={isLocked}>
                        <option value="PCT">PCT</option>
                        <option value="VALUE">VALUE</option>
                      </select>
                    </td>
                    {line.kpi_mode === "VALUE" ? (
                      <>
                        <td className="px-2 py-1.5 w-20"><input type="number" value={line.kpi_min_value} onChange={(e) => setLineField(idx, "kpi_min_value", e.target.value)} className={inputCls} style={S.input} disabled={isLocked} /></td>
                        <td className="px-2 py-1.5 w-20"><input type="number" value={line.kpi_max_value} onChange={(e) => setLineField(idx, "kpi_max_value", e.target.value)} className={inputCls} style={S.input} disabled={isLocked} /></td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-1.5 w-20"><input type="number" value={line.kpi_min_pct} onChange={(e) => setLineField(idx, "kpi_min_pct", e.target.value)} placeholder="90" className={inputCls} style={S.input} disabled={isLocked} /></td>
                        <td className="px-2 py-1.5 w-20"><input type="number" value={line.kpi_max_pct} onChange={(e) => setLineField(idx, "kpi_max_pct", e.target.value)} placeholder="110" className={inputCls} style={S.input} disabled={isLocked} /></td>
                      </>
                    )}
                    <td className="px-2 py-1.5 w-20"><input type="number" value={line.critical_threshold_pct} onChange={(e) => setLineField(idx, "critical_threshold_pct", e.target.value)} placeholder="20" className={inputCls} style={S.input} disabled={isLocked} /></td>
                    {!isLocked && (
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeLine(idx)} type="button" className="rounded p-1 transition hover:bg-(--danger-muted)" style={{ color: "var(--danger)" }}><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
