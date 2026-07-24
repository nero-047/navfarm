import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5f8] p-6">
      <div className="max-w-md rounded-2xl border border-[#e1e5ec] bg-white p-8 text-center shadow-sm">
        <ShieldX className="mx-auto h-11 w-11 text-[#c24332]" />
        <h1 className="mt-4 text-2xl font-semibold text-[#252b3d]">Workspace unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-[#707789]">This tenant or company is suspended, inactive, or not included in your memberships.</p>
        <Link href="/context-selection" className="mt-6 inline-flex rounded-xl bg-[#0b1248] px-4 py-2.5 text-xs font-semibold text-white">Choose another workspace</Link>
      </div>
    </main>
  );
}
