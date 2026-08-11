import React, { useEffect, useState } from 'react';
import Input from '../../ui/input';
import Button from '../../ui/button';
import { Contact } from 'lucide-react';

interface Step3ContactProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  initialData?: any;
}

export default function Step3Contact({
  onSubmit,
  isSubmitting,
  initialData,
}: Step3ContactProps) {
  const [formData, setFormData] = useState({
    contact_name: initialData?.contact_name || '',
    contact_email: initialData?.contact_email || '',
    contact_phone: initialData?.contact_phone || '',
    phone_secondary: initialData?.phone_secondary || '',
    designation: initialData?.designation || 'CEO',
    receives_reports: initialData?.receives_reports ?? true,
    is_primary: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        contact_name: initialData.contact_name || '',
        contact_email: initialData.contact_email || '',
        contact_phone: initialData.contact_phone || '',
        phone_secondary: initialData.phone_secondary || '',
        designation: initialData.designation || 'CEO',
        receives_reports: initialData.receives_reports ?? true,
        is_primary: true,
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
        <h2 className="text-xl font-bold text-(--text-primary) flex items-center gap-2">
          <Contact className="w-5 h-5 text-(--accent)" />
          Step 3: Primary Contact Details
        </h2>
        <p className="text-xs text-(--text-secondary)">
          Provide the contact profile for administrative alerts and reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Contact Person Name"
          placeholder="Amit Sharma"
          value={formData.contact_name}
          onChange={(e) =>
            setFormData({ ...formData, contact_name: e.target.value })
          }
          required
        />
        <Input
          label="Email Address"
          placeholder="amit@greenvalley.com"
          value={formData.contact_email}
          onChange={(e) =>
            setFormData({ ...formData, contact_email: e.target.value })
          }
          required
        />
        <Input
          label="Primary Mobile Phone"
          placeholder="+91 99999 88888"
          value={formData.contact_phone}
          onChange={(e) =>
            setFormData({ ...formData, contact_phone: e.target.value })
          }
          required
        />
        <Input
          label="Secondary / Alternate Phone"
          placeholder="+91 99999 77777"
          value={formData.phone_secondary}
          onChange={(e) =>
            setFormData({ ...formData, phone_secondary: e.target.value })
          }
        />
        <Input
          label="Job Designation"
          placeholder="Operations Manager"
          value={formData.designation}
          onChange={(e) =>
            setFormData({ ...formData, designation: e.target.value })
          }
        />
        <div className="flex items-center gap-3 mt-4">
          <input
            type="checkbox"
            id="receives_reports"
            checked={formData.receives_reports}
            onChange={(e) =>
              setFormData({ ...formData, receives_reports: e.target.checked })
            }
            className="w-4 h-4 rounded border-(--input-border) bg-(--input-bg) text-(--accent) focus:ring-(--accent)"
          />
          <label
            htmlFor="receives_reports"
            className="text-xs text-(--text-secondary) font-medium cursor-pointer"
          >
            Receive periodic executive report emails (weekly P&L, batch metrics)
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-4 self-end">
        {isSubmitting ? 'Saving...' : 'Save & Continue'}
      </Button>
    </form>
  );
}
