import React, { useEffect, useId, useState } from "react";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Step6TimezoneProps {
  onSubmit: (timezone: string, country: string) => Promise<void>;
  isSubmitting: boolean;
  initialTz?: string;
  initialCountry?: string;
  onError: (msg: string) => void;
}

export default function Step6Timezone({ onSubmit, isSubmitting, initialTz, initialCountry, onError }: Step6TimezoneProps) {
  const [timezone, setTimezone] = useState(initialTz || "Asia/Kolkata");
  const [country, setCountry] = useState(initialCountry || "");
  const uid = useId();
  const countryId = `${uid}-country`;

  useEffect(() => {
    if (initialTz) setTimezone(initialTz);
    if (initialCountry) setCountry(initialCountry);
  }, [initialTz, initialCountry]);


  const handleSubmit = () => {
    if (!country) {
      onError("Please choose or input a country code (e.g. IND, USA).");
      return;
    }
    onSubmit(timezone, country);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-(--text-primary) flex items-center gap-2">
          <Clock className="w-5 h-5 text-(--text-muted)" />
          Step 6: Timezone & Country Preferences
        </h2>
        <p className="text-xs text-(--text-secondary)">Choose operations time-sync settings and national parameters.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-(--text-secondary) font-medium">Operating Timezone</label>
          <Select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-sm text-(--input-text) focus:border-(--input-border-focus)"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </Select>
        </div>

        <Field label="Country Code (ISO 3-Letter)" htmlFor={countryId} required>
          <Input
            id={countryId}
            placeholder="e.g. IND, USA"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            maxLength={3}
            required
          />
        </Field>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="mt-8 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </div>
  );
}
