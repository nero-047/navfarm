'use client';

import Link from 'next/link';
import type { CompanyMeta } from '../types';

export function CompanyCard({ company }: { company: CompanyMeta }) {
  return (
    <Link href={`/${company.slug}/dashboard`} className="block h-full">
      <div className="group flex h-full min-h-[220px] cursor-pointer flex-col rounded-[var(--radius-md)] border border-(--border) bg-(--surface) p-6 transition-colors hover:border-(--accent)">
        <div className="flex items-start justify-between gap-3">
          <span className="text-4xl leading-none">{company.icon}</span>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-(--accent-muted) px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-(--accent)">
              {company.nobName}
            </span>
          </div>
        </div>
        <h3 className="mt-5 text-[15px] font-semibold text-(--text-primary)">
          {company.name}
        </h3>
        <p className="mt-1 text-xs text-(--text-secondary)">
          {company.location}
        </p>
        <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-(--text-secondary)">
          {company.lobs.join(' · ')}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-(--border) pt-4">
          <span className="text-xs text-(--text-muted)">
            {company.lobs.length} LOBs
          </span>
          <span className="text-xs font-semibold text-(--accent)">
            Setup {company.setupProgress}%
          </span>
        </div>
      </div>
    </Link>
  );
}
