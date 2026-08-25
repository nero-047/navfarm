"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser } from "@/hooks/useAuth";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { useLanguage } from "@/hooks/useLanguage";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConsolePage } from "@/components/ui/console-page";
import { ShieldAlert } from "lucide-react";

const FINANCE_SECTIONS = [
  { key: "journal", href: "/finance/journal", labelKey: "finJournal" },
  { key: "profit-loss", href: "/finance/profit-loss", labelKey: "finProfitLoss" },
  { key: "balance-sheet", href: "/finance/balance-sheet", labelKey: "finBalanceSheet" },
  { key: "trial-balance", href: "/finance/trial-balance", labelKey: "finTrialBalance" },
  { key: "bio-asset-reconciliation", href: "/finance/bio-asset-reconciliation", labelKey: "finBioAssetReconciliation" },
] as const;

export type FinanceTabKey = (typeof FINANCE_SECTIONS)[number]["key"];

function useFinancePageState() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  const mayView = Boolean(
    user && (user.userType === "OPERATIONAL_ADMIN" || user.userType === "COMPANY_ADMIN" || user.userType === "TENANT_ADMIN" || hasPermission(user, "FINANCE", "JOURNAL", "can_view"))
  );

  return { ready, mayView };
}

export function FinancePageShell({ activeKey, children }: { activeKey: FinanceTabKey; children: React.ReactNode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { ready, mayView } = useFinancePageState();

  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayView) return null;
    return {
      label: t("moduleSections", { module: t("finance") }),
      groups: [{ items: FINANCE_SECTIONS.map((s) => ({ key: s.key, label: t(s.labelKey as any) })) }],
      activeKey,
      onSelect: (key) => {
        const target = FINANCE_SECTIONS.find((s) => s.key === key);
        if (target) router.push(target.href);
      },
    };
  }, [ready, mayView, activeKey, t, router]);

  useContextNav(contextNav);

  if (!ready) return null;

  if (!mayView) {
    return (
      <ConsolePage size="narrow">
        <PageHeader title={t("finModuleTitle")} sticky={false} />
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5" style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}>
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t("finAccessDeniedTitle")}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{t("accessDeniedContactAdmin")}</p>
          </div>
        </div>
      </ConsolePage>
    );
  }

  const title =
    activeKey === "journal" ? t("finJournalTitle") :
    activeKey === "profit-loss" ? t("finProfitLossTitle") :
    activeKey === "balance-sheet" ? t("finBalanceSheetTitle") :
    activeKey === "trial-balance" ? t("finTrialBalanceTitle") :
    t("finBioAssetReconciliationTitle");

  return (
    <ConsolePage>
      <PageHeader title={title} description={t("finPageDescription")} />
      {children}
    </ConsolePage>
  );
}
