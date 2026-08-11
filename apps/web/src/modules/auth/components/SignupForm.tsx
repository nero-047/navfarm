'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

export function SignupForm() {
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tenantName || !tenantCode || !name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        'Use 8+ characters with an uppercase letter, number and special character',
      );
      return;
    }
    setSubmitting(true);
    try {
      await signup({ tenantName, tenantCode, name, email, password });
      router.push('/company-selection');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to create workspace',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-(--text-primary) tracking-tight mb-2">
          Create account
        </h1>
        <p className="text-(--text-secondary) text-[15px]">
          Create your NAVFarm account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-(--danger) py-1">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="tenant-name"
            className="block text-[13px] font-medium text-(--text-primary)"
          >
            Organization name
          </label>
          <Input
            id="tenant-name"
            type="text"
            placeholder="Green Valley Holdings"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="tenant-code"
            className="block text-[13px] font-medium text-(--text-primary)"
          >
            Workspace code
          </label>
          <Input
            id="tenant-code"
            type="text"
            placeholder="greenvalley"
            value={tenantCode}
            onChange={(e) =>
              setTenantCode(
                e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''),
              )
            }
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-[13px] font-medium text-(--text-primary)"
          >
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[13px] font-medium text-(--text-primary)"
          >
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
          <label
            htmlFor="password"
            className="block text-[13px] font-medium text-(--text-primary)"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="8+ chars, uppercase, number, special"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-(--text-secondary)">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
