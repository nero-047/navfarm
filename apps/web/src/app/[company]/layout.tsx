'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  QrCode,
  Search,
  Settings,
  Sun,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { CompanySwitcher } from '@/components/CompanySwitcher';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { CompanyProvider, useCompanyContext } from '@/modules/company';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: 'dashboard' },
  { icon: Boxes, label: 'Batches', href: 'batches' },
  { icon: Gauge, label: 'Data entry', href: 'operations' },
  { icon: ClipboardCheck, label: 'Quality control', href: 'quality' },
  { icon: QrCode, label: 'Traceability', href: 'traceability' },
  { icon: Wrench, label: 'Resources & KPIs', href: 'resources' },
  { icon: BarChart3, label: 'Reports', href: 'reports' },
  { icon: Settings, label: 'Settings', href: 'settings' },
] as const;

function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const { company, loading, error, reload } = useCompanyContext();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const slug = pathname.split('/').filter(Boolean)[0] ?? '';
  const activePage = pathname.split('/').filter(Boolean)[1] ?? 'dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, router, user]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  if (authLoading || loading) return <LoadingState label="Loading workspace" />;
  if (!user) return null;
  if (error)
    return (
      <div className="min-h-screen bg-(--bg) p-6">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  if (!company)
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg) p-6">
        <div className="max-w-md text-center">
          <Building2 size={28} className="mx-auto text-(--text-muted)" />
          <h1 className="mt-4 text-xl font-semibold text-(--text-primary)">
            Company not found
          </h1>
          <p className="mt-2 text-sm text-(--text-secondary)">
            This company is unavailable or your account no longer has access.
          </p>
          <Button
            className="mt-5"
            onClick={() => router.push('/company-selection')}
          >
            Choose a company
          </Button>
        </div>
      </div>
    );

  const searchResults = query
    ? NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()),
      )
    : [];
  const signOut = () => {
    logout();
    router.push('/login');
  };

  const Navigation = () => (
    <>
      <div className="border-b border-white/10 px-4 pb-4 pt-5">
        <Link
          href="/company-selection"
          className="flex items-center gap-3 px-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-white/15 text-[13px] font-bold text-white">
            NF
          </span>
          <span className="text-lg font-semibold tracking-[-0.02em] text-white">
            NAV<span className="text-[#ef806f]">Farm</span>
          </span>
        </Link>
        <div className="mt-4 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.04] p-1">
          <CompanySwitcher />
        </div>
      </div>
      <nav
        aria-label="Company workspace"
        className="flex-1 space-y-1 overflow-y-auto p-3"
      >
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.href;
          return (
            <Link
              key={item.href}
              href={`/${slug}/${item.href}`}
              className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[14px] transition-colors ${active ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
            >
              <item.icon size={18} className={active ? 'text-[#ef806f]' : ''} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/organization"
          className="flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
        >
          <Building2 size={18} />
          Organization
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-(--bg) lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-(--sidebar-bg) lg:flex">
        <Navigation />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(320px,88vw)] flex-col bg-(--sidebar-bg)">
            <button
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-white/70"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
            <Navigation />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 h-14 border-b border-(--border-subtle) bg-[var(--surface-overlay)] backdrop-blur-[20px] backdrop-saturate-[180%]">
          <div className="flex h-full items-center gap-3 px-4 sm:px-6 xl:px-8">
            <button
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-(--text-secondary) lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[13px] font-semibold text-(--text-primary)">
                {company.name}
              </p>
              <p className="truncate text-xs text-(--text-muted)">
                {company.nobName}
              </p>
            </div>
            <div className="relative ml-auto hidden w-full max-w-md md:block">
              <label className="flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface-raised) px-3">
                <Search size={15} className="text-(--text-muted)" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search workspace"
                  placeholder="Search workspace"
                  className="nf-embedded-input min-w-0 flex-1 border-0 bg-transparent text-sm text-(--text-primary) outline-none"
                />
              </label>
              {query && (
                <div className="absolute inset-x-0 top-12 rounded-[var(--radius-md)] border border-(--border) bg-(--surface) p-2 shadow-[var(--shadow-md)]">
                  {searchResults.length ? (
                    searchResults.map((item) => (
                      <Link
                        key={item.href}
                        href={`/${slug}/${item.href}`}
                        onClick={() => setQuery('')}
                        className="flex min-h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm text-(--text-secondary) hover:bg-(--surface-raised)"
                      >
                        <item.icon size={16} />
                        {item.label}
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-center text-sm text-(--text-muted)">
                      No matching page
                    </p>
                  )}
                </div>
              )}
            </div>
            <Link
              href={`/${slug}/operations`}
              className="hidden min-h-10 items-center rounded-[var(--radius-sm)] bg-(--accent) px-4 text-[13px] font-semibold text-white hover:bg-(--accent-hover) sm:flex"
            >
              New entry
            </Link>
            <button
              aria-label={
                theme === 'dark'
                  ? 'Use light appearance'
                  : 'Use dark appearance'
              }
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-(--text-secondary) hover:bg-(--surface-raised)"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] px-2 text-(--text-secondary) hover:bg-(--surface-raised)"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--accent-muted) text-xs font-bold text-(--accent)">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
                <ChevronDown size={14} />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-12 w-64 rounded-[var(--radius-md)] border border-(--border) bg-(--surface) p-2 shadow-[var(--shadow-md)]">
                  <div className="border-b border-(--border-subtle) px-3 py-3">
                    <p className="text-sm font-semibold text-(--text-primary)">
                      {user.name || user.email}
                    </p>
                    <p className="mt-1 truncate text-xs text-(--text-muted)">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href={`/${slug}/profile`}
                    className="mt-1 flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm text-(--text-secondary) hover:bg-(--surface-raised)"
                  >
                    <UserRound size={16} />
                    Profile
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex min-h-10 w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm text-(--danger) hover:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-[1600px] p-4 sm:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return (
    <CompanyProvider>
      <WorkspaceLayout>{children}</WorkspaceLayout>
    </CompanyProvider>
  );
}
