'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  Gauge,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  Wrench,
} from 'lucide-react';
import { CompanySwitcher } from '@/components/CompanySwitcher';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: 'dashboard' },
  { icon: Boxes, label: 'Batches', href: 'batches' },
  { icon: Gauge, label: 'Operations', href: 'operations' },
  { icon: ClipboardCheck, label: 'Quality Control', href: 'quality' },
  { icon: QrCode, label: 'Traceability', href: 'traceability' },
  { icon: Wrench, label: 'Resources & KPIs', href: 'resources' },
  { icon: BarChart3, label: 'Reports', href: 'reports' },
  { icon: Settings, label: 'Settings', href: 'settings' },
];

function getInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() ?? '?';
}

function getCurrentSlug(pathname: string): string | null {
  return pathname.split('/').filter(Boolean)[0] ?? null;
}

function NavLink({
  item,
  slug,
  activePage,
  compact = false,
}: {
  item: (typeof NAV_ITEMS)[number];
  slug: string | null;
  activePage: string;
  compact?: boolean;
}) {
  const active = activePage === item.href;
  return (
    <Link
      href={slug ? `/${slug}/${item.href}` : '#'}
      className={`flex shrink-0 items-center gap-3 rounded-lg text-[12px] font-medium transition-colors ${compact ? 'px-3 py-2' : 'px-3 py-2.5'} ${active ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/85'}`}
    >
      <item.icon size={17} strokeWidth={active ? 2 : 1.6} />
      {item.label}
    </Link>
  );
}

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const slug = getCurrentSlug(pathname);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-[#707070]">
        Loading NAVFarm…
      </div>
    );
  if (!user) return null;

  const activePage = pathname.split('/').filter(Boolean)[1] ?? 'dashboard';

  return (
    <div className="min-h-screen bg-[#f7f8fa] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-[#0b1248] text-white lg:flex">
        <div className="border-b border-white/[0.08] p-5 pb-4">
          <Link
            href="/company-selection"
            className="mb-4 block text-xl font-bold tracking-tight"
          >
            NAV<span className="text-[#c24332]">Farm</span>
          </Link>
          <CompanySwitcher />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              slug={slug}
              activePage={activePage}
            />
          ))}
        </nav>
        <div className="border-t border-white/[0.08] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold">
              {getInitial(user.name || user.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">
                {user.name || 'User'}
              </p>
              <p className="truncate text-[10px] text-white/40">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-[252px]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1248] px-4 py-3 text-white lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Link href="/company-selection" className="text-lg font-bold">
              NAV<span className="text-[#c24332]">Farm</span>
            </Link>
            <div className="w-48">
              <CompanySwitcher />
            </div>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                slug={slug}
                activePage={activePage}
                compact
              />
            ))}
          </nav>
        </header>
        <main className="min-h-screen p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
