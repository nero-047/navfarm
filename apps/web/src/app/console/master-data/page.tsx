"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, NavUser } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { MASTER_DATA_CONFIGS, MASTER_DATA_GROUPS, getConfig } from "@/modules/master-data/configs";
import MasterDataTable from "@/modules/master-data/MasterDataTable";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShieldAlert } from "lucide-react";

const S = {
  sub: { color: "var(--text-secondary)" },
};

export default function MasterDataPage() {
  const router = useRouter();
  const { t, tLabel } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeKey, setActiveKey] = useState(MASTER_DATA_CONFIGS[0].key);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  // Mirrors the access check below. Registered as null until the user is known
  // and allowed, so the loading and access-denied states stay full-width.
  const mayViewMasterData =
    user?.userType === "COMPANY_ADMIN" ||
    user?.userType === "SYSTEM_ADMIN" ||
    user?.userType === "TENANT_ADMIN";

  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayViewMasterData) return null;
    return {
      label: t("moduleSections", { module: t("masterData") }),
      groups: MASTER_DATA_GROUPS.map((group) => ({
        label: tLabel(group),
        items: MASTER_DATA_CONFIGS.filter((c) => c.group === group).map((c) => ({
          key: c.key,
          label: tLabel(c.label),
        })),
      })),
      activeKey,
      onSelect: setActiveKey,
    };
  }, [ready, mayViewMasterData, activeKey, t, tLabel]);

  useContextNav(contextNav);

  if (!ready || !user) return null;

  if (user.userType !== "COMPANY_ADMIN" && user.userType !== "SYSTEM_ADMIN" && user.userType !== "TENANT_ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title={t("masterData")} sticky={false} />
        <div
          className="flex items-center gap-3 rounded-[var(--radius-md)] border p-5"
          style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t("masterDataAccessDeniedTitle")}</p>
            <p className="mt-1 text-xs" style={S.sub}>{t("masterDataAccessDeniedDesc", { type: user.userType.replace(/_/g, " ").toLowerCase() })}</p>
          </div>
        </div>
      </div>
    );
  }

  const activeConfig = getConfig(activeKey) || MASTER_DATA_CONFIGS[0];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
      {/* The page title is the record set the user is actually looking at —
          "Suppliers", not "Master Data" (apple.design.md §23). The module name
          is already stated twice around it, by the breadcrumb above and the
          contextual index beside it; repeating it here as the H1 forced the
          real subject down into a second heading inside the table, which is
          the duplicate hierarchy this phase removes. The table now renders no
          heading of its own — see MasterDataTable. */}
      <PageHeader
        title={tLabel(activeConfig.label)}
        description={activeConfig.description ? tLabel(activeConfig.description) : undefined}
      />

      {/* The module index used to live here as an in-page <aside>, which meant
          it scrolled away with the table it indexes. It is a shell region now —
          see ContextNav — so the page is only ever the work surface. */}
      <MasterDataTable key={activeConfig.key} config={activeConfig} />
    </div>
  );
}
