"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, NavUser, getActiveCompanyId, setActiveCompanyId, getStoredTenantId } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { MASTER_DATA_CONFIGS, MASTER_DATA_GROUPS, getConfig } from "@/modules/master-data/configs";
import type { MasterDataConfig } from "@/modules/master-data/types";
import MasterDataTable from "@/modules/master-data/MasterDataTable";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConsolePage } from "@/components/ui/console-page";
import { Tabs } from "@/components/ui/tabs";
import { ShieldAlert, Download, Building2, RefreshCw } from "lucide-react";
import { api } from "@/services/api-client";

const S = {
  sub: { color: "var(--text-secondary)" },
};

function useMasterDataPageState() {
  const router = useRouter();
  // The session lives in localStorage, so it is available synchronously on the
  // first render. Resolving it in an effect instead meant this shell mounted
  // with user=null and ready=false, and the module index — which is static
  // configuration and never depended on either — was registered as null for a
  // commit before appearing. That is what made the sub-navigation visibly
  // empty and refill on every page change.
  const [user, setUser] = useState<NavUser | null>(() => getStoredUser());
  const [ready, setReady] = useState(() => Boolean(getStoredUser()));
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => getActiveCompanyId() || "");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setSelectedCompanyId(getActiveCompanyId() || "");

    // Only the company list is genuinely async, and only the Master Scope
    // selector needs it — the index does not wait on it.
    const tenantId = getStoredTenantId() || stored.tenantId;
    if (tenantId) {
      api.get(`/company/tenant/${tenantId}`).then((res: any) => {
        if (Array.isArray(res)) setCompanies(res);
      }).catch(() => void 0);
    }

    setReady(true);
  }, [router]);

  const mayView =
    user?.userType === "COMPANY_ADMIN" ||
    user?.userType === "SYSTEM_ADMIN" ||
    user?.userType === "TENANT_ADMIN" ||
    user?.userType === "OPERATIONAL_ADMIN";

  return { ready, user, mayView, companies, selectedCompanyId, setSelectedCompanyId };
}

export function MasterDataPageShell({ activeKey }: { activeKey: string }) {
  const router = useRouter();
  const { t, tLabel } = useLanguage();
  const { ready, user, mayView, companies, selectedCompanyId, setSelectedCompanyId } = useMasterDataPageState();
  const [preseedLoading, setPreseedLoading] = useState(false);
  const [preseedMsg, setPreseedMsg] = useState("");
  const activeConfig: MasterDataConfig = getConfig(activeKey) || MASTER_DATA_CONFIGS.find((c) => c.isPrimary)!;
  const parentConfig = (activeConfig.tabOf && getConfig(activeConfig.tabOf)) || activeConfig;
  const tabConfigs = MASTER_DATA_CONFIGS.filter((c) => c.tabOf === parentConfig.key);
  const parentKey = parentConfig.key;

  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayView) return null;
    return {
      label: t("moduleSections", { module: t("masterData") }),
      groups: MASTER_DATA_GROUPS.map((group) => ({
        label: tLabel(group),
        items: MASTER_DATA_CONFIGS
          .filter((c) => c.group === group && c.isPrimary)
          .map((c) => ({ key: c.key, label: tLabel(c.label) })),
      })).filter((g) => g.items.length > 0),
      activeKey: parentKey,
      onSelect: (key) => router.push(`/master-data/${key}`),
    };
  }, [ready, mayView, parentKey, t, tLabel, router]);

  useContextNav(contextNav);

  const handlePreseedCompany = async () => {
    const compId = selectedCompanyId || getActiveCompanyId();
    if (!compId) return;
    setPreseedLoading(true);
    setPreseedMsg("");
    try {
      await api.post(`/operational-area/preseed-company/${compId}`, {});
      setPreseedMsg(t("mdPreseedSuccess"));
      setTimeout(() => setPreseedMsg(""), 4000);
    } catch (e: any) {
      setPreseedMsg(e?.message || t("mdPreseedFailed"));
    } finally {
      setPreseedLoading(false);
    }
  };

  if (!ready || !user) return null;

  if (!mayView) {
    return (
      <ConsolePage size="narrow">
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
      </ConsolePage>
    );
  }

  return (
    <ConsolePage>
      <div className="flex flex-col gap-3 min-w-0">
        <PageHeader
          title={tLabel(activeConfig.label)}
          description={activeConfig.description ? tLabel(activeConfig.description) : undefined}
        />

        {/* Tenant Admin Company Selector or Company Pre-seed trigger */}
        <div className="flex items-center gap-2 pb-3 flex-wrap">
          {user.userType === "TENANT_ADMIN" && companies.length > 0 && (
            <div className="flex min-w-0 max-w-full items-center gap-2 bg-(--surface) border border-(--border) px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] uppercase font-bold text-(--text-muted)">{t("mdMasterScope")}</span>
              <select
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  if (e.target.value) setActiveCompanyId(e.target.value);
                }}
                className="min-w-0 bg-transparent text-xs font-semibold text-(--text-primary) focus:outline-none"
              >
                <option value="">{t("mdTenantGlobalCatalog")}</option>
                {companies.map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.company_name} {t("mdCompanyRecordsSuffix")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {user.userType === "COMPANY_ADMIN" && (
            <button
              onClick={handlePreseedCompany}
              disabled={preseedLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface-raised) hover:bg-(--surface) text-xs font-semibold text-(--text-secondary) shadow-2xs transition-all disabled:opacity-50"
            >
              {preseedLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-(--accent)" />}
              {t("mdPreseedButton")}
            </button>
          )}
        </div>
      </div>

      {preseedMsg && (
        <div
          className="p-3 rounded-[var(--radius-sm)] border text-xs font-semibold"
          style={{
            backgroundColor: "var(--success-muted)",
            borderColor: "rgba(47, 125, 91, 0.3)",
            color: "var(--success)",
          }}
        >
          {preseedMsg}
        </div>
      )}

      {tabConfigs.length > 0 && (
        <Tabs
          panelId="master-data-sheet"
          items={[parentConfig, ...tabConfigs].map((config) => ({
            value: config.key,
            label: tLabel(config.tabLabel || config.label),
          }))}
          value={activeConfig.key}
          onChange={(key) => router.push(`/master-data/${key}`)}
        />
      )}
      <div id="master-data-sheet" role={tabConfigs.length ? "tabpanel" : undefined} aria-label={tLabel(activeConfig.tabLabel || activeConfig.label)}>
        <MasterDataTable key={`${activeConfig.key}-${selectedCompanyId}`} config={activeConfig} />
      </div>
    </ConsolePage>
  );
}
