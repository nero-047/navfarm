'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ClipboardCheck,
  Globe2,
  Leaf,
  QrCode,
  ShieldCheck,
  Sprout,
  Waves,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';
import AuthDrawer from '@/components/landing/auth-drawer';
import { useAuth } from '@/contexts/AuthContext';

const industries = [
  { icon: Sprout, name: 'Agriculture', detail: 'Fields, crops, orchards and harvest lots' },
  { icon: Leaf, name: 'Poultry', detail: 'Rearing, laying, hatchery and processing' },
  { icon: ShieldCheck, name: 'Livestock', detail: 'Herd health, breeding and biological assets' },
  { icon: Waves, name: 'Aquaculture', detail: 'Ponds, grow-out cycles, feed and harvest' },
  { icon: Globe2, name: 'Insect farming', detail: 'Beekeeping, pollination and BSF production' },
  { icon: Boxes, name: 'Feed & processing', detail: 'Recipes, production jobs and inventory' },
];

const workflow = [
  { icon: Boxes, number: '01', title: 'Plan the cycle', text: 'Configure the company, line of business, batch, locations, resources and targets.' },
  { icon: BarChart3, number: '02', title: 'Run daily operations', text: 'Capture feed, labour, health, mortality, output and resource use in one place.' },
  { icon: ClipboardCheck, number: '03', title: 'Control quality', text: 'Hold, pass or fail outputs with an auditable quality trail before release.' },
  { icon: QrCode, number: '04', title: 'Trace every output', text: 'Connect finished packs back to their source batch and production history.' },
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function openAuth(tab: 'login' | 'signup') {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  function launch() {
    if (user) router.push(user.userType === 'SYSTEM_ADMIN' ? '/admin' : '/company-selection');
    else openAuth('login');
  }

  return (
    <main id="top" className="min-h-screen overflow-x-hidden bg-[var(--surface)] text-[var(--text-primary)]">
      <Navbar
        onSignInClick={launch}
        onRegisterClick={() => openAuth('signup')}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isLoggedIn={Boolean(user)}
      />

      <div className="pt-[72px]">
        <Hero
          onRegisterClick={() => openAuth('signup')}
          onLaunchClick={launch}
          isLoggedIn={Boolean(user)}
        />
      </div>

      <section id="industries" className="border-y border-[var(--border-subtle)] bg-[var(--surface-raised)] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">Built for farming</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">One platform. Every farming business.</h2>
            <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">Configure the workspace around your operation without losing a consistent way to work.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map(({ icon: Icon, name, detail }) => (
              <article key={name} className="group rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-[#c9ced8] hover:shadow-[var(--shadow-md)]">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-blue-soft)] text-[var(--color-blue-accent)]"><Icon size={20} /></span>
                  <div><h3 className="text-base font-semibold">{name}</h3><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-5 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">A connected workflow</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">From setup to traceability, without the spreadsheet gaps.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[var(--text-secondary)] lg:justify-self-end">NAVFarm keeps operational activity, quality decisions, cost and output history connected around the production batch.</p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 xl:grid-cols-4">
            {workflow.map(({ icon: Icon, number, title, text }) => (
              <article key={title} className="min-h-64 bg-[var(--surface)] p-6 sm:p-7">
                <div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--color-navy)]"><Icon size={20} /></span><span className="text-xs font-semibold text-[var(--text-muted)]">{number}</span></div>
                <h3 className="mt-10 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="traceability" className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[28px] bg-[var(--color-navy)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-7 text-white sm:p-12 lg:p-16">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f58c79]">Farm to fork</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Know where every output came from.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/68">Link source batches, daily operations, quality results and finished packs into one understandable record.</p>
            <ul className="mt-8 space-y-3">
              {['Source-batch lineage', 'Quality status and release history', 'Public pack-level trace page'].map((item) => <li key={item} className="flex items-center gap-3 text-sm text-white/85"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10"><Check size={14} /></span>{item}</li>)}
            </ul>
          </div>
          <div className="m-4 rounded-[22px] bg-[var(--surface)] p-6 sm:m-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-5"><div><p className="text-xs font-semibold">Pack trace</p><p className="mt-1 text-[11px] text-[var(--text-muted)]">PACK-2026-00418</p></div><QrCode size={38} className="text-[var(--color-navy)]" /></div>
            <div className="mt-6 space-y-4">
              {[
                ['Source batch', 'BROILER-26-041'],
                ['Farm location', 'North Farm · House 04'],
                ['Quality status', 'Passed · 18 Jul 2026'],
                ['Packed on', '19 Jul 2026, 08:42'],
              ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-raised)] px-4 py-3"><span className="text-xs text-[var(--text-muted)]">{label}</span><span className="text-right text-xs font-semibold">{value}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border-subtle)] bg-[var(--surface-raised)] px-5 py-20 text-center sm:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">See NAVFarm in action.</h2>
          <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">Explore a realistic frontend demo with local sample data and documented farm workflows.</p>
          <button onClick={launch} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(200,67,53,0.2)] transition hover:bg-[var(--color-primary-hover)] active:scale-[0.98]">Open the demo <ArrowRight size={17} /></button>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between"><span className="text-base font-bold text-[var(--color-navy)]">NAV<span className="text-[var(--color-primary)]">Farm</span></span><p>Universal farm management · Frontend demo</p></div>
      </footer>

      <AuthDrawer isOpen={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />
    </main>
  );
}
