import React, { useState } from "react";
import Input from "../../source-ui/input";
import Button from "../../source-ui/button";
import { MapPin } from "lucide-react";

interface Step2AddressProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  initialData?: any;
}

export default function Step2Address({ onSubmit, isSubmitting, initialData }: Step2AddressProps) {
  const [formData, setFormData] = useState({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-400" />
          Step 2: Operating Addresses
        </h2>
        <p className="text-xs text-gray-500">Provide operating physical addresses for billing and tax allocations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Street Address line 1"
          placeholder="Main Farm Gate Road"
          value={formData.address_line_1}
          onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
          required
        />
        <Input
          label="Street Address line 2"
          placeholder="Shed Area 4"
          value={formData.address_line_2}
          onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
        />
        <Input
          label="City"
          placeholder="Gurugram"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          required
        />
        <Input
          label="State / Province"
          placeholder="Haryana"
          value={formData.state_province}
          onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
          required
        />
        <Input
          label="Postal Code"
          placeholder="122001"
          value={formData.postal_code}
          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Location Type</label>
          <select
            value={formData.address_type}
            onChange={(e) => setFormData({ ...formData, address_type: e.target.value })}
            className="bg-[#121824] border border-gray-800 rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value="HEAD_OFFICE">Head Office</option>
            <option value="FARM">Farm Location</option>
            <option value="WAREHOUSE">Warehouse</option>
          </select>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-4 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </form>
  );
}
