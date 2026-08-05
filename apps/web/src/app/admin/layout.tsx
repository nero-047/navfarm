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
    <div className="flex h-full flex-col">
      {/* ── Logo + access-level card (mirrors the tenant console chrome) ── */}
      <div className="border-b border-white/[0.08] px-5 pb-4 pt-5">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f16d50,#c24332)] text-sm font-black text-white shadow-lg">NF</span>
          <span>
            <span className="block text-xl font-bold tracking-tight text-white">NAV<span className="text-[#f16d50]">Farm</span></span>
            <span className="block text-[8px] font-semibold uppercase tracking-[0.22em] text-white/35">Platform administration</span>
          </span>
        </Link>
        <div className="mt-5 rounded-xl border border-red-400/25 bg-red-500/[0.08] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-red-300/80">Access level</span>
            <ShieldCheck className="h-3.5 w-3.5 text-red-300" />
          </div>
          <p className="mt-1 text-sm font-bold text-white">{t("systemAdmin")}</p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">{t("admin")}</p>
        <ul className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all ${isActive ? "bg-white text-[#111a4f] shadow-[0_8px_22px_rgba(0,0,0,0.16)]" : "text-white/62 hover:bg-white/[0.07] hover:text-white"}`}
                >
                  {isActive && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-[#ed6a4f]" />}
                  <item.icon size={17} strokeWidth={isActive ? 2 : 1.6} />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-white/[0.08] p-4">
        <div className="flex items-center gap-3 px-1 pb-3">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b1248] bg-emerald-400" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-white">{user.fullName}</span>
            <span className="mt-0.5 block truncate text-[9px] text-white/38">{user.email}</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-medium text-white/50 transition hover:border-red-400/25 hover:bg-red-400/10 hover:text-red-300"
        >
          <LogOut size={14} /> {t("signOut")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg)" }}>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[linear-gradient(180deg,#0a1244_0%,#111b55_58%,#071039_100%)] text-white md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative h-full w-[min(300px,86vw)] flex flex-col bg-[linear-gradient(180deg,#0a1244_0%,#111b55_58%,#071039_100%)] shadow-2xl">
            <button className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-[264px]">
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
