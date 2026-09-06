"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api-client";
import type { MasterDataField } from "./types";
import { getActiveCompanyId, getActiveWorkspaceScope, getActiveOperationalAreaId } from "@/hooks/useAuth";

const CODE_SERIES: Record<string, [string, string, string?]> = {
  reason: ["REASON", "reason_code"],
  animal: ["ANIMAL", "animal_code"],
  species: ["SPECIES", "species_code"],
  "item-attribute": ["ITEM_ATTRIBUTE", "attribute_code"],
  "location-type": ["LOCATION_TYPE", "type_code"],
  item: ["ITEM", "item_code", "item_type"],
  supplier: ["SUPPLIER", "supplier_code"],
  customer: ["CUSTOMER", "customer_code"],
  resource: ["RESOURCE", "resource_code"],
  location: ["LOCATION", "location_code", "location_type"],
  breed: ["BREED", "breed_code", "breed_type"],
  disease: ["DISEASE", "disease_code"],
  "feed-formula": ["FEED_FORMULA", "formula_code"],
  uom: ["UOM", "uom_code", "uom_type"],
  stage: ["STAGE", "stage_code", "stage_category"],
  "item-type": ["ITEM_TYPE", "type_code"],
  "item-category": ["ITEM_CATEGORY", "category_code"],
  "gl-account": ["GL_ACCOUNT", "account_code", "account_type"],
  "cost-center": ["COST_CENTER", "cost_center_code", "cost_center_type"],
  // The last four masters to gain a code. No series is configured for any of them
  // (the client's numbering conventions are still outstanding), so the preview call
  // returns { generated: false, allowManual: true } and the field stays a plain
  // optional text input. Registering them now means that when a series is finally
  // added the serial/manual toggle appears with no further frontend change.
  "uom-conversion": ["UOM_CONVERSION", "conversion_code"],
  "gl-mapping": ["GL_MAPPING", "mapping_code"],
  "breed-lifecycle-stage": ["BREED_LIFECYCLE_STAGE", "lifecycle_code"],
};
const PARENT_FIELDS: Record<string, string> = {
  location: "parent_location_id", breed: "location_id", "item-category": "parent_category_id",
  "gl-account": "parent_account_id", "cost-center": "parent_cost_center_id",
};
interface Settings { generated: boolean; allowManual: boolean; preview?: string }

export function useCodeSeries(key: string, form: Record<string, unknown>, enabled = true) {
  const [revision, setRevision] = useState(0);
  const definition = CODE_SERIES[key];
  const canGenerate = !!definition;
  const type = definition?.[2] ? String(form[definition[2]] || "") : "";
  const parentId = String(form[PARENT_FIELDS[key]] || "");
  const lobId = key === "animal" ? String(form.lob_id || "") : "";
  const scopeKey = `${getActiveWorkspaceScope()}:${getActiveCompanyId()}:${getActiveOperationalAreaId()}`;
  const requestKey = `${scopeKey}:${key}:${type}:${parentId}:${lobId}:${revision}`;
  const [result, setResult] = useState<{ key: string; settings?: Settings; error?: string }>();
  const [selection, setSelection] = useState<{ key: string; mode: "serial" | "manual" }>();
  useEffect(() => {
    if (!enabled) { setSelection(undefined); setResult(undefined); return; }
    if (!definition || !canGenerate) return;
    let cancelled = false;
    const params = new URLSearchParams({ master: definition[0] });
    if (type) params.set("type", type);
    if (parentId) params.set("parentId", parentId);
    if (lobId) params.set("lobId", lobId);
    api.get(`/number-series/preview?${params}`).then((res) => {
      const data = res?.data || res;
      if (!cancelled) setResult({ key: requestKey, settings: { generated: data.generated === true, allowManual: data.allowManual !== false, preview: data.preview } });
    }).catch((err: Error) => { if (!cancelled) setResult({ key: requestKey, error: err.message || "Could not check code numbering." }); });
    return () => { cancelled = true; };
  }, [key, type, parentId, lobId, scopeKey, enabled, canGenerate, requestKey]);
  const current = result?.key === requestKey ? result : undefined;
  const modeKey = `${scopeKey}:${key}`;
  const mode = selection?.key === modeKey ? selection.mode : "serial";
  // Locations use type-specific series. Choosing an entry mode must not wait
  // for a type (or its preview request); the resolved series policy still wins.
  const awaitingLocationType = key === "location" && !type;
  const managedCode = awaitingLocationType || current?.settings?.generated;
  const allowManual = awaitingLocationType || current?.settings?.allowManual;
  const serial = enabled && managedCode && !(allowManual && mode === "manual");
  return {
    canChoose: enabled && canGenerate && managedCode && allowManual,
    mode,
    chooseMode: (mode: "serial" | "manual") => setSelection({ key: modeKey, mode }),
    refresh: () => setRevision((value) => value + 1),
    value: (fieldKey: string, value: unknown) => serial && fieldKey === definition?.[1] ? current?.settings?.preview || "" : value,
    loading: canGenerate && enabled && !current,
    error: canGenerate && enabled ? current?.error : undefined,
    field: (field: MasterDataField): MasterDataField => {
      if (!enabled || !canGenerate || field.key !== definition?.[1] || !managedCode) return field;
      const manual = allowManual && mode === "manual";
      return { ...field, required: manual, readOnly: !manual,
        placeholder: manual ? "Enter a unique code" : awaitingLocationType ? "Select Location Type to preview code" : "Calculating code…",
        helpText: manual ? "Enter a unique manual code for this master." : awaitingLocationType ? "The selected Location Type determines the numbering series." : "Live preview — allocated when saved. Another user's save may change the final number." };
    },
  };
}
