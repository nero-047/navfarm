"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api-client";
import type { MasterDataConfig } from "./types";

// `Row` is a local alias in MasterDataTable.tsx and is not exported from
// types.ts, so it is redeclared here rather than imported.
type Row = Record<string, any>;

/**
 * A lookup master rendered inside its parent's dialog. Saves immediately, as
 * Business Central does: the category exists the moment it is added, even if
 * the item dialog is then cancelled.
 */
export function LookupCard({
  config, onCreated,
}: {
  config: MasterDataConfig;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<Row>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Only the required, directly-typed fields. A lookup's own nested entity
  // pickers are out of scope here - it stays a small, fast form. "select" is
  // included (alongside text/textarea/number) because some lookups (e.g.
  // UOM's uom_type) have a required select field - leaving it out would let
  // the form report "complete" without it and 400 on save.
  const fields = config.fields.filter(
    (f) => !f.hideInForm && f.required && (f.type === "text" || f.type === "textarea" || f.type === "number" || f.type === "select"),
  );

  const add = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post(config.apiBase, form);
      setForm({});
      onCreated();
    } catch (e: any) {
      setError(e?.message || "Could not add");
    } finally {
      setBusy(false);
    }
  };

  const complete = fields.every((f) => String(form[f.key] ?? "").trim() !== "");

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="grid gap-1">
            <span className="text-xs font-medium">{f.label}</span>
            {f.type === "select" ? (
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
                value={String(form[f.key] ?? "")}
                placeholder={f.placeholder}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            )}
          </label>
        ))}
      </div>
      {error ? (
        <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
      ) : null}
      <div>
        <Button type="button" size="sm" onClick={add} disabled={busy || !complete}>
          {busy ? "Adding…" : `Add ${config.label}`}
        </Button>
      </div>
    </div>
  );
}
