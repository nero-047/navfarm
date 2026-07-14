'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <p className="text-[#707070]">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0b1248] text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="text-xl font-bold">
            NAV<span className="text-[#c24332]">Farm</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/company-selection"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            Switch Industry
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-white/60 mb-2">{user.email}</div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-[#ebebeb] bg-white flex items-center px-6">
          <p className="text-sm text-[#707070]">Welcome, {user.name}</p>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
