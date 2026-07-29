'use client';

import Link from 'next/link';
import QRCode from 'react-qr-code';
import {
  CheckCircle2,
  ChevronRight,
  Database,
  MapPin,
  PackageCheck,
} from 'lucide-react';
import { COMPANIES } from '@/modules/company/types';
import ThemeToggle from '@/components/source-ui/theme-toggle';
import { NavfarmBrand } from '@/components/brand/navfarm-brand';
import { INDUSTRY_CONFIG } from './data';

export function PublicTracePage({
  companySlug,
  packCode,
}: {
  companySlug: string;
  packCode: string;
}) {
  const company = COMPANIES[companySlug];
  if (!company)
    return (
      <main className="nf-public-page flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
        <div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-sm)]">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Trace record not found
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Check the pack code and try again.
          </p>
        </div>
      </main>
    );
  const config = INDUSTRY_CONFIG[company.nobCode];
  const stages = [
    'Source verified',
    'Production complete',
    'Quality released',
    'Pack issued',
  ];
  return (
    <main className="nf-public-page min-h-screen bg-[var(--bg)] text-[var(--text-secondary)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" aria-label="NAVFarm home">
            <NavfarmBrand />
          </Link>
          <div className="flex items-center gap-2">
            <span className="nf-info-state inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold">
              <Database size={13} aria-hidden /> Demo trace record
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
        <div className="overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#0b1248,#1c4aa9)] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                Product journey
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {config.primaryOutput}
              </h1>
              <p className="mt-2 text-sm text-white/65">
                Produced by {company.name}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <QRCode
                value={`https://navfarm.app/trace/${companySlug}/${packCode}`}
                size={112}
                fgColor="#0b1248"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-base font-semibold">Trace summary</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['Pack code', packCode],
                ['Production batch', `${config.batchPrefix}-2026-035`],
                ['Product', config.primaryOutput],
                ['Quality status', 'Released'],
                ['Produced', '15 Jul 2026'],
                ['Best before', '22 Jul 2026'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[var(--surface-raised)] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    {label}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-base font-semibold">Origin & assurance</h2>
            <div className="mt-5 flex gap-3">
              <MapPin className="mt-0.5 text-[#1c4aa9]" size={18} />
              <div>
                <p className="text-sm font-semibold">{company.location}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Registered production location
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <PackageCheck className="mt-0.5 text-emerald-600" size={18} />
              <div>
                <p className="text-sm font-semibold">Mock release recorded</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Demo fixture released for packing and distribution
                </p>
              </div>
            </div>
          </section>
        </div>
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-base font-semibold">Journey</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {stages.map((stage, index) => (
              <div key={stage} className="flex items-center sm:block">
                <div className="flex items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={17} />
                  </span>
                  {index < stages.length - 1 && (
                    <span className="mx-2 hidden h-px flex-1 bg-[#dfe3ea] sm:block" />
                  )}
                </div>
                <p className="ml-3 text-xs font-semibold sm:ml-0 sm:mt-3">
                  {stage}
                </p>
                {index < stages.length - 1 && (
                  <ChevronRight
                    className="ml-auto text-[#bbc0ca] sm:hidden"
                    size={16}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
        <p className="mt-6 text-center text-[10px] leading-5 text-[var(--text-muted)]">
          Demo data only. This trace record illustrates associated product
          information and is not a certification or compliance statement.
        </p>
      </div>
    </main>
  );
}
