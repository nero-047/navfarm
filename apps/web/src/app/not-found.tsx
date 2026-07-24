import Link from 'next/link';
export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f3f5f8] p-6"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c24332]">404</p><h1 className="mt-3 text-3xl font-semibold text-[#252b3d]">Page not found</h1><p className="mt-2 text-sm text-[#707789]">The NAVFarm page you requested does not exist.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-[#0b1248] px-4 py-2.5 text-xs font-semibold text-white">Return to workspace</Link></div></main>;
}
