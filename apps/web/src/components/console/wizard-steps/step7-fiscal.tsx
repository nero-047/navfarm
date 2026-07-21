import React, { useState } from "react";
import Button from "../../source-ui/button";
import { Calendar } from "lucide-react";

interface Step7FiscalProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  initialData?: any;
}

export default function Step7Fiscal({ onSubmit, isSubmitting, initialData }: Step7FiscalProps) {
  const [formData, setFormData] = useState({
    fiscal_start_month: initialData?.fiscal_start_month || 4, // April
    valuation_method: initialData?.valuation_method || "FIFO",
    currency_precision: initialData?.currency_precision || 2,
    checkbook_format: initialData?.checkbook_format || "STANDARD"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-400" />
          Step 7: Fiscal Year & Ledger Configuration
        </h2>
        <p className="text-xs text-gray-500">Define accounting start months and inventory valuation models.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Fiscal Year Start Month</label>
          <select
            value={formData.fiscal_start_month}
            onChange={(e) => setFormData({ ...formData, fiscal_start_month: parseInt(e.target.value) })}
            className="bg-[#121824] border border-gray-800 rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value={1}>January</option>
            <option value={4}>April</option>
            <option value={7}>July</option>
            <option value={10}>October</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Inventory Valuation Model</label>
          <select
            value={formData.valuation_method}
            onChange={(e) => setFormData({ ...formData, valuation_method: e.target.value })}
            className="bg-[#121824] border border-gray-800 rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value="FIFO">First-In, First-Out (FIFO)</option>
            <option value="STANDARD">Standard Costing</option>
            <option value="WEIGHTED_AVG">Weighted Average Cost</option>
          </select>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-8 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </form>
  );
}
