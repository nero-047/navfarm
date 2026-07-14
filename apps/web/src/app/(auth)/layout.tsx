import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      <header className="w-full py-6">
        <Link href="/" className="flex items-center justify-center">
          <span className="text-2xl font-bold text-[#0b1248]">
            NAV<span className="text-[#c24332]">Farm</span>
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}
