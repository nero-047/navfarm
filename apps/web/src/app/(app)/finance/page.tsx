"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredUser, hasPermission, NavUser } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import JournalPanel from "@/components/console/finance/journal-panel";
import TrialBalancePanel from "@/components/console/finance/trial-balance-panel";
import BalanceSheetPanel from "@/components/console/finance/balance-sheet-panel";
import ProfitLossPanel from "@/components/console/finance/profit-loss-panel";
import BioAssetRollForwardPanel from "@/components/console/finance/bio-asset-roll-forward-panel";
import { ShieldAlert } from "lucide-react";

const FINANCE_SECTIONS = [
  { key: "journal", label: "Costing & WIP Journals" },
  { key: "profit-loss", label: "Profit & Loss (P&L)" },
  { key: "balance-sheet", label: "Balance Sheet" },
  { key: "trial-balance", label: "Trial Balance" },
  { key: "bio-asset-reconciliation", label: "IAS 41 Bio-Asset Statement" },
];

export default function FinancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeKey, setActiveKey] = useState(searchParams.get("tab") || FINANCE_SECTIONS[0].key);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);

    const tab = searchParams.get("tab");
    if (tab) {
      if (tab === "journals") setActiveKey("journal");
      else if (FINANCE_SECTIONS.some((s) => s.key === tab)) setActiveKey(tab);
    }
    setReady(true);
  }, [router, searchParams]);

  const mayViewFinance = Boolean(
    user && (user.userType === "OPERATIONAL_ADMIN" || user.userType === "COMPANY_ADMIN" || user.userType === "TENANT_ADMIN" || hasPermission(user, "FINANCE", "JOURNAL", "can_view"))
  );

  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayViewFinance) return null;
    return {
      label: t("moduleSections", { module: "Finance" }),
      groups: [{ items: FINANCE_SECTIONS.map((s) => ({ key: s.key, label: s.label })) }],
      activeKey,
      onSelect: (key) => {
        setActiveKey(key);
        router.replace(`/console/finance?tab=${key}`);
      },
    };
  }, [ready, mayViewFinance, activeKey, t, router]);

  useContextNav(contextNav);

  if (!ready || !user) return null;

  if (!mayViewFinance) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title="Finance & Costing" sticky={false} />
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5" style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}>
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">You don&apos;t have access to Finance</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>Contact your company administrator if you need access to this section.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-7 space-y-5">
      <PageHeader
        title={
          activeKey === "journal"
            ? "Costing & WIP Journals"
            : activeKey === "profit-loss"
            ? "Profit & Loss (P&L) Statement"
            : activeKey === "balance-sheet"
            ? "Balance Sheet Statement"
            : activeKey === "trial-balance"
            ? "Trial Balance"
            : "IAS 41 Biological Asset Statement"
        }
        description="General Ledger journals, WIP allocations, and statutory financial statements."
      />

      {activeKey === "journal" && <JournalPanel />}
      {activeKey === "profit-loss" && <ProfitLossPanel />}
      {activeKey === "balance-sheet" && <BalanceSheetPanel />}
      {activeKey === "trial-balance" && <TrialBalancePanel />}
      {activeKey === "bio-asset-reconciliation" && <BioAssetRollForwardPanel />}
    </div>
  );
}
