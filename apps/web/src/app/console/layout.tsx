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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        border: "1px solid var(--border)",
        backgroundColor: "transparent",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition: "background-color 150ms, border-color 150ms, color 150ms",
      }}
      onMouseEnter={(e) => {
        const b = e.currentTarget;
        b.style.backgroundColor = "var(--accent-muted)";
        b.style.color = "var(--accent)";
        b.style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget;
        b.style.backgroundColor = "transparent";
        b.style.color = "var(--text-secondary)";
        b.style.borderColor = "var(--border)";
      }}
    >
      {isDark ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
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
      api.get(`/tenant/${tenantId}`).then((data: any) => setTenantPlanInfo(data)).catch(() => {});
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full erp-sidebar">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 shrink-0 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          NAV<span style={{ color: "var(--accent)" }}>Farm</span>
        </span>
        <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ color: "var(--text-muted)", backgroundColor: "var(--surface-raised)" }}>
          Console
        </span>
      </div>

      {/* ── Active Plan Card ── */}
      {tenantPlanInfo && (() => {
        const planName = (tenantPlanInfo.plan_id?.replace("PLAN_", "") || "STANDARD").toUpperCase();
        const planColors: Record<string, string> = {
          PRO:        "var(--accent)",
          ENTERPRISE: "#8B5CF6",
          BASIC:      "#10B981",
          STANDARD:   "#6B7280",
        };
        const planColor = planColors[planName] || planColors.STANDARD;
        return (
          <div className="mx-3 mt-3 mb-3 rounded-xl border"
            style={{ borderColor: planColor + "55", backgroundColor: planColor + "0d" }}>
            {/* Single row — everything vertically centered */}
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              {/* Star icon */}
              <svg viewBox="0 0 24 24" fill="currentColor"
                style={{ width: 15, height: 15, color: planColor, flexShrink: 0 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {/* Labels stacked */}
              <div className="flex flex-col justify-center leading-none gap-0.5 flex-1 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: "var(--text-muted)" }}>Active Plan</span>
                <span className="text-sm font-black tracking-tight"
                  style={{ color: planColor }}>{planName}</span>
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "#10B981" }} />
                <span className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: "#10B981" }}>Live</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-3" style={{ color: "var(--text-muted)" }}>Navigation</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`erp-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border-l-4 ${isActive ? "active border-l-[var(--accent)]" : "border-transparent"}`}
                  style={isActive
                    ? { backgroundColor: "var(--sidebar-active-bg)", color: "var(--sidebar-active-text)", borderLeftColor: "var(--accent)" }
                    : { color: "var(--sidebar-text)" }
                  }
                >
                  <span style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>
                    <item.icon className="w-4 h-4 shrink-0" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t shrink-0" style={{ borderColor: "var(--sidebar-border)" }}>

        {/* User card */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ background: "linear-gradient(135deg, var(--accent), #7C3AED)" }}>
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 rounded-full"
              style={{ borderColor: "var(--sidebar-bg)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold truncate" style={{ color: "var(--sidebar-text)" }}>{user.fullName}</div>
            <div className="text-[10px] truncate font-mono" style={{ color: "var(--text-muted)" }}>{user.email}</div>
          </div>
        </div>

        {/* Sign out button container */}
        <div className="px-3 pb-3 flex flex-col gap-2">
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid var(--sidebar-border)",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background-color 150ms, color 150ms, border-color 150ms",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget;
              b.style.backgroundColor = "rgba(239,68,68,0.1)";
              b.style.color = "#EF4444";
              b.style.borderColor = "rgba(239,68,68,0.35)";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget;
              b.style.backgroundColor = "transparent";
              b.style.color = "var(--text-muted)";
              b.style.borderColor = "var(--sidebar-border)";
            }}
          >
            <LogOut style={{ width: 14, height: 14 }} />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );

  const sidebarStyle: React.CSSProperties = {
    backgroundColor: "var(--sidebar-bg)",
    borderColor: "var(--sidebar-border)",
    color: "var(--sidebar-text)",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: "var(--header-bg)",
    borderColor: "var(--border)",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--bg)" }}>

      {/* ── Desktop Sidebar (≥768px) ── */}
      <aside style={{
        ...sidebarStyle,
        width: 240,
        position: "fixed",
        top: 0, bottom: 0, left: 0,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--sidebar-border)",
      }}
        className="hidden md:flex"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay (<768px) ── */}
      {sidebarOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
        }} className="md:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            }}
          />
          {/* Drawer panel — solid, full height */}
          <aside style={{
            ...sidebarStyle,
            position: "relative",
            width: 260,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--sidebar-border)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
            overflowY: "auto",
            zIndex: 51,
          }}>
            {/* Mobile close row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--sidebar-border)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                NAV<span style={{ color: "var(--accent)" }}>Farm</span>
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none", padding: 4 }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}
        className="md:pl-60">
        {/* Top header */}
        <header style={{
          ...headerStyle,
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
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
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
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }} className="hidden sm:inline">{user.fullName}</span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
