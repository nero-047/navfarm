'use client';

import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Leaf,
  QrCode,
  TrendingUp,
} from 'lucide-react';

interface HeroProps {
  onRegisterClick: () => void;
  onLaunchClick: () => void;
  isLoggedIn?: boolean;
}

const metrics = [
  { label: 'Active batches', value: '24', note: '+3 this week' },
  { label: 'Feed conversion', value: '1.62', note: 'Within target' },
  { label: 'QC pass rate', value: '97.4%', note: '+1.8% vs last cycle' },
];

export default function Hero({
  onRegisterClick,
  onLaunchClick,
  isLoggedIn = false,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
      <div className="pointer-events-none absolute inset-0 " />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-overlay)] px-3 py-1.5 text-xs font-semibold text-[var(--color-navy)] shadow-sm backdrop-blur">
            <Leaf size={14} className="text-[var(--color-primary)]" />
            Universal farm management
          </div>
          <h1 className="text-[clamp(2.75rem,6vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-navy)]">
            One clear view of your entire farm.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">
            Plan work, track every batch, control quality, and understand cost
            from farm to fork—all in one adaptable workspace.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onLaunchClick}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-navy)] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,18,72,0.2)] transition hover:bg-[var(--color-navy-light)] active:scale-[0.98]"
            >
              {isLoggedIn ? 'Open workspace' : 'Get started'}{' '}
              <ArrowRight size={17} />
            </button>
            {!isLoggedIn && (
              <button
                onClick={onRegisterClick}
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-raised)] active:scale-[0.98]"
              >
                Create account
              </button>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
            {[
              'Multi-company ready',
              'Configurable NOB & LOB',
              'Farm-to-fork traceability',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[var(--success)]" />{' '}
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
          <div className="absolute -inset-5 -z-10 rounded-[36px] bg-(--border-subtle)" />
          <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-overlay)] shadow-[0_28px_80px_rgba(11,18,72,0.16)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Green Valley Farms
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Operations overview · Demo data
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                Live cycle
              </span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4"
                >
                  <p className="text-xs font-medium text-[var(--text-muted)]">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[var(--success)]">
                    {metric.note}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-6 sm:pb-6">
              <div className="rounded-[var(--radius-lg)] bg-[var(--color-navy)] p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    Production cycle
                  </span>
                  <TrendingUp size={16} className="text-white/70" />
                </div>
                <div
                  className="mt-6 flex h-24 items-end gap-2"
                  aria-label="Production trend chart"
                >
                  {[42, 58, 50, 72, 65, 84, 92].map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-md bg-white/80"
                      style={{
                        height: `${height}%`,
                        opacity: 0.45 + index * 0.07,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-xs text-white/55">
                  <span>Week 1</span>
                  <span>Week 7</span>
                </div>
              </div>
              <div className="space-y-2.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-4">
                {[
                  {
                    icon: ClipboardCheck,
                    title: 'QC review complete',
                    meta: 'Batch PL-2408 · 14 min ago',
                    tone: 'bg-emerald-50 text-emerald-700',
                  },
                  {
                    icon: QrCode,
                    title: 'Trace pack generated',
                    meta: 'PACK-09381 · 42 min ago',
                    tone: 'bg-blue-50 text-blue-700',
                  },
                  {
                    icon: Leaf,
                    title: 'Daily operation logged',
                    meta: 'House 04 · 1 hr ago',
                    tone: 'bg-red-50 text-red-700',
                  },
                ].map(({ icon: Icon, title, meta, tone }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-raised)] p-3"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] ${tone}`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">
                        {title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                        {meta}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
