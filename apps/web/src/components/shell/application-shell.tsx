'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell, ChevronDown, ChevronRight, LogOut, Menu, PanelLeftClose,
  PanelLeftOpen, ShieldX, UserRound, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessScope, filterNavigation, type AppScope } from '../../lib/authorization';
import { navigationForScope } from './navigation';

const SCOPE_LABEL: Record<AppScope, string> = {
  platform: 'Platform administration',
  tenant: 'Organization administration',
  company: 'Company workspace',
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
  const [transitioning, setTransitioning] = useState(false);

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
    if (!loading && session && !canAccessScope(session, scope)) router.replace('/access-denied?reason=forbidden');
  }, [loading, router, scope, session]);

  const nav = useMemo(
    () => filterNavigation(navigationForScope(scope, companySlug), session),
    [companySlug, scope, session],
  );
  const activeCompany = session?.companies.find((item) => item.companyId === session.activeCompanyId);
  const activeTenant = session?.tenants.find((item) => item.tenantId === session.activeTenantId);
  const crumbs = pathname.split('/').filter(Boolean).map((value) =>
    value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
  );
  const pageTitle = nav.find((item) => pathname.startsWith(item.href))?.label ?? crumbs.at(-1) ?? SCOPE_LABEL[scope];

  if (loading || (!session && !user)) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8] text-sm text-[#707789]">Loading your secure workspace…</div>;
  }
  if (!session || !canAccessScope(session, scope)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8] p-6">
        <div className="max-w-md rounded-2xl border border-[#e1e5ec] bg-white p-8 text-center shadow-sm">
          <ShieldX className="mx-auto h-10 w-10 text-[#c24332]" />
          <h1 className="mt-4 text-xl font-semibold text-[#22283a]">Access denied</h1>
          <p className="mt-2 text-sm leading-6 text-[#707789]">Your current role or membership does not allow access to this area.</p>
          <Link href="/context-selection" className="mt-5 inline-flex rounded-xl bg-[#0b1248] px-4 py-2.5 text-xs font-semibold text-white">Choose another workspace</Link>
        </div>
      </div>
    );
  }

  const sidebarWidth = collapsed ? '84px' : '252px';
  const sidebar = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#0a1244,#101a52_60%,#071039)] text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d45b43] text-xs font-black">NF</span>
        {!collapsed && <span className="text-lg font-bold">NAV<span className="text-[#f16d50]">Farm</span></span>}
        <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>
      {!collapsed && (
        <div className="border-b border-white/10 p-3">
          <button onClick={() => setContextOpen(!contextOpen)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3 text-left">
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] uppercase tracking-[0.16em] text-white/40">{SCOPE_LABEL[scope]}</span>
              <span className="mt-1 block truncate text-xs font-semibold">{scope === 'platform' ? 'NAVFarm Platform' : activeCompany?.companyName || activeTenant?.tenantName || 'Select context'}</span>
            </span>
            <ChevronDown size={14} />
          </button>
          {contextOpen && (
            <div className="mt-2 rounded-xl border border-white/10 bg-[#11194b] p-2">
              {session.tenants.map((tenant) => (
                <button key={tenant.tenantId} onClick={() => void selectContext(tenant.tenantId, null).then(() => router.push('/context-selection'))} className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10">
                  {tenant.tenantName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <nav aria-label={`${SCOPE_LABEL[scope]} navigation`} className="flex-1 space-y-1 overflow-y-auto p-3">
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
                <Link href={scope === 'platform' ? '/admin' : scope === 'tenant' ? '/console' : `/${companySlug}/dashboard`}>{SCOPE_LABEL[scope]}</Link>
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
