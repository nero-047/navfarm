"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api-client";
import { getActiveCompanyId, getActiveWorkspaceScope } from "@/hooks/useAuth";
import type { MasterDataConfig, MasterDataField } from "./types";
import { singularLabel } from "./labels";
import { useCodeSeries } from "./useCodeSeries";

// `Row` is a local alias in MasterDataTable.tsx and is not exported from
// types.ts, so it is redeclared here rather than imported.
type Row = Record<string, any>;

function LookupEntitySelect({ field, value, onChange }: {
  field: MasterDataField;
  value: string;
  onChange: (value: string) => void;
}) {
  const [options, setOptions] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const companyId = getActiveWorkspaceScope() === "TENANT" ? null : getActiveCompanyId();
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ limit: "200", isActive: "true" });
    if (companyId) params.set("companyId", companyId);
    setLoading(true);
    setError("");
    api.get(`${field.entityEndpoint}?${params}`).then((res: any) => {
      if (!cancelled) setOptions(Array.isArray(res) ? res : res?.data || []);
    }).catch((err: Error) => {
      if (!cancelled) setError(err.message || "Could not load options");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [field.entityEndpoint, companyId]);
  return (
    <>
      <select aria-label={field.label} className="nf-input nf-select" value={value} disabled={loading || !!error} onChange={(event) => onChange(event.target.value)}>
        <option value="">{loading ? "Loading…" : "Select…"}</option>
        {options.map((row) => (
          <option key={row[field.entityValueKey || "id"]} value={row[field.entityValueKey || "id"]}>
            {(field.entityLabelKeys || []).map((key) => row[key]).filter(Boolean).join(" — ") || row[field.entityValueKey || "id"]}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-(--danger)">{error}</span>}
    </>
  );
}

/**
 * A lookup master rendered inside its parent's dialog. Saves immediately, as
 * Business Central does: the category exists the moment it is added, even if
 * the item dialog is then cancelled.
 */
export function LookupCard({
  config, onCreated, onManage,
}: {
  config: MasterDataConfig;
  onCreated: () => void;
  onManage: () => void;
}) {
  const [form, setForm] = useState<Row>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Include every required creation field: recipes need item/UOM selectors
  // and ingredients as well as their code and name.
  const numbering = useCodeSeries(config.key, form);
  const fields = config.fields.filter((f) => f.required || f.showInLookup).map(numbering.field).filter(
    (f) => !f.hideInForm && !f.readOnly && !f.editOnly && !f.filterOnly && !(getActiveWorkspaceScope() === "OPERATIONAL" && ["nob_id", "lob_id"].includes(f.key)),
  );

  const add = async () => {
    setBusy(true);
    setError("");
    try {
      const cid = getActiveWorkspaceScope() === "TENANT" ? null : getActiveCompanyId();
      const body: Row = {};
      for (const field of fields) {
        const value = form[field.key];
        if (value === undefined || value === "") continue;
        if (field.type === "json") {
          try { body[field.key] = JSON.parse(value); }
          catch { throw new Error(`${field.label} must contain valid JSON.`); }
        } else if (field.type === "number") {
          body[field.key] = Number(value);
          if (!Number.isFinite(body[field.key])) throw new Error(`${field.label} must be a number.`);
        } else body[field.key] = value;
      }
      if (cid && config.fields.some((f) => f.key === "company_id")) body.company_id = cid;
      await api.post(config.apiBase, body);
      setForm({});
      onCreated();
    } catch (e: any) {
      setError(e?.message || "Could not add");
    } finally {
      setBusy(false);
    }
  };

  const complete = fields.filter((f) => f.required).every((f) => String(form[f.key] ?? "").trim() !== "");

  return (
    <div className="grid gap-3">
      {numbering.canChoose && <label className="grid gap-1 text-sm">Code Entry
        <select aria-label="Code Entry" className="nf-input nf-select" value={numbering.mode} onChange={(e) => numbering.chooseMode(e.target.value as "serial" | "manual")}>
          <option value="serial">Follow number series</option><option value="manual">Enter manually</option>
        </select>
      </label>}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="grid gap-1">
            <span className="text-xs font-medium">{f.label}</span>
            {f.type === "select-entity" ? (
              <LookupEntitySelect field={f} value={String(form[f.key] ?? "")} onChange={(value) => setForm((p) => ({ ...p, [f.key]: value }))} />
            ) : f.type === "json" || f.type === "textarea" ? (
              <textarea className="nf-input" rows={4} value={String(form[f.key] ?? "")} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} />
            ) : f.type === "boolean" ? (
              <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.checked }))} />
            ) : f.type === "select" ? (
              <select
                value={String(form[f.key] ?? "")}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className="nf-input nf-select"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" }}
              >
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <Input
                aria-label={f.label}
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "email" ? "email" : "text"}
                step={f.step}
                value={String(form[f.key] ?? "")}
                placeholder={f.placeholder}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            )}
            {f.helpText && <span className="text-xs text-(--text-muted)">{f.helpText}</span>}
          </label>
        ))}
      </div>
      {error ? (
        <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
      ) : null}
      {numbering.error && <p className="text-xs text-(--danger)">{numbering.error}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        <Button type="button" size="sm" onClick={add} disabled={busy || !complete || numbering.loading || !!numbering.error}>
          {busy ? "Adding…" : `Add ${singularLabel(config)}`}
        </Button>
        <button type="button" onClick={onManage} className="text-xs underline text-(--text-secondary)">
          Manage {config.label}
        </button>
      </div>
    </div>
  );
}
