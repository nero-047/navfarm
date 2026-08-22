"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredUser, hasPermission, NavUser, getActiveWorkspaceScope, getActiveLob } from "@/hooks/useAuth";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import StockBalancePanel from "@/components/console/inventory/stock-balance-panel";
import GoodsReceiptPanel from "@/components/console/inventory/goods-receipt-panel";
import GoodsIssuePanel from "@/components/console/inventory/goods-issue-panel";
import StockTransferPanel from "@/components/console/inventory/stock-transfer-panel";
import StockAdjustmentPanel from "@/components/console/inventory/stock-adjustment-panel";
import InventoryLedgerPanel from "@/components/console/inventory/inventory-ledger-panel";
import { ShieldAlert } from "lucide-react";

const INVENTORY_SECTIONS = [
  { key: "balance", label: "Stock Balance" },
  { key: "goods-receipt", label: "Goods Receipt (GRN)" },
  { key: "transfers", label: "Stock Transfer & Sales" },
  { key: "goods-issue", label: "Goods Issue" },
  { key: "stock-adjustment", label: "Stock Adjustment" },
  { key: "ledger", label: "Inventory Ledger" },
];

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeKey, setActiveKey] = useState(searchParams.get("tab") || "balance");
  const [scope, setScope] = useState("COMPANY");
  const [activeLob, setActiveLobState] = useState("PIGGERY");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setScope(getActiveWorkspaceScope());
    setActiveLobState(getActiveLob());

    const tab = searchParams.get("tab");
    if (tab) {
      if (tab === "stock-transfer") setActiveKey("transfers");
      else if (INVENTORY_SECTIONS.some((s) => s.key === tab)) setActiveKey(tab);
    }
    setReady(true);
  }, [router, searchParams]);

  const mayViewInventory = Boolean(
    user && (user.userType === "OPERATIONAL_ADMIN" || user.userType === "COMPANY_ADMIN" || user.userType === "TENANT_ADMIN" || hasPermission(user, "INVENTORY", "GOODS_RECEIPT", "can_view"))
  );

  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayViewInventory) return null;
    return {
      label: "Inventory sections",
      groups: [{ items: INVENTORY_SECTIONS.map((s) => ({ key: s.key, label: s.label })) }],
      activeKey,
      onSelect: (key) => {
        setActiveKey(key);
        router.replace(`/inventory?tab=${key}`);
      },
    };
  }, [ready, mayViewInventory, activeKey, router]);

  useContextNav(contextNav);

  if (!ready || !user) return null;

  if (!mayViewInventory) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title="Inventory & Procurement" sticky={false} />
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5" style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}>
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">You don&apos;t have access to Inventory</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Contact your company administrator if you need access to this section.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-7 space-y-5">
      <PageHeader
        title={
          activeKey === "goods-receipt"
            ? "Procurement & Goods Receipt (GRN)"
            : activeKey === "transfers"
            ? "Sales, Dispatches & Stock Transfers"
            : activeKey === "goods-issue"
            ? "Goods Issue to Production"
            : activeKey === "stock-adjustment"
            ? "Stock Adjustment & Physical Count"
            : activeKey === "ledger"
            ? "Inventory Ledger (FIFO Layers)"
            : scope === "OPERATIONAL"
            ? `${activeLob} Unit Stock Balance`
            : "Company Inventory & Stock Balance"
        }
        description={
          scope === "OPERATIONAL"
            ? `Operational stock, daily feed/med allocations, and dispatches for ${activeLob} Unit.`
            : "Company-wide warehouse stock, PO receipts, inter-site movements, and FIFO inventory valuation."
        }
      />

      {activeKey === "balance" && <StockBalancePanel />}
      {activeKey === "goods-receipt" && <GoodsReceiptPanel />}
      {activeKey === "goods-issue" && <GoodsIssuePanel />}
      {activeKey === "transfers" && <StockTransferPanel />}
      {activeKey === "stock-adjustment" && <StockAdjustmentPanel />}
      {activeKey === "ledger" && <InventoryLedgerPanel />}
    </div>
  );
}
