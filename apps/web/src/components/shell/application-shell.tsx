'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Bell, Building2, Check, ChevronDown, ChevronRight, LogOut, Menu, PanelLeftClose,
  PanelLeftOpen, Plus, Search, Settings2, UserRound, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { capabilities, filterNavigation, type AppScope } from '../../lib/authorization';
import { scopeAccessReason } from '../../lib/access-reasons';
import { navigationForScope } from './navigation';
import { NavfarmBrand } from '../brand/navfarm-brand';
import {
  buildContextSwitcherGroups,
  currentContextSelection,
  workspaceSwitchDestination,
} from './context-switcher';

const SCOPE_LABEL: Record<AppScope, string> = {
  platform: 'Platform administration',
  tenant: 'Organization administration',
  company: 'Company administration',
  workspace: 'Workspace operations',
};

export function ApplicationShell({
  scope,
  companySlug,
  children,
}: {
  scope: AppScope;
  companySlug?: string;
  children: ReactNode;
}) {
  const {
    session, user, status, loading, mfaChallengeId, logout, selectContext,
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextQuery, setContextQuery] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [contextChanging, setContextChanging] = useState(false);
  const [contextError, setContextError] = useState('');
  const contextButtonRef = useRef<HTMLButtonElement>(null);
  const contextDialogRef = useRef<HTMLDivElement>(null);
  const workspaceMatch = companySlug
    ? pathname.match(new RegExp(`^/${companySlug}/workspaces/([^/]+)/(dashboard|batches|operations|quality|traceability|resources|costing|reports|masters|settings)(?:/|$)`))
    : null;
  const routeWorkspaceSlug = workspaceMatch?.[1];
  const requestedCompany = session?.companies.find((item) => item.companySlug === companySlug);
  const routeWorkspace = session?.workspaces.find(
    (item) => item.workspaceSlug === routeWorkspaceSlug && item.companyId === requestedCompany?.companyId,
  );
  const effectiveScope: AppScope = scope === 'company' && routeWorkspaceSlug ? 'workspace' : scope;
  const accessReason = session
    ? scopeAccessReason(session, effectiveScope, companySlug, routeWorkspaceSlug)
    : null;

  useEffect(() => {
    setCollapsed(localStorage.getItem('navfarm_sidebar_collapsed') === 'true');
  }, []);
  useEffect(() => {
    setTransitioning(true);
    setContextChanging(false);
    setMobileOpen(false);
    const timer = window.setTimeout(() => setTransitioning(false), 240);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  useEffect(() => {
    if (status === 'mfa_pending') {
      router.replace(`/mfa/verify?challengeId=${encodeURIComponent(mfaChallengeId || '')}`);
    } else if (status === 'unauthenticated') {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [mfaChallengeId, pathname, router, status]);
  useEffect(() => {
    if (!loading && session && accessReason && !contextChanging) {
      const companyQuery =
        companySlug &&
        ['workspace_inactive', 'workspace_not_assigned', 'onboarding_incomplete'].includes(accessReason)
          ? `&company=${encodeURIComponent(companySlug)}`
          : '';
      router.replace(`/access-denied?reason=${accessReason}${companyQuery}`);
    }
  }, [accessReason, companySlug, contextChanging, loading, router, session]);
  useEffect(() => {
    if (!contextOpen) return;
    const dialog = contextDialogRef.current;
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setContextOpen(false);
        contextButtonRef.current?.focus();
        return;
      }
      if (event.key === 'Tab' && dialog) {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled])',
          ),
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (
        (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
        dialog
      ) {
        const options = Array.from(
          dialog.querySelectorAll<HTMLButtonElement>(
            '[data-context-option]:not([disabled])',
          ),
        );
        if (!options.length) return;
        const current = options.indexOf(document.activeElement as HTMLButtonElement);
        if (current >= 0 || document.activeElement?.getAttribute('aria-label') === 'Search companies and workspaces') {
          event.preventDefault();
          const offset = event.key === 'ArrowDown' ? 1 : -1;
          const next = current < 0
            ? event.key === 'ArrowDown' ? 0 : options.length - 1
            : (current + offset + options.length) % options.length;
          options[next]?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [contextOpen]);

  const nav = useMemo(
    () => filterNavigation(navigationForScope(effectiveScope, companySlug, routeWorkspace), session),
    [companySlug, effectiveScope, routeWorkspace, session],
  );
  const activeCompany = session?.companies.find((item) => item.companyId === session.activeCompanyId);
  const crumbs = pathname.split('/').filter(Boolean).map((value) =>
    value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
  );
  const pageTitle = nav.find((item) => pathname.startsWith(item.href))?.label ?? crumbs.at(-1) ?? SCOPE_LABEL[effectiveScope];
  const visibleCompanies = session
    ? buildContextSwitcherGroups(session, contextQuery)
    : [];
  const currentSelection = session
    ? currentContextSelection(session)
    : null;

  async function chooseCompany(tenantId: string, companyId: string, slug: string) {
    if (contextChanging) return;
    setContextChanging(true);
    setContextError('');
    try {
      await selectContext(tenantId, companyId, null);
      setContextOpen(false);
      router.push(`/${slug}/overview`);
    } catch (cause) {
      setContextChanging(false);
      setContextError(
        cause instanceof Error
          ? `${cause.message} Your previous company and workspace remain selected.`
          : 'The context change failed. Your previous company and workspace remain selected.',
      );
    }
  }

  async function chooseWorkspace(
    tenantId: string,
    companyId: string,
    slug: string,
    workspace: NonNullable<typeof session>['workspaces'][number],
  ) {
    if (!session || contextChanging) return;
    setContextChanging(true);
    setContextError('');
    try {
      await selectContext(tenantId, companyId, workspace.workspaceId);
      setContextOpen(false);
      router.push(
        workspaceSwitchDestination({
          pathname,
          companySlug: slug,
          workspace,
          session,
        }),
      );
    } catch (cause) {
      setContextChanging(false);
      setContextError(
        cause instanceof Error
          ? `${cause.message} Your previous company and workspace remain selected.`
          : 'The context change failed. Your previous company and workspace remain selected.',
      );
    }
  }

  if (loading || status === 'mfa_pending' || (!session && !user)) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8] text-sm text-[#707789]">Loading your secure workspace…</div>;
  }
  if (!session || (accessReason && !contextChanging)) {
    return <div className="min-h-screen bg-[#f3f5f8]" />;
  }

  const sidebarWidth = collapsed ? '84px' : '252px';
  const switcherVisible =
    effectiveScope === 'company' || effectiveScope === 'workspace';
  const triggerCompany = requestedCompany ?? activeCompany;
  const triggerWorkspace =
    effectiveScope === 'workspace' ? routeWorkspace : null;
  const closeContextSwitcher = () => {
    setContextOpen(false);
    contextButtonRef.current?.focus();
  };
  const sidebar = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#0a1244,#101a52_60%,#071039)] text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <NavfarmBrand compact={collapsed} inverse />
        <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>
      {!collapsed && switcherVisible && (
        <div className="border-b border-white/10 p-3">
          <button
            ref={contextButtonRef}
            aria-label="Switch context"
            aria-haspopup="dialog"
            aria-expanded={contextOpen}
            onClick={() => {
              setContextError('');
              setContextOpen(!contextOpen);
            }}
            className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3 text-left outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold">
              {(triggerWorkspace?.workspaceName ?? triggerCompany?.companyName ?? 'N')
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">
                {triggerCompany?.companyName ?? 'Select company'}
              </span>
              <span className="mt-1 block truncate text-[10px] text-white/55">
                {triggerWorkspace?.workspaceName ?? 'Company administration'}
              </span>
            </span>
            <ChevronDown size={14} />
          </button>
          {contextOpen && (
            <div
              ref={contextDialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Context switcher"
              aria-describedby="context-switcher-description"
              aria-busy={contextChanging}
              className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#11194b] p-4 shadow-2xl motion-reduce:transition-none lg:static lg:mt-2 lg:h-[68vh] lg:max-h-[620px] lg:w-auto lg:rounded-xl lg:border lg:border-white/10 lg:p-2"
            >
              <div className="mb-3 flex min-h-11 items-start justify-between gap-3">
                <div className="pt-1 lg:px-2">
                  <strong id="context-switcher-title" className="text-sm">
                    Switch company or workspace
                  </strong>
                  <p
                    id="context-switcher-description"
                    className="mt-1 text-[10px] leading-4 text-white/55"
                  >
                    Choose company administration or an assigned operational workspace.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close context switcher"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
                  onClick={closeContextSwitcher}
                >
                  <X size={18} />
                </button>
              </div>
              <label className="relative block">
                <Search size={14} className="absolute left-3 top-3.5 text-white/40" />
                <input
                  autoFocus
                  aria-label="Search companies and workspaces"
                  value={contextQuery}
                  onChange={(event) => setContextQuery(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-white"
                  placeholder="Search companies and workspaces"
                />
              </label>
              {contextError ? (
                <div
                  role="alert"
                  className="mt-3 rounded-lg border border-red-300/30 bg-red-400/10 p-3 text-[11px] leading-4 text-red-100"
                >
                  {contextError}
                </div>
              ) : null}
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
                {visibleCompanies.map((company) => (
                    <div key={company.companyId} className="rounded-lg border border-white/10 p-1">
                      <p className="flex min-h-9 items-center gap-2 px-2 text-xs font-semibold"><Building2 size={14} />{company.companyName}</p>
                      <button
                        data-context-option
                        aria-pressed={
                          currentSelection?.kind === 'company' &&
                          currentSelection.companyId === company.companyId
                        }
                        disabled={contextChanging}
                        onClick={() => void chooseCompany(company.tenantId, company.companyId, company.companySlug)}
                        className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-xs outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-55"
                      >
                        <Settings2 size={14} />Company administration
                        {currentSelection?.kind === 'company' && currentSelection.companyId === company.companyId ? <Check size={14} className="ml-auto" /> : null}
                      </button>
                      {company.workspaces.map((workspace) => (
                        <button
                          key={workspace.workspaceId}
                          data-context-option
                          aria-pressed={
                            currentSelection?.kind === 'workspace' &&
                            currentSelection.workspaceId === workspace.workspaceId
                          }
                          disabled={contextChanging}
                          onClick={() => void chooseWorkspace(company.tenantId, company.companyId, company.companySlug, workspace)}
                          className="flex min-h-11 w-full items-center gap-2 rounded-md pl-7 pr-3 text-left text-xs text-white/75 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-55"
                        >
                          <ChevronRight size={13} />{workspace.workspaceName}
                          {currentSelection?.kind === 'workspace' && currentSelection.workspaceId === workspace.workspaceId ? <Check size={14} className="ml-auto" /> : null}
                        </button>
                      ))}
                    </div>
                ))}
                {!visibleCompanies.length ? (
                  <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-[11px] leading-5 text-white/55">
                    No accessible company or workspace matches your search.
                  </div>
                ) : null}
              </div>
              {(capabilities(session).canManageTenant ||
                capabilities(session).canManageWorkspaces) ? (
                <div className="mt-3 border-t border-white/10 pt-2">
                  {capabilities(session).canManageTenant ? (
                    <Link href="/console/companies" onClick={() => setContextOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"><Settings2 size={14} />Manage companies</Link>
                  ) : null}
                  {activeCompany && capabilities(session).canManageWorkspaces ? (
                    <>
                      <Link href={`/${activeCompany.companySlug}/workspaces`} onClick={() => setContextOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"><Settings2 size={14} />Manage workspaces</Link>
                      <Link href={`/${activeCompany.companySlug}/workspaces/new`} onClick={() => setContextOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"><Plus size={14} />Create workspace</Link>
                    </>
                  ) : null}
                </div>
              ) : null}
              {contextChanging ? (
                <p role="status" className="mt-2 px-3 text-[10px] text-white/60">
                  Switching context…
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}
      <nav aria-label={`${SCOPE_LABEL[effectiveScope]} navigation`} className="flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && <p className="px-3 pb-2 pt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">Navigation</p>}
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium ${active ? 'bg-white text-[#101849] shadow-lg' : 'text-white/65 hover:bg-white/[0.07] hover:text-white'}`}>
              <item.icon size={17} className="shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      <button
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={() => {
          const next = !collapsed;
          setCollapsed(next);
          localStorage.setItem('navfarm_sidebar_collapsed', String(next));
        }}
        className="hidden items-center gap-3 border-t border-white/10 px-5 py-4 text-xs text-white/55 hover:text-white lg:flex"
      >
        {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        {!collapsed && 'Collapse sidebar'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f5f8]" style={{ '--sidebar-width': sidebarWidth } as React.CSSProperties}>
      {transitioning && <div className="fixed inset-x-0 top-0 z-[70] h-0.5 animate-pulse bg-[#e4664d]" />}
      <aside className="fixed inset-y-0 left-0 z-40 hidden transition-[width] lg:block lg:w-[var(--sidebar-width)]">{sidebar}</aside>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation overlay" className="absolute inset-0 bg-black/45" onClick={() => setMobileOpen(false)} /><aside className="relative h-full w-[min(300px,88vw)]">{sidebar}</aside></div>}
      <div className="min-w-0 overflow-x-hidden transition-[margin] lg:ml-[var(--sidebar-width)]">
        <header className="sticky top-0 z-30 border-b border-[#e1e5ec] bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e1e5ec] lg:hidden"><Menu size={18} /></button>
            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-1 text-[10px] text-[#8a91a1] sm:flex">
                <Link href={effectiveScope === 'platform' ? '/admin' : effectiveScope === 'tenant' ? '/console' : `/${companySlug}/overview`}>{SCOPE_LABEL[effectiveScope]}</Link>
                {crumbs.slice(1).map((crumb) => <span key={crumb} className="flex items-center"><ChevronRight size={11} />{crumb}</span>)}
              </div>
              <h1 className="truncate text-sm font-semibold text-[#252b3d] sm:mt-1">{pageTitle}</h1>
            </div>
            <button aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e1e5ec] text-[#646b7c]"><Bell size={17} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#e55b43]" /></button>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} className="flex h-10 items-center gap-2 rounded-xl border border-[#e1e5ec] px-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b1248] text-[10px] font-bold text-white">{user?.fullName?.charAt(0) || '?'}</span>
                <span className="hidden max-w-32 truncate text-xs font-semibold text-[#30364b] md:block">{user?.fullName}</span>
                <ChevronDown size={13} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-64 rounded-2xl border border-[#e1e5ec] bg-white p-2 shadow-2xl">
                  <div className="border-b border-[#edf0f4] px-3 py-3"><p className="text-sm font-semibold">{user?.fullName}</p><p className="mt-1 truncate text-[10px] text-[#8a91a1]">{user?.email}</p></div>
                  <Link href="/profile" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs hover:bg-[#f5f7fa]"><UserRound size={15} /> My profile</Link>
                  <button onClick={() => void logout().then(() => router.replace('/login'))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-[#c24332] hover:bg-red-50"><LogOut size={15} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
