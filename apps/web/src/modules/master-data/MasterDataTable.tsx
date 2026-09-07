"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Inbox, Eye } from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { InlineAlert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getActiveCompanyId, getActiveWorkspaceScope, getStoredUser } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import type { MasterDataConfig, MasterDataField } from "./types";
import { CollapsibleCard } from "./CollapsibleCard";
import { singularLabel } from "./labels";
import { LookupCard } from "./LookupCard";
import { MASTER_DATA_CONFIGS } from "./configs";
import { useCodeSeries } from "./useCodeSeries";
import { MasterRecordView } from "./MasterRecordView";
import { BcOwnershipNotice } from "./BcOwnershipNotice";

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
    // entityEndpoint may already carry a query string (e.g.
    // "/item-category?rootOnly=true"), so append rather than assume — the same
    // rule the option-fetch effects use. Hardcoding "?" here would produce
    // "...?rootOnly=true?itemType=X" and the first value would swallow the rest.
    return qs ? `${f.entityEndpoint}${f.entityEndpoint.includes("?") ? "&" : "?"}${qs}` : f.entityEndpoint;
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

/**
 * Normalizes a "string-list" field's stored value into chip-editor state. Handles the
 * already-parsed-array shape the API returns, a JSON-encoded string (in case a raw value ever
 * round-trips through text), and anything else (null, a JSON string rather than an array, or
 * invalid JSON) by falling back to an empty list rather than throwing.
 */
