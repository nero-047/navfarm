'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Building2, LogOut, Settings2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ManagementShell({
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
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);
  if (loading || !user) return null;
  const links = [
    ...(user.userType === 'SYSTEM_ADMIN'
      ? [{ href: '/admin', label: 'System admin', icon: ShieldCheck }]
      : [{ href: '/organization', label: 'Organization', icon: Building2 }]),
    {
      href: '/company-selection',
      label: 'Company workspaces',
      icon: Settings2,
    },
  ];
  return (
    <div className="min-h-screen bg-(--bg)">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-[var(--surface-overlay)] backdrop-blur-[20px] backdrop-saturate-[180%]">
        <div className="mx-auto flex min-h-14 max-w-[1500px] items-center gap-5 px-5 sm:px-8">
          <Link
            href="/company-selection"
            className="text-lg font-semibold tracking-tight text-(--text-primary)"
          >
            NAV<span className="text-(--accent)">Farm</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-[13px] ${pathname === item.href ? 'bg-(--accent-muted) font-semibold text-(--accent)' : 'text-(--text-secondary) hover:bg-(--surface-raised)'}`}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            aria-label="Sign out"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-(--text-secondary) hover:bg-(--surface-raised)"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
        <p className="text-[13px] font-semibold text-(--accent)">{eyebrow}</p>
        <h1 className="mt-2 text-[clamp(1.75rem,3vw,2.125rem)] font-semibold tracking-tight text-(--text-primary)">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
