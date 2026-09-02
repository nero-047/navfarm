"use client";

import { FinancePageShell } from "@/components/console/finance/finance-page-shell";
import BatchCostVariancePanel from "@/components/console/finance/batch-cost-variance-panel";

export default function FinanceBatchCostVariancePage() {
  return (
    <FinancePageShell activeKey="batch-cost-variance">
      <BatchCostVariancePanel />
    </FinancePageShell>
  );
}