function parseStringList(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string" && v.trim() !== "") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function MasterDataTable({ config }: { config: MasterDataConfig }) {
  const { t, tLabel } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [entityOptions, setEntityOptions] = useState<Record<string, Row[]>>({});
  // Per derived field: "found" when the source master already holds the value
  // (so it is filled and locked), "missing" when it does not (so it is asked
  // for here and recorded), undefined while the parents are incomplete.
  const [derived, setDerived] = useState<Record<string, "found" | "missing">>({});

  const [nobFilterOptions, setNobFilterOptions] = useState<Row[]>([]);
  const [lobFilterOptions, setLobFilterOptions] = useState<Row[]>([]);
  const [nobFilter, setNobFilter] = useState("");
  const [lobFilter, setLobFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [form, setForm] = useState<Row>({});
  // Pending, not-yet-added input text for each "string-list" field's chip editor, keyed by field key.
  const [chipDrafts, setChipDrafts] = useState<Record<string, string>>({});
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
  // BBP-1 §1.5 and §1.6 put Items and the Chart of Accounts in Business Central:
  // "NAVFarm cannot create items independently", "NAVFarm does NOT maintain its own
  // Chart of Accounts". That integration is not built, so until it is, these stay
  // locally editable and the notice states the blueprint's position rather than
  // the screen pretending a BC connection exists. Rishi's call, 2026-09-06.
  const bcOwned = config.owner === "BC";
  const administrationRestricted = !!config.businessAdminOnly && !["TENANT_ADMIN", "COMPANY_ADMIN"].includes(getStoredUser()?.userType || "");
  const readOnly = administrationRestricted;
  const numbering = useCodeSeries(config.key, form, modalOpen && !editing);
  // A failed code preview used to disable Create outright. For a master whose
  // code is optional — UOM Conversion says "leave blank until the numbering
  // convention is agreed" — that made an unrelated preview problem block the
  // whole record. Only a mandatory code can stop a save; otherwise the message
  // stands as a warning and the row saves without a code.
  const codeIsMandatory = !!config.fields.find((f) => f.key === numbering.codeKey)?.required;
  const numberingBlocks = !!numbering.error && codeIsMandatory;
  // A derived field is read-only once its source master supplies the value, and
  // required while it does not — that is the moment the number is captured.
  const applyDerived = (f: MasterDataField): MasterDataField => {
    if (!f.derivedFrom) return f;
    const state = derived[f.key];
    if (state === "found") return { ...f, readOnly: true, required: false, helpText: `From ${f.derivedFrom.endpoint.replace(/^\//, "")} — the stored factor for these units.` };
    if (state === "missing") return { ...f, readOnly: false, required: true, helpText: f.derivedFrom.missingHelpText || f.helpText };
    return { ...f, readOnly: true, helpText: f.helpText };
  };
  const formFields = config.fields.map(numbering.field).map(applyDerived).filter((f) => !f.hideInForm && !(workspaceScope === "OPERATIONAL" && ["nob_id", "lob_id"].includes(f.key)));
  // A requiresParent field is offered only once it can actually be filtered, and
  // only if that filter leaves something to choose. Before this, Sub Category
  // listed every category in the tenant while no Category was selected.
  const parentSatisfied = (f: MasterDataField) =>
    !f.requiresParent || parentKeys(f).every((k) => !!form[k]);
  const hasChoices = (f: MasterDataField) => {
    if (!f.requiresParent) return true;
    const ep = resolveEndpoint(f, form);
    const loaded = ep ? entityOptions[ep] : undefined;
    // Undefined means the fetch has not resolved yet — keep the field so it does
    // not flicker in and out; an empty array is a real "nothing to choose".
    return loaded === undefined || loaded.length > 0;
  };
  // A master can be exhausted: Number Series takes exactly one row per master,
  // so once every master has one there is nothing left to add and the button
  // should go rather than open a form whose only required picker is empty.
  // Driven by the same endpoint the picker uses, so the two cannot disagree.
  const exhaustingField = config.fields.find((f) => f.required && f.createOnly && f.type === "select-entity" && f.entityEndpoint);
  const exhausted = (() => {
    if (!exhaustingField?.entityEndpoint) return false;
    const loaded = entityOptions[exhaustingField.entityEndpoint];
    return Array.isArray(loaded) && loaded.length === 0;
  })();

  const visibleFields = (editing ? formFields.filter((f) => !f.createOnly) : formFields.filter((f) => !f.editOnly))
    .filter((f) => !f.visibleWhen || isFieldRequired({ ...f, required: false, requiredWhen: f.visibleWhen }, form))
    .filter((f) => parentSatisfied(f) && hasChoices(f));
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
    // Includes the select-entity columns nested inside a jsonRow, whose
    // dropdowns are otherwise never populated because they are not top-level
    // fields.
    const endpoints = Array.from(
      new Set([...config.fields, ...config.fields.flatMap((f) => f.jsonRow || [])]
        .filter((f) => f.type === "select-entity" && f.entityEndpoint && !f.dependsOn)
        .map((f) => f.entityEndpoint!))
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
        // ep may already carry a query string (e.g. "/item?itemType=LIVING_ASSET"),
        // so append rather than assume — the same rule the dependent-field effect
        // below uses. Hardcoding "?" produced "/item?itemType=X?companyId=..." and
        // the filter value silently swallowed the rest of the query.
        const res = await api.get(`${ep}${ep.includes("?") ? "&" : "?"}${params.toString()}`);
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

  // Fill a derivedFrom field from its source master. The Item Master Template
  // says the UOM Conversion Factor is "Auto-filled from uom_conversion_master",
  // so when that table already holds the pair the number is shown and locked;
  // when it does not, the field stays open so the factor is captured once, here,
  // and saved into UOM Conversion rather than living only on the item.
  useEffect(() => {
    if (!modalOpen) return;
    let cancelled = false;
    for (const f of config.fields.filter((x) => x.derivedFrom)) {
      const d = f.derivedFrom!;
      const params = new URLSearchParams();
      let complete = true;
      for (const [fieldKey, paramName] of Object.entries(d.params)) {
        const v = form[fieldKey];
        if (!v) { complete = false; break; }
        params.set(paramName, String(v));
      }
      if (!complete) {
        setDerived((prev) => (prev[f.key] === undefined ? prev : { ...prev, [f.key]: undefined as any }));
        continue;
      }
      if (companyId) params.set("companyId", companyId);
      api.get(`${d.endpoint}${d.endpoint.includes("?") ? "&" : "?"}${params}`).then((res: any) => {
        if (cancelled) return;
        const rows = unwrap<Row[]>(res) || [];
        const hit = Array.isArray(rows) ? rows[0] : undefined;
        if (hit && hit[d.valueKey] != null) {
          setDerived((prev) => ({ ...prev, [f.key]: "found" }));
          setForm((prev) => ({ ...prev, [f.key]: String(hit[d.valueKey]) }));
        } else {
          setDerived((prev) => ({ ...prev, [f.key]: "missing" }));
        }
      }).catch(() => { if (!cancelled) setDerived((prev) => ({ ...prev, [f.key]: "missing" })); });
    }
    return () => { cancelled = true; };
    // Re-runs when a parent value changes: the fields named in every
    // derivedFrom's params are the real dependency.
  }, [modalOpen, companyId, config.key,
      ...config.fields.filter((x) => x.derivedFrom).flatMap((x) => Object.keys(x.derivedFrom!.params).map((k) => form[k]))]);

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
    if (readOnly) return;
    setEditing(null);
    const initial: Row = {};
    formFields.forEach((f) => { initial[f.key] = f.type === "boolean" ? false : f.type === "string-list" || f.multiple ? [] : ""; });
    setForm(initial);
    setFormError("");
    setChipDrafts({});
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    if (readOnly) return;
    setEditing(row);
    const initial: Row = {};
    formFields.filter((f) => !f.createOnly).forEach((f) => {
      let v = row[f.key];
      if (f.type === "string-list" || f.multiple) {
        initial[f.key] = parseStringList(v);
        return;
      }
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
    setChipDrafts({});
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
    if (readOnly) return;
    setSaving(true);
    setFormError("");
    try {
      for (const f of visibleFields) {
        if (f.filterOnly) continue;
        const v = form[f.key];
        const isEmpty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
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
      if (!editing) numbering.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (readOnly) return;
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
    if (readOnly) return;
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
    const value = numbering.value(f.key, form[f.key] ?? "") as any;
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
    if (f.type === "string-list") {
      const list: string[] = Array.isArray(value) ? value : [];
      const draft = chipDrafts[f.key] ?? "";
      const addChip = () => {
        const trimmed = draft.trim();
        if (!trimmed) return;
        if (!list.includes(trimmed)) setField(f.key, [...list, trimmed]);
        setChipDrafts((prev) => ({ ...prev, [f.key]: "" }));
      };
      const removeChip = (idx: number) => setField(f.key, list.filter((_, i) => i !== idx));
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              {...accessibility}
              type="text"
              value={draft}
              onChange={(e) => setChipDrafts((prev) => ({ ...prev, [f.key]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addChip(); }
              }}
              placeholder={f.placeholder}
              className={inputCls}
              style={S.input}
            />
            <button
              type="button"
              onClick={addChip}
              className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={S.surface}
            >
              {t("mdAdd")}
            </button>
          </div>
          {list.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {list.map((val, idx) => (
                <span
                  key={`${val}-${idx}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                  style={S.surface}
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => removeChip(idx)}
                    aria-label={`Remove ${val}`}
                    className="leading-none"
                    style={S.muted}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }
    // A json array with a declared row shape is edited as rows of real inputs.
    // The stored value stays JSON, so nothing about the API changes — only the
    // way it is produced. Typing JSON by hand is how a trailing comma becomes a
    // rejected save with nothing useful to say about it.
    if (f.type === "json" && f.jsonRow?.length) {
      let rows: Row[] = [];
      try { const parsed = value ? JSON.parse(value) : []; if (Array.isArray(parsed)) rows = parsed; } catch { rows = []; }
      const broken = !!value && rows.length === 0 && value.trim() !== "[]" && value.trim() !== "";
      const write = (next: Row[]) => setField(f.key, JSON.stringify(next));
      return (
        <div className="flex flex-col gap-2">
          {broken && <InlineAlert>This entry is not a JSON array, so it cannot be shown as rows. Clear it to start again.</InlineAlert>}
          {rows.map((row, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg border p-2" style={S.raised}>
              {f.jsonRow!.map((col) => (
                <label key={col.key} className="flex min-w-[8rem] flex-1 flex-col gap-1">
                  <span className="text-[11px] font-medium" style={S.sub}>{tLabel(col.label)}</span>
                  {col.type === "select-entity" ? (
                    <select className={`${inputCls} nf-select`} style={S.input} disabled={readOnly}
                      value={String(row[col.key] ?? "")}
                      onChange={(e) => write(rows.map((r, i) => i === idx ? { ...r, [col.key]: e.target.value } : r))}>
                      <option value="">{t("selectPlaceholder")}</option>
                      {(entityOptions[col.entityEndpoint || ""] || []).map((o) => (
                        <option key={String(o[col.entityValueKey || "id"])} value={String(o[col.entityValueKey || "id"])}>
                          {(col.entityLabelKeys || []).map((k) => o[k]).filter(Boolean).join(" — ") || String(o[col.entityValueKey || "id"])}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className={inputCls} style={S.input} disabled={readOnly}
                      type={col.type === "number" ? "number" : "text"} step={col.step} placeholder={col.placeholder}
                      value={String(row[col.key] ?? "")}
                      onChange={(e) => write(rows.map((r, i) => i === idx ? { ...r, [col.key]: col.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value } : r))} />
                  )}
                </label>
              ))}
              {!readOnly && <button type="button" onClick={() => write(rows.filter((_, i) => i !== idx))}
                className="rounded-lg border px-2 py-1.5 text-xs font-medium" style={{ ...S.surface, color: "var(--danger)" }}>
                {t("mdRemoveRow")}
              </button>}
            </div>
          ))}
          {!readOnly && <button type="button" onClick={() => write([...rows, {}])}
            className="self-start rounded-lg border px-3 py-1.5 text-xs font-semibold" style={S.surface}>
            <Plus className="mr-1 inline h-3 w-3" />{rows.length ? t("mdAddMore") : t("mdAdd")}
          </button>}
        </div>
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
      if (f.multiple) {
        // A real multi-select rather than a column of checkboxes: with eight
        // stages the checkbox list was taller than the rest of the form, and it
        // read as a settings panel rather than one field. Chosen values show as
        // removable chips so the selection is legible without opening the list.
        const selected = parseStringList(form[f.key]);
        const missing = selected.filter((key) => !options.some((option) => option[f.entityValueKey || "id"] === key));
        const unselected = options.filter((o) => !selected.includes(String(o[f.entityValueKey || "id"])));
        return <div className="flex flex-col gap-2">
          {(selected.length > 0) && <div className="flex flex-wrap gap-1.5">
            {selected.map((key) => {
              const option = options.find((o) => String(o[f.entityValueKey || "id"]) === key);
              return <span key={key} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs" style={S.raised}>
                {option ? entityLabel(option, f) : `${key} — unavailable in active catalog`}
                {!f.readOnly && <button type="button" aria-label={`Remove ${key}`} onClick={() => setField(f.key, selected.filter((entry) => entry !== key))}
                  className="font-semibold" style={{ color: "var(--danger)" }}>×</button>}
              </span>;
            })}
          </div>}
          <select {...accessibility} value="" disabled={disabled || f.readOnly || !unselected.length}
            className={`${inputCls} nf-select`} style={S.input}
            onChange={(e) => { if (e.target.value) setField(f.key, [...selected, e.target.value]); }}>
            <option value="">{!options.length ? t("selectPlaceholder") : unselected.length ? t("selectPlaceholder") : ""}</option>
            {unselected.map((o) => (
              <option key={String(o[f.entityValueKey || "id"])} value={String(o[f.entityValueKey || "id"])}>{entityLabel(o, f)}</option>
            ))}
          </select>
          {!!missing.length && <p className="text-xs" style={S.muted}>{missing.length} selected value(s) are not in the active catalog.</p>}
        </div>;
      }
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
        placeholder={f.placeholder}
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
          {!readOnly && !exhausted && <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Plus className="h-3.5 w-3.5" /> {t("addItem", { name: tLabel(singularLabel(config)) })}
          </button>}
        </div>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}

      {bcOwned && <BcOwnershipNotice config={config} />}
      {administrationRestricted && <p className="rounded-lg border p-3 text-sm" style={S.raised}>Only a Tenant Admin or Company Admin can add, edit or deactivate reasons. You can view the shared catalog here.</p>}
      {bcOwned && lookupConfigs.length > 0 && <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-(--text-muted)">Related NAVFarm setup:</span>
        {lookupConfigs.filter((c) => c.owner !== "BC").map((c) => <button key={c.key} type="button"
          className="text-xs underline" onClick={() => setLookupManager(c)}>Manage {c.label}</button>)}
      </div>}

      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <TableHeader>
              <tr className="border-b" style={{ borderColor: "var(--row-border)" }}>
                {columns.map((c) => (
                  <TableHead key={c.key} className="whitespace-nowrap">{tLabel(c.label)}</TableHead>
                ))}
                {/* "Active", not "Status". This column is the record's own
                    active/deactivated flag — the switch below it. Several
                    masters carry a domain status of their own that the client's
                    templates name "Status": Animal Register's is ACTIVE /
                    QUARANTINE / SICK / PREGNANT / LACTATING / DRY / CULLED /
                    DEAD / SOLD / SLAUGHTERED, mandatory, per its template. With
                    both headers reading "Status" that screen showed two columns
                    of the same name saying different things. The client's word
                    stays on the client's field. */}
                <TableHead className="text-right">{t("activeColumn")}</TableHead>
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
                    {!readOnly && <button onClick={openCreate} className="mt-2 block w-full font-semibold" style={S.accent}>{t("addFirstOne")}</button>}
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
                        {!readOnly && (config.supportsRestore ?? true) ? (
                          <div className="flex items-center justify-end">
                            {/* The switch alone. It carried a text label beside
                                it saying Active/Inactive — the same fact the
                                switch's own position and colour already state,
                                twice in one cell. Screen readers were the only
                                audience for that text and they get it from
                                aria-checked instead. */}
                            <button
                              role="switch"
                              aria-checked={!inactive}
                              aria-label={String(row[columns[0]?.key] ?? tLabel(config.label))}
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
                          <button onClick={() => setViewingId(String(row[config.idKey]))} aria-label={`View ${singularLabel(config)}`} title="View" className="rounded-lg p-1.5 transition hover:bg-[var(--surface-raised)]" style={S.sub}>
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {!readOnly && <button onClick={() => openEdit(row)} title={t("edit")} className="rounded-lg p-1.5 transition hover:bg-[var(--surface-raised)]" style={S.sub}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>}
                          {!readOnly && !(config.supportsRestore ?? true) && (
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

      {viewingId && <MasterRecordView config={config} id={viewingId} onClose={() => setViewingId(null)} />}

      {/* Master forms open in a centred window. Dense, sectioned forms use a
          near-full-page presentation like Business Central, while compact
          masters keep a conventional modal. Both retain one scrolling body,
          a pinned action footer, focus trapping and Escape handling. */}
      <Dialog
        open={modalOpen && !readOnly}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? t("editItem", { name: tLabel(singularLabel(config)) }) : t("addItem", { name: tLabel(singularLabel(config)) })}
        maxWidth={sectionCount > 1 ? "xl" : "lg"}
        presentation={usePageDialog ? "page" : "modal"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || numbering.loading || numberingBlocks}
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
              // Open the first card, and any card holding a field the form
              // will refuse to save without. Primary UOM is required and lives
              // in "Units & Valuation", so with only the first card open a
              // mandatory field sat collapsed below optional ones like Storage
              // Temp — invisible until you went looking for it.
              <CollapsibleCard key={s} title={s} defaultOpen={i === 0 || bySection.get(s)!.some((f) => isFieldRequired(f, form))}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {bySection.get(s)!.map((f) => (
                    <div key={f.key} className={f.type === "textarea" || f.type === "json" || f.type === "string-list" ? "sm:col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
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
                <LookupCard config={c} onCreated={() => { setEntityReloadKey((k) => k + 1); numbering.refresh(); }} onManage={() => setLookupManager(c)} />
              </CollapsibleCard>
            ))}
        </div>
      </Dialog>

      <Dialog open={!!lookupManager} title={`Manage ${lookupManager?.label || ""}`} maxWidth="xl"
        onClose={() => { setLookupManager(null); setEntityReloadKey((k) => k + 1); numbering.refresh(); }}>
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
