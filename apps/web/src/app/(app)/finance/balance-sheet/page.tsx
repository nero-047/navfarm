"use client";

import { FinancePageShell } from "@/components/console/finance/finance-page-shell";
import BalanceSheetPanel from "@/components/console/finance/balance-sheet-panel";

export default function FinanceBalanceSheetPage() {
  return (
    <FinancePageShell activeKey="balance-sheet">
      <BalanceSheetPanel />
    </FinancePageShell>
  );
}
