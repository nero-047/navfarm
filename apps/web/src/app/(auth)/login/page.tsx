import { LoginForm } from '@/modules/auth';
import { Suspense } from 'react';
import { getApiMode } from '@/server/api/mode';

export default function LoginPage() {
  const showDemoAccounts = getApiMode() === 'mock';
  return <Suspense fallback={<p className="text-sm text-[#707070]">Loading sign in…</p>}><LoginForm showDemoAccounts={showDemoAccounts} /></Suspense>;
}
