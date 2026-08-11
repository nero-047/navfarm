import { api } from '@/lib/api-client';
import {
  getNobOption,
  normalizeCompany,
  type CompanyMeta,
  type NobCode,
} from './types';

export interface BackendCompany {
  company_id: string;
  tenant_id: string;
  company_code: string;
  company_name: string;
  company_display_name?: string | null;
  industry_type: string;
  onboarding_status: string;
  is_active: boolean;
}

export function slugifyCompany(name: string, id?: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return id ? `${base}-${id.slice(0, 8)}` : base;
}

function inferNobCode(industry: string): NobCode {
  const value = industry.toUpperCase();
  if (
    value.includes('LIVESTOCK') ||
    value.includes('DAIRY') ||
    value.includes('PIGGERY')
  )
    return 'LIVESTOCK';
  if (
    value.includes('AGRI') ||
    value.includes('CROP') ||
    value.includes('SEED')
  )
    return 'AGRICULTURE';
  if (value.includes('AQUA') || value.includes('FISH')) return 'AQUACULTURE';
  if (value.includes('INSECT') || value.includes('BEE')) return 'INSECT';
  if (value.includes('FEED') || value.includes('PROCESS')) return 'PROCESSING';
  if (value.includes('POULTRY') || value.includes('CHICKEN')) return 'POULTRY';
  return 'UNCONFIGURED';
}

export function toCompanyMeta(company: BackendCompany): CompanyMeta {
  const nob = getNobOption(inferNobCode(company.industry_type));
  const statusProgress = company.onboarding_status === 'COMPLETED' ? 100 : 0;
  return normalizeCompany({
    id: company.company_id,
    tenantId: company.tenant_id,
    slug: slugifyCompany(
      company.company_display_name || company.company_name,
      company.company_id,
    ),
    name: company.company_display_name || company.company_name,
    nobCode: nob.code,
    nobName: nob.name,
    icon: nob.icon,
    description: nob.description,
    lobs: nob.lobs,
    location: 'Location pending setup',
    setupProgress: statusProgress,
  });
}

export async function fetchTenantCompanies(
  tenantId: string,
): Promise<CompanyMeta[]> {
  const companies = await api.get<BackendCompany[]>(
    `/company/tenant/${tenantId}`,
  );
  return companies
    .filter(
      (company) => company.is_active && company.company_code !== 'PLACEHOLDER',
    )
    .map(toCompanyMeta);
}

export async function fetchCompany(companyId: string): Promise<CompanyMeta> {
  return toCompanyMeta(await api.get<BackendCompany>(`/company/${companyId}`));
}

export async function createBackendCompany(input: {
  name: string;
  nobCode: NobCode;
}): Promise<CompanyMeta> {
  const company = await api.post<BackendCompany>('/company', {
    company_code: slugifyCompany(input.name)
      .replace(/-/g, '_')
      .toUpperCase()
      .slice(0, 20),
    company_name: input.name,
    company_display_name: input.name,
    company_type: 'Pvt Ltd',
    industry_type: getNobOption(input.nobCode).name,
    country_id: 'IND',
    default_timezone_id: 'Asia/Kolkata',
  });
  return toCompanyMeta(company);
}
