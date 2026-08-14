'use client';

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

const NAVFARM_LOGO_SRC = "https://nav-cdn.pages.dev/images/favicon.png";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-[55%] bg-[var(--color-navy)] relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2">
            <img src={NAVFARM_LOGO_SRC} alt="Navfarm" className="h-8 w-8 rounded-[var(--radius-xs)]" />
            {/* This panel is always dark navy, so the accent must be the
                on-dark variant. --color-primary has no dark override and sits
                at 2.55:1 here; --sidebar-active-accent is the token that
                already exists for brand accent on dark chrome (3.74:1 light,
                4.31:1 dark) and tracks the theme. */}
            <span className="text-xl font-semibold text-white tracking-tight">
              NAV<span className="text-(--sidebar-active-accent)">Farm</span>
            </span>
          </Link>

          <div className="animate-fade-in">
            <h1 className="nf-text-display text-white mb-4">
              {t('authTagline')}
              <br />
              {t('authTaglineLine2')}
            </h1>
            <p className="text-white/60 text-lg max-w-md leading-relaxed">
              {t('authSubheading')}
            </p>
          </div>

          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Navfarm. {t('authAllRightsReserved')}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-(--bg)">
        {/* Mobile logo */}
        <div className="md:hidden px-6 pt-8 pb-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src={NAVFARM_LOGO_SRC} alt="Navfarm" className="h-7 w-7 rounded-[var(--radius-xs)]" />
            <span className="text-lg font-semibold text-(--text-primary) tracking-tight">
              NAV<span className="text-(--accent)">Farm</span>
            </span>
          </Link>
        </div>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
