"use client";

import { InventoryPageShell } from "@/components/console/inventory/inventory-page-shell";
import StockBalancePanel from "@/components/console/inventory/stock-balance-panel";

export default function InventoryBalancePage() {
  return (
    <InventoryPageShell activeKey="balance">
      <StockBalancePanel />
    </InventoryPageShell>
  );
}
