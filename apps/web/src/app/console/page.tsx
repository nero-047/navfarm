'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '../../hooks/useAuth';

export default function ConsolePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.replace('/');
      return;
    }
    if (user.userType === 'SYSTEM_ADMIN') {
      router.replace('/admin/tenants');
      return;
    }
    router.replace('/console/dashboard');
  }, [router]);

  return null;
}
