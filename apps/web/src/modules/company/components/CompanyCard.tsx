'use client';

import Link from 'next/link';
import type { CompanyMeta } from '../types';

export function CompanyCard({ company }: { company: CompanyMeta }) {
  return (
    <Link href={`/${company.slug}/dashboard`} className="block h-full">
      <div className="group flex h-full min-h-[230px] cursor-pointer flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-3">
          <span className="text-4xl leading-none">{company.icon}</span>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1c4aa9]">
              {company.nobName}
            </span>
            {company.source === 'demo' && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                Demo data
              </span>
            )}
          </div>
        </div>
        <h3 className="mt-5 text-[15px] font-semibold text-[var(--text-primary)]">
          {company.name}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{company.location}</p>
        <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[var(--text-secondary)]">
          {company.lobs.join(' · ')}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
          <span className="text-[11px] text-[var(--text-muted)]">
            {company.lobs.length} LOBs
          </span>
          <span className="text-[11px] font-semibold text-[#1c4aa9]">
            Setup {company.setupProgress}%
          </span>
        </div>
      </div>
    </Link>
  );
}
