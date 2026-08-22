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
      router.replace(user.userType === 'SYSTEM_ADMIN' ? '/admin' : '/dashboard');
    } catch {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--surface-secondary)">
      <div className="text-center">
        <p className="text-xl font-semibold tracking-tight text-(--text-primary)">
          NAV<span className="text-(--accent)">Farm</span>
        </p>
        <p className="mt-2 text-sm text-(--text-secondary)">Opening your workspace…</p>
      </div>
    </div>
  );
}
