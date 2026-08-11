'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, MailCheck } from 'lucide-react';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-(--accent-muted) flex items-center justify-center">
            <MailCheck size={28} className="text-(--accent)" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-(--text-primary) tracking-tight mb-2">
          Check your email
        </h1>
        <p className="text-(--text-secondary) text-[15px] mb-1">
          We sent a reset link to
        </p>
        <p className="text-(--text-primary) font-medium text-[15px] mb-8">
          {email}
        </p>
        <p className="text-[13px] text-(--text-secondary) mb-8 leading-relaxed">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </p>
        <Button
          variant="outline"
          onClick={() => setSubmitted(false)}
          className="mx-auto"
        >
          Try again
        </Button>
        <p className="mt-8 text-[14px]">
          <Link
            href="/login"
            className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-(--text-primary) tracking-tight mb-2">
          Reset password
        </h1>
        <p className="text-(--text-secondary) text-[15px]">
          Enter your email and we&apos;ll send you a reset link
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

        <Button type="submit" className="w-full">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-(--text-secondary)">
        <Link
          href="/login"
          className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
