"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api-client";
import type { MasterDataField } from "./types";

const CODE_SERIES: Record<string, [string, string, string?]> = {
  item: ["ITEM", "item_code"],
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
};
interface Settings { generated: boolean; allowManual: boolean }

export function useCodeSeries(key: string, form: Record<string, unknown>, enabled = true) {
  const definition = CODE_SERIES[key];
  const canGenerate = !!definition && (key !== "breed" || !!form.location_id);
  const type = definition?.[2] ? String(form[definition[2]] || "") : "";
  const requestKey = `${key}:${type}:${canGenerate}`;
  const [result, setResult] = useState<{ key: string; settings?: Settings; error?: string }>();
  const [selection, setSelection] = useState<{ key: string; mode: "serial" | "manual" }>();
  useEffect(() => {
    if (!definition || !canGenerate || !enabled) return;
    let cancelled = false;
    const params = new URLSearchParams({ master: definition[0] });
    if (type) params.set("type", type);
    api.get(`/number-series/resolve?${params}`).then((res) => {
      const data = res?.data || res;
      if (!cancelled) setResult({ key: requestKey, settings: { generated: data.generated === true, allowManual: data.allowManual !== false } });
    }).catch((err: Error) => { if (!cancelled) setResult({ key: requestKey, error: err.message || "Could not check code numbering." }); });
    return () => { cancelled = true; };
  }, [key, type, enabled, canGenerate]);
  const current = result?.key === requestKey ? result : undefined;
  const mode = selection?.key === requestKey ? selection.mode : "serial";
  return {
    canChoose: enabled && canGenerate && current?.settings?.generated && current.settings.allowManual,
    mode,
    chooseMode: (mode: "serial" | "manual") => setSelection({ key: requestKey, mode }),
    loading: canGenerate && enabled && !current,
    error: canGenerate && enabled ? current?.error : undefined,
    field: (field: MasterDataField): MasterDataField => {
      if (!enabled || !canGenerate || field.key !== definition?.[1] || !current?.settings?.generated) return field;
      const manual = current.settings.allowManual && mode === "manual";
      return { ...field, required: manual, readOnly: !manual,
        placeholder: manual ? "Enter a unique code" : "Assigned when saved",
        helpText: manual ? "Enter a unique manual code for this master." : "Generated from the configured number series when saved." };
    },
  };
}
