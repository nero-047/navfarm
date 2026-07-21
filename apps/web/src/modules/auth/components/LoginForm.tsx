'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const signedInUser = await login(email, password);
      router.push(signedInUser.userType === 'SYSTEM_ADMIN' ? '/admin' : '/console');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-[#2e313f] tracking-tight mb-2">
          Welcome back
        </h1>
        <p className="text-[#707070] text-[15px]">
          Sign in to your NAVFarm account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-[#c24332] py-1">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[13px] font-medium text-[#2e313f]">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-[13px] font-medium text-[#2e313f]">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/reset-password"
            className="text-[13px] text-[#707070] hover:text-[#2e313f] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-[#707070]">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-[#2e313f] hover:text-[#c24332] transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
