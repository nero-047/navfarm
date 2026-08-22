"use client";

import { InventoryPageShell } from "@/components/console/inventory/inventory-page-shell";
import StockTransferPanel from "@/components/console/inventory/stock-transfer-panel";

export default function InventoryTransfersPage() {
  return (
    <InventoryPageShell activeKey="transfers">
      <StockTransferPanel />
    </InventoryPageShell>
  );
}
