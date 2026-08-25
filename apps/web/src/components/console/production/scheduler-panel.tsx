"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search, Loader2, Inbox, Eye, Pencil } from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLanguage } from "@/hooks/useLanguage";

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

const inputCls = "nf-input";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const OCCURRENCES = ["DAILY", "WEEKLY", "MONTHLY"];

// The header stage selector has three states, not two: every line on one
// stage, every line whole-batch (""), or lines on different stages. Without a
// distinct value the third case fell back to "" and the header claimed
// "Whole batch" for a scheduler that was in fact staged per line.
const MIXED_STAGES = "__MIXED__";

const emptyLine = () => ({
  parameter_id: "", period_no: "1", period_from: "", period_to: "", period_label: "", occurrence: "WEEKLY",
  stage_code: "", expected_qty_override: "", kpi_mode: "PCT", kpi_min_pct: "", kpi_max_pct: "",
  kpi_min_value: "", kpi_max_value: "", critical_threshold_pct: "",
});

const emptyHeader = () => ({ lob_id: "", scheduler_code: "", scheduler_name: "", duration_value: "", duration_unit: "DAY", breed_id: "", batch_start_from: "Start Date", is_active: true, description: "" });

export default function SchedulerPanel() {
  const { t } = useLanguage();
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
  const [stages, setStages] = useState<Row[]>([]);

  const [nobId, setNobId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [header, setHeader] = useState<Row>(emptyHeader());
  const [lines, setLines] = useState<Row[]>([emptyLine()]);
  const [defaultStageCode, setDefaultStageCode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLocked, setEditingLocked] = useState(false);
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
      const data = unwrap<Row[]>(res);
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || t("schedErrLoadFailed"));
      setRows([]);
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
    api.get(`/stage?${qs}`).then((r) => setStages(unwrap<Row[]>(r) || [])).catch(() => setStages([]));
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
    setDefaultStageCode("");
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
      const loadedLines = (res.parameter_lines || []).map((l: Row) => ({
        parameter_id: l.parameter_id || "",
        period_no: String(l.period_no ?? "1"),
        period_from: String(l.period_from ?? ""),
        period_to: String(l.period_to ?? ""),
        period_label: l.period_label || "",
        occurrence: l.occurrence || "WEEKLY",
        stage_code: l.stage_code || "",
        expected_qty_override: l.expected_qty_override ?? "",
        kpi_mode: l.kpi_mode || "PCT",
        kpi_min_pct: l.kpi_min_pct ?? "",
        kpi_max_pct: l.kpi_max_pct ?? "",
        kpi_min_value: l.kpi_min_value ?? "",
        kpi_max_value: l.kpi_max_value ?? "",
        critical_threshold_pct: l.critical_threshold_pct ?? "",
      }));
      setLines(loadedLines.length > 0 ? loadedLines : [emptyLine()]);
      // If every line already shares the same stage, reflect that in the
      // header convenience selector; otherwise leave it blank ("Mixed").
      const distinctStages = new Set(loadedLines.map((l: Row) => l.stage_code || ""));
      setDefaultStageCode(distinctStages.size === 1 ? (loadedLines[0]?.stage_code || "") : MIXED_STAGES);
      setModalOpen(true);
    } catch (err: any) {
      setError(err?.message || t("schedErrLoadEditFailed"));
    }
  };

  const setLineField = (idx: number, key: string, value: any) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine(), period_no: String(prev.length + 1), stage_code: defaultStageCode === MIXED_STAGES ? "" : defaultStageCode }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const applyStageToAllLines = (stageCode: string) => {
    // MIXED is a readout of the lines below, not something you can apply.
    if (stageCode === MIXED_STAGES) return;
    setDefaultStageCode(stageCode);
    setLines((prev) => prev.map((l) => ({ ...l, stage_code: stageCode })));
  };

  const handleSave = async () => {
    if (isLocked) return;
    setSaving(true);
    setFormError("");
    try {
      if (!header.lob_id) throw new Error(t("schedErrLobRequired"));
      if (!header.scheduler_code || !header.scheduler_name) throw new Error(t("schedErrCodeNameRequired"));
      if (!header.duration_value) throw new Error(t("schedErrDurationRequired"));
      const cleanLines = lines
        .filter((l) => l.parameter_id && l.period_from && l.period_to)
        .map((l) => ({
          parameter_id: l.parameter_id,
          period_no: Number(l.period_no) || 1,
          period_from: Number(l.period_from),
          period_to: Number(l.period_to),
          period_label: l.period_label || undefined,
          occurrence: l.occurrence || undefined,
          stage_code: l.stage_code || undefined,
          expected_qty_override: l.expected_qty_override ? Number(l.expected_qty_override) : undefined,
          kpi_mode: l.kpi_mode || undefined,
          kpi_min_pct: l.kpi_min_pct ? Number(l.kpi_min_pct) : undefined,
          kpi_max_pct: l.kpi_max_pct ? Number(l.kpi_max_pct) : undefined,
          kpi_min_value: l.kpi_min_value ? Number(l.kpi_min_value) : undefined,
          kpi_max_value: l.kpi_max_value ? Number(l.kpi_max_value) : undefined,
          critical_threshold_pct: l.critical_threshold_pct ? Number(l.critical_threshold_pct) : undefined,
        }));
      if (cleanLines.length === 0) throw new Error(t("schedErrAddLine"));

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
      setFormError(err?.message || t("schedErrSaveFailed"));
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
          <h2 className="text-lg font-semibold" style={S.primary}>{t("schedTitle")}</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>{t("schedSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("schedSearchPlaceholder")} className="nf-input-sm pl-8 pr-3" style={S.input} />
          </div>
          <Button size="sm" onClick={openCreate} >
            <Plus className="h-3.5 w-3.5" /> {t("schedNewScheduler")}
          </Button>
        </div>
      </div>

      {error && (
        <InlineAlert>{error}</InlineAlert>
      )}

      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <TableHeader>
              <tr className="border-b" style={{ borderColor: "var(--row-border)" }}>
                <TableHead className="whitespace-nowrap">{t("schedColCode")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("schedColName")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("schedColDuration")}</TableHead>
                <TableHead className="whitespace-nowrap text-right">{t("schedColStatus")}</TableHead>
                <TableHead className="whitespace-nowrap text-right">{t("schedColLocked")}</TableHead>
                <TableHead className="text-right">{t("schedColActions")}</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <tr><TableCell colSpan={6} className="py-10 text-center" style={S.sub}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> {t("schedLoading")}</TableCell></tr>
              ) : rows.length === 0 ? (
                <tr><TableCell colSpan={6} className="py-10 text-center" style={S.sub}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> {t("schedNoSchedulers")}</TableCell></tr>
              ) : (
                pagedRows.map((row) => (
                  <TableRow key={row.scheduler_id}>
                    <TableCell className="whitespace-nowrap font-semibold" style={S.primary}>{row.scheduler_code}</TableCell>
                    <TableCell className="whitespace-nowrap" style={S.primary}>{row.scheduler_name}</TableCell>
                    <TableCell className="whitespace-nowrap" style={S.sub}>{row.duration_value} {row.duration_unit}{t("schedUnitPluralSuffix")}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {row.is_active === false ? (
                        <StatusBadge status="INACTIVE" label={t("schedStatusInactive")} />
                      ) : (
                        <StatusBadge status="ACTIVE" label={t("schedStatusActive")} />
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {row.is_locked ? (
                        // Locked is an expected lifecycle state, not an error — it
                        // read as danger-red here before, making every locked
                        // scheduler look broken.
                        <StatusBadge status="LOCKED" label={t("schedLockedLabel")} />
                      ) : (
                        <StatusBadge status="OPEN" label={t("schedEditableLabel")} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => openEdit(row)}
                        title={row.is_locked ? t("schedViewLocked") : t("schedViewEdit")}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition hover:bg-(--surface-raised)"
                        style={S.sub}
                      >
                        {row.is_locked ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                        {row.is_locked ? t("schedView") : t("schedEdit")}
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
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
        title={isLocked ? t("schedModalTitleView", { code: header.scheduler_code }) : editingId ? t("schedModalTitleEdit", { code: header.scheduler_code }) : t("schedModalTitleNew")}
        maxWidth="xl"
        footer={
          isLocked ? undefined : (
            <>
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>{t("schedCancel")}</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="nf-btn-primary">
                {saving ? t("schedSaving") : t("schedSave")}
              </Button>
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
              {t("schedLockedWarning")}
            </InlineAlert>
          )}

          {editingId && !isLocked && (
            <p className="text-[11px]" style={S.muted}>{t("schedLockedFieldsNote")}</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedNob")} <span className="text-(--danger)">*</span></label>
              <select value={nobId} onChange={(e) => { setNobId(e.target.value); setHeader((h) => ({ ...h, lob_id: "" })); }} className={`${inputCls} nf-select`} style={S.input} disabled={!!editingId}>
                <option value="">{t("schedSelectEllipsis")}</option>
                {nobs.map((n) => <option key={n.nob_id} value={n.nob_id}>{n.nob_code} — {n.nob_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedLob")} <span className="text-(--danger)">*</span></label>
              <select value={header.lob_id} onChange={(e) => setHeader((h) => ({ ...h, lob_id: e.target.value }))} className={`${inputCls} nf-select`} style={S.input} disabled={!nobId || !!editingId}>
                <option value="">{nobId ? t("schedSelectEllipsis") : t("schedSelectNobFirst")}</option>
                {lobs.map((l) => <option key={l.lob_id} value={l.lob_id}>{l.lob_code} — {l.lob_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedCode")} <span className="text-(--danger)">*</span></label>
              <input value={header.scheduler_code} onChange={(e) => setHeader((h) => ({ ...h, scheduler_code: e.target.value }))} placeholder={t("schedCodePlaceholder")} className={inputCls} style={S.input} disabled={!!editingId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedName")} <span className="text-(--danger)">*</span></label>
              <input value={header.scheduler_name} onChange={(e) => setHeader((h) => ({ ...h, scheduler_name: e.target.value }))} placeholder={t("schedNamePlaceholder")} className={inputCls} style={S.input} disabled={isLocked} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedDuration")} <span className="text-(--danger)">*</span></label>
              <input type="number" value={header.duration_value} onChange={(e) => setHeader((h) => ({ ...h, duration_value: e.target.value }))} placeholder={t("schedDurationPlaceholder")} className={inputCls} style={S.input} disabled={!!editingId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedDurationUnit")}</label>
              <select value={header.duration_unit} onChange={(e) => setHeader((h) => ({ ...h, duration_unit: e.target.value }))} className={`${inputCls} nf-select`} style={S.input} disabled={!!editingId}>
                <option value="DAY">{t("schedUnitDay")}</option>
                <option value="WEEK">{t("schedUnitWeek")}</option>
                <option value="MONTH">{t("schedUnitMonth")}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedBreed")}</label>
              <select value={header.breed_id} onChange={(e) => setHeader((h) => ({ ...h, breed_id: e.target.value }))} className={`${inputCls} nf-select`} style={S.input} disabled={!!editingId}>
                <option value="">{t("schedSelectEllipsis")}</option>
                {breeds.map((b) => <option key={b.breed_id} value={b.breed_id}>{b.breed_code} — {b.breed_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedAppliesToLabel")}</label>
              <select value={defaultStageCode} onChange={(e) => applyStageToAllLines(e.target.value)} className={`${inputCls} nf-select`} style={S.input} disabled={isLocked}>
                {defaultStageCode === MIXED_STAGES && <option value={MIXED_STAGES}>{t("schedMixedStages")}</option>}
                <option value="">{t("schedWholeBatch")}</option>
                {stages.map((s) => <option key={s.stage_id} value={s.stage_code}>{s.stage_code} — {s.stage_name}</option>)}
              </select>
              <p className="text-[12px]" style={S.muted}>{t("schedAppliesToHint")}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="nf-text-label" style={S.sub}>{t("schedBatchStartFrom")}</label>
              <input value={header.batch_start_from} onChange={(e) => setHeader((h) => ({ ...h, batch_start_from: e.target.value }))} placeholder={t("schedStartDatePlaceholder")} className={inputCls} style={S.input} disabled={isLocked} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="nf-text-label" style={S.sub}>{t("schedDescription")}</label>
              <input value={header.description} onChange={(e) => setHeader((h) => ({ ...h, description: e.target.value }))} className={inputCls} style={S.input} disabled={isLocked} />
            </div>
            {editingId && (
              <div className="flex items-center gap-2 pt-1">
                <label className={`flex select-none items-center gap-2 text-sm ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`} style={S.primary}>
                  <input type="checkbox" checked={header.is_active} onChange={(e) => setHeader((h) => ({ ...h, is_active: e.target.checked }))} disabled={isLocked} className="h-4 w-4 rounded-[var(--radius-xs)] accent-(--accent)" />
                  {t("schedActive")}
                </label>
                {!header.is_active && (
                  <span className="rounded-[var(--radius-xs)] px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--danger-muted)", color: "var(--danger)", border: "1px solid var(--danger)" }}>{t("schedWillBeDeactivated")}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>{t("schedParameterLines")}</p>
            {!isLocked && (
              <button onClick={addLine} type="button" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={S.surface}>
                <Plus className="h-3 w-3" /> {t("schedAddLine")}
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-sm)] border" style={S.surface}>
            <table className="w-full border-collapse text-left text-xs">
              <TableHeader>
                <tr className="border-b border-(--row-border)">
                  <TableHead className="h-auto px-3 py-2">{t("schedColParamType")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColItemName")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColUom")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColOccurrence")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColStage")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColFreqStart")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColFreqEnd")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColLabel")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColExpectedQty")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColKpiMode")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColMin")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColMax")}</TableHead>
                  <TableHead className="h-auto px-3 py-2">{t("schedColCritical")}</TableHead>
                  <TableHead className="h-auto px-3 py-2"></TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => {
                  const selectedParam = parameters.find((p) => p.parameter_id === line.parameter_id);
                  return (
                  <TableRow key={idx}>
                    <TableCell className="px-2 py-1.5 min-w-[200px]">
                      <select value={line.parameter_id} onChange={(e) => setLineField(idx, "parameter_id", e.target.value)} className={`${inputCls} nf-select`} style={S.input} disabled={isLocked}>
                        <option value="">{t("schedSelectEllipsis")}</option>
                        {parameters.map((p) => <option key={p.parameter_id} value={p.parameter_id}>{p.parameter_code} — {p.parameter_name}</option>)}
                      </select>
                      {selectedParam && (
                        <p className="mt-1 text-[10px]" style={S.muted}>{t("schedTypeLabel")} <span className="font-semibold" style={S.sub}>{selectedParam.parameter_type}</span></p>
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[140px] text-[11px]" style={S.sub}>{selectedParam?.item_id ? itemLabel(selectedParam.item_id) : "—"}</TableCell>
                    <TableCell className="px-2 py-1.5 w-16 text-[11px]" style={S.sub}>{selectedParam?.default_uom || "—"}</TableCell>
                    <TableCell className="px-2 py-1.5 w-28">
                      <select value={line.occurrence} onChange={(e) => setLineField(idx, "occurrence", e.target.value)} className={`${inputCls} nf-select`} style={S.input} disabled={isLocked}>
                        {OCCURRENCES.map((o) => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 w-32">
                      <select value={line.stage_code} onChange={(e) => setLineField(idx, "stage_code", e.target.value)} className={`${inputCls} nf-select`} style={S.input} disabled={isLocked}>
                        <option value="">{t("schedWholeBatch")}</option>
                        {stages.map((s) => <option key={s.stage_id} value={s.stage_code}>{s.stage_code} — {s.stage_name}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 w-20"><input type="number" value={line.period_from} onChange={(e) => setLineField(idx, "period_from", e.target.value)} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                    <TableCell className="px-2 py-1.5 w-20"><input type="number" value={line.period_to} onChange={(e) => setLineField(idx, "period_to", e.target.value)} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                    <TableCell className="px-2 py-1.5 w-32"><input value={line.period_label} onChange={(e) => setLineField(idx, "period_label", e.target.value)} placeholder={t("schedLabelPlaceholder")} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                    <TableCell className="px-2 py-1.5 w-28"><input type="number" value={line.expected_qty_override} onChange={(e) => setLineField(idx, "expected_qty_override", e.target.value)} placeholder={t("schedExpectedQtyPlaceholder")} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                    <TableCell className="px-2 py-1.5 w-24">
                      <select value={line.kpi_mode} onChange={(e) => setLineField(idx, "kpi_mode", e.target.value)} className={`${inputCls} nf-select`} style={S.input} disabled={isLocked}>
                        <option value="PCT">{t("schedKpiPct")}</option>
                        <option value="VALUE">{t("schedKpiValue")}</option>
                      </select>
                    </TableCell>
                    {line.kpi_mode === "VALUE" ? (
                      <>
                        <TableCell className="px-2 py-1.5 w-20"><input type="number" value={line.kpi_min_value} onChange={(e) => setLineField(idx, "kpi_min_value", e.target.value)} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                        <TableCell className="px-2 py-1.5 w-20"><input type="number" value={line.kpi_max_value} onChange={(e) => setLineField(idx, "kpi_max_value", e.target.value)} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="px-2 py-1.5 w-20"><input type="number" value={line.kpi_min_pct} onChange={(e) => setLineField(idx, "kpi_min_pct", e.target.value)} placeholder={t("schedMinPctPlaceholder")} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                        <TableCell className="px-2 py-1.5 w-20"><input type="number" value={line.kpi_max_pct} onChange={(e) => setLineField(idx, "kpi_max_pct", e.target.value)} placeholder={t("schedMaxPctPlaceholder")} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                      </>
                    )}
                    <TableCell className="px-2 py-1.5 w-20"><input type="number" value={line.critical_threshold_pct} onChange={(e) => setLineField(idx, "critical_threshold_pct", e.target.value)} placeholder={t("schedCriticalPlaceholder")} className={inputCls} style={S.input} disabled={isLocked} /></TableCell>
                    {!isLocked && (
                      <TableCell className="px-2 py-1.5">
                        <button onClick={() => removeLine(idx)} type="button" className="rounded-[var(--radius-xs)] p-1 transition hover:bg-(--danger-muted)" style={{ color: "var(--danger)" }}><Trash2 className="h-3.5 w-3.5" /></button>
                      </TableCell>
                    )}
                  </TableRow>
                  );
                })}
              </TableBody>
            </table>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
