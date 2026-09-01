"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser, getActiveLob } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConsolePage } from "@/components/ui/console-page";
import { ShieldAlert } from "lucide-react";

/**
 * Section nav for the Livestock family. Named for the family rather than for
 * Piggery: Dairy areas already render through this shell, and Goat & Sheep and
 * Poultry will too — a shell called "Piggery" that every livestock LOB has to
 * use is exactly the naming this restructure set out to remove.
 *
 * Keys match the last path segment so a route and its tab can never drift.
 */
export const LIVESTOCK_SECTIONS = [
  { key: "register", href: "/livestock", labelKey: "navLivestockRegister" },
  // A page route, not the API path. The breeding controller lives at
  // 'piggery/breeding'; the screen lives at /livestock/breeding. Conflating the
  // two pointed this nav item at a route that does not exist and, because the
  // href dropped out of the nav set, gave the highlight to /livestock instead.
  { key: "breeding", href: "/livestock/breeding", labelKey: "pigBreeding" },
  // Health sits in this family but renders through ProductionPageShell (it is
  // batch-and-animal shaped, not register-shaped), so it has no tab key here —
  // it is listed so the sidebar has one list to render from.
  { key: null, href: "/livestock/health", labelKey: "navLivestockHealth" },
  { key: "facility", href: "/livestock/facility", labelKey: "pigFacilityOccupancy" },
  { key: "analytics", href: "/livestock/analytics", labelKey: "pigHerdAnalytics" },
] as const;

export type LivestockTabKey = Exclude<(typeof LIVESTOCK_SECTIONS)[number]["key"], null>;

export function useLivestockPageState() {
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

export function LivestockPageShell({ activeKey, children }: { activeKey: LivestockTabKey; children: React.ReactNode }) {
  const { t } = useLanguage();
  const { ready, activeLob, mayView } = useLivestockPageState();

  // No context nav here any more. Livestock is a primary group in the sidebar
  // and lists its five sections there, so a second copy of the same five links
  // in a context rail was the same navigation rendered twice. Module shells
  // that are a SINGLE sidebar entry (Inventory, Finance, Master Data) still use
  // the context nav — that is the rule: sidebar children for the two domain
  // groups, context nav for module shells.

  if (!ready) return null;

  if (!mayView) {
    return (
      <ConsolePage size="narrow">
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
      </ConsolePage>
    );
  }

  return (
    <ConsolePage>
      <PageHeader title={t("pigAnimalRegisterTitle")} description={t("pigAnimalRegisterDesc")} />
      {children}
    </ConsolePage>
  );
}
