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
  const { session, user, loading, logout, selectContext } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextQuery, setContextQuery] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const contextButtonRef = useRef<HTMLButtonElement>(null);
  const workspaceMatch = companySlug
    ? pathname.match(new RegExp(`^/${companySlug}/workspaces/([^/]+)/(dashboard|batches|operations|quality|traceability|resources|costing|reports|masters|settings)(?:/|$)`))
    : null;
  const routeWorkspaceSlug = workspaceMatch?.[1];
  const requestedCompany = session?.companies.find((item) => item.companySlug === companySlug);
  const routeWorkspace = session?.workspaces.find(
    (item) => item.workspaceSlug === routeWorkspaceSlug && item.companyId === requestedCompany?.companyId,
  );
  const effectiveScope: AppScope = scope === 'company' && routeWorkspaceSlug ? 'workspace' : scope;
  const accessReason = session ? scopeAccessReason(session, effectiveScope, companySlug) : null;

  useEffect(() => {
    setCollapsed(localStorage.getItem('navfarm_sidebar_collapsed') === 'true');
  }, []);
  useEffect(() => {
    setTransitioning(true);
    setMobileOpen(false);
    const timer = window.setTimeout(() => setTransitioning(false), 240);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  useEffect(() => {
    if (!loading && !session) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }, [loading, pathname, router, session]);
  useEffect(() => {
    if (!loading && session && accessReason) router.replace(`/access-denied?reason=${accessReason}`);
  }, [accessReason, loading, router, session]);
  useEffect(() => {
    if (!contextOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextOpen(false);
        contextButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [contextOpen]);

  const nav = useMemo(
    () => filterNavigation(navigationForScope(effectiveScope, companySlug, routeWorkspace), session),
    [companySlug, effectiveScope, routeWorkspace, session],
  );
  const activeCompany = session?.companies.find((item) => item.companyId === session.activeCompanyId);
  const activeTenant = session?.tenants.find((item) => item.tenantId === session.activeTenantId);
  const crumbs = pathname.split('/').filter(Boolean).map((value) =>
    value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
  );
  const pageTitle = nav.find((item) => pathname.startsWith(item.href))?.label ?? crumbs.at(-1) ?? SCOPE_LABEL[effectiveScope];
  const currentSection = workspaceMatch?.[2] ?? 'dashboard';
  const normalizedQuery = contextQuery.trim().toLowerCase();
  const visibleCompanies = session?.companies.filter((company) =>
    company.status === 'ACTIVE' &&
    (!normalizedQuery ||
      company.companyName.toLowerCase().includes(normalizedQuery) ||
      session.workspaces.some((workspace) =>
        workspace.companyId === company.companyId && workspace.workspaceName.toLowerCase().includes(normalizedQuery))),
  ) ?? [];

  async function chooseCompany(tenantId: string, companyId: string, slug: string) {
    sessionStorage.setItem('navfarm_context_transition', 'company');
    await selectContext(tenantId, companyId, null);
    setContextOpen(false);
    router.push(`/${slug}/overview`);
    window.setTimeout(() => sessionStorage.removeItem('navfarm_context_transition'), 500);
  }

  async function chooseWorkspace(
    tenantId: string,
    companyId: string,
    slug: string,
    workspace: NonNullable<typeof session>['workspaces'][number],
  ) {
    if (!session) return;
    await selectContext(tenantId, companyId, workspace.workspaceId);
    setContextOpen(false);
    const desired = navigationForScope('workspace', slug, workspace).find((item) => item.href.endsWith(`/${currentSection}`));
    const supported = desired && filterNavigation([desired], {
      ...session,
      activeTenantId: tenantId,
      activeCompanyId: companyId,
      activeWorkspaceId: workspace.workspaceId,
    }).length;
    router.push(`/${slug}/workspaces/${workspace.workspaceSlug}/${supported ? currentSection : 'dashboard'}`);
  }

  if (loading || (!session && !user)) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8] text-sm text-[#707789]">Loading your secure workspace…</div>;
  }
  if (!session || accessReason) return <div className="min-h-screen bg-[#f3f5f8]" />;

  const sidebarWidth = collapsed ? '84px' : '252px';
  const sidebar = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#0a1244,#101a52_60%,#071039)] text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <NavfarmBrand compact={collapsed} inverse />
        <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>
      {!collapsed && (
        <div className="border-b border-white/10 p-3">
          <button ref={contextButtonRef} aria-label="Switch context" aria-expanded={contextOpen} onClick={() => setContextOpen(!contextOpen)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3 text-left">
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] uppercase tracking-[0.16em] text-white/40">{SCOPE_LABEL[effectiveScope]}</span>
              <span className="mt-1 block truncate text-xs font-semibold">{effectiveScope === 'platform' ? 'NAVFarm Platform' : routeWorkspace?.workspaceName || activeCompany?.companyName || activeTenant?.tenantName || 'Select context'}</span>
            </span>
            <ChevronDown size={14} />
          </button>
          {contextOpen && (
            <div role="dialog" aria-label="Context switcher" className="fixed inset-0 z-50 h-[100dvh] w-screen overflow-y-auto bg-[#11194b] p-4 shadow-2xl lg:static lg:mt-2 lg:h-auto lg:w-auto lg:max-h-[65vh] lg:rounded-xl lg:border lg:border-white/10 lg:p-2">
              <div className="mb-3 flex min-h-11 items-center justify-between lg:hidden">
                <strong className="text-sm">Choose context</strong>
                <button
                  type="button"
                  aria-label="Close context switcher"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10"
                  onClick={() => {
                    setContextOpen(false);
                    contextButtonRef.current?.focus();
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <label className="relative block">
                <Search size={14} className="absolute left-3 top-3.5 text-white/40" />
                <input autoFocus aria-label="Search organisations, companies and workspaces" value={contextQuery} onChange={(event) => setContextQuery(event.target.value)} className="min-h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] pl-9 pr-3 text-xs text-white placeholder:text-white/35" placeholder="Search contexts" />
              </label>
              {session.tenants.filter((tenant) => tenant.status === 'ACTIVE').map((tenant) => (
                <div key={tenant.tenantId} className="mt-3">
                  <p className="px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">{tenant.tenantName}</p>
                  {visibleCompanies.filter((company) => company.tenantId === tenant.tenantId).map((company) => (
                    <div key={company.companyId} className="mt-2 rounded-lg border border-white/10 p-1">
                      <p className="flex min-h-9 items-center gap-2 px-2 text-xs font-semibold"><Building2 size={14} />{company.companyName}</p>
                      <button onClick={() => void chooseCompany(tenant.tenantId, company.companyId, company.companySlug)} className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-xs hover:bg-white/10">
                        <Settings2 size={14} />Company administration
                        {session.activeCompanyId === company.companyId && !session.activeWorkspaceId ? <Check size={14} className="ml-auto" /> : null}
                      </button>
                      {session.workspaces.filter((workspace) => workspace.companyId === company.companyId && workspace.status === 'ACTIVE' && (!normalizedQuery || workspace.workspaceName.toLowerCase().includes(normalizedQuery) || company.companyName.toLowerCase().includes(normalizedQuery))).map((workspace) => (
                        <button key={workspace.workspaceId} onClick={() => void chooseWorkspace(tenant.tenantId, company.companyId, company.companySlug, workspace)} className="flex min-h-11 w-full items-center gap-2 rounded-md pl-7 pr-3 text-left text-xs text-white/75 hover:bg-white/10 hover:text-white">
                          <ChevronRight size={13} />{workspace.workspaceName}
                          {session.activeWorkspaceId === workspace.workspaceId ? <Check size={14} className="ml-auto" /> : null}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
              {capabilities(session).canManageCompanies ? <div className="mt-3 border-t border-white/10 pt-2">
                <Link href="/console/companies" onClick={() => setContextOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs hover:bg-white/10"><Settings2 size={14} />Manage companies</Link>
                {activeCompany ? <Link href={`/${activeCompany.companySlug}/workspaces/new`} onClick={() => setContextOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs hover:bg-white/10"><Plus size={14} />Create workspace</Link> : null}
              </div> : null}
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
