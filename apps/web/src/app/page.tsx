'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('navfarm_auth_user');
    if (user) {
      router.replace('/company-selection');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
      <p className="text-[#707070]">Redirecting...</p>
    </div>
  );
}
