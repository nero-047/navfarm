import Link from 'next/link';
import { NavfarmBrand } from '@/components/brand/navfarm-brand';
import ThemeToggle from '@/components/source-ui/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Left branding panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b1248] via-[#151d5e] to-[#1c4aa9] md:flex md:w-[42%] xl:w-[46%]">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/[0.03]" />
        <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-white/[0.04]" />
        <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-[#c24332]/10" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" aria-label="NAVFarm home">
            <NavfarmBrand inverse />
          </Link>

          <div className="animate-fade-in">
            <h1 className="text-4xl font-semibold !text-white leading-tight tracking-tight mb-4">
              Farm management,
              <br />
              simplified.
            </h1>
            <p className="text-white/60 text-lg max-w-md leading-relaxed">
              Manage your livestock, crops, and operations from one clean dashboard.
            </p>
          </div>

          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} NAVFarm. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="nf-auth-content flex flex-1 flex-col bg-[var(--surface)]">
        {/* Mobile logo */}
        <div className="flex items-center justify-between px-6 pb-4 pt-8 md:hidden">
          <Link href="/" aria-label="NAVFarm home">
            <NavfarmBrand />
          </Link>
          <ThemeToggle />
        </div>
        <div className="hidden justify-end px-8 pt-6 md:flex">
          <ThemeToggle />
        </div>

        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 md:py-10">
          <div className="w-full max-w-2xl animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
