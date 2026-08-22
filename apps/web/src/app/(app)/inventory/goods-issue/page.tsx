"use client";

import { InventoryPageShell } from "@/components/console/inventory/inventory-page-shell";
import GoodsIssuePanel from "@/components/console/inventory/goods-issue-panel";

export default function InventoryGoodsIssuePage() {
  return (
    <InventoryPageShell activeKey="goods-issue">
      <GoodsIssuePanel />
    </InventoryPageShell>
  );
}
