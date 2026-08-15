"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  ShieldAlert,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredUser, getStoredToken, getStoredTenantId, getActiveCompanyId, NavUser } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";
import { LoadingState, ErrorState } from "../../../components/ui/states";
import { PageHeader } from "../../../components/ui/PageHeader";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tenantPlanInfo, setTenantPlanInfo] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const tenantId = getStoredTenantId();
    if (!token || !storedUser || !tenantId) { router.replace("/"); return; }
    setUser(storedUser);
    loadDashboard(storedUser, tenantId);
  }, [router]);

  const loadDashboard = async (storedUser: NavUser, tenantId: string) => {
    setLoading(true);
    try {
      const [tenant, companiesList, usersList] = await Promise.all([
        api.get(`/tenant/${tenantId}`),
        api.get(`/company/tenant/${tenantId}`),
        api.get("/auth/users").catch(() => []),
      ]);
      setTenantPlanInfo(tenant);

      // Use the active company from localStorage (reflects company switch)
      const activeId = getActiveCompanyId() ||
        storedUser.companyId ||
        (storedUser as any).company_id;

      let filteredCompanies = companiesList;
      if (storedUser.userType !== "TENANT_ADMIN") {
        // For non-tenant-admins show only the currently active company
        filteredCompanies = companiesList.filter((c: any) => c.company_id === activeId);
        // Fallback: show all if filter returns nothing (e.g. first load)
        if (filteredCompanies.length === 0) filteredCompanies = companiesList;
      }
      setCompanies(filteredCompanies);
      setUsers(usersList);

      // Active company = the one matching the switched/active ID
      const assigned =
        companiesList.find((c: any) => c.company_id === activeId) ||
        filteredCompanies[0] ||
        null;
      setActiveCompany(assigned);
    } catch (e: any) {
      setError(e?.message || t("failedToLoadDashboard"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState label={t("loadingDashboard")} />;

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={() => user && loadDashboard(user, getStoredTenantId() || "")} />
      </div>
    );
  }

  const userPercent  = Math.min(100, (users.length / (tenantPlanInfo?.max_users || 5)) * 100);
  const compPercent  = Math.min(100, (companies.length / (tenantPlanInfo?.max_companies || 1)) * 100);
  const isTenantAdmin = user?.userType === "TENANT_ADMIN";

  const quickActions = [
    { label: t("companies"),       description: t("manageCompanySetup"),     href: "/console/companies",     icon: Building2 },
    { label: t("teamManagement"),  description: t("inviteAndManageUsers"),   href: "/console/users",         icon: Users },
    { label: t("rolePermissions"), description: t("configureRbacPolicies"), href: "/console/roles",         icon: ShieldAlert },
  ];

  const statCard = (
    label: string,
    icon: React.ElementType,
    main: React.ReactNode,
    sub: React.ReactNode,
    bar?: { pct: number }
  ) => (
    <div className="rounded-[var(--radius-md)] p-5 border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="nf-text-caption font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
        {React.createElement(icon, { className: "w-4 h-4", style: { color: "var(--text-muted)" } })}
      </div>
      <div className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{main}</div>
      <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{sub}</div>
      {bar && (
        <div className="mt-3">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
            {/* Neutral until the plan limit is genuinely close — colour marks pressure, not decoration. */}
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${bar.pct}%`,
                backgroundColor: bar.pct >= 90 ? "var(--danger)" : bar.pct >= 75 ? "var(--warning)" : "var(--text-muted)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-4 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8">
      <PageHeader
        title={isTenantAdmin ? t("operationalDashboard") : t("companyDashboard")}
        description={
          <>
            {t("welcomeBack")}{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{user?.fullName}</span>
          </>
        }
        actions={
          <span className="nf-text-caption shrink-0 whitespace-nowrap font-semibold uppercase tracking-wider px-3 py-1.5 rounded-[var(--radius-pill)]"
            style={{ backgroundColor: "var(--badge-bg)", color: "var(--text-secondary)" }}>
            {user?.userType?.replace("_", " ")}
          </span>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Company */}
        <div className="rounded-[var(--radius-md)] p-5 border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="nf-text-caption font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("activeCompany")}</span>
            <Building2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {activeCompany?.company_name || "—"}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {activeCompany?.onboarding_status === "COMPLETED" ? (
              <><CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--success)" }} /><span className="text-xs font-medium" style={{ color: "var(--success)" }}>{t("setupComplete")}</span></>
            ) : (
              <><AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--warning)" }} /><span className="text-xs font-medium" style={{ color: "var(--warning)" }}>{t("setupPending")}</span></>
            )}
          </div>
        </div>

        {statCard(t("companies"), Building2,
          <span className="text-2xl font-semibold">{companies.length}</span>,
          t("ofLimitPct", { max: tenantPlanInfo?.max_companies || 1, pct: compPercent.toFixed(0) }),
          { pct: compPercent }
        )}

        {statCard(t("teamMembers"), Users,
          <span className="text-2xl font-semibold">{users.length}</span>,
          t("ofSeatsPct", { max: tenantPlanInfo?.max_users || 5, pct: userPercent.toFixed(0) }),
          { pct: userPercent }
        )}

        {statCard(t("subscription"), TrendingUp,
          tenantPlanInfo?.plan_id?.replace("PLAN_", "") || "—",
          `${tenantPlanInfo?.billing_cycle || t("monthly")} · ${tenantPlanInfo?.db_name || "—"}`
        )}
      </div>

      {/* Active company detail — lives directly on the page; a hairline and
          spacing carry the grouping without another container. */}
      {activeCompany && (
        <section className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <h2 className="nf-text-caption font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("activeCompanyDetails")}</h2>
            <Link href="/console/companies" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}>
              <Settings className="w-3.5 h-3.5" /> {t("manage")}
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
            {[
              { label: t("companyName"),   value: activeCompany.company_name || "—" },
              { label: t("registrationNo"), value: activeCompany.registration_no || "—" },
              { label: t("country"),        value: activeCompany.country_id || "—" },
              { label: t("onboardingLabel"), value: activeCompany.onboarding_status || "—" },
            ].map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="nf-text-caption mb-1" style={{ color: "var(--text-muted)" }}>{row.label}</dt>
                <dd className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Quick actions — a plain list of destinations, not three cards. */}
      <section className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
        <h2 className="nf-text-caption font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{t("quickActionsHeading")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="nf-press group -mx-2 flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-3 transition-colors hover:bg-(--row-hover)"
            >
              <action.icon className="h-4 w-4 shrink-0" strokeWidth={1.6} style={{ color: "var(--text-muted)" }} />
              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{action.label}</div>
                <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{action.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
