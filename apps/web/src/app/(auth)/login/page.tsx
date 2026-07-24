import { LoginForm } from '@/modules/auth';
import { Suspense } from 'react';

export default function LoginPage() {
  return <Suspense fallback={<p className="text-sm text-[#707070]">Loading sign in…</p>}><LoginForm /></Suspense>;
}
