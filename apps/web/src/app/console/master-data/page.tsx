"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, NavUser, getActiveCompanyId, setActiveCompanyId } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { MASTER_DATA_CONFIGS, MASTER_DATA_GROUPS, getConfig } from "@/modules/master-data/configs";
import MasterDataTable from "@/modules/master-data/MasterDataTable";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShieldAlert, Download, Building2, RefreshCw } from "lucide-react";
import { api } from "@/services/api-client";

const S = {
  sub: { color: "var(--text-secondary)" },
};

export default function MasterDataPage() {
  const router = useRouter();
  const { t, tLabel } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeKey, setActiveKey] = useState(MASTER_DATA_CONFIGS[0].key);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [preseedLoading, setPreseedLoading] = useState(false);
  const [preseedMsg, setPreseedMsg] = useState("");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);

    const activeComp = getActiveCompanyId() || "";
    setSelectedCompanyId(activeComp);

    // Fetch company list for Tenant Admin company inspection
    const tenantId = localStorage.getItem("tenant_id") || stored.tenantId;
    if (tenantId) {
      api.get(`/company/tenant/${tenantId}`).then((res: any) => {
        if (Array.isArray(res)) setCompanies(res);
      }).catch(() => {});
    }

    setReady(true);
  }, [router]);

  const mayViewMasterData =
    user?.userType === "COMPANY_ADMIN" ||
    user?.userType === "SYSTEM_ADMIN" ||
    user?.userType === "TENANT_ADMIN" ||
    user?.userType === "OPERATIONAL_ADMIN";

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

  const handlePreseedCompany = async () => {
    const compId = selectedCompanyId || getActiveCompanyId();
    if (!compId) return;
    setPreseedLoading(true);
    setPreseedMsg("");
    try {
      await api.post(`/operational-area/preseed-company/${compId}`, {});
      setPreseedMsg("Company master data pre-seeded successfully from Tenant templates!");
      setTimeout(() => setPreseedMsg(""), 4000);
    } catch (e: any) {
      setPreseedMsg(e?.message || "Failed to pre-seed master data");
    } finally {
      setPreseedLoading(false);
    }
  };

  if (!ready || !user) return null;

  if (!mayViewMasterData) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={tLabel(activeConfig.label)}
          description={activeConfig.description ? tLabel(activeConfig.description) : undefined}
        />

        {/* Tenant Admin Company Selector or Company Pre-seed trigger */}
        <div className="flex items-center gap-2 pb-3 flex-wrap">
          {user.userType === "TENANT_ADMIN" && companies.length > 0 && (
            <div className="flex items-center gap-2 bg-(--surface) border border-(--border) px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] uppercase font-bold text-(--text-muted)">Master Scope:</span>
              <select
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  if (e.target.value) setActiveCompanyId(e.target.value);
                }}
                className="bg-transparent text-xs font-semibold text-(--text-primary) focus:outline-none"
              >
                <option value="">Tenant Global Catalog (Templates)</option>
                {companies.map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.company_name} (Company Records)
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
              Pre-Seed from Tenant Catalog
            </button>
          )}
        </div>
      </div>

      {preseedMsg && (
        <div
          className="mb-4 p-3 rounded-[var(--radius-sm)] border text-xs font-semibold"
          style={{
            backgroundColor: "var(--success-muted)",
            borderColor: "rgba(47, 125, 91, 0.3)",
            color: "var(--success)",
          }}
        >
          {preseedMsg}
        </div>
      )}

      <MasterDataTable key={`${activeConfig.key}-${selectedCompanyId}`} config={activeConfig} />
    </div>
  );
}
