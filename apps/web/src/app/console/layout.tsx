"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldAlert,
  History,
  Bell,
  Database,
  Boxes,
  Landmark,
  Sprout,
  LogOut,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { getStoredUser, getStoredToken, clearSession, hasPermission, getActiveCompanyId, setActiveCompanyId, isTenantCompanyMode, setTenantCompanyMode, NavUser, CompanyRef } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { api } from "../../services/api-client";
import OnboardingWizard from "../../components/console/onboarding-wizard";
import { LanguageSelector } from "../../components/ui/language-selector";
import { AppShell, AppShellNavItem } from "../../components/shell/AppShell";
import { ThemeIconButton } from "../../components/shell/ThemeIconButton";

interface ConsoleSidebarItem extends AppShellNavItem {
  show: boolean;
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [tenantPlanInfo, setTenantPlanInfo] = useState<any>(null);
  const [ready, setReady] = useState(false);

  // Multi-company switcher
  const [headerSwitcherOpen,  setHeaderSwitcherOpen]  = useState(false);
  const [currentActiveCompanyId, setCurrentActiveCompanyId] = useState<string | null>(null);
  // Tenant Admin only: whether they've explicitly entered a company's
  // operational context (via "Switch" on the Companies list) — gates the
  // company-scoped sidebar tabs (Master Data/Inventory/Finance/Production/
  // Role Permissions/Audit Ledger/Notifications). Starts false on every
  // login so a tenant admin lands on the tenant-wide view first.
  const [companyMode, setCompanyMode] = useState(false);

