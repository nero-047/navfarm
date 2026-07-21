import React, { useState } from "react";
import Input from "../../source-ui/input";
import Button from "../../source-ui/button";
import { Building2 } from "lucide-react";

interface Step1ProfileProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  initialData?: any;
}

export default function Step1Profile({ onSubmit, isSubmitting, initialData }: Step1ProfileProps) {
  const [formData, setFormData] = useState({
    company_code: initialData?.company_code || "",
    company_name: initialData?.company_name || "",
    company_display_name: initialData?.company_display_name || "",
    company_type: initialData?.company_type || "Pvt Ltd",
    industry_type: initialData?.industry_type || "Poultry Farming",
    registration_no: initialData?.registration_no || "",
    tax_id: initialData?.tax_id || "",
    primary_color_hex: initialData?.primary_color_hex || "#1F4E79"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-400" />
          Step 1: Register Company Profile
        </h2>
        <p className="text-xs text-gray-500">Provide registration names and brand details. Limits set by pricing plan are applied.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Company Code (Short ID)"
          placeholder="e.g. GVF"
          value={formData.company_code}
          onChange={(e) => setFormData({ ...formData, company_code: e.target.value.toUpperCase() })}
          required
        />
        <Input
          label="Legal Entity Name"
          placeholder="Green Valley Farms Pvt Ltd"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          required
        />
        <Input
          label="Display Name"
          placeholder="Green Valley Farms"
          value={formData.company_display_name}
          onChange={(e) => setFormData({ ...formData, company_display_name: e.target.value })}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Business Class</label>
          <select
            value={formData.company_type}
            onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
            className="bg-[#121824] border border-gray-800 rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value="Sole Proprietor">Sole Proprietor</option>
            <option value="Partnership">Partnership</option>
            <option value="Pvt Ltd">Pvt Ltd</option>
            <option value="LLP">LLP</option>
          </select>
        </div>
        <Input
          label="Registration Certificate No"
          placeholder="e.g. U01403DL2023PTC123456"
          value={formData.registration_no}
          onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
        />
        <Input
          label="Taxpayer ID / GSTIN"
          placeholder="e.g. 07AAAAA1111A1Z1"
          value={formData.tax_id}
          onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-4 self-end">
        {isSubmitting ? "Registering..." : "Save & Continue"}
      </Button>
    </form>
  );
}
