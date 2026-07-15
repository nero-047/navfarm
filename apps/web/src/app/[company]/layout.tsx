'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, Grid3X3, BarChart3, Settings } from 'lucide-react';
import { CompanySwitcher } from '@/components/CompanySwitcher';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: 'dashboard' },
  { icon: Grid3X3, label: 'Operations', href: 'operations' },
  { icon: BarChart3, label: 'Reports', href: 'reports' },
  { icon: Settings, label: 'Settings', href: 'settings' },
];

function getInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() ?? '?';
}

function getCurrentSlug(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length >= 1 ? parts[0] : null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentSlug = getCurrentSlug(pathname);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#707070]">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const activePage = pathname.split('/').filter(Boolean)[2] ?? 'dashboard';

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#0b1248] text-white flex flex-col shrink-0">
        {/* Logo + Company */}
        <div className="p-5 pb-4 border-b border-white/[0.08]">
          <Link href="/" className="text-xl font-bold block mb-4 tracking-tight">
            NAV<span className="text-[#c24332]">Farm</span>
          </Link>
          <CompanySwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 mt-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentSlug && activePage === item.href;
            return (
              <Link
                key={item.href}
                href={currentSlug ? `/${currentSlug}/${item.href}` : '#'}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[13px] font-semibold text-white shrink-0">
              {getInitial(user.name || user.email)}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-white truncate">{user.name || 'User'}</div>
              <div className="text-[11px] text-white/40 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
