"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser, getActiveLob } from "@/hooks/useAuth";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { useLanguage } from "@/hooks/useLanguage";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShieldAlert } from "lucide-react";

const PIGGERY_SECTIONS = [
  { key: "animals", href: "/piggery/animals", labelKey: "pigAnimals" },
  { key: "breeding", href: "/piggery/breeding", labelKey: "pigBreeding" },
  { key: "facility-occupancy", href: "/piggery/facility-occupancy", labelKey: "pigFacilityOccupancy" },
  { key: "herd-analytics", href: "/piggery/herd-analytics", labelKey: "pigHerdAnalytics" },
] as const;

export type PiggeryTabKey = (typeof PIGGERY_SECTIONS)[number]["key"];

export function usePiggeryPageState() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeLob, setActiveLobState] = useState("PIGGERY");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setActiveLobState(getActiveLob());
    setReady(true);
  }, [router]);

  const mayView = Boolean(
    user && (
      user.userType === "COMPANY_ADMIN" ||
      user.userType === "TENANT_ADMIN" ||
      user.userType === "OPERATIONAL_ADMIN" ||
      hasPermission(user, "PIGGERY", "ANIMAL", "can_view")
    )
  );

  return { ready, activeLob, mayView };
}

export function PiggeryPageShell({ activeKey, children }: { activeKey: PiggeryTabKey; children: React.ReactNode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { ready, activeLob, mayView } = usePiggeryPageState();

  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayView || activeLob === "DAIRY") return null;
    return {
      label: t("moduleSections", { module: t("animalHerdRegister") }),
      groups: [{ items: PIGGERY_SECTIONS.map((s) => ({ key: s.key, label: t(s.labelKey as any) })) }],
      activeKey,
      onSelect: (key) => {
        const target = PIGGERY_SECTIONS.find((s) => s.key === key);
        if (target) router.push(target.href);
      },
    };
  }, [ready, mayView, activeKey, activeLob, t, router]);

  useContextNav(contextNav);

  if (!ready) return null;

  if (!mayView) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title={activeLob === "DAIRY" ? t("dairyCowRegister") : t("pigSwineRegister")} sticky={false} />
        <div
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5"
          style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t("pigAccessRestrictedTitle")}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{t("accessDeniedContactAdmin")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-7 space-y-5">
      <PageHeader title={t("pigAnimalRegisterTitle")} description={t("pigAnimalRegisterDesc")} />
      {children}
    </div>
  );
}
