"use client";

import { InventoryPageShell } from "@/components/console/inventory/inventory-page-shell";
import StockAdjustmentPanel from "@/components/console/inventory/stock-adjustment-panel";

export default function InventoryStockAdjustmentPage() {
  return (
    <InventoryPageShell activeKey="stock-adjustment">
      <StockAdjustmentPanel />
    </InventoryPageShell>
  );
}
