"use client";

import { InventoryPageShell } from "@/components/console/inventory/inventory-page-shell";
import GoodsReceiptPanel from "@/components/console/inventory/goods-receipt-panel";

export default function InventoryGoodsReceiptPage() {
  return (
    <InventoryPageShell activeKey="goods-receipt">
      <GoodsReceiptPanel />
    </InventoryPageShell>
  );
}
