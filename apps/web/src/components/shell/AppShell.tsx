"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { ProfilePopover, type ProfileMenuItem } from "./ProfilePopover";

export const NAVFARM_LOGO_SRC = "https://nav-cdn.pages.dev/images/favicon.png";

/** The viewport at which the shell becomes a pinned desktop workspace. */
export const SHELL_DESKTOP_QUERY = "(min-width: 1024px)";

export interface AppShellNavItem {
  label: string;
  href: string;
  icon: ElementType;
}

export interface AppShellProps {
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
  /** Account entries shown above Sign out in the profile popover. */
  profileItems: ProfileMenuItem[];
  /** Accessible name for the avatar trigger, e.g. "Account menu". */
  profileMenuLabel: string;
  breadcrumbRoot: string;
  breadcrumbCurrent: string;
  headerRight?: ReactNode;
  /**
   * Structural slot for the contextual (module) navigation column. When
   * present the workspace splits into CONTEXT NAV | CONTENT on desktop.
   * Wired per-route in a later phase; the geometry exists now.
   */
  contextNav?: ReactNode;
  /** Structural slot for the page header, sticky inside the content scroller. */
  pageHeader?: ReactNode;
  children: ReactNode;
}

/**
 * The application shell.
 *
 * On desktop the shell owns the viewport: the root is exactly `100dvh` and
 * does not scroll, so the primary navigation and the global header are
 * stationary without being taken out of flow, and `<main>` is the single
 * primary content scroller. Geometry lives in `global.css` against the
 * `data-shell-region` attributes rather than in utility classes, so the
 * sizing chain (`min-height: 0` at every level, `minmax(0, 1fr)` tracks) is
 * readable in one place.
 *
 * The navigation renders exactly once. Below 1024px the same element becomes
 * the off-canvas drawer via transform, rather than a second copy of the same
 * links, so there is only ever one set of navigation nodes in the accessibility
 * tree.
 */
export function AppShell(props: AppShellProps) {
  const {
    brandHref, brandSubtitle, sidebarSummary, navSectionLabel, navItems, pathname,
    userInitials, userName, userEmail, onLogout, signOutLabel, profileItems, profileMenuLabel,
    breadcrumbRoot, breadcrumbCurrent, headerRight, contextNav, pageHeader, children,
  } = props;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const close = () => setMobileOpen(false);

  // Browser tests need a commit-accurate signal that the shell has laid out,
  // otherwise they fall back to arbitrary waits.
  useEffect(() => setReady(true), []);

  // The off-canvas drawer only exists below the desktop breakpoint. Resizing
  // up while it is open would otherwise leave the navigation column carrying
  // modal semantics it no longer has.
  useEffect(() => {
    const query = window.matchMedia(SHELL_DESKTOP_QUERY);
    const onChange = () => { if (query.matches) setMobileOpen(false); };
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // The drawer is a modal surface: Escape dismisses it, focus moves into it on
  // open and returns to the trigger on close. Page scroll is held by the
  // shared lock rather than by this component reaching for document.body.
  useScrollLock(mobileOpen);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    navRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      openerRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <div data-shell-root data-shell-ready={ready ? "true" : "false"}>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Dismiss navigation overlay"
          tabIndex={-1}
          onClick={close}
          data-shell-scrim
        />
      )}

      {/* One navigation, two geometries: grid column on desktop, off-canvas
          drawer below it. `role="dialog"` is applied only while it is acting
          as a drawer — on desktop the <nav> inside stays a plain landmark. */}
      <div
        ref={navRef}
        data-shell-region="primary-nav"
        data-open={mobileOpen ? "true" : "false"}
        {...(mobileOpen
          ? { role: "dialog" as const, "aria-modal": true, "aria-label": "Main navigation", tabIndex: -1 }
          : {})}
      >
        {mobileOpen && (
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        )}

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

        <nav aria-label="Primary" data-shell-nav-scroll className="p-3">
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
                    onClick={close}
                    // The active module is stated, not only coloured: the tint,
                    // the indicator and the weight are all visual-only signals.
                    aria-current={isActive ? "page" : undefined}
                    className={`nf-press group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] transition-colors ${
                      isActive
                        ? "font-semibold text-white"
                        : "font-normal text-[var(--sidebar-text)] hover:bg-white/[0.06] hover:text-white"
                    }`}
                    style={isActive ? { backgroundColor: "var(--sidebar-active-bg)" } : undefined}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full"
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

        {/* No account footer here. Identity and Sign out are account actions,
            not navigation, and they live behind the header avatar — see
            ProfilePopover. The rail carries navigation only. */}
      </div>

      <header data-shell-region="header" className="px-4 backdrop-blur-xl sm:px-6">
        <button
          ref={openerRef}
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center -ml-2.5 text-[var(--text-secondary)] lg:hidden"
        >
          <Menu size={20} />
        </button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
          <span className="hidden sm:inline" style={{ color: "var(--text-secondary)" }}>{breadcrumbRoot}</span>
          <ChevronRight size={14} className="hidden shrink-0 sm:block" />
          <span className="truncate font-semibold" style={{ color: "var(--text-primary)" }}>{breadcrumbCurrent}</span>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2.5">
          {headerRight}
          <ProfilePopover
            initials={userInitials}
            name={userName}
            email={userEmail}
            items={profileItems}
            signOutLabel={signOutLabel}
            onSignOut={onLogout}
            triggerLabel={profileMenuLabel}
          />
        </div>
      </header>

      <div data-shell-region="workspace" data-has-context-nav={contextNav ? "true" : "false"}>
        {contextNav && <div data-shell-region="context-nav">{contextNav}</div>}
        <main data-shell-region="content">
          {pageHeader && <div data-shell-region="page-header">{pageHeader}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
