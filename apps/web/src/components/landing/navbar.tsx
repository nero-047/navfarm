'use client';

import { ArrowRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSignInClick: () => void;
  onRegisterClick: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isLoggedIn?: boolean;
}

const links = [
  { href: '#platform', label: 'Platform' },
  { href: '#industries', label: 'Industries' },
  { href: '#traceability', label: 'Traceability' },
];

export default function Navbar({
  onSignInClick,
  mobileMenuOpen,
  setMobileMenuOpen,
  isLoggedIn = false,
}: NavbarProps) {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--surface-overlay)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            aria-label="NAVFarm home"
            className="flex items-baseline text-xl font-bold tracking-[-0.035em] text-[var(--color-navy)]"
          >
            NAV<span className="text-[var(--color-primary)]">Farm</span>
          </a>
          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Main navigation"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={onSignInClick}
              className="min-h-11 rounded-[var(--radius-md)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--accent-muted)]"
            >
              {isLoggedIn ? 'Dashboard' : 'Sign in'}
            </button>
            <button
              onClick={onSignInClick}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-navy-light)]"
            >
              {isLoggedIn ? 'Open workspace' : 'Sign in'}{' '}
              <ArrowRight size={15} />
            </button>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-[var(--accent-muted)] md:hidden"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[72px] z-50 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow-md)] md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center rounded-[var(--radius-md)] px-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignInClick();
              }}
              className="mt-3 min-h-12 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-5 text-sm font-semibold text-white"
            >
              {isLoggedIn ? 'Open workspace' : 'Sign in to NAVFarm'}
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
