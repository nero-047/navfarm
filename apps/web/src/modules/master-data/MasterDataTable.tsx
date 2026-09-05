"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Inbox } from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { InlineAlert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getActiveCompanyId, getActiveWorkspaceScope } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import type { MasterDataConfig, MasterDataField } from "./types";
import { CollapsibleCard } from "./CollapsibleCard";
import { LookupCard } from "./LookupCard";
import { MASTER_DATA_CONFIGS } from "./configs";
import { useCodeSeries } from "./useCodeSeries";

const PAGE_SIZE = 25;

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised: { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
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

function entityLabel(row: Row, field: MasterDataField): string {
  const keys = field.entityLabelKeys || [];
  const text = keys.map((k) => row[k]).filter(Boolean).join(" — ");
  return text || row[field.entityValueKey || "id"];
}

function parentKeys(f: MasterDataField): string[] {
  if (!f.dependsOn) return [];
  return Array.isArray(f.dependsOn) ? f.dependsOn : [f.dependsOn];
}

/** Whether `f` is required right now — statically, or via `requiredWhen` against the live form values. */
function isFieldRequired(f: MasterDataField, form: Row): boolean {
  if (f.required) return true;
  if (!f.requiredWhen) return false;
  return f.requiredWhen.anyOf.some((cond) => {
    const depValue = form[cond.key];
    if (cond.equals !== undefined) {
      const list = Array.isArray(cond.equals) ? cond.equals : [cond.equals];
      return list.includes(depValue);
    }
    return depValue !== undefined && depValue !== "" && depValue !== false && depValue !== null;
  });
}

/**
 * Resolves a select-entity field's actual endpoint.
 * - "path" mode (default, single parent): substitutes "{value}" with the parent's current
 *   value; returns null (blocking the field) while that parent is unset.
 * - "query" mode (one or more parents): appends each set parent as a query param via
 *   queryParams; unset parents are simply omitted rather than blocking the fetch.
 */
function resolveEndpoint(f: MasterDataField, form: Row): string | null {
  if (!f.entityEndpoint) return null;
  const parents = parentKeys(f);
  if (parents.length === 0) return f.entityEndpoint;

  if (f.dependsOnMode === "query") {
    const params = new URLSearchParams();
    for (const key of parents) {
      const val = form[key];
      const paramName = f.queryParams?.[key];
      if (val && paramName) params.set(paramName, val);
    }
    const qs = params.toString();
    return qs ? `${f.entityEndpoint}?${qs}` : f.entityEndpoint;
  }

  const parentVal = form[parents[0]];
  if (!parentVal) return null;
  return f.entityEndpoint.replace("{value}", parentVal);
}

function displayValue(row: Row, key: string, yesLabel: string, noLabel: string): string {
  const v = row[key];
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? yesLabel : noLabel;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function MasterDataTable({ config }: { config: MasterDataConfig }) {
  const { t, tLabel } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [entityOptions, setEntityOptions] = useState<Record<string, Row[]>>({});

  const [nobFilterOptions, setNobFilterOptions] = useState<Row[]>([]);
  const [lobFilterOptions, setLobFilterOptions] = useState<Row[]>([]);
  const [nobFilter, setNobFilter] = useState("");
  const [lobFilter, setLobFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [entityReloadKey, setEntityReloadKey] = useState(0);
  const [lookupManager, setLookupManager] = useState<MasterDataConfig | null>(null);
  const lastEntityReloadKeyRef = useRef(entityReloadKey);

  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const workspaceScope = getActiveWorkspaceScope();
  const companyId = workspaceScope === "TENANT" ? null : getActiveCompanyId();
  const numbering = useCodeSeries(config.key, form, modalOpen && !editing);
  const formFields = config.fields.map(numbering.field).filter((f) => !f.hideInForm && !(workspaceScope === "OPERATIONAL" && ["nob_id", "lob_id"].includes(f.key)));
  const visibleFields = (editing ? formFields.filter((f) => !f.createOnly) : formFields.filter((f) => !f.editOnly))
    .filter((f) => !f.visibleWhen || isFieldRequired({ ...f, required: false, requiredWhen: f.visibleWhen }, form));
  const columns = config.columns || config.fields.filter((f) => !f.hideInTable).slice(0, 5);
  const lookupConfigs = MASTER_DATA_CONFIGS.filter((c) => c.lookupFor?.includes(config.key));
  const sectionCount = new Set(visibleFields.map((f) => f.section || "Identification")).size;
  // Business Central-style adaptive presentation: compact masters remain a
  // centred modal, while a dense or multi-card master gets a near-full-page
  // dialog with its own scrolling body and pinned actions.
  const usePageDialog = visibleFields.length > 10 || sectionCount > 3 || lookupConfigs.length > 2;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      if (search) params.set("search", search);
      if (config.supportsNobLobFilter && nobFilter) params.set("nobId", nobFilter);
      if (config.supportsNobLobFilter && lobFilter) params.set("lobId", lobFilter);
      params.set("limit", "200");
      const res = await api.get(`${config.apiBase}?${params.toString()}`);
      const list = unwrap<Row[]>(res);
      setRows(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.message || t("mdFailedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [config.key, search, nobFilter, lobFilter]);

  useEffect(() => { setPage(1); }, [config.key, search, nobFilter, lobFilter, pageSize]);

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (!config.supportsNobLobFilter || workspaceScope === "OPERATIONAL") return;
    setNobFilter("");
    setLobFilter("");
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("limit", "500");
    api.get(`/setup/wizard/nobs?${params.toString()}`).then((r) => setNobFilterOptions(unwrap<Row[]>(r) || [])).catch(() => setNobFilterOptions([]));
  }, [config.key]);

  useEffect(() => {
    if (!config.supportsNobLobFilter || !nobFilter) { setLobFilterOptions([]); return; }
    api.get(`/setup/wizard/lobs/${nobFilter}`).then((r) => setLobFilterOptions(unwrap<Row[]>(r) || [])).catch(() => setLobFilterOptions([]));
  }, [config.supportsNobLobFilter, nobFilter]);

  useEffect(() => {
    const endpoints = Array.from(
      new Set(config.fields.filter((f) => f.type === "select-entity" && f.entityEndpoint && !f.dependsOn).map((f) => f.entityEndpoint!))
    );
    endpoints.forEach(async (ep) => {
      try {
        const params = new URLSearchParams();
        if (companyId) params.set("companyId", companyId);
        params.set("limit", "500");
        // A picker must only offer rows the API will actually accept — unlike
        // the list page, which deliberately shows Active/Inactive rows so a
        // blocked one can be found and restored. isActive=true is a no-op on
        // endpoints that already always filter to active (e.g. NOB/LOB,
        // costing-method) and is honored by every findAll that carries the
        // isActive query param.
        params.set("isActive", "true");
        const res = await api.get(`${ep}?${params.toString()}`);
        const list = unwrap<Row[]>(res);
        setEntityOptions((prev) => ({ ...prev, [ep]: Array.isArray(list) ? list : [] }));
      } catch {
        setEntityOptions((prev) => ({ ...prev, [ep]: prev[ep] || [] }));
      }
    });
    // entityReloadKey is included so a lookup card's inline "Add" (e.g. a
    // new Item Category, Item Type or UOM) refetches this effect's
    // non-dependent select-entity fields — category_id, item_type,
    // uom_primary/uom_secondary all have no dependsOn, so this is the
    // effect that actually powers those dropdowns, not the dependent-fields
    // effect below.
  }, [config.key, entityReloadKey]);

  useEffect(() => {
    if (!modalOpen) return;
    const dependentFields = config.fields.filter((f) => f.type === "select-entity" && f.dependsOn);
    // entityReloadKey changing means a lookup card just created a row that a
    // dependent dropdown here may need to see. The early return below skips
    // endpoints already cached in entityOptions, which would otherwise make
    // entityReloadKey a no-op dependency - so on a genuine key change, clear
    // this effect's cached endpoints first to force a real refetch.
    const reloadKeyChanged = lastEntityReloadKeyRef.current !== entityReloadKey;
    lastEntityReloadKeyRef.current = entityReloadKey;
    if (reloadKeyChanged) {
      const eps = new Set(dependentFields.map((f) => resolveEndpoint(f, form)).filter((ep): ep is string => !!ep));
      if (eps.size) {
        setEntityOptions((prev) => {
          const next = { ...prev };
          eps.forEach((ep) => { delete next[ep]; });
          return next;
        });
      }
    }
    dependentFields.forEach(async (f) => {
      const ep = resolveEndpoint(f, form);
      if (!ep || (!reloadKeyChanged && entityOptions[ep])) return;
      try {
        // Same active-only rule as the non-dependent effect above — a picker
        // must not offer a row the API will reject. ep may already carry a
        // query string (dependsOnMode "query"), so append rather than assume.
        const activeOnlyEp = `${ep}${ep.includes("?") ? "&" : "?"}isActive=true`;
        const res = await api.get(activeOnlyEp);
        const list = unwrap<Row[]>(res);
        setEntityOptions((prev) => ({ ...prev, [ep]: Array.isArray(list) ? list : [] }));
      } catch {
        setEntityOptions((prev) => ({ ...prev, [ep]: [] }));
      }
    });
  }, [modalOpen, form, config.key, entityReloadKey]);

  const openCreate = () => {
    setEditing(null);
    const initial: Row = {};
    formFields.forEach((f) => { initial[f.key] = f.type === "boolean" ? false : ""; });
    setForm(initial);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    const initial: Row = {};
    formFields.filter((f) => !f.createOnly).forEach((f) => {
      let v = row[f.key];
      if (f.type === "json" && v && typeof v !== "string") {
        if (f.jsonListKeys && Array.isArray(v)) {
          v = v.map((entry: Row) => {
            const picked: Row = {};
            f.jsonListKeys!.forEach((k) => { if (entry[k] !== undefined) picked[k] = entry[k]; });
            return picked;
          });
        }
        v = JSON.stringify(v, null, 2);
      }
      initial[f.key] = v ?? (f.type === "boolean" ? false : "");
    });
    setForm(initial);
    setFormError("");
    setModalOpen(true);
  };

  const setField = (key: string, value: any) => setForm((prev) => {
    const next = { ...prev, [key]: value };
    if (config.key === "location" && key === "location_type" && value === "SILO") next.storage_type = "SILO";
    if (config.key === "location" && key === "storage_type" && value !== "SILO") {
      next.silo_capacity_kg = "";
      next.silo_reorder_days = "";
    }
    config.fields.forEach((f) => {
      if (parentKeys(f).includes(key) && next[f.key]) next[f.key] = "";
    });
    if (value) {
      const changedField = config.fields.find((f) => f.key === key);
      (changedField?.exclusiveWith || []).forEach((otherKey) => { next[otherKey] = ""; });
    }
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      for (const f of visibleFields) {
        if (f.filterOnly) continue;
        const v = form[f.key];
        const isEmpty = v === "" || v === undefined || v === null;
        if (isEmpty && isFieldRequired(f, form)) {
          throw new Error(`"${tLabel(f.label)}" is required.`);
        }
      }

      const payload: Row = {};
      for (const f of visibleFields) {
        if (f.filterOnly || f.readOnly) continue;
        let v = form[f.key];
        if (v === "" || v === undefined) continue;
        if (f.type === "number") v = Number(v);
        if (f.type === "json") {
          try {
            v = JSON.parse(v);
          } catch {
            throw new Error(`"${f.label}" must be valid JSON.`);
          }
        }
        payload[f.key] = v;
      }
      const hasCompanyField = config.fields.some((f) => f.key === "company_id");
      if (!editing && companyId && hasCompanyField) payload.company_id = companyId;

      if (editing) {
        await api.put(`${config.apiBase}/${editing[config.idKey]}`, payload);
      } else {
        await api.post(config.apiBase, payload);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || t("mdFailedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`${config.apiBase}/${confirmDelete[config.idKey]}`);
      setConfirmDelete(null);
      load();
    } catch (err: any) {
      setError(err?.message || t("mdFailedToDelete"));
    } finally {
      setDeleting(false);
    }
  };

  /** Toggle switch in the Status column, for entities that support restore — flips a row
   * between Active/Inactive in one click, no confirmation step (unlike the trash-icon delete
   * flow), since it's trivially reversible by clicking again. */
  const handleToggleActive = async (row: Row) => {
    const id = row[config.idKey];
    setTogglingId(id);
    try {
      if (row.is_active === false) {
        await api.patch(`${config.apiBase}/${id}/restore`);
      } else {
        await api.delete(`${config.apiBase}/${id}`);
      }
      load();
    } catch (err: any) {
      setError(err?.message || t("mdFailedToSave"));
    } finally {
      setTogglingId(null);
    }
  };

  const renderField = (f: MasterDataField) => {
    const value = form[f.key] ?? "";
    const accessibility = { id: `master-${config.key}-${f.key}`, "aria-label": tLabel(f.label), "aria-required": isFieldRequired(f, form) };
    if (f.type === "boolean") {
      return (
        <label className="flex items-center gap-2 py-2 text-sm" style={S.primary}>
          <input
            {...accessibility}
            type="checkbox"
            checked={!!value}
            onChange={(e) => setField(f.key, e.target.checked)}
            className="h-4 w-4 rounded-[var(--radius-xs)] accent-[var(--accent)]"
          />
          {tLabel(f.label)}
        </label>
      );
    }
    if (f.type === "textarea" || f.type === "json") {
      return (
        <textarea
          {...accessibility}
          value={value}
          onChange={(e) => setField(f.key, e.target.value)}
          placeholder={f.placeholder}
          rows={f.type === "json" ? 5 : 3}
          className={`${inputCls} font-mono text-xs`}
          style={S.input}
        />
      );
    }
    if (f.type === "select") {
      return (
        <select {...accessibility} value={value} onChange={(e) => setField(f.key, e.target.value)} className={`${inputCls} nf-select`} style={S.input}>
          <option value="">{t("selectPlaceholder")}</option>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (f.type === "select-entity") {
      const resolvedEp = resolveEndpoint(f, form);
      const options = resolvedEp ? entityOptions[resolvedEp] || [] : [];
      const parents = parentKeys(f);
      // "query" mode never blocks — an unset parent just narrows the results less, it
      // doesn't prevent fetching (mirrors the backend treating an absent filter as "show all").
      const disabled = f.dependsOnMode !== "query" && parents.length > 0 && !resolvedEp;
      const parentLabel = parents.map((k) => tLabel(config.fields.find((pf) => pf.key === k)?.label || k)).join(" & ");
      return (
        <select {...accessibility} value={value} onChange={(e) => setField(f.key, e.target.value)} className={`${inputCls} nf-select`} style={S.input} disabled={disabled}>
          <option value="">{disabled ? t("selectXFirst", { name: parentLabel }) : t("selectPlaceholder")}</option>
          {options.map((o) => (
            <option key={o[f.entityValueKey || "id"]} value={o[f.entityValueKey || "id"]}>
              {entityLabel(o, f)}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        {...accessibility}
        type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"}
        step={f.step}
        value={value}
        onChange={(e) => setField(f.key, e.target.value)}
        placeholder={f.readOnly && !editing ? "Generated when this record is created" : f.placeholder}
        disabled={f.readOnly}
        className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-70`}
        style={f.readOnly ? { ...S.input, backgroundColor: "var(--surface-raised)" } : S.input}
      />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* No heading here any more. The record set's name and description are
          the page's own H1 and description, rendered by PageHeader above this
          component — this used to restate both as an <h2> immediately under a
          "Master Data" <h1>, so every screen carried two titles for one thing.
          What remains is this component's own toolbar: the filters, the search
          and the create action that operate on the table below. They belong to
          the work surface, so they stay with it. Nothing about their state,
          their handlers or the requests they make has changed. */}
      {/* Left-aligned, so the controls sit under the title they belong to
          rather than drifting to the far edge now that nothing balances them
          on the left (apple.design.md §23). */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {config.supportsNobLobFilter && workspaceScope !== "OPERATIONAL" && (
            <>
              <select
                aria-label="Filter by nature of business"
                value={nobFilter}
                onChange={(e) => { setNobFilter(e.target.value); setLobFilter(""); }}
                className="nf-input-sm nf-select"
                style={S.input}
              >
                <option value="">{t("allNob")}</option>
                {nobFilterOptions.map((n) => (
                  <option key={n.nob_id} value={n.nob_id}>{n.nob_code}</option>
                ))}
              </select>
              <select
                aria-label="Filter by line of business"
                value={lobFilter}
                onChange={(e) => setLobFilter(e.target.value)}
                className="nf-input-sm nf-select"
                style={S.input}
                disabled={!nobFilter}
              >
                <option value="">{nobFilter ? t("allLob") : t("selectNobFirst")}</option>
                {lobFilterOptions.map((l) => (
                  <option key={l.lob_id} value={l.lob_id}>{l.lob_code}</option>
                ))}
              </select>
            </>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="nf-input-sm"
              // `.nf-input-sm` sets `padding` as a shorthand, which overrode
              // the `pl-8` utility that was here and left the icon sitting on
              // top of the placeholder. Setting it alongside the other inline
              // styles keeps the fix on this one field.
              style={{ ...S.input, paddingLeft: "1.75rem" }}
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Plus className="h-3.5 w-3.5" /> {t("addItem", { name: tLabel(config.label.replace(/s$/, "")) })}
          </button>
        </div>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}

      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <TableHeader>
              <tr className="border-b" style={{ borderColor: "var(--row-border)" }}>
                {columns.map((c) => (
                  <TableHead key={c.key} className="whitespace-nowrap">{tLabel(c.label)}</TableHead>
                ))}
                <TableHead className="text-right">{t("statusColumn")}</TableHead>
                <TableHead className="text-right">{t("actionsColumn")}</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <tr>
                  <TableCell colSpan={columns.length + 2} className="py-10 text-center" style={S.sub}>
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> {t("loadingEllipsis")}
                  </TableCell>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <TableCell colSpan={columns.length + 2} className="py-10 text-center" style={S.sub}>
                    <Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} />
                    {t("noRecordsYet", { name: tLabel(config.label).toLowerCase() })}
                    <button onClick={openCreate} className="mt-2 block w-full font-semibold" style={S.accent}>{t("addFirstOne")}</button>
                  </TableCell>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const inactive = row.is_active === false;
                  return (
                    <TableRow key={row[config.idKey]}>
                      {columns.map((c) => (
                        <TableCell key={c.key} className="whitespace-nowrap" style={S.primary}>{displayValue(row, c.key, t("mdYes"), t("mdNo"))}</TableCell>
                      ))}
                      <TableCell className="text-right">
                        {(config.supportsRestore ?? true) ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-semibold" style={{ color: inactive ? "var(--text-muted)" : "var(--success)" }}>
                              {inactive ? t("statusInactive") : t("statusActive")}
                            </span>
                            <button
                              role="switch"
                              aria-checked={!inactive}
                              onClick={() => handleToggleActive(row)}
                              disabled={togglingId === row[config.idKey]}
                              title={inactive ? t("restore") : t("deactivate")}
                              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-50"
                              style={{ backgroundColor: inactive ? "var(--border)" : "var(--success)" }}
                            >
                              <span
                                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                                style={{ transform: inactive ? "translateX(0.2rem)" : "translateX(1.15rem)" }}
                              />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                            style={inactive
                              ? { color: "var(--text-muted)", borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" }
                              : { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--success-muted)" }}
                          >
                            {inactive ? t("statusInactive") : t("statusActive")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(row)} title={t("edit")} className="rounded-lg p-1.5 transition hover:bg-[var(--surface-raised)]" style={S.sub}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {!(config.supportsRestore ?? true) && (
                            <button onClick={() => setConfirmDelete(row)} title={t("deactivate")} className="rounded-lg p-1.5 transition hover:bg-[var(--danger-muted)]" style={{ color: "var(--danger)" }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <div className="border-t px-2" style={{ borderColor: "var(--border)" }}>
            <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[25, 50, 100]} />
          </div>
        )}
      </div>

      {/* Master forms open in a centred window. Dense, sectioned forms use a
          near-full-page presentation like Business Central, while compact
          masters keep a conventional modal. Both retain one scrolling body,
          a pinned action footer, focus trapping and Escape handling. */}
      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? t("editItem", { name: tLabel(config.label.replace(/s$/, "")) }) : t("addItem", { name: tLabel(config.label.replace(/s$/, "")) })}
        maxWidth={sectionCount > 1 ? "xl" : "lg"}
        presentation={usePageDialog ? "page" : "modal"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || numbering.loading || !!numbering.error}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {saving ? t("saving") : editing ? t("saveChanges") : t("create")}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && <InlineAlert>{formError}</InlineAlert>}
          {numbering.error && <InlineAlert>{numbering.error}</InlineAlert>}
          {numbering.canChoose && <label className="grid gap-1 text-sm">Code Entry
            <select aria-label="Code Entry" className="nf-input nf-select" value={numbering.mode} onChange={(e) => numbering.chooseMode(e.target.value as "serial" | "manual")}>
              <option value="serial">Follow number series</option><option value="manual">Enter manually</option>
            </select>
          </label>}
          {(() => {
            const DEFAULT = "Identification";
            const order: string[] = [];
            const bySection = new Map<string, typeof visibleFields>();
            for (const f of visibleFields) {
              const s = f.section || DEFAULT;
              if (!bySection.has(s)) { bySection.set(s, []); order.push(s); }
              bySection.get(s)!.push(f);
            }
            // A master with no sections configured renders one card, which looks the
            // same as today's flat form once expanded.
            const identificationIndex = order.indexOf(DEFAULT);
            if (identificationIndex > 0) order.unshift(...order.splice(identificationIndex, 1));
            return order.map((s, i) => (
              <CollapsibleCard key={s} title={s} defaultOpen={i === 0}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {bySection.get(s)!.map((f) => (
                    <div key={f.key} className={f.type === "textarea" || f.type === "json" ? "sm:col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
                      <label htmlFor={`master-${config.key}-${f.key}`} className="nf-text-label" style={S.sub}>
                        {tLabel(f.label)}{isFieldRequired(f, form) && <span style={{ color: "var(--danger)" }}> *</span>}
                      </label>
                      {renderField(f)}
                      {f.helpText && <p className="text-[11px]" style={S.muted}>{f.helpText}</p>}
                    </div>
                  ))}
                </div>
              </CollapsibleCard>
            ));
          })()}

          {lookupConfigs.map((c) => (
              <CollapsibleCard key={c.key} title={c.label} subtitle="Add one without leaving this form">
                <LookupCard config={c} onCreated={() => setEntityReloadKey((k) => k + 1)} onManage={() => setLookupManager(c)} />
              </CollapsibleCard>
            ))}
        </div>
      </Dialog>

      <Dialog open={!!lookupManager} title={`Manage ${lookupManager?.label || ""}`} maxWidth="xl"
        onClose={() => { setLookupManager(null); setEntityReloadKey((k) => k + 1); }}>
        {lookupManager && <MasterDataTable key={lookupManager.key} config={lookupManager} />}
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        title={t("deactivateRecordTitle")}
        description={confirmDelete ? t("deactivateRecordDesc", { name: confirmDelete[columns[0]?.key] ?? confirmDelete[config.idKey], label: tLabel(config.label) }) : undefined}
        maxWidth="sm"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>
              {t("cancel")}
            </button>
            <button onClick={handleDelete} disabled={deleting} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--danger)" }}>
              {deleting ? t("deactivating") : t("deactivate")}
            </button>
          </>
        }
      >
        <p className="text-sm" style={S.sub}>{t("confirmDeactivate")}</p>
      </Dialog>
    </div>
  );
}
