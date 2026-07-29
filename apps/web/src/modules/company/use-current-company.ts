'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  COMPANIES, normalizeCompany, type CompanyMeta,
} from './types';

export function useCurrentCompany(): CompanyMeta | null {
  const { company: companySlug } = useParams<{ company: string }>();
  const { session } = useAuth();
  const membership = session?.companies.find(
    (company) => company.companySlug === companySlug,
  );

  return useMemo(() => {
    const documented = COMPANIES[companySlug];
    if (documented) {
      return normalizeCompany({
        ...documented,
        id: membership?.companyId,
        tenantId: membership?.tenantId,
      });
    }
    if (!membership) return null;
    return normalizeCompany({
      id: membership.companyId,
      tenantId: membership.tenantId,
      source: 'api',
      slug: membership.companySlug,
      name: membership.companyName,
      setupProgress: membership.onboardingStatus === 'COMPLETED' ? 100 : 0,
    });
  }, [companySlug, membership]);
}
