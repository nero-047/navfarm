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
  LogOut,
  RefreshCw,
  Layers,
  CalendarClock,
  Wheat,
  Pill,
  HeartPulse,
  CheckSquare,
  Settings,
} from "lucide-react";
import {
  getStoredUser,
  getStoredToken,
  clearSession,
  getActiveCompanyId,
  setActiveCompanyId,
  getActiveWorkspaceScope,
  setActiveWorkspaceScope,
  getActiveLob,
  NavUser,
} from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { api } from "../../services/api-client";
import OnboardingWizard from "../../components/console/onboarding-wizard";
import WorkspaceScopeSwitcher from "../../components/console/workspace-scope-switcher";
import { LanguageSelector } from "../../components/ui/language-selector";
import { AppShell, AppShellNavItem } from "../../components/shell/AppShell";
import { ContextNavProvider } from "../../components/shell/ContextNav";
import { PROFILE_ITEMS } from "../../components/shell/ProfilePopover";
import { ThemeIconButton } from "../../components/shell/ThemeIconButton";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);

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

    const storedActiveId = getActiveCompanyId();
    const homeId = storedUser.companyId || (storedUser as any).company_id;
    const initialActiveId = storedActiveId || homeId || null;

    // Strict role scope check on load:
    const activeScope = getActiveWorkspaceScope();
    if (storedUser.userType !== "TENANT_ADMIN" && activeScope === "TENANT") {
      setActiveWorkspaceScope("COMPANY");
    }

    if (initialActiveId && initialActiveId !== homeId) {
      const patched = { ...storedUser, companyId: initialActiveId, company_id: initialActiveId };
      localStorage.setItem("user", JSON.stringify(patched));
      setUser(patched);
    } else {
      setUser(storedUser);
    }

    if (initialActiveId && !storedActiveId) setActiveCompanyId(initialActiveId);

    if (tenantId) {
      api.get(`/tenant/${tenantId}`).catch(() => {});
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
  const activeScope = getActiveWorkspaceScope();
  const activeLob = getActiveLob();

  let navItems: AppShellNavItem[] = [];

  if (activeScope === "TENANT") {
    navItems = [
      { label: t("dashboard"),       href: "/console/dashboard",      icon: LayoutDashboard },
      { label: t("companies"),       href: "/console/companies",      icon: Building2 },
      { label: t("masterData"),      href: "/console/master-data",    icon: Database },
      { label: t("teamManagement"),  href: "/console/users",          icon: Users },
      { label: t("auditLedger"),     href: "/console/audit",          icon: History },
      { label: t("notifications"),   href: "/console/notifications",  icon: Bell },
    ];
  } else if (activeScope === "COMPANY") {
    navItems = [
      { label: "Company Dashboard",  href: "/console/dashboard",      icon: LayoutDashboard },
      { label: "Operational Areas",  href: "/console/operational-areas", icon: Layers },
      { label: t("company"),         href: "/console/companies",      icon: Building2 },
      { label: t("masterData"),      href: "/console/master-data",    icon: Database },
      { label: t("inventory"),       href: "/console/inventory",      icon: Boxes },
      { label: t("finance"),         href: "/console/finance",        icon: Landmark },
      { label: "Production",         href: "/console/production",     icon: Wheat },
      { label: "Herd Register",      href: "/console/piggery",        icon: Pill },
      { label: t("teamManagement"),  href: "/console/users",          icon: Users },
      { label: t("rolePermissions"), href: "/console/roles",          icon: ShieldAlert },
      { label: t("notifications"),   href: "/console/notifications",  icon: Bell },
    ];
  } else {
    // OPERATIONAL Area Scope (e.g. Piggery / Dairy / Poultry)
    navItems = [
      { label: `${activeLob || "Farm"} Dashboard`, href: "/console/dashboard", icon: LayoutDashboard },
      {
        label: "Batch Management",
        href: "/console/production",
        icon: Layers,
        children: [
          { label: "Batch List", href: "/console/production?tab=batches" },
          { label: "Batch Stages", href: "/console/production?tab=batch-stages" },
          { label: "Animal Assignment", href: "/console/production?tab=batch-animal-assignment" },
          { label: "Batch Data Entry", href: "/console/production?tab=daily-operational-entry" },
        ],
      },
      { label: "Scheduler", href: "/console/production?tab=schedulers", icon: CalendarClock },
      { label: "Feed Management", href: "/console/production?tab=stage-consumption", icon: Wheat },
      { label: activeLob === "DAIRY" ? "Dairy Cow Register" : "Animal & Herd Register", href: "/console/piggery", icon: Pill },
      { label: "Inventory & Stock", href: "/console/inventory", icon: Boxes },
      { label: "Mortality & Health", href: "/console/production?tab=daily-entry", icon: HeartPulse },
      { label: "Finance & Costing", href: "/console/finance", icon: Landmark },
      { label: t("masterData"), href: "/console/master-data", icon: Database },
      { label: "Approvals", href: "/console/approvals", icon: CheckSquare },
      { label: t("settings"), href: "/console/area-settings", icon: Settings },
    ];
  }

  const sidebarSummary = (
    <WorkspaceScopeSwitcher onScopeChanged={() => window.location.reload()} />
  );

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const breadcrumbLabel =
    activeScope === "TENANT"
      ? "Tenant Workspace"
      : activeScope === "COMPANY"
      ? activeCompany?.company_name || "Company Workspace"
      : `${activeLob || "Operational"} Area`;

  const headerRight = (
    <>
      <span className="hidden shrink-0 sm:inline-flex"><LanguageSelector /></span>
      <ThemeIconButton />
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
