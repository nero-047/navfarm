'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardingWizard from '../../components/console/onboarding-wizard';
import { ApplicationShell } from '../../components/shell/application-shell';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthSession } from '../../contracts/api';
import { api } from '../../lib/api-client';

function OnboardingContent() {
  const { session, selectContext, refreshSession } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [wizardSteps, setWizardSteps] = useState<any[]>([]);
  const [activeWizardStep, setActiveWizardStep] = useState(1);
  const [languages, setLanguages] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [nobs, setNobs] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestedTenantId = params.get('tenantId');
  const requestedCompanyId = params.get('companyId');
  const companyId = requestedCompanyId || session?.activeCompanyId;
  const tenantId = requestedTenantId || session?.activeTenantId;

  async function fetchProgress(id: string) {
    const steps = await api.get<any[]>(`/setup/wizard/status/${id}`);
    setWizardSteps(steps);
    const pending = steps.find((step) => step.status !== 'COMPLETED' && step.isMandatory);
    setActiveWizardStep(pending?.stepOrder || 1);
  }

  useEffect(() => {
    const currentSession = session;
    const currentTenantId = tenantId;
    const currentCompanyId = companyId;
    if (!currentSession || !currentTenantId || !currentCompanyId) return;
    let cancelled = false;
    async function load(activeSession: AuthSession, activeTenantId: string, activeCompanyId: string) {
      try {
        if (activeSession.activeCompanyId !== activeCompanyId) {
          await selectContext(activeTenantId, activeCompanyId);
        }
        const [companies, langList, currencyList, nobList] = await Promise.all([
          api.get<any[]>(`/company/tenant/${activeTenantId}`),
          api.get<any[]>('/language'),
          api.get<any[]>('/currency'),
          api.get<any[]>('/setup/wizard/nobs'),
        ]);
        if (cancelled) return;
        setActiveCompany(companies.find((company) => company.company_id === activeCompanyId) || null);
        setLanguages(langList); setCurrencies(currencyList); setNobs(nobList);
        await fetchProgress(activeCompanyId);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load onboarding');
      }
    }
    void load(currentSession, currentTenantId, currentCompanyId);
    return () => { cancelled = true; };
  }, [companyId, selectContext, session, tenantId]);

  if (!session) return null;
  return (
    <ApplicationShell scope="tenant">
      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">{success}</div>}
      {activeCompany && tenantId ? (
        <OnboardingWizard
          wizardSteps={wizardSteps}
          activeWizardStep={activeWizardStep}
          setActiveWizardStep={setActiveWizardStep}
          activeCompany={activeCompany}
          setActiveCompany={setActiveCompany}
          tenantId={tenantId}
          languages={languages}
          currencies={currencies}
          nobs={nobs}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          setActionError={setError}
          setActionSuccess={setSuccess}
          fetchWizardProgress={fetchProgress}
          loadConsoleWorkspace={async () => {
            await refreshSession();
            router.push('/context-selection');
          }}
        />
      ) : <div className="rounded-2xl border border-[#e1e5ec] bg-white p-8 text-sm text-[#707789]">Loading company onboarding…</div>}
    </ApplicationShell>
  );
}

export default function OnboardingPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm">Loading onboarding…</div>}><OnboardingContent /></Suspense>;
}
