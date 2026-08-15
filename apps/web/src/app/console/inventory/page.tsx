"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import StockBalancePanel from "@/components/console/inventory/stock-balance-panel";
import GoodsReceiptPanel from "@/components/console/inventory/goods-receipt-panel";
import GoodsIssuePanel from "@/components/console/inventory/goods-issue-panel";
import StockTransferPanel from "@/components/console/inventory/stock-transfer-panel";
import StockAdjustmentPanel from "@/components/console/inventory/stock-adjustment-panel";
import InventoryLedgerPanel from "@/components/console/inventory/inventory-ledger-panel";
import { ShieldAlert } from "lucide-react";

const SECTIONS = [
  { key: "balance", label: "Stock Balance" },
  { key: "goods-receipt", label: "Goods Receipt" },
  { key: "goods-issue", label: "Goods Issue" },
  { key: "stock-transfer", label: "Stock Transfer" },
  { key: "stock-adjustment", label: "Stock Adjustment" },
  { key: "ledger", label: "Inventory Ledger" },
];

export default function InventoryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeKey, setActiveKey] = useState(SECTIONS[0].key);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  // Same permission the render path checks below — the module index is not
  // offered to someone who cannot open the module.
  const mayViewInventory = Boolean(user && hasPermission(user, "INVENTORY", "GOODS_RECEIPT", "can_view"));

  // Flat, six entries: one ungrouped group, which is what makes this a tab
  // strip rather than a selector below the desktop breakpoint.
  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayViewInventory) return null;
    return {
      label: t("moduleSections", { module: "Inventory" }),
      groups: [{ items: SECTIONS.map((s) => ({ key: s.key, label: s.label })) }],
      activeKey,
      onSelect: setActiveKey,
    };
  }, [ready, mayViewInventory, activeKey, t]);

  useContextNav(contextNav);

  if (!ready || !user) return null;

  if (!hasPermission(user, "INVENTORY", "GOODS_RECEIPT", "can_view")) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title="Inventory" sticky={false} />
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5" style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}>
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">You don&apos;t have access to Inventory</p>
            <p className="mt-1 text-xs">Contact your company administrator if you need access to this section.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
      <PageHeader
        title="Inventory"
        description="Goods movement, lot/serial tracking and the Inventory Ledger."
      />

      {/* Section switching moved to the shell's contextual navigation; the
          panels themselves are untouched. */}
      {activeKey === "balance" && <StockBalancePanel />}
      {activeKey === "goods-receipt" && <GoodsReceiptPanel />}
      {activeKey === "goods-issue" && <GoodsIssuePanel />}
      {activeKey === "stock-transfer" && <StockTransferPanel />}
      {activeKey === "stock-adjustment" && <StockAdjustmentPanel />}
      {activeKey === "ledger" && <InventoryLedgerPanel />}
    </div>
  );
}
