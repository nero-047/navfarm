"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldAlert,
  History,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { getStoredUser, getStoredToken, clearSession, hasPermission, NavUser } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../services/api-client";
import OnboardingWizard from "../../components/console/onboarding-wizard";

// ── Clean circular theme toggle for the header ─────────────────────────────
function ThemeIconButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light" : "Switch to Dark"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--color-navy)]"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

interface ConsoleSidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  show: boolean;
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<NavUser | null>(null);
  const [tenantPlanInfo, setTenantPlanInfo] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

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
    setUser(storedUser);

    if (tenantId) {
      api.get(`/tenant/${tenantId}`).then((data: any) => setTenantPlanInfo(data)).catch(() => setTenantPlanInfo(null));
    }
    checkOnboardingStatus(storedUser, tenantId || "");
  }, [router]);

  const checkOnboardingStatus = async (storedUser: NavUser, tenantId: string) => {
    if (!tenantId) { setCheckingOnboard(false); setReady(true); return; }
    try {
      const companiesList = await api.get(`/company/tenant/${tenantId}`);
      let filtered = companiesList;
      if (storedUser.userType !== "TENANT_ADMIN") {
        const myId = storedUser.companyId || (storedUser as any).company_id;
        filtered = companiesList.filter((c: any) => c.company_id === myId);
      }
      if (filtered.length === 0) {
        setIsOnboarded(false);
        setActiveWizardStep(1);
      } else {
        const comp = filtered.find((c: any) => c.company_id === (storedUser.companyId || (storedUser as any).company_id)) || filtered[0];
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
        <header className="h-14 flex items-center px-6 shrink-0 border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            NAV<span style={{ color: "var(--accent)" }}>Farm</span>
          </span>
          <span className="ml-2 text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: "var(--text-muted)", backgroundColor: "var(--surface-raised)" }}>
            Company Setup
          </span>
          <div className="ml-auto flex items-center gap-3">
            <ThemeIconButton />
            <button onClick={handleLogout} className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <LogOut className="w-4 h-4" /> Sign Out
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

  const navItems: ConsoleSidebarItem[] = [
    { label: "Dashboard",       href: "/console/dashboard",      icon: LayoutDashboard, show: user.userType === "TENANT_ADMIN" || user.userType === "COMPANY_ADMIN" },
    { label: "Companies",       href: "/console/companies",      icon: Building2,       show: hasPermission(user, "COMPANY", "SETTINGS", "can_view") },
    { label: "Team Management", href: "/console/users",          icon: Users,           show: hasPermission(user, "RBAC", "USER", "can_view") },
    { label: "Role Permissions",href: "/console/roles",          icon: ShieldAlert,     show: hasPermission(user, "RBAC", "ROLE", "can_view") },
    { label: "Audit Ledger",    href: "/console/audit",          icon: History,         show: hasPermission(user, "AUDIT", "LOGS", "can_view") },
    { label: "Notifications",   href: "/console/notifications",  icon: Bell,            show: hasPermission(user, "NOTIFICATION", "SETTINGS", "can_view") },
  ].filter((i) => i.show);

  const initials = user.fullName?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
  const breadcrumbLabel = navItems.find((i) => pathname.startsWith(i.href))?.label || "Console";

  const SidebarContent = () => {
    const planName = (tenantPlanInfo?.plan_id?.replace("PLAN_", "") || "STANDARD").toUpperCase();
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-white/[0.08] px-5 pb-4 pt-5">
          <Link href="/console/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f16d50,#c24332)] text-sm font-black text-white shadow-lg">NF</span>
            <span>
              <span className="block text-xl font-bold tracking-tight text-white">NAV<span className="text-[#f16d50]">Farm</span></span>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.22em] text-white/35">Management console</span>
            </span>
          </Link>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">Current plan</span>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active</span>
            </div>
            <p className="mt-1 text-sm font-bold text-white">{planName}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">Organization</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setSidebarOpen(false)} className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all ${isActive ? "bg-white text-[#111a4f] shadow-[0_8px_22px_rgba(0,0,0,0.16)]" : "text-white/62 hover:bg-white/[0.07] hover:text-white"}`}>
                    {isActive && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-[#ed6a4f]" />}
                    <item.icon size={17} strokeWidth={isActive ? 2 : 1.6} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          <div className="flex items-center gap-3 px-1 pb-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">{initials}<span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b1248] bg-emerald-400" /></span>
            <span className="min-w-0"><span className="block truncate text-xs font-semibold text-white">{user.fullName}</span><span className="mt-0.5 block truncate text-[9px] text-white/38">{user.email}</span></span>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-medium text-white/50 transition hover:border-red-400/25 hover:bg-red-400/10 hover:text-red-300"><LogOut size={14} /> Sign out</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[linear-gradient(180deg,#0a1244_0%,#111b55_58%,#071039_100%)] text-white lg:flex"><SidebarContent /></aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
          <aside className="relative h-full w-[min(300px,86vw)] bg-[linear-gradient(180deg,#0a1244_0%,#111b55_58%,#071039_100%)] shadow-2xl">
            <button onClick={() => setSidebarOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white"><X size={19} /></button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1 lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e4e8ef] bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 xl:px-8">
            <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e8ef] text-[#30364b] lg:hidden"><Menu size={18} /></button>
            <nav className="flex min-w-0 items-center gap-2 text-xs">
              <span className="hidden font-medium text-[#9298a8] sm:inline">Organization console</span>
              <ChevronRight size={13} className="hidden text-[#b0b5c0] sm:block" />
              <span className="truncate font-semibold text-[#30364b]">{breadcrumbLabel}</span>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <ThemeIconButton />
              <div className="flex h-10 items-center gap-2 rounded-xl border border-[#e4e8ef] bg-white px-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#1c4aa9,#0b1248)] text-[10px] font-bold text-white">{initials}</span>
                <span className="hidden max-w-32 truncate text-xs font-semibold text-[#30364b] sm:block">{user.fullName}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
