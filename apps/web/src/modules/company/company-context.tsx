'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTenantCompanies } from './api';
import type { CompanyMeta } from './types';

interface CompanyContextValue {
  companies: CompanyMeta[];
  company: CompanyMeta | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const params = useParams<{ company: string }>();
  const [companies, setCompanies] = useState<CompanyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    if (!user?.tenantId) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    fetchTenantCompanies(user.tenantId)
      .then((items) => {
        if (active) setCompanies(items);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Could not load companies.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestKey, user?.tenantId]);

  const company = useMemo(
    () => companies.find((item) => item.slug === params.company) ?? null,
    [companies, params.company],
  );

  useEffect(() => {
    if (company?.id) localStorage.setItem('active_company_id', company.id);
  }, [company?.id]);

  const reload = useCallback(() => setRequestKey((value) => value + 1), []);
  return (
    <CompanyContext.Provider
      value={{ companies, company, loading, error, reload }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const value = useContext(CompanyContext);
  if (!value)
    throw new Error('useCompanyContext must be used within CompanyProvider');
  return value;
}
