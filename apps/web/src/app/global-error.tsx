'use client';
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html><body><main className="flex min-h-screen items-center justify-center bg-[#f3f5f8] p-6"><div className="max-w-md text-center"><h1 className="text-2xl font-semibold text-[#252b3d]">NAVFarm encountered an error</h1><p className="mt-2 text-sm text-[#707789]">Your data was not changed. Try loading this view again.</p><button onClick={reset} className="mt-6 rounded-xl bg-[#0b1248] px-4 py-2.5 text-xs font-semibold text-white">Try again</button></div></main></body></html>;
}