  // Onboarding wizard state
  const [checkingOnboard, setCheckingOnboard] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [wizardSteps, setWizardSteps] = useState<any[]>([]);
  const [activeWizardStep, setActiveWizardStep] = useState(1);
  const [languages, setLanguages] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [nobs, setNobs] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setWizardError] = useState("");
  const [, setWizardSuccess] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const tenantId = localStorage.getItem("tenant_id");
    if (!token || !storedUser) { router.replace("/"); return; }
    if (storedUser.userType === "SYSTEM_ADMIN") { router.replace("/admin/tenants"); return; }

    // On mount: if active_company_id is set and differs from user.companyId,
    // update the user object so all pages read the correct company.
    const storedActiveId = getActiveCompanyId();
    const homeId = storedUser.companyId || (storedUser as any).company_id;
    const initialActiveId = storedActiveId || homeId || null;

    if (initialActiveId && initialActiveId !== homeId) {
      // Patch the in-memory and stored user to reflect switched company
      const patched = { ...storedUser, companyId: initialActiveId, company_id: initialActiveId };
      localStorage.setItem("user", JSON.stringify(patched));
      setUser(patched);
    } else {
      setUser(storedUser);
    }

    setCurrentActiveCompanyId(initialActiveId);
    if (initialActiveId && !storedActiveId) setActiveCompanyId(initialActiveId);
    setCompanyMode(isTenantCompanyMode());

    if (tenantId) {
      api.get(`/tenant/${tenantId}`).then((data: any) => setTenantPlanInfo(data)).catch(() => setTenantPlanInfo(null));
    }
    checkOnboardingStatus(
      initialActiveId && initialActiveId !== homeId
        ? { ...storedUser, companyId: initialActiveId, company_id: initialActiveId }
        : storedUser,
      tenantId || ""
    );
  }, [router]);

  const checkOnboardingStatus = async (storedUser: NavUser, tenantId: string) => {
    if (!tenantId) { setCheckingOnboard(false); setReady(true); return; }
    // Completing the setup wizard (legal entity details, registration numbers,
    // NOB/LOB, admin registration) is a company-admin task — a standard user's
    // role typically doesn't even grant COMPANY.SETTINGS.view, so the company
    // list fetch below 403s for them regardless of whether their company is
    // actually onboarded. That used to fall into the catch-all below and get
    // misread as "not onboarded", incorrectly routing already-active staff
    // into the wizard. Standard users never need this gate: by the time an
    // admin can invite one, the company they're being added to already exists
    // and (in normal use) is already set up.
    if (storedUser.userType === "STANDARD_USER") {
      setIsOnboarded(true);
      setCheckingOnboard(false);
      setReady(true);
      return;
    }
    try {
      const companiesList = await api.get(`/company/tenant/${tenantId}`);
      let filtered = companiesList;

      // Always use active company ID as the source of truth
      const activeId = getActiveCompanyId() ||
        storedUser.companyId ||
        (storedUser as any).company_id;

      if (storedUser.userType !== "TENANT_ADMIN") {
        filtered = companiesList.filter((c: any) => c.company_id === activeId);
        if (filtered.length === 0) filtered = companiesList; // fallback
      }
      if (filtered.length === 0) {
        setIsOnboarded(false);
        setActiveWizardStep(1);
      } else {
        const comp = companiesList.find((c: any) => c.company_id === activeId) || filtered[0];
        setActiveCompany(comp);
        if (comp.onboarding_status === "COMPLETED") {
          setIsOnboarded(true);
        } else {
          setIsOnboarded(false);
          const steps = await api.get(`/setup/wizard/status/${comp.company_id}`);
          setWizardSteps(steps);
          const firstPending = steps.find((s: any) => s.status !== "COMPLETED" && s.isMandatory);
          setActiveWizardStep(firstPending ? firstPending.stepOrder : 8);
        }
      }
      const [langList, currList, nobList] = await Promise.all([
        api.get("/language").catch(() => []),
        api.get("/currency").catch(() => []),
        api.get("/setup/wizard/nobs").catch(() => []),
      ]);
      setLanguages(langList);
      setCurrencies(currList);
      setNobs(nobList);
    } catch {
      setIsOnboarded(false);
    } finally {
      setCheckingOnboard(false);
      setReady(true);
    }
  };

  const reloadConsole = async () => {
    const tenantId = localStorage.getItem("tenant_id") || "";
    const storedUser = getStoredUser();
    if (!storedUser) return;
    setCheckingOnboard(true);
    await checkOnboardingStatus(storedUser, tenantId);
  };

  const handleLogout = () => { clearSession(); router.replace("/"); };

  const Spinner = () => (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        <RefreshCw className="animate-spin w-4 h-4" style={{ color: "var(--accent)" }} />
        Loading workspace…
      </div>
    </div>
  );

  if (!ready || !user) return <Spinner />;
  if (checkingOnboard) return <Spinner />;

  // Onboarding wizard guard
  if (!isOnboarded) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
        <header className="h-14 flex items-center px-4 sm:px-6 shrink-0 border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            NAV<span style={{ color: "var(--accent)" }}>Farm</span>
          </span>
          <span className="ml-2 hidden text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded sm:inline-flex" style={{ color: "var(--text-muted)", backgroundColor: "var(--surface-raised)" }}>
            Company Setup
          </span>
          <div className="ml-auto flex items-center gap-3">
            <ThemeIconButton />
            <button onClick={handleLogout} aria-label={t("signOut")} className="text-sm flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 sm:px-3" style={{ color: "var(--text-secondary)" }}>
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          </div>
        </header>
        <OnboardingWizard
          wizardSteps={wizardSteps}
          activeWizardStep={activeWizardStep}
          setActiveWizardStep={setActiveWizardStep}
          activeCompany={activeCompany}
          setActiveCompany={setActiveCompany}
          tenantId={localStorage.getItem("tenant_id") || ""}
          languages={languages}
          currencies={currencies}
          nobs={nobs}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          setActionError={setWizardError}
          setActionSuccess={setWizardSuccess}
          fetchWizardProgress={async (companyId: string) => {
            const steps = await api.get(`/setup/wizard/status/${companyId}`);
            setWizardSteps(steps);
          }}
          loadConsoleWorkspace={reloadConsole}
        />
      </div>
    );
  }

  // Tenant Admin's company-scoped tabs (Master Data/Inventory/Finance/Production/
  // Role Permissions/Audit Ledger/Notifications) only appear once they've
  // explicitly entered a company via "Switch" on the Companies list — before
  // that, they only see the tenant-wide tabs (Dashboard/Companies/Team
  // Management). Every other user type is unaffected (always governed by
  // their normal hasPermission() check).
  const isTenantAdmin = user.userType === "TENANT_ADMIN";
  const companyScoped = !isTenantAdmin || companyMode;

  const navItems: ConsoleSidebarItem[] = [
    { label: t("dashboard"),       href: "/console/dashboard",      icon: LayoutDashboard, show: user.userType === "TENANT_ADMIN" || user.userType === "COMPANY_ADMIN" },
    { label: t("companies"),       href: "/console/companies",      icon: Building2,       show: hasPermission(user, "COMPANY", "SETTINGS", "can_view") },
    { label: t("masterData"),      href: "/console/master-data",    icon: Database,        show: companyScoped && hasPermission(user, "MASTER_DATA", "UOM", "can_view") },
    { label: t("inventory"),       href: "/console/inventory",      icon: Boxes,           show: companyScoped && hasPermission(user, "INVENTORY", "GOODS_RECEIPT", "can_view") },
    { label: t("finance"),         href: "/console/finance",        icon: Landmark,        show: companyScoped && hasPermission(user, "FINANCE", "JOURNAL", "can_view") },
    { label: t("production"),      href: "/console/production",     icon: Sprout,          show: companyScoped && hasPermission(user, "PRODUCTION", "BATCH", "can_view") },
    { label: t("teamManagement"),  href: "/console/users",          icon: Users,           show: hasPermission(user, "RBAC", "USER", "can_view") },
    { label: t("rolePermissions"), href: "/console/roles",          icon: ShieldAlert,     show: companyScoped && hasPermission(user, "RBAC", "ROLE", "can_view") },
    { label: t("auditLedger"),     href: "/console/audit",          icon: History,         show: companyScoped && hasPermission(user, "AUDIT", "LOGS", "can_view") },
    { label: t("notifications"),   href: "/console/notifications",  icon: Bell,            show: companyScoped && hasPermission(user, "NOTIFICATION", "SETTINGS", "can_view") },
  ].filter((i) => i.show);

  const initials = user.fullName?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
  const breadcrumbLabel = navItems.find((i) => pathname.startsWith(i.href))?.label || "Console";

  const planName = (tenantPlanInfo?.plan_id?.replace("PLAN_", "") || "STANDARD").toUpperCase();
  const sidebarSummary = (
    <div className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.05] px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">Current plan</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-(--success)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--success)" /> Active
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{planName}</p>
    </div>
  );

  const headerRight = (
    <>
      {/* ── "Managing {company} — Back to Tenant" — Tenant Admin only, shown while
          they've explicitly entered a company's operational context ── */}
      {user?.userType === "TENANT_ADMIN" && companyMode && activeCompany && (() => {
              const homeCompanyId = user.companies?.find((c) => c.is_primary)?.company_id || user.companies?.[0]?.company_id || activeCompany.company_id;
              // Impersonation context is a standing state, not an action — it is
              // marked, not shouted, so the page's real primary action stays the
              // loudest thing on screen.
              return (
                <div
                  className="flex min-w-0 items-center gap-2 rounded-[var(--radius-pill)] py-[5px] pl-2.5 pr-1.5 text-xs font-semibold"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--warning-muted)",
                    color: "var(--warning)",
                  }}
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden truncate xl:inline" style={{ maxWidth: 200 }}>
                    Managing: {activeCompany.company_name}
                  </span>
                  <button
                    onClick={() => {
                      const currentUser = getStoredUser();
                      if (currentUser) {
                        const patched = { ...currentUser, companyId: homeCompanyId, company_id: homeCompanyId };
                        localStorage.setItem("user", JSON.stringify(patched));
                        localStorage.setItem("navfarm_auth_user", JSON.stringify(patched));
                      }
                      setActiveCompanyId(homeCompanyId);
                      setTenantCompanyMode(false);
                      window.location.href = "/console/companies";
                    }}
                    title="Back to Tenant Admin — exit this company's context"
                    aria-label="Back to Tenant Admin"
                    className="nf-press flex min-h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-1.5 text-[11px] font-semibold underline-offset-2 hover:underline sm:min-h-0"
                    style={{ border: "none", background: "transparent", color: "var(--warning)", cursor: "pointer" }}
                  >
                    <ArrowLeft className="h-3 w-3 shrink-0" />
                    <span className="hidden sm:inline">Back to Tenant</span>
                  </button>
                </div>
              );
            })()}

            {/* ── Company Switcher Pill (header) — only when ≥2 companies ── */}
            {user?.companies && user.companies.length > 1 && (() => {
              const active = user.companies.find((c) => c.company_id === currentActiveCompanyId) || user.companies[0];
              return (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setHeaderSwitcherOpen((o) => !o)}
                    className="nf-press flex min-h-9 min-w-0 max-w-[190px] items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] border py-[5px] pl-2.5 pr-2 text-xs font-semibold transition-colors sm:min-h-0"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface-secondary)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                    }}
                    title="Switch active company"
                    aria-label={`Switch active company — current: ${active.company_name}`}
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                    <span className="hidden truncate md:inline">{active.company_name}</span>
                    <ChevronRight
                      className="h-3 w-3 shrink-0 transition-transform"
                      style={{
                        color: "var(--text-muted)",
                        transform: headerSwitcherOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  {/* Dropdown */}
                  {headerSwitcherOpen && (
                    <>
                      {/* Click-away overlay */}
                      <div
                        style={{ position: "fixed", inset: 0, zIndex: 40 }}
                        onClick={() => setHeaderSwitcherOpen(false)}
                      />
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        minWidth: 220,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        overflow: "hidden",
                        zIndex: 50,
                      }}>
                        {/* Header of dropdown */}
                        <div style={{
                          padding: "10px 14px 8px",
                          borderBottom: "1px solid var(--border)",
                        }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: 0 }}>
                            Switch Company
                          </p>
                        </div>
                        {/* Company list */}
                        {user.companies.map((c: CompanyRef) => {
                          const isCurrent = c.company_id === currentActiveCompanyId;
                          return (
                            <button
                              key={c.company_id}
                              onClick={() => {
                                // Update localStorage user so all pages see the new companyId
                                const currentUser = getStoredUser();
                                if (currentUser) {
                                  const patched = {
                                    ...currentUser,
                                    companyId:  c.company_id,
                                    company_id: c.company_id,
                                  };
                                  localStorage.setItem("user", JSON.stringify(patched));
                                  localStorage.setItem("navfarm_auth_user", JSON.stringify(patched));
                                }
                                setActiveCompanyId(c.company_id);
                                setCurrentActiveCompanyId(c.company_id);
                                setHeaderSwitcherOpen(false);
                                window.location.reload();
                              }}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 14px",
                                background: isCurrent ? "var(--accent-muted)" : "transparent",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "background 150ms",
                              }}
                              onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "var(--surface-raised)"; }}
                              onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                            >
                              {/* Avatar circle with initials */}
                              <div style={{
                                width: 30, height: 30,
                                borderRadius: "50%",
                                backgroundColor: isCurrent ? "var(--accent)" : "var(--surface-raised)",
                                color: isCurrent ? "#fff" : "var(--text-secondary)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, flexShrink: 0,
                                border: isCurrent ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                              }}>
                                {c.company_name.substring(0, 2).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isCurrent ? "var(--accent)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {c.company_name}
                                </p>
                                {c.is_primary && (
                                  <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>{t("homeCompany")}</p>
                                )}
                              </div>
                              {isCurrent && (
                                <span style={{
                                  width: 8, height: 8, borderRadius: "50%",
                                  backgroundColor: "var(--accent)", flexShrink: 0,
                                }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

      {/* Language is a set-once preference, not a per-task control — it yields
          first on narrow screens so the header never forces page overflow. */}
      <span className="hidden shrink-0 sm:inline-flex"><LanguageSelector /></span>
      <ThemeIconButton />
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        title={user.fullName}
      >
        {initials}
      </div>
    </>
  );

  return (
    <AppShell
      brandHref="/console/dashboard"
      brandSubtitle="Management console"
      sidebarSummary={sidebarSummary}
      navSectionLabel="Organization"
      navItems={navItems}
      pathname={pathname}
      userInitials={initials}
      userName={user.fullName}
      userEmail={user.email}
      onLogout={handleLogout}
      signOutLabel={t("signOut")}
      breadcrumbRoot="Console"
      breadcrumbCurrent={breadcrumbLabel}
      headerRight={headerRight}
    >
      {children}
    </AppShell>
  );
}
