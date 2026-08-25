"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  type ReactNode,
  type ElementType,
} from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { ProfilePopover, type ProfileMenuItem } from "./ProfilePopover";

export const NAVFARM_LOGO_SRC = "https://nav-cdn.pages.dev/images/favicon.png";

/** The viewport at which the shell becomes a pinned desktop workspace. */
export const SHELL_DESKTOP_QUERY = "(min-width: 1024px)";

export interface AppShellNavChild {
  label: string;
  href: string;
}

export interface AppShellNavItem {
  label: string;
  href: string;
  icon: ElementType;
  children?: AppShellNavChild[];
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
  /**
   * There is no page-header slot. The page header is page content — it is the
   * page's own H1 and its own actions — so routes render `ui/PageHeader`
   * themselves, inside their own container, where it aligns with the content
   * beneath it. It carries `data-shell-region="page-header"` and pins to this
   * scroller under the Phase 1 geometry without the shell mounting it.
   */
  children: ReactNode;
}

function isHrefActive(
  targetHref: string,
  currentPath: string,
  searchParams: URLSearchParams | null,
  allNavHrefs: string[]
): boolean {
  if (!targetHref) return false;
  const [targetPath, targetQuery] = targetHref.split("?");

  // Path check
  const isPathExact = currentPath === targetPath;
  const isSubPath = currentPath.startsWith(targetPath + "/");
  if (!isPathExact && !isSubPath) {
    return false;
  }

  // A parent path also "contains" its siblings' paths: on
  // /production/batches/daily-entry both Batch List (/production/batches) and
  // Data Entry matched, so two items highlighted at once. Only the most
  // specific nav entry wins — if some other entry is a longer match for where
  // we actually are, this broader one is not the active item.
  if (!isPathExact) {
    const hasDeeperMatch = allNavHrefs.some((otherHref) => {
      const otherPath = otherHref.split("?")[0];
      if (otherPath === targetPath || otherPath.length <= targetPath.length) return false;
      return currentPath === otherPath || currentPath.startsWith(otherPath + "/");
    });
    if (hasDeeperMatch) return false;
  }

  // If target has query parameters (e.g. ?tab=schedulers)
  if (targetQuery) {
    const targetParams = new URLSearchParams(targetQuery);
    for (const [key, val] of targetParams.entries()) {
      const currentVal = searchParams ? searchParams.get(key) : null;
      if (currentVal !== val) {
        return false;
      }
    }
    return true;
  }

  // If target has NO query parameters:
  // If the path matches, check if any other nav item in allNavHrefs has the same targetPath AND matches the current searchParams.
  // If another nav item specifically matches the current search query, this generic item is not directly active.
  if (searchParams && searchParams.toString().length > 0) {
    const hasSpecificOtherMatch = allNavHrefs.some((otherHref) => {
      if (otherHref === targetHref) return false;
      const [otherPath, otherQuery] = otherHref.split("?");
      if (otherPath !== targetPath || !otherQuery) return false;
      const otherParams = new URLSearchParams(otherQuery);
      let matches = true;
      for (const [k, v] of otherParams.entries()) {
        if (searchParams.get(k) !== v) {
          matches = false;
          break;
        }
      }
      return matches;
    });

    if (hasSpecificOtherMatch) {
      return false;
    }
  }

  return true;
}

