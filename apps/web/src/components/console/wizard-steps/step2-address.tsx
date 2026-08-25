import React, { useEffect, useId, useState } from "react";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Step2AddressProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  initialData?: any;
}

export default function Step2Address({ onSubmit, isSubmitting, initialData }: Step2AddressProps) {
  const { t } = useLanguage();
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const [formData, setFormData] = useState({
    address_label: initialData?.address_label || "",
    address_line_1: initialData?.address_line_1 || "",
    address_line_2: initialData?.address_line_2 || "",
    city: initialData?.city || "",
    state_province: initialData?.state_province || "",
    postal_code: initialData?.postal_code || "",
    country_name: initialData?.country_name || "India",
    address_type: initialData?.address_type || "HEAD_OFFICE",
    gps_lat: initialData?.gps_lat || "28.7041",
    gps_lng: initialData?.gps_lng || "77.1025"
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        address_label: initialData.address_label || "",
        address_line_1: initialData.address_line_1 || "",
        address_line_2: initialData.address_line_2 || "",
        city: initialData.city || "",
        state_province: initialData.state_province || "",
        postal_code: initialData.postal_code || "",
        country_name: initialData.country_name || "India",
        address_type: initialData.address_type || "HEAD_OFFICE",
        gps_lat: initialData.gps_lat || "28.7041",
        gps_lng: initialData.gps_lng || "77.1025"
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
          <MapPin className="w-5 h-5 text-(--text-muted)" />{t("wzStep2Title")}</h2>
        <p className="text-xs text-(--text-secondary)">{t("wzStep2Desc")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("wzAddressTagLabel")} htmlFor={fieldId("address_label")}>
          <Input
            id={fieldId("address_label")}
            placeholder={t("wzPhAddressTag")}
            value={formData.address_label}
            onChange={(e) => setFormData({ ...formData, address_label: e.target.value })}
          />
        </Field>
        <Field label={t("wzStreetLine1")} htmlFor={fieldId("address_line_1")} required>
          <Input
            id={fieldId("address_line_1")}
            placeholder={t("wzPhStreetLine1")}
            value={formData.address_line_1}
            onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
            required
          />
        </Field>

        <Field label={t("wzStreetLine2")} htmlFor={fieldId("address_line_2")}>
          <Input
            id={fieldId("address_line_2")}
            placeholder={t("wzPhStreetLine2")}
            value={formData.address_line_2}
            onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
          />
        </Field>
        <Field label={t("ctCity")} htmlFor={fieldId("city")} required>
          <Input
            id={fieldId("city")}
            placeholder={t("wzPhCity")}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </Field>
        <Field label={t("ctStateProvince")} htmlFor={fieldId("state_province")} required>
          <Input
            id={fieldId("state_province")}
            placeholder={t("wzPhState")}
            value={formData.state_province}
            onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
            required
          />
        </Field>
        <Field label={t("wzPostalCode")} htmlFor={fieldId("postal_code")} required>
          <Input
            id={fieldId("postal_code")}
            placeholder="122001"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            required
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--text-secondary) font-medium">{t("wzLocationType")}</label>
          <Select
            value={formData.address_type}
            onChange={(e) => setFormData({ ...formData, address_type: e.target.value })}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
          >
            <option value="HEAD_OFFICE">{t("wzLocHeadOffice")}</option>
            <option value="FARM">{t("wzLocFarmLocation")}</option>
            <option value="WAREHOUSE">{t("gipWarehouse")}</option>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-4 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </form>
  );
}
