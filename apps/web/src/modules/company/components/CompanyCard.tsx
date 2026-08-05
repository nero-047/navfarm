'use client';

import Link from 'next/link';
import type { CompanyMeta } from '../types';

export function CompanyCard({ company }: { company: CompanyMeta }) {
  return (
    <Link href={`/${company.slug}/dashboard`} className="block h-full">
      <div className="group flex h-full min-h-[230px] cursor-pointer flex-col rounded-2xl border border-(--border) bg-(--surface) p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#c24332] hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <span className="text-4xl leading-none">{company.icon}</span>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-(--accent-muted) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-(--accent)">
              {company.nobName}
            </span>
            {company.source === 'demo' && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                Demo data
              </span>
            )}
          </div>
        </div>
        <h3 className="mt-5 text-[15px] font-semibold text-(--text-primary)">
          {company.name}
        </h3>
        <p className="mt-1 text-xs text-(--text-secondary)">{company.location}</p>
        <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-(--text-secondary)">
          {company.lobs.join(' · ')}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-(--border) pt-4">
          <span className="text-[11px] text-(--text-muted)">
            {company.lobs.length} LOBs
          </span>
          <span className="text-[11px] font-semibold text-(--accent)">
            Setup {company.setupProgress}%
          </span>
        </div>
      </div>
    </Link>
  );
}
