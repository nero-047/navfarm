import React, { useEffect, useState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Step7FiscalProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  initialData?: any;
}

export default function Step7Fiscal({ onSubmit, isSubmitting, initialData }: Step7FiscalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fiscal_start_month: initialData?.fiscal_start_month || 4, // April
    valuation_method: initialData?.valuation_method || "FIFO",
    depreciation_method: initialData?.depreciation_method || "SLM",
    gst_filing_frequency: initialData?.gst_filing_frequency || "MONTHLY",
    tax_audit_applicable: initialData?.tax_audit_applicable ?? false,
    decimal_places: initialData?.decimal_places ?? 2,
    currency_precision: initialData?.currency_precision || 2,
    checkbook_format: initialData?.checkbook_format || "STANDARD"
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fiscal_start_month: initialData.fiscal_start_month || 4,
        valuation_method: initialData.valuation_method || "FIFO",
        depreciation_method: initialData.depreciation_method || "SLM",
        gst_filing_frequency: initialData.gst_filing_frequency || "MONTHLY",
        tax_audit_applicable: initialData.tax_audit_applicable ?? false,
        decimal_places: initialData.decimal_places ?? 2,
        currency_precision: initialData.currency_precision || 2,
        checkbook_format: initialData.checkbook_format || "STANDARD"
      });
    }
  }, [initialData]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-(--text-primary) flex items-center gap-2">
          <Calendar className="w-5 h-5 text-(--text-muted)" />{t("wzStep7Title")}</h2>
        <p className="text-xs text-(--text-secondary)">{t("wzStep7Desc")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--text-secondary) font-medium">{t("wzFiscalStartMonth")}</label>
          <Select
            value={formData.fiscal_start_month}
            onChange={(e) => setFormData({ ...formData, fiscal_start_month: parseInt(e.target.value) })}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
          >
            <option value={1}>{t("ctMonthJanuary")}</option>
            <option value={4}>{t("ctMonthApril")}</option>
            <option value={7}>{t("wzMonthJuly")}</option>
            <option value={10}>{t("wzMonthOctober")}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--text-secondary) font-medium">{t("wzInventoryValuationModel")}</label>
          <Select
            value={formData.valuation_method}
            onChange={(e) => setFormData({ ...formData, valuation_method: e.target.value })}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
          >
            <option value="FIFO">{t("wzFifoLong")}</option>
            <option value="STANDARD">{t("ctCostStandard")}</option>
            <option value="WEIGHTED_AVG">{t("ctCostWeightedAverage")}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--text-secondary) font-medium">{t("ctDepreciationModel")}</label>
          <Select
            value={formData.depreciation_method}
            onChange={(e) => setFormData({ ...formData, depreciation_method: e.target.value })}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
          >
            <option value="SLM">{t("ctDeprSlm")}</option>
            <option value="WDV">{t("ctDeprWdv")}</option>
            <option value="UNITS_OF_PRODUCTION">{t("ctDeprUnitsOfProduction")}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--text-secondary) font-medium">{t("ctTaxFilingFrequency")}</label>
          <Select
            value={formData.gst_filing_frequency}
            onChange={(e) => setFormData({ ...formData, gst_filing_frequency: e.target.value })}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
          >
            <option value="MONTHLY">{t("ctFilingMonthly")}</option>
            <option value="QUARTERLY">{t("ctFilingQuarterly")}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--text-secondary) font-medium">{t("wzDecimalPrecisionAmounts")}</label>
          <Select
            value={formData.decimal_places}
            onChange={(e) => setFormData({ ...formData, decimal_places: parseInt(e.target.value) })}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
          >
            <option value={2}>2 Decimal Places (e.g. 100.50)</option>
            <option value={3}>3 Decimal Places (e.g. 100.500 for KG/Liters)</option>
            <option value={4}>4 Decimal Places (High Precision)</option>
          </Select>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <input
            type="checkbox"
            id="tax_audit_applicable"
            checked={formData.tax_audit_applicable}
            onChange={(e) => setFormData({ ...formData, tax_audit_applicable: e.target.checked })}
            className="w-4 h-4 rounded-[var(--radius-xs)] border-(--input-border) bg-(--input-bg) text-(--accent) focus:ring-(--accent)"
          />
          <label htmlFor="tax_audit_applicable" className="text-xs text-(--text-secondary) font-medium cursor-pointer">{t("ctStatutoryAuditApplicable")}</label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-8 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </form>
  );
}
