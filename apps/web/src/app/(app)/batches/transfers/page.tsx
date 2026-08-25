"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import BatchTransferPanel from "@/components/console/production/batch-transfer-panel";

export default function BatchTransfersPage() {
  return (
    <ProductionPageShell titleKey="batchTransfers">
      {() => <BatchTransferPanel />}
    </ProductionPageShell>
  );
}
