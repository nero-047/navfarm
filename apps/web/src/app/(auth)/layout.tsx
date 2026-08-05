import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-[55%] bg-gradient-to-br from-[#0b1248] via-[#151d5e] to-[#1c4aa9] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/[0.03]" />
        <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-white/[0.04]" />
        <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-[#c24332]/10" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              NAV<span className="text-[#c24332]">Farm</span>
            </span>
          </Link>

          <div className="animate-fade-in">
            <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight mb-4">
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
      <div className="flex-1 flex flex-col bg-(--bg)">
        {/* Mobile logo */}
        <div className="md:hidden px-6 pt-8 pb-4">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-xl font-bold text-(--text-primary) tracking-tight">
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
