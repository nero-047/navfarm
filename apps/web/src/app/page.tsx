'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('navfarm_auth_user');
    if (!raw) {
      router.replace('/login');
      return;
    }
    try {
      const user = JSON.parse(raw);
      router.replace(user.userType === 'SYSTEM_ADMIN' ? '/admin' : '/console');
    } catch {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
      <div className="text-center">
        <p className="text-xl font-bold tracking-tight text-[#0b1248]">
          NAV<span className="text-[#c24332]">Farm</span>
        </p>
        <p className="mt-2 text-sm text-[#707070]">Opening your workspace…</p>
      </div>
    </div>
  );
}
