'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('navfarm_auth_user');
    router.replace(user ? '/company-selection' : '/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
      <div className="text-center">
        <p className="text-xl font-bold tracking-tight text-(--text-primary)">
          NAV<span className="text-(--accent)">Farm</span>
        </p>
        <p className="mt-2 text-sm text-(--text-secondary)">
          Opening your workspace…
        </p>
      </div>
    </div>
  );
}
