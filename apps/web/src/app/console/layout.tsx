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
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { getStoredUser, getStoredToken, clearSession, hasPermission, getActiveCompanyId, setActiveCompanyId, isTenantCompanyMode, setTenantCompanyMode, NavUser } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { api } from "../../services/api-client";
import OnboardingWizard from "../../components/console/onboarding-wizard";
import { LanguageSelector } from "../../components/ui/language-selector";
import { AppShell, AppShellNavItem } from "../../components/shell/AppShell";
import { ContextNavProvider } from "../../components/shell/ContextNav";
import { PROFILE_ITEMS } from "../../components/shell/ProfilePopover";
import { ThemeIconButton } from "../../components/shell/ThemeIconButton";
import { WorkspaceSwitcher } from "../../components/shell/WorkspaceSwitcher";

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

  // Multi-company switcher. Open/dismiss state, Escape, outside click and focus
  // restoration are the shared Popover's job now — this layout keeps only the
  // selection effect, which is unchanged.
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
  const [timezones, setTimezones] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
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
      const [langList, currList, tzList, countryList, nobList] = await Promise.all([
        api.get("/language").catch(() => []),
        api.get("/currency").catch(() => []),
        api.get("/timezone").catch(() => []),
        api.get("/country").catch(() => []),
        api.get("/setup/wizard/nobs").catch(() => []),
      ]);
      setLanguages(langList);
      setCurrencies(currList);
      setTimezones(tzList);
      setCountries(countryList);
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
          timezones={timezones}
          countries={countries}
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
    { label: (isTenantAdmin && companyMode) || user.userType === "COMPANY_ADMIN" ? t("company") : t("companies"), href: "/console/companies", icon: Building2, show: hasPermission(user, "COMPANY", "SETTINGS", "can_view") },
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

            {/* ── Company Switcher (header) — only when ≥2 companies ── */}
            {user?.companies && user.companies.length > 1 && (
              <WorkspaceSwitcher
                companies={user.companies}
                activeCompanyId={currentActiveCompanyId}
                label={t("switchCompany")}
                homeCompanyLabel={t("homeCompany")}
                onSelect={(companyId) => {
                  // Unchanged selection behaviour: patch the stored user so every
                  // page reads the new companyId, record the active company, then
                  // reload so company-scoped data refetches.
                  const currentUser = getStoredUser();
                  if (currentUser) {
                    const patched = {
                      ...currentUser,
                      companyId:  companyId,
                      company_id: companyId,
                    };
                    localStorage.setItem("user", JSON.stringify(patched));
                    localStorage.setItem("navfarm_auth_user", JSON.stringify(patched));
                  }
                  setActiveCompanyId(companyId);
                  setCurrentActiveCompanyId(companyId);
                  window.location.reload();
                }}
              />
            )}

      {/* Language is a set-once preference, not a per-task control — it yields
          first on narrow screens so the header never forces page overflow. */}
      <span className="hidden shrink-0 sm:inline-flex"><LanguageSelector /></span>
      <ThemeIconButton />
      {/* The avatar that used to sit here is now the ProfilePopover trigger,
          rendered by AppShell so every shell route gets the same account menu. */}
    </>
  );

  return (
    // The module index is a shell region — it has to sit outside <main> to hold
    // still while the content scrolls — but which sections exist is page state.
    // The provider is the seam: routes register an index, the shell renders it.
    // Routes that register nothing stay full-width, which is every route
    // outside Master Data, Inventory, Finance and Production.
    <ContextNavProvider>
      {(contextNav) => (
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
          profileItems={PROFILE_ITEMS.map((key) => ({ label: t(key) }))}
          profileMenuLabel={t("accountMenu")}
          breadcrumbRoot="Console"
          breadcrumbCurrent={breadcrumbLabel}
          headerRight={headerRight}
          contextNav={contextNav}
        >
          {children}
        </AppShell>
      )}
    </ContextNavProvider>
  );
}
