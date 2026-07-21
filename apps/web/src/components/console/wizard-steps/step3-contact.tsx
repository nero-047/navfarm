import React, { useState } from "react";
import Input from "../../source-ui/input";
import Button from "../../source-ui/button";
import { Contact } from "lucide-react";

interface Step3ContactProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  initialData?: any;
}

export default function Step3Contact({ onSubmit, isSubmitting, initialData }: Step3ContactProps) {
  const [formData, setFormData] = useState({
    contact_name: initialData?.contact_name || "",
    contact_email: initialData?.contact_email || "",
    contact_phone: initialData?.contact_phone || "",
    designation: initialData?.designation || "CEO",
    is_primary: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Contact className="w-5 h-5 text-teal-400" />
          Step 3: Primary Contact Details
        </h2>
        <p className="text-xs text-gray-500">Provide the contact profile for administrative alerts.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Contact Person Name"
          placeholder="Amit Sharma"
          value={formData.contact_name}
          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
          required
        />
        <Input
          label="Email Address"
          placeholder="amit@greenvalley.com"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          required
        />
        <Input
          label="Mobile Phone No"
          placeholder="+91 99999 88888"
          value={formData.contact_phone}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          required
        />
        <Input
          label="Job Designation"
          placeholder="Operations Manager"
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-4 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </form>
  );
}
