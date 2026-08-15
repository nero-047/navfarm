"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import JournalPanel from "@/components/console/finance/journal-panel";
import TrialBalancePanel from "@/components/console/finance/trial-balance-panel";
import BalanceSheetPanel from "@/components/console/finance/balance-sheet-panel";
import ProfitLossPanel from "@/components/console/finance/profit-loss-panel";
import { ShieldAlert } from "lucide-react";

const SECTIONS = [
  { key: "journal", label: "Journal Entries" },
  { key: "trial-balance", label: "Trial Balance" },
  { key: "balance-sheet", label: "Balance Sheet" },
  { key: "profit-loss", label: "Profit & Loss" },
];

export default function FinancePage() {
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
  const mayViewFinance = Boolean(user && hasPermission(user, "FINANCE", "JOURNAL", "can_view"));

  // Flat set: one ungrouped group, so below the desktop breakpoint this
  // renders as a tab strip rather than a selector.
  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayViewFinance) return null;
    return {
      label: t("moduleSections", { module: "Finance" }),
      groups: [{ items: SECTIONS.map((s) => ({ key: s.key, label: s.label })) }],
      activeKey,
      onSelect: setActiveKey,
    };
  }, [ready, mayViewFinance, activeKey, t]);

  useContextNav(contextNav);

  if (!ready || !user) return null;

  if (!hasPermission(user, "FINANCE", "JOURNAL", "can_view")) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title="Finance" sticky={false} />
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5" style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}>
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">You don&apos;t have access to Finance</p>
            <p className="mt-1 text-xs">Contact your company administrator if you need access to this section.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
      {/* This title used to carry both `nf-text-section` and `text-xl`, so the
          utility silently won and Finance rendered its H1 eight points smaller
          than every other module's. One shared component, one size. */}
      <PageHeader
        title="Finance"
        description="General Ledger journal entries and financial reports."
      />

      {/* Section switching moved to the shell's contextual navigation; the
          panels themselves are untouched. */}
      {activeKey === "journal" && <JournalPanel />}
      {activeKey === "trial-balance" && <TrialBalancePanel />}
      {activeKey === "balance-sheet" && <BalanceSheetPanel />}
      {activeKey === "profit-loss" && <ProfitLossPanel />}
    </div>
  );
}
