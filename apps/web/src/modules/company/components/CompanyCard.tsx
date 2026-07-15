'use client';

import Link from 'next/link';
import type { CompanyMeta } from '../types';

export function CompanyCard({ company }: { company: CompanyMeta }) {
  return (
    <Link href={`/${company.slug}/dashboard`}>
      <div className="group bg-white rounded-2xl border border-[#e5e5e5] p-7 cursor-pointer h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#c24332]">
        <span className="text-5xl leading-none block mb-4">{company.icon}</span>
        <h3 className="text-[15px] font-semibold text-[#2e313f] mb-1">{company.name}</h3>
        <p className="text-[13px] text-[#707070] leading-relaxed">{company.description}</p>
      </div>
    </Link>
  );
}
