"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, AlertCircle, Loader2, Inbox } from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { getActiveCompanyId } from "@/hooks/useAuth";
import type { MasterDataConfig, MasterDataField } from "./types";

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

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-(--input-border-focus)";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

function entityLabel(row: Row, field: MasterDataField): string {
  const keys = field.entityLabelKeys || [];
  const text = keys.map((k) => row[k]).filter(Boolean).join(" — ");
  return text || row[field.entityValueKey || "id"];
}

function displayValue(row: Row, key: string): string {
  const v = row[key];
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function MasterDataTable({ config }: { config: MasterDataConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [entityOptions, setEntityOptions] = useState<Record<string, Row[]>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const companyId = getActiveCompanyId();
  const formFields = config.fields.filter((f) => !f.hideInForm);
  const columns = config.columns || config.fields.filter((f) => !f.hideInTable).slice(0, 5);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      if (search) params.set("search", search);
      params.set("limit", "200");
      const res = await api.get(`${config.apiBase}?${params.toString()}`);
      const list = unwrap<Row[]>(res);
      setRows(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.key, search]);

  useEffect(() => {
    const endpoints = Array.from(
      new Set(config.fields.filter((f) => f.type === "select-entity" && f.entityEndpoint).map((f) => f.entityEndpoint!))
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
    formFields.forEach((f) => {
      let v = row[f.key];
      if (f.type === "json" && v && typeof v !== "string") v = JSON.stringify(v, null, 2);
      initial[f.key] = v ?? (f.type === "boolean" ? false : "");
    });
    setForm(initial);
    setFormError("");
    setModalOpen(true);
  };

  const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      const payload: Row = {};
      for (const f of formFields) {
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
      setFormError(err?.message || "Failed to save record.");
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
      setError(err?.message || "Failed to delete record.");
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
          {f.label}
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
        <select value={value} onChange={(e) => setField(f.key, e.target.value)} className={inputCls} style={S.input}>
          <option value="">Select…</option>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (f.type === "select-entity") {
      const options = entityOptions[f.entityEndpoint || ""] || [];
      return (
        <select value={value} onChange={(e) => setField(f.key, e.target.value)} className={inputCls} style={S.input}>
          <option value="">Select…</option>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={S.primary}>{config.label}</h2>
          {config.description && <p className="mt-0.5 text-xs" style={S.sub}>{config.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none"
              style={S.input}
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Plus className="h-3.5 w-3.5" /> Add {config.label.replace(/s$/, "")}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ ...S.sub, borderColor: "var(--border)" }}>
                {columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-3">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-xs" style={S.sub}>
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-xs" style={S.sub}>
                    <Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No {config.label.toLowerCase()} yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
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
                            : { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--accent-muted)" }}
                        >
                          {inactive ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(row)} title="Edit" className="rounded-lg p-1.5 transition hover:bg-(--surface-raised)" style={S.sub}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(row)} title="Deactivate" className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50">
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
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? `Edit ${config.label.replace(/s$/, "")}` : `Add ${config.label.replace(/s$/, "")}`}
        maxWidth="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Create"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {formError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formFields.map((f) => (
              <div key={f.key} className={f.type === "textarea" || f.type === "json" ? "sm:col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>
                  {f.label}{f.required && <span className="text-red-500"> *</span>}
                </label>
                {renderField(f)}
                {f.helpText && <p className="text-[11px]" style={S.muted}>{f.helpText}</p>}
              </div>
            ))}
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        title="Deactivate record"
        description={confirmDelete ? `This will remove "${confirmDelete[columns[0]?.key] ?? confirmDelete[config.idKey]}" from ${config.label}. This can't be undone from this screen.` : undefined}
        maxWidth="sm"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {deleting ? "Deactivating…" : "Deactivate"}
            </button>
          </>
        }
      >
        <p className="text-sm" style={S.sub}>Please confirm you want to deactivate this record.</p>
      </Dialog>
    </div>
  );
}
