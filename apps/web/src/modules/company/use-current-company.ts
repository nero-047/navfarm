'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { COMPANIES, normalizeCompany, type CompanyMeta } from './types';

export const CUSTOM_COMPANIES_KEY = 'navfarm_custom_companies';
export const API_COMPANIES_KEY = 'navfarm_api_companies';

export function saveApiCompanies(companies: CompanyMeta[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_COMPANIES_KEY, JSON.stringify(companies));
}

export function getApiCompanies(): CompanyMeta[] | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(API_COMPANIES_KEY);
  if (stored === null) return null;
  try {
    return (JSON.parse(stored) as CompanyMeta[]).map(normalizeCompany);
  } catch {
    return null;
  }
}

export function getCustomCompanies(): CompanyMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CUSTOM_COMPANIES_KEY);
    if (!stored) return [];
    return (
      JSON.parse(stored) as Array<
        Partial<CompanyMeta> & Pick<CompanyMeta, 'slug' | 'name'>
      >
    ).map(normalizeCompany);
  } catch {
    return [];
  }
}

export function getAllCompanies(): Record<string, CompanyMeta> {
  const apiCompanies = getApiCompanies();
  if (apiCompanies) {
    return Object.fromEntries(apiCompanies.map((company) => [company.slug, company]));
  }
  const companies = { ...COMPANIES };
  for (const custom of getCustomCompanies()) companies[custom.slug] = custom;
  return companies;
}

export function useCurrentCompany(): CompanyMeta | null {
  const { company } = useParams<{ company: string }>();
  return useMemo(() => getAllCompanies()[company] ?? null, [company]);
}
