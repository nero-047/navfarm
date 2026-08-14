"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser } from "@/hooks/useAuth";
import JournalPanel from "@/components/console/finance/journal-panel";
import TrialBalancePanel from "@/components/console/finance/trial-balance-panel";
import BalanceSheetPanel from "@/components/console/finance/balance-sheet-panel";
import ProfitLossPanel from "@/components/console/finance/profit-loss-panel";
import { ShieldAlert } from "lucide-react";

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
};

const SECTIONS = [
  { key: "journal", label: "Journal Entries" },
  { key: "trial-balance", label: "Trial Balance" },
  { key: "balance-sheet", label: "Balance Sheet" },
  { key: "profit-loss", label: "Profit & Loss" },
];

export default function FinancePage() {
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

  if (!hasPermission(user, "FINANCE", "JOURNAL", "can_view")) {
    return (
      <div className="mx-auto max-w-2xl p-8">
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
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-7">
      <div className="mb-5">
        <h1 className="nf-text-section text-xl" style={S.primary}>Finance</h1>
        <p className="mt-0.5 text-sm" style={S.sub}>General Ledger journal entries and financial reports.</p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <nav className="lg:border-r lg:pr-2" style={{ borderColor: "var(--border)" }}>
            <ul className="flex flex-col gap-0.5">
              {SECTIONS.map((s) => {
                const isActive = s.key === activeKey;
                return (
                  <li key={s.key}>
                    <button
                      onClick={() => setActiveKey(s.key)}
                      className="nf-press w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-[13px] font-semibold transition-colors"
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
          {activeKey === "journal" && <JournalPanel />}
          {activeKey === "trial-balance" && <TrialBalancePanel />}
          {activeKey === "balance-sheet" && <BalanceSheetPanel />}
          {activeKey === "profit-loss" && <ProfitLossPanel />}
        </main>
      </div>
    </div>
  );
}
