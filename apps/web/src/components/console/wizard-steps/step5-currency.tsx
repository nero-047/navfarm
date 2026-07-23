import React, { useEffect, useState } from "react";
import Button from "../../source-ui/button";
import { Coins } from "lucide-react";

interface Step5CurrencyProps {
  onSubmit: (currencyId: string) => Promise<void>;
  isSubmitting: boolean;
  currencies: any[];
  initialValue?: string;
}

export default function Step5Currency({ onSubmit, isSubmitting, currencies, initialValue }: Step5CurrencyProps) {
  const [selectedCurr, setSelectedCurr] = useState(initialValue || (currencies.length > 0 ? currencies[0].currency_id : ""));

  useEffect(() => {
    if (initialValue) {
      setSelectedCurr(initialValue);
    }
  }, [initialValue]);


  const handleSubmit = () => {
    onSubmit(selectedCurr);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-teal-400" />
          Step 5: Base Currency Configuration
        </h2>
        <p className="text-xs text-gray-500">Configure standard currency precision for ledger balances.</p>
      </div>

      <div className="flex flex-col gap-2 max-w-md mt-4">
        <label className="text-xs text-gray-400 font-medium">Select Currency</label>
        <select
          value={selectedCurr}
          onChange={(e) => setSelectedCurr(e.target.value)}
          className="bg-[#121824] border border-gray-800 rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500"
        >
          {currencies.map((c) => (
            <option key={c.currency_id} value={c.currency_id}>
              {c.currency_name} ({c.iso_code}) - {c.symbol}
            </option>
          ))}
        </select>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="mt-8 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </div>
  );
}
