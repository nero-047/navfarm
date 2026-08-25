import React, { useEffect, useId, useState } from "react";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Step6TimezoneProps {
  onSubmit: (timezone: string, country: string) => Promise<void>;
  isSubmitting: boolean;
  timezones: any[];
  countries: any[];
  initialTz?: string;
  initialCountry?: string;
  onError: (msg: string) => void;
}

export default function Step6Timezone({ onSubmit, isSubmitting, timezones, countries, initialTz, initialCountry, onError }: Step6TimezoneProps) {
  const { t } = useLanguage();
  const [timezone, setTimezone] = useState(initialTz || "Asia/Kolkata");
  const [country, setCountry] = useState(initialCountry || (countries.find((c) => c.iso3 === "IND") ? "IND" : ""));
  const uid = useId();
  const countryId = `${uid}-country`;

  useEffect(() => {
    if (initialTz) setTimezone(initialTz);
    if (initialCountry) setCountry(initialCountry);
  }, [initialTz, initialCountry]);


  const handleSubmit = () => {
    if (!country) {
      onError("Please select a country.");
      return;
    }
    onSubmit(timezone, country);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-(--text-primary) flex items-center gap-2">
          <Clock className="w-5 h-5 text-(--text-muted)" />{t("wzStep6Title")}</h2>
        <p className="text-xs text-(--text-secondary)">{t("wzStep6Desc")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--text-secondary) font-medium">{t("wzOperatingTimezone")}</label>
          <Select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
          >
            {timezones.map((tz) => (
              <option key={tz.tz_code} value={tz.tz_code}>
                {tz.tz_code} ({tz.utc_offset}) — {tz.tz_name}
              </option>
            ))}
          </Select>
        </div>

        <Field label={t("country")} htmlFor={countryId} required>
          <Select
            id={countryId}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
            required
          >
            <option value="" disabled>{t("wzSelectCountry")}</option>
            {countries.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.flag_emoji ? `${c.flag_emoji} ` : ""}{c.country_name} ({c.iso3})
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="mt-8 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </div>
  );
}
