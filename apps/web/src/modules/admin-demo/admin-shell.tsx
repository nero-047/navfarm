'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Building2, LogOut, Settings2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AdminShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, router, user]);
  if (loading || !user) return null;
  const links = [
    ...(user.userType === 'SYSTEM_ADMIN'
      ? [{ href: '/admin', label: 'System admin', icon: ShieldCheck }]
      : [{ href: '/organization', label: 'Organization', icon: Building2 }]),
    {
      href: '/context-selection',
      label: 'Company workspaces',
      icon: Settings2,
    },
  ];
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b border-white/10 bg-[#0b1248] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <Link href="/context-selection" className="text-xl font-bold">
              NAV<span className="text-[#c24332]">Farm</span>
            </Link>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
              {eyebrow}
            </p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${pathname === item.href ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10'}`}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex items-center gap-2 text-xs text-white/60"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#2e313f]">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
