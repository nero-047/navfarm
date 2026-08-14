"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";
import Link from "next/link";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";

export const NAVFARM_LOGO_SRC = "https://nav-cdn.pages.dev/images/favicon.png";

export interface AppShellNavItem {
  label: string;
  href: string;
  icon: ElementType;
}

interface SidebarContentProps {
  brandHref: string;
  brandSubtitle: string;
  sidebarSummary?: ReactNode;
  navSectionLabel: string;
  navItems: AppShellNavItem[];
  pathname: string;
  userInitials: string;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  signOutLabel: string;
  onNavigate: () => void;
}

function SidebarContent(props: SidebarContentProps) {
  const {
    brandHref, brandSubtitle, sidebarSummary, navSectionLabel, navItems, pathname,
    userInitials, userName, userEmail, onLogout, signOutLabel, onNavigate,
  } = props;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--sidebar-border)] px-5 pb-4 pt-5">
        <Link href={brandHref} className="flex items-center gap-2.5">
          <img src={NAVFARM_LOGO_SRC} alt="Navfarm" className="h-7 w-7 rounded-[var(--radius-xs)]" />
          <span>
            <span className="block text-[17px] font-semibold tracking-tight text-white">
              NAV<span style={{ color: "var(--sidebar-active-accent)" }}>Farm</span>
            </span>
            <span className="block text-[10px] font-normal uppercase tracking-[0.16em] text-white/40">
              {brandSubtitle}
            </span>
          </span>
        </Link>
        {sidebarSummary && <div className="mt-4">{sidebarSummary}</div>}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-normal uppercase tracking-[0.18em] text-white/35">
          {navSectionLabel}
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`nf-press group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] transition-colors ${
                    isActive
                      ? "font-semibold text-white"
                      : "font-normal text-[var(--sidebar-text)] hover:bg-white/[0.06] hover:text-white"
                  }`}
                  style={isActive ? { backgroundColor: "var(--sidebar-active-bg)" } : undefined}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full"
                      style={{ backgroundColor: "var(--sidebar-active-accent)" }}
                    />
                  )}
                  <item.icon
                    size={17}
                    strokeWidth={isActive ? 2 : 1.5}
                    color={isActive ? "var(--sidebar-active-accent)" : undefined}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-4">
        <div className="flex items-center gap-3 px-1 pb-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {userInitials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-white">{userName}</span>
            <span className="mt-0.5 block truncate text-[11px] text-white/40">{userEmail}</span>
          </span>
        </div>
        <button
          onClick={onLogout}
          className="nf-press flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-white/10 px-3 py-2.5 text-xs font-normal text-white/55 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut size={14} /> {signOutLabel}
        </button>
      </div>
    </div>
  );
}

export interface AppShellProps extends Omit<SidebarContentProps, "onNavigate"> {
  breadcrumbRoot: string;
  breadcrumbCurrent: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function AppShell(props: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);
  const { breadcrumbRoot, breadcrumbCurrent, headerRight, children, ...sidebarProps } = props;
  const drawerRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  // The mobile drawer is a modal surface: Escape dismisses it, focus moves
  // into it on open and returns to the trigger on close, and the page behind
  // it does not scroll.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    drawerRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      openerRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[var(--bg)] lg:flex">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col lg:flex"
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        <SidebarContent {...sidebarProps} onNavigate={close} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Dismiss navigation overlay"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-black/50"
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            tabIndex={-1}
            className="relative h-full w-[min(280px,86vw)] outline-none"
            style={{ backgroundColor: "var(--sidebar-bg)" }}
          >
            <button
              onClick={close}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent {...sidebarProps} onNavigate={close} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-[260px]">
        <header
          className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b px-4 backdrop-blur-xl sm:px-6"
          style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--border)" }}
        >
          <button
            ref={openerRef}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center -ml-2.5 text-[var(--text-secondary)] lg:hidden"
          >
            <Menu size={20} />
          </button>
          <nav className="flex min-w-0 items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="hidden sm:inline" style={{ color: "var(--text-secondary)" }}>{breadcrumbRoot}</span>
            <ChevronRight size={14} className="hidden shrink-0 sm:block" />
            <span className="truncate font-semibold" style={{ color: "var(--text-primary)" }}>{breadcrumbCurrent}</span>
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-2.5">{headerRight}</div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  );
}
