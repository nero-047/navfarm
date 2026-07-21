import React from 'react';
import { Menu, X } from 'lucide-react';
import Button from '../source-ui/button';
import ThemeToggle from '../source-ui/theme-toggle';

interface NavbarProps {
  onSignInClick: () => void;
  onRegisterClick: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSignInClick,
  onRegisterClick,
  mobileMenuOpen,
  setMobileMenuOpen,
  isLoggedIn = false,
}) => {
  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              NAV<span className="text-teal-400">Farm</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#verticals" className="hover:text-[var(--text-primary)] transition-colors">Verticals</a>
            <a href="#costing" className="hover:text-[var(--text-primary)] transition-colors">Accounting</a>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Button variant="primary" onClick={onSignInClick}>
              {isLoggedIn ? 'Go to Dashboard' : 'Sign In'}
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 w-full h-[calc(100vh-5rem)] bg-[var(--surface)] border-b border-[var(--border)] px-6 py-8 flex flex-col gap-6 z-50 shadow-2xl overflow-y-auto">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Features</a>
          <a href="#verticals" onClick={() => setMobileMenuOpen(false)} className="text-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Verticals</a>
          <a href="#costing" onClick={() => setMobileMenuOpen(false)} className="text-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Accounting</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</a>
          <div className="h-px bg-[var(--border)] my-2" />
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Toggle Theme</span>
            <ThemeToggle />
          </div>
          <Button variant="primary" onClick={() => { setMobileMenuOpen(false); onSignInClick(); }} className="w-full justify-center">
            {isLoggedIn ? 'Go to Dashboard' : 'Sign In'}
          </Button>
        </div>
      )}
    </>
  );
};
export default Navbar;
