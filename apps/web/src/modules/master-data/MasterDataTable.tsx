"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Inbox } from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { InlineAlert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import type { MasterDataConfig, MasterDataField } from "./types";

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

function displayValue(row: Row, key: string): string {
  const v = row[key];
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
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

  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const companyId = getActiveCompanyId();
  const formFields = config.fields.filter((f) => !f.hideInForm);
  const visibleFields = editing ? formFields.filter((f) => !f.createOnly) : formFields;
  const columns = config.columns || config.fields.filter((f) => !f.hideInTable).slice(0, 5);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.key, search, nobFilter, lobFilter]);

  useEffect(() => { setPage(1); }, [config.key, search, nobFilter, lobFilter, pageSize]);

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (!config.supportsNobLobFilter) return;
    setNobFilter("");
    setLobFilter("");
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("limit", "500");
    api.get(`/setup/wizard/nobs?${params.toString()}`).then((r) => setNobFilterOptions(unwrap<Row[]>(r) || [])).catch(() => setNobFilterOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const res = await api.get(`${ep}?${params.toString()}`);
        const list = unwrap<Row[]>(res);
        setEntityOptions((prev) => ({ ...prev, [ep]: Array.isArray(list) ? list : [] }));
      } catch {
        setEntityOptions((prev) => ({ ...prev, [ep]: prev[ep] || [] }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.key]);

  useEffect(() => {
    if (!modalOpen) return;
    const dependentFields = config.fields.filter((f) => f.type === "select-entity" && f.dependsOn);
    dependentFields.forEach(async (f) => {
      const ep = resolveEndpoint(f, form);
      if (!ep || entityOptions[ep]) return;
      try {
        const res = await api.get(ep);
        const list = unwrap<Row[]>(res);
        setEntityOptions((prev) => ({ ...prev, [ep]: Array.isArray(list) ? list : [] }));
      } catch {
        setEntityOptions((prev) => ({ ...prev, [ep]: [] }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, form, config.key]);

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
      const payload: Row = {};
      for (const f of visibleFields) {
        if (f.filterOnly) continue;
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

  const renderField = (f: MasterDataField) => {
    const value = form[f.key] ?? "";
    if (f.type === "boolean") {
      return (
        <label className="flex items-center gap-2 py-2 text-sm" style={S.primary}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => setField(f.key, e.target.checked)}
            className="h-4 w-4 rounded accent-(--accent)"
          />
          {tLabel(f.label)}
        </label>
      );
    }
    if (f.type === "textarea" || f.type === "json") {
      return (
        <textarea
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
        <select value={value} onChange={(e) => setField(f.key, e.target.value)} className={`${inputCls} nf-select`} style={S.input}>
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
        <select value={value} onChange={(e) => setField(f.key, e.target.value)} className={`${inputCls} nf-select`} style={S.input} disabled={disabled}>
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
        type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"}
        step={f.step}
        value={value}
        onChange={(e) => setField(f.key, e.target.value)}
        placeholder={f.placeholder}
        className={inputCls}
        style={S.input}
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
          {config.supportsNobLobFilter && (
            <>
              <select
                value={nobFilter}
                onChange={(e) => setNobFilter(e.target.value)}
                className="nf-input-sm nf-select"
                style={S.input}
              >
                <option value="">{t("allNob")}</option>
                {nobFilterOptions.map((n) => (
                  <option key={n.nob_id} value={n.nob_id}>{n.nob_code}</option>
                ))}
              </select>
              <select
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
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Plus className="h-3.5 w-3.5" /> {t("addItem", { name: tLabel(config.label.replace(/s$/, "")) })}
          </button>
        </div>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}

      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-semibold uppercase tracking-wider" style={{ ...S.sub, borderColor: "var(--border)" }}>
                {columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-3">{tLabel(c.label)}</th>
                ))}
                <th className="px-4 py-3 text-right">{t("statusColumn")}</th>
                <th className="px-4 py-3 text-right">{t("actionsColumn")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-xs" style={S.sub}>
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> {t("loadingEllipsis")}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-xs" style={S.sub}>
                    <Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} />
                    {t("noRecordsYet", { name: tLabel(config.label).toLowerCase() })}
                    <button onClick={openCreate} className="mt-2 block w-full font-semibold" style={S.accent}>{t("addFirstOne")}</button>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const inactive = row.is_active === false;
                  return (
                    <tr key={row[config.idKey]} className="border-b text-xs transition-colors hover:bg-(--surface-raised)" style={{ borderColor: "var(--border)" }}>
                      {columns.map((c) => (
                        <td key={c.key} className="whitespace-nowrap px-4 py-3" style={S.primary}>{displayValue(row, c.key)}</td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={inactive
                            ? { color: "var(--text-muted)", borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" }
                            : { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--success-muted)" }}
                        >
                          {inactive ? t("statusInactive") : t("statusActive")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(row)} title={t("edit")} className="rounded-lg p-1.5 transition hover:bg-(--surface-raised)" style={S.sub}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(row)} title={t("deactivate")} className="rounded-lg p-1.5 transition hover:bg-(--danger-muted)" style={{ color: "var(--danger)" }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <div className="border-t px-2" style={{ borderColor: "var(--border)" }}>
            <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[25, 50, 100]} />
          </div>
        )}
      </div>

      {/* A record create/edit form, which is the drawer case in the taxonomy
          (plan Phase 5): these configs run to a dozen fields, well past the
          0–2 a dialog is for. Nothing inside changed — the same fields, the
          same `handleSave`, the same validation and the same requests. Only
          the surface moved, from a centred modal to a work panel beside the
          table it edits, with the actions pinned below a scrolling body. */}
      <Drawer
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? t("editItem", { name: tLabel(config.label.replace(/s$/, "")) }) : t("addItem", { name: tLabel(config.label.replace(/s$/, "")) })}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleFields.map((f) => (
              <div key={f.key} className={f.type === "textarea" || f.type === "json" ? "sm:col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>
                  {tLabel(f.label)}{f.required && <span className="text-(--danger)"> *</span>}
                </label>
                {renderField(f)}
                {f.helpText && <p className="text-[11px]" style={S.muted}>{f.helpText}</p>}
              </div>
            ))}
          </div>
        </div>
      </Drawer>

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
