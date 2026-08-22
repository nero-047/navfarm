"use client";

import { FinancePageShell } from "@/components/console/finance/finance-page-shell";
import TrialBalancePanel from "@/components/console/finance/trial-balance-panel";

export default function FinanceTrialBalancePage() {
  return (
    <FinancePageShell activeKey="trial-balance">
      <TrialBalancePanel />
    </FinancePageShell>
  );
}
