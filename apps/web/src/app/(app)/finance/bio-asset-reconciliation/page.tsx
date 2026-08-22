"use client";

import { FinancePageShell } from "@/components/console/finance/finance-page-shell";
import BioAssetRollForwardPanel from "@/components/console/finance/bio-asset-roll-forward-panel";

export default function FinanceBioAssetReconciliationPage() {
  return (
    <FinancePageShell activeKey="bio-asset-reconciliation">
      <BioAssetRollForwardPanel />
    </FinancePageShell>
  );
}