function PrimaryNavContent({
  navItems,
  navSectionLabel,
  pathname,
  searchParams,
  onItemClick,
}: {
  navItems: AppShellNavItem[];
  navSectionLabel: string;
  pathname: string;
  searchParams: URLSearchParams | null;
  onItemClick: () => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const allNavHrefs = useMemo(() => {
    const hrefs: string[] = [];
    for (const item of navItems) {
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          hrefs.push(child.href);
        }
      } else if (item.href) {
        hrefs.push(item.href);
      }
    }
    return hrefs;
  }, [navItems]);

  return (
    <nav aria-label="Primary" data-shell-nav-scroll className="p-3">
      <p className="px-3 pb-2 pt-2 text-[10px] font-normal uppercase tracking-[0.18em] text-white/35">
        {navSectionLabel}
      </p>
      <ul className="space-y-0.5">
        {navItems.map((item) => {
          const hasChildren = Boolean(item.children && item.children.length > 0);

          let isChildActive = false;
          if (hasChildren && item.children) {
            isChildActive = item.children.some((child) =>
              isHrefActive(child.href, pathname, searchParams, allNavHrefs)
            );
          }

          const isDirectActive = !hasChildren && isHrefActive(item.href, pathname, searchParams, allNavHrefs);
          const isExpanded = expandedItems[item.label] ?? (isChildActive || true);

          if (hasChildren) {
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedItems((prev) => ({
                      ...prev,
                      [item.label]: !(prev[item.label] ?? isChildActive ?? true),
                    }));
                  }}
                  className={`nf-press group relative flex w-full min-h-10 items-center justify-between gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[12.5px] transition-colors ${
                    isDirectActive
                      ? "font-semibold text-white bg-[var(--sidebar-active-bg)]"
                      : isChildActive
                      ? "font-semibold text-white bg-white/[0.04]"
                      : "font-normal text-[var(--sidebar-text)] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isDirectActive && (
                      <span
                        className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full"
                        style={{ backgroundColor: "var(--sidebar-active-accent)" }}
                      />
                    )}
                    <item.icon
                      size={16}
                      strokeWidth={isDirectActive || isChildActive ? 2 : 1.5}
                      color={isDirectActive || isChildActive ? "var(--sidebar-active-accent)" : undefined}
                      className="shrink-0"
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`shrink-0 text-white/40 group-hover:text-white transition-transform duration-200 ${
                      isExpanded ? "rotate-0 text-white/80" : "-rotate-90 text-white/40"
                    }`}
                  />
                </button>
                {isExpanded && (
                  <ul className="mt-0.5 space-y-0.5 pl-6 pr-1">
                    {item.children!.map((child) => {
                      const childActive = isHrefActive(child.href, pathname, searchParams, allNavHrefs);
                      return (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            onClick={onItemClick}
                            className={`block rounded-[var(--radius-xs)] px-2.5 py-1.5 text-[11px] transition-colors ${
                              childActive
                                ? "font-semibold text-white bg-white/10"
                                : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          }

          const isActive = isDirectActive;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onItemClick}
                aria-current={isActive ? "page" : undefined}
                className={`nf-press group relative flex min-h-10 items-center justify-between gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[12.5px] transition-colors ${
                  isActive
                    ? "font-semibold text-white bg-[var(--sidebar-active-bg)]"
                    : "font-normal text-[var(--sidebar-text)] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full"
                      style={{ backgroundColor: "var(--sidebar-active-accent)" }}
                    />
                  )}
                  <item.icon
                    size={16}
                    strokeWidth={isActive ? 2 : 1.5}
                    color={isActive ? "var(--sidebar-active-accent)" : undefined}
                    className="shrink-0"
                  />
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PrimaryNavInner({
  navItems,
  navSectionLabel,
  fallbackPathname,
  onItemClick,
}: {
  navItems: AppShellNavItem[];
  navSectionLabel: string;
  fallbackPathname: string;
  onItemClick: () => void;
}) {
  const pathnameHook = usePathname();
  const searchParamsHook = useSearchParams();
  const pathname = pathnameHook || fallbackPathname;

  return (
    <PrimaryNavContent
      navItems={navItems}
      navSectionLabel={navSectionLabel}
      pathname={pathname}
      searchParams={searchParamsHook}
      onItemClick={onItemClick}
    />
  );
}

function PrimaryNav({
  navItems,
  navSectionLabel,
  fallbackPathname,
  onItemClick,
}: {
  navItems: AppShellNavItem[];
  navSectionLabel: string;
  fallbackPathname: string;
  onItemClick: () => void;
}) {
  return (
    <Suspense
      fallback={
        <PrimaryNavContent
          navItems={navItems}
          navSectionLabel={navSectionLabel}
          pathname={fallbackPathname}
          searchParams={null}
          onItemClick={onItemClick}
        />
      }
    >
      <PrimaryNavInner
        navItems={navItems}
        navSectionLabel={navSectionLabel}
        fallbackPathname={fallbackPathname}
        onItemClick={onItemClick}
      />
    </Suspense>
  );
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
    brandHref,
    brandSubtitle,
    sidebarSummary,
    navSectionLabel,
    navItems,
    pathname,
    userInitials,
    userName,
    userEmail,
    onLogout,
    signOutLabel,
    profileItems,
    profileMenuLabel,
    breadcrumbRoot,
    breadcrumbCurrent,
    headerRight,
    contextNav,
    children,
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
    const onChange = () => {
      if (query.matches) setMobileOpen(false);
    };
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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
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

        <PrimaryNav
          navItems={navItems}
          navSectionLabel={navSectionLabel}
          fallbackPathname={pathname}
          onItemClick={close}
        />

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
        {/* The breadcrumb used to sit here, with its current segment set in
            semibold primary text. That made it a second title competing with
            the page's H1 from inside the chrome. It is the first step of the
            content hierarchy, not chrome, so it moved into <main> directly
            above the page header — see below. The header keeps its geometry,
            its height and its global controls. */}
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
          {/* Step one of the content hierarchy, rendered once for every route
              whether or not it has a PageHeader yet: one breadcrumb landmark
              exists on every page and no page can add a second. It scrolls
              away under the page header rather than pinning — the title is
              what has to stay legible while the work surface moves. */}
          <nav aria-label="Breadcrumb" data-shell-breadcrumb>
            <ol>
              <li>{breadcrumbRoot}</li>
              <li aria-current="page">{breadcrumbCurrent}</li>
            </ol>
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
