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
  Database,
  Boxes,
  LogOut,
  Menu,
  X,
  ChevronRight,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { getStoredUser, getStoredToken, clearSession, hasPermission, getActiveCompanyId, setActiveCompanyId, NavUser, CompanyRef } from "../../hooks/useAuth";
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

  // Multi-company switcher
  const [headerSwitcherOpen,  setHeaderSwitcherOpen]  = useState(false);
  const [currentActiveCompanyId, setCurrentActiveCompanyId] = useState<string | null>(null);

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
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            NAV<span style={{ color: "var(--accent)" }}>Farm</span>
          </span>
          <span className="ml-2 hidden text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded sm:inline-flex" style={{ color: "var(--text-muted)", backgroundColor: "var(--surface-raised)" }}>
            Company Setup
          </span>
          <div className="ml-auto flex items-center gap-3">
            <ThemeIconButton />
            <button onClick={handleLogout} aria-label="Sign out" className="text-sm flex h-10 items-center gap-1.5 rounded-xl px-2 sm:px-3" style={{ color: "var(--text-secondary)" }}>
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
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
    { label: "Master Data",     href: "/console/master-data",    icon: Database,        show: hasPermission(user, "MASTER_DATA", "UOM", "can_view") },
    { label: "Inventory",       href: "/console/inventory",      icon: Boxes,           show: hasPermission(user, "INVENTORY", "GOODS_RECEIPT", "can_view") },
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
    <div className="min-h-screen bg-[var(--bg)] lg:flex">
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

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}
        className="min-w-0 lg:ml-[264px]">
        {/* Top header */}
        <header style={{
          backgroundColor: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ color: "var(--text-secondary)", marginRight: 12, cursor: "pointer", background: "none", border: "none" }}
            className="md:hidden"
          >
            <Menu style={{ width: 20, height: 20 }} />
          </button>
          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-muted)" }}>
            <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>Console</span>
            <ChevronRight style={{ width: 14, height: 14 }} />
            <span style={{ fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{breadcrumbLabel}</span>
          </nav>
          {/* Right side: company switcher + theme + user */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>

            {/* ── Company Switcher Pill (header) — only when ≥2 companies ── */}
            {user?.companies && user.companies.length > 1 && (() => {
              const active = user.companies.find((c) => c.company_id === currentActiveCompanyId) || user.companies[0];
              return (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setHeaderSwitcherOpen((o) => !o)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px 5px 8px",
                      borderRadius: 999,
                      border: "1.5px solid var(--accent)",
                      backgroundColor: "var(--accent-muted)",
                      color: "var(--accent)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                      overflow: "hidden",
                      transition: "background-color 150ms, box-shadow 150ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                    title="Switch active company"
                  >
                    {/* dot indicator */}
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      backgroundColor: "var(--accent)",
                      flexShrink: 0,
                    }} />
                    <Building2 style={{ width: 13, height: 13, flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
                      {active.company_name}
                    </span>
                    <ChevronRight style={{
                      width: 12, height: 12, flexShrink: 0,
                      transform: headerSwitcherOpen ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 200ms",
                    }} />
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
                                  <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>Home company</p>
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

            <ThemeIconButton />
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "var(--accent)", color: "#fff",
                fontSize: 11, fontWeight: 700,
              }}>
                {initials}
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
