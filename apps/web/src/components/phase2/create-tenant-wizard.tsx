'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { api, ApiError } from '../../lib/api-client';
import type { CreateTenant, Plan, PlatformTenant } from '../../contracts/phase2';
import {
  ErrorState, LoadingState, PageHeader, SuccessNotice, inputClass,
  primaryButtonClass, secondaryButtonClass,
} from './common';

const steps = ['Tenant identity', 'Plan selection', 'Billing', 'Limits & features', 'First administrator', 'Review', 'Create'];
const initial: CreateTenant = {
  code: '', name: '', type: 'SME', planId: '',
  billingEmail: '', billingCurrency: 'INR', billingCycle: 'ANNUAL',
  subscriptionStart: '2026-07-24', subscriptionEnd: null,
  limits: { companies: 1, users: 8, batchesPerMonth: 50, apiRequestsPerMinute: 60, storageGb: 10 },
  features: [],
  administrator: { fullName: '', email: '' },
};

export function CreateTenantWizard() {
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<CreateTenant>(initial);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get<Plan[]>('/platform/plans')
      .then((items) => {
        setPlans(items);
        const defaultPlan = items[0];
        if (defaultPlan) setForm((value) => ({ ...value, planId: defaultPlan.planId, limits: defaultPlan.limits, features: defaultPlan.features }));
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Plans failed to load.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { heading.current?.focus(); }, [step]);

  const selectPlan = (planId: string) => {
    const plan = plans.find((item) => item.planId === planId);
    if (plan) setForm((value) => ({ ...value, planId, limits: plan.limits, features: plan.features }));
  };

  const stepValid =
    step === 0 ? form.code.length >= 3 && form.name.length >= 2 :
      step === 1 ? Boolean(form.planId) :
        step === 2 ? form.billingEmail.includes('@') && Boolean(form.subscriptionStart) :
          step === 3 ? form.limits.companies > 0 && form.limits.users > 0 :
            step === 4 ? form.administrator.fullName.length >= 2 && form.administrator.email.includes('@') : true;

  const create = async () => {
    setSubmitting(true); setError('');
    try {
      const created = await api.post<PlatformTenant>('/platform/tenants', form);
      setSuccess(`${created.name} was created.`);
      setStep(6);
      window.setTimeout(() => router.push(`/admin/tenants/${created.tenantId}/overview`), 700);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Tenant creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading tenant configuration…" />;
  if (!plans.length && error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader eyebrow="Platform administration" title="Create tenant" description="Provision tenant identity, subscription configuration, limits, entitlements, and the first tenant administrator." />
      <nav aria-label="Tenant creation progress" className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3">
        <ol className="flex min-w-max gap-2">
          {steps.map((label, index) => (
            <li key={label} aria-current={index === step ? 'step' : undefined} className={`rounded-lg px-3 py-2 text-xs font-bold ${index === step ? 'bg-[#101b52] text-white' : index < step ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
              {index < step ? <Check className="mr-1 inline h-3 w-3" /> : `${index + 1}. `}{label}
            </li>
          ))}
        </ol>
      </nav>
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 ref={heading} tabIndex={-1} className="text-xl font-black text-slate-950">{steps[step]}</h2>
        {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
        {success ? <div className="mt-4"><SuccessNotice message={success} /></div> : null}

        {step === 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Tenant code<input className={`${inputClass} mt-1`} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} placeholder="GREEN_VALLEY" aria-describedby="code-help" /></label>
            <label className="text-sm font-semibold text-slate-700">Tenant name<input className={`${inputClass} mt-1`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <p id="code-help" className="text-xs text-slate-500">Unique uppercase code used for tenant identity. Permanent deletion is not supported.</p>
            <label className="text-sm font-semibold text-slate-700">Tenant type<select className={`${inputClass} mt-1`} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CreateTenant['type'] })}><option>INDIVIDUAL</option><option>SME</option><option>ENTERPRISE</option><option>COOPERATIVE</option></select></label>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {plans.map((plan) => (
              <button key={plan.planId} type="button" onClick={() => selectPlan(plan.planId)} className={`rounded-xl border p-4 text-left ${form.planId === plan.planId ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}>
                <span className="font-black text-slate-950">{plan.name}</span><span className="mt-1 block text-xs text-slate-500">{plan.description}</span>
                <span className="mt-3 block text-xs font-semibold text-blue-700">{plan.limits.companies} companies · {plan.limits.users} users</span>
              </button>
            ))}
          </div>
        ) : null}
        {step === 2 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Billing email<input type="email" className={`${inputClass} mt-1`} value={form.billingEmail} onChange={(event) => setForm({ ...form, billingEmail: event.target.value })} /></label>
            <label className="text-sm font-semibold text-slate-700">Billing currency<select className={`${inputClass} mt-1`} value={form.billingCurrency} onChange={(event) => setForm({ ...form, billingCurrency: event.target.value })}><option>INR</option><option>USD</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Billing cycle<select className={`${inputClass} mt-1`} value={form.billingCycle} onChange={(event) => setForm({ ...form, billingCycle: event.target.value as CreateTenant['billingCycle'] })}><option>MONTHLY</option><option>QUARTERLY</option><option>ANNUAL</option><option>CUSTOM</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Subscription start<input type="date" className={`${inputClass} mt-1`} value={form.subscriptionStart} onChange={(event) => setForm({ ...form, subscriptionStart: event.target.value })} /></label>
            <label className="text-sm font-semibold text-slate-700">Subscription end (optional)<input type="date" className={`${inputClass} mt-1`} value={form.subscriptionEnd ?? ''} onChange={(event) => setForm({ ...form, subscriptionEnd: event.target.value || null })} /></label>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 sm:col-span-2">Pricing, taxes, GST, payment collection, retries, proration, invoices, overages, and grace periods are intentionally not modeled.</p>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {([
                ['companies', 'Maximum companies'], ['users', 'Maximum users'],
                ['batchesPerMonth', 'Batches per month'], ['apiRequestsPerMinute', 'API requests / minute'],
                ['storageGb', 'Storage GB'],
              ] as const).map(([key, label]) => (
                <label key={key} className="text-sm font-semibold text-slate-700">{label}<input type="number" min="1" className={`${inputClass} mt-1`} value={form.limits[key] ?? ''} onChange={(event) => setForm({ ...form, limits: { ...form.limits, [key]: event.target.value ? Number(event.target.value) : null } })} /></label>
              ))}
            </div>
            <fieldset><legend className="text-sm font-bold text-slate-800">Feature entitlements</legend><div className="mt-2 flex flex-wrap gap-2">{Array.from(new Set(plans.flatMap((plan) => plan.features))).map((feature) => <label key={feature} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={form.features.includes(feature)} onChange={(event) => setForm({ ...form, features: event.target.checked ? [...form.features, feature] : form.features.filter((item) => item !== feature) })} />{feature}</label>)}</div></fieldset>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Administrator name<input className={`${inputClass} mt-1`} value={form.administrator.fullName} onChange={(event) => setForm({ ...form, administrator: { ...form.administrator, fullName: event.target.value } })} /></label>
            <label className="text-sm font-semibold text-slate-700">Administrator email<input type="email" className={`${inputClass} mt-1`} value={form.administrator.email} onChange={(event) => setForm({ ...form, administrator: { ...form.administrator, email: event.target.value } })} /></label>
            <p className="text-xs text-slate-500 sm:col-span-2">The administrator account is represented as active mock state. Invitation delivery remains an upstream responsibility.</p>
          </div>
        ) : null}
        {step === 5 ? (
          <dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
            {[
              ['Tenant', `${form.name} (${form.code})`], ['Type', form.type],
              ['Plan', plans.find((plan) => plan.planId === form.planId)?.name ?? form.planId],
              ['Billing', `${form.billingCycle} · ${form.billingCurrency} · ${form.billingEmail}`],
              ['Limits', `${form.limits.companies} companies · ${form.limits.users} users · ${form.limits.batchesPerMonth ?? 'Unlimited'} batches`],
              ['Administrator', `${form.administrator.fullName} · ${form.administrator.email}`],
            ].map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd></div>)}
          </dl>
        ) : null}
        {step === 6 && !success ? <p className="mt-6 text-sm text-slate-600">Ready to create the tenant using the reviewed configuration.</p> : null}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
          <button type="button" className={secondaryButtonClass} disabled={step === 0 || submitting} onClick={() => setStep((value) => value - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Previous</button>
          {step < 5 ? <button type="button" className={primaryButtonClass} disabled={!stepValid} onClick={() => setStep((value) => value + 1)}>Save and continue<ArrowRight className="ml-2 h-4 w-4" /></button> : null}
          {step === 5 ? <button type="button" className={primaryButtonClass} onClick={() => setStep(6)}>Confirm review<ArrowRight className="ml-2 h-4 w-4" /></button> : null}
          {step === 6 && !success ? <button type="button" className={primaryButtonClass} disabled={submitting} onClick={() => void create()}>{submitting ? 'Creating…' : 'Create tenant'}</button> : null}
        </div>
      </section>
    </div>
  );
}
