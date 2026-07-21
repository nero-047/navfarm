"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building, Layers, Database, History,
  LogOut, Menu, X, ChevronRight, ShieldCheck, Sun, Moon,
  LayoutDashboard,
} from "lucide-react";
import { getStoredUser, getStoredToken, clearSession, NavUser } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguage";

const adminNavItems = [
  { label: "Dashboard",   key: "dashboard" as const,   href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Tenants",     key: "tenants" as const,     href: "/admin/tenants", icon: Building  },
  { label: "Plans",       key: "plans" as const,       href: "/admin/plans",   icon: Layers    },
  { label: "Master Data", key: "masterData" as const,  href: "/admin/masters", icon: Database  },
  { label: "Audit Logs",  key: "auditLogs" as const,   href: "/admin/audit",   icon: History   },
];

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

function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        style={{
          padding: "0 24px 0 10px",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          backgroundColor: "transparent",
          color: "var(--text-secondary)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          height: "32px",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          transition: "border-color 150ms, color 150ms",
        }}
        onMouseEnter={(e) => {
          const b = e.currentTarget;
          b.style.borderColor = "var(--accent)";
          b.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget;
          b.style.borderColor = "var(--border)";
          b.style.color = "var(--text-secondary)";
        }}
      >
        <option value="en" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>EN</option>
        <option value="hi" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>HI</option>
        <option value="mr" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>MR</option>
        <option value="es" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>ES</option>
        <option value="fr" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>FR</option>
        <option value="bn" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>BN</option>
        <option value="te" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>TE</option>
        <option value="ta" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>TA</option>
      </select>
      <span style={{
        position: "absolute",
        right: "8px",
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        color: "var(--text-muted)",
        fontSize: "8px",
        display: "flex",
        alignItems: "center"
      }}>
        ▼
      </span>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) { router.replace("/"); return; }
    if (storedUser.userType !== "SYSTEM_ADMIN") { router.replace("/console/dashboard"); return; }
    setUser(storedUser);
    setReady(true);
  }, [router]);

  const handleLogout = () => { clearSession(); router.replace("/"); };

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Authorizing admin session…
        </div>
      </div>
    );
  }

  const initials = user.fullName?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "SA";
  const activeNavItem = adminNavItems.find((i) => pathname.startsWith(i.href));
  const breadcrumbLabel = activeNavItem ? t(activeNavItem.key) : "Admin";

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--sidebar-bg)" }}>

      {/* ── Logo ── */}
      <div className="h-14 flex items-center px-5 shrink-0 border-b gap-2" style={{ borderColor: "var(--sidebar-border)" }}>
        <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          NAV<span style={{ color: "var(--accent)" }}>Farm</span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white bg-red-600 px-2 py-0.5 rounded">
          {t("systemAdmin")}
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-3" style={{ color: "var(--text-muted)" }}>
          {t("admin")}
        </p>
        <ul className="space-y-0.5">
          {adminNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border-l-4"
                  style={isActive
                    ? { backgroundColor: "var(--sidebar-active-bg)", color: "var(--sidebar-active-text)", borderLeftColor: "var(--accent)" }
                    : { color: "var(--sidebar-text)", borderColor: "transparent" }
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }} />
                  {t(item.key)}
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 rounded-full"
              style={{ borderColor: "var(--sidebar-bg)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold truncate" style={{ color: "var(--sidebar-text)" }}>{user.fullName}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-red-400 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">{t("systemAdmin")}</span>
            </div>
          </div>
        </div>

        {/* Theme + Language + Sign out — buttons container */}
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
            {t("signOut")}
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg)" }}>
      {/* Desktop Sidebar */}
      <aside className="w-60 flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex border-r" style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 flex flex-col shadow-xl" style={{ backgroundColor: "var(--sidebar-bg)" }}>
            <button className="absolute top-4 right-4" style={{ color: "var(--text-muted)" }} onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-60">
        <header className="h-14 flex items-center px-6 shrink-0 sticky top-0 z-20 border-b" style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--border)" }}>
          <button className="mr-3 md:hidden" style={{ color: "var(--text-secondary)" }} onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <nav className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{breadcrumbLabel}</span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {/* Header theme toggle — keep the small icon-only version in header */}
            <ThemeIconButton />
            <LanguageSelector />
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user.fullName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
