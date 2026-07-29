'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, InputHTMLAttributes } from 'react';
import { AlertCircle, ArrowRight, Building2, CheckCircle2, Lock, Mail, UserRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { destinationForSession } from '@/lib/authorization';

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

const fieldClass = 'h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-11 pr-4 text-sm text-[var(--input-text)] outline-none placeholder:text-[var(--input-placeholder)]';

function Field({ icon: Icon, label, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail; label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">{label}</span>
      <span className="relative block">
        <Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input className={fieldClass} {...props} />
      </span>
    </label>
  );
}

export default function AuthDrawer({ isOpen, onClose, initialTab = 'login' }: AuthDrawerProps) {
  const router = useRouter();
  const { login, signup, refreshSession } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [name, setName] = useState('');

  useEffect(() => { setTab(initialTab); setError(''); setSuccess(''); }, [initialTab, isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setSuccess('');
    try {
      const result = tab === 'login' ? await login(email, password) : null;
      if (tab === 'signup') {
        await signup({ tenantName, tenantCode, name, email, password });
      }
      setSuccess(tab === 'login' ? 'Signed in. Opening your workspace…' : 'Workspace created. Opening NAVFarm…');
      setTimeout(() => {
        void (async () => {
          onClose();
          if (result?.status === 'mfa_pending') {
            router.push(`/mfa/verify?challengeId=${encodeURIComponent(result.challengeId)}`);
            return;
          }
          const session = result?.session ?? await refreshSession();
          router.push(session ? destinationForSession(session) : '/login');
        })();
      }, 450);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete this request.');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#070a20]/45 backdrop-blur-sm" role="presentation">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close sign in" />
      <aside role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative h-full w-full max-w-lg overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] shadow-[-24px_0_70px_rgba(11,18,72,0.2)] animate-slide-up">
        <div className="flex min-h-full flex-col p-6 sm:p-9">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold tracking-[-0.035em] text-[var(--color-navy)]">NAV<span className="text-[var(--color-primary)]">Farm</span></span>
            <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]" aria-label="Close"><X size={20} /></button>
          </div>

          <div className="my-auto py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">{tab === 'login' ? 'Welcome back' : 'New workspace'}</p>
            <h2 id="auth-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em]">{tab === 'login' ? 'Sign in to NAVFarm' : 'Create your NAVFarm account'}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{tab === 'login' ? 'Use your organization account to continue.' : 'Set up the organization administrator. Company setup follows after sign in.'}</p>

            <div className="mt-7 grid grid-cols-2 rounded-xl bg-[var(--surface-raised)] p-1">
              {(['login', 'signup'] as const).map((item) => <button key={item} type="button" onClick={() => { setTab(item); setError(''); setSuccess(''); }} className={`min-h-10 rounded-lg text-xs font-semibold transition ${tab === item ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{item === 'login' ? 'Sign in' : 'Create account'}</button>)}
            </div>

            <form onSubmit={submit} className="mt-7 space-y-4">
              {tab === 'signup' && (
                <>
                  <Field icon={Building2} label="Organization name" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Green Valley Holdings" required />
                  <Field icon={Building2} label="Organization code" value={tenantCode} onChange={(e) => setTenantCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="GREENVALLEY" required />
                  <Field icon={UserRound} label="Administrator name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
                </>
              )}
              <Field icon={Mail} label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" autoComplete="email" required />
              <Field icon={Lock} label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} required />

              {error && <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
              {success && <div className="flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{success}</div>}

              <button type="submit" disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-navy-light)] active:scale-[0.99] disabled:opacity-60">
                {busy ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'} {!busy && <ArrowRight size={16} />}
              </button>
            </form>
          </div>
          <p className="text-center text-[11px] leading-5 text-[var(--text-muted)]">Demo frontend. Authentication and company data depend on the configured NAVFarm API.</p>
        </div>
      </aside>
    </div>
  );
}
