"use client";

import { FinancePageShell } from "@/components/console/finance/finance-page-shell";
import ProfitLossPanel from "@/components/console/finance/profit-loss-panel";

export default function FinanceProfitLossPage() {
  return (
    <FinancePageShell activeKey="profit-loss">
      <ProfitLossPanel />
    </FinancePageShell>
  );
}
