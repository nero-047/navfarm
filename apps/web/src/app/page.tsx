'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { destinationForSession } from '../lib/authorization';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(session ? destinationForSession(session) : '/login');
  }, [loading, router, session]);
  return <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8] text-sm text-[#707789]">Opening your secure workspace…</div>;
}
