'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { COMPANIES, normalizeCompany, type CompanyMeta } from './types';

export const CUSTOM_COMPANIES_KEY = 'navfarm_custom_companies';
export const API_COMPANIES_KEY = 'navfarm_api_companies';

let apiCompanies: CompanyMeta[] | null = null;

export function saveApiCompanies(companies: CompanyMeta[]): void {
  apiCompanies = companies.map(normalizeCompany);
}

export function getApiCompanies(): CompanyMeta[] | null {
  return apiCompanies;
}

export function getCustomCompanies(): CompanyMeta[] {
  return [];
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
