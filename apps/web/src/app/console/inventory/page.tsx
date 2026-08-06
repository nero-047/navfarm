"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser } from "@/hooks/useAuth";
import GoodsReceiptPanel from "@/components/console/inventory/goods-receipt-panel";
import GoodsIssuePanel from "@/components/console/inventory/goods-issue-panel";
import StockTransferPanel from "@/components/console/inventory/stock-transfer-panel";
import StockAdjustmentPanel from "@/components/console/inventory/stock-adjustment-panel";
import InventoryLedgerPanel from "@/components/console/inventory/inventory-ledger-panel";
import { ShieldAlert } from "lucide-react";

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
};

const SECTIONS = [
  { key: "goods-receipt", label: "Goods Receipt" },
  { key: "goods-issue", label: "Goods Issue" },
  { key: "stock-transfer", label: "Stock Transfer" },
  { key: "stock-adjustment", label: "Stock Adjustment" },
  { key: "ledger", label: "Inventory Ledger" },
];

export default function InventoryPage() {
  const router = useRouter();
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

  if (!ready || !user) return null;

  if (!hasPermission(user, "INVENTORY", "GOODS_RECEIPT", "can_view")) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
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
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-7">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={S.primary}>Inventory</h1>
        <p className="mt-0.5 text-sm" style={S.sub}>Goods movement, lot/serial tracking and the Inventory Ledger.</p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <nav className="rounded-2xl border p-2" style={S.surface}>
            <ul className="flex flex-col gap-0.5">
              {SECTIONS.map((s) => {
                const isActive = s.key === activeKey;
                return (
                  <li key={s.key}>
                    <button
                      onClick={() => setActiveKey(s.key)}
                      className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors"
                      style={isActive
                        ? { backgroundColor: "var(--accent-muted)", color: "var(--accent)" }
                        : { color: "var(--text-secondary)" }}
                    >
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {activeKey === "goods-receipt" && <GoodsReceiptPanel />}
          {activeKey === "goods-issue" && <GoodsIssuePanel />}
          {activeKey === "stock-transfer" && <StockTransferPanel />}
          {activeKey === "stock-adjustment" && <StockAdjustmentPanel />}
          {activeKey === "ledger" && <InventoryLedgerPanel />}
        </main>
      </div>
    </div>
  );
}
