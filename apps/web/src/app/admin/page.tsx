'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '../../hooks/useAuth';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.replace('/');
      return;
    }
    if (user.userType !== 'SYSTEM_ADMIN') {
      router.replace('/console/dashboard');
      return;
    }
    router.replace('/admin/dashboard');
  }, [router]);

  return null;
}
