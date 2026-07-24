'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../lib/authorization';
import { api } from '../../lib/api-client';
import { SETUP_ROUTES, type SetupRoute } from '../../lib/readiness-policy';
import type {
  Address, Administrator, BusinessStructure, ChartOfAccounts, Contact,
  EssentialMasters, Fiscal, Localization, ModuleSelection, SetupNotifications,
  SetupProfile, SetupStatus, TeamMember,
} from '../../contracts/phase2';
import {
  ErrorState, LoadingState, PageHeader, StatusBadge, SuccessNotice, inputClass,
  primaryButtonClass, secondaryButtonClass,
} from './common';

const routeResource: Record<SetupRoute, string> = {
  profile: 'profile', address: 'addresses', contacts: 'contacts',
  localization: 'localization', accounting: 'fiscal', modules: 'modules',
  admin: 'administrator', team: 'team', 'chart-of-accounts': 'chart-of-accounts',
  'business-structure': 'business-structure', masters: 'essential-masters',
  notifications: 'notifications', review: 'status',
};

const routeLabel: Record<SetupRoute, string> = {
  profile: 'Company profile', address: 'Address', contacts: 'Contacts',
  localization: 'Language, currency & timezone', accounting: 'Fiscal & accounting',
  modules: 'Modules', admin: 'Company administrator', team: 'Team members',
  'chart-of-accounts': 'Chart of accounts & GL', 'business-structure': 'NOB & LOB configuration',
  masters: 'Essential master data', notifications: 'Notifications', review: 'Review & completion',
};

const blankAddress: Omit<Address, 'addressId'> = {
  addressType: 'REGISTERED', label: 'Registered office', line1: '', line2: '',
  city: '', state: '', country: 'India', postalCode: '', latitude: null,
  longitude: null, isPrimary: true,
};
const blankContact: Omit<Contact, 'contactId'> = {
  contactType: 'OWNER', fullName: '', email: '', phone: '',
  receivesAlerts: true, receivesReports: true, isPrimary: true,
};
const blankTeam: Omit<TeamMember, 'memberId' | 'status'> = {
  fullName: '', email: '', role: 'FARM_MANAGER',
};

export function CompanySetup({ companySlug, step }: { companySlug: string; step: SetupRoute }) {
  const router = useRouter();
  const { session, refreshSession } = useAuth();
  const membership = session?.companies.find((company) => company.companySlug === companySlug);
  const companyId = membership?.companyId;
  const editable = can(session, 'company.manage');
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [profile, setProfile] = useState<SetupProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [address, setAddress] = useState(blankAddress);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contact, setContact] = useState(blankContact);
  const [localization, setLocalization] = useState<Localization | null>(null);
  const [fiscal, setFiscal] = useState<Fiscal | null>(null);
  const [modules, setModules] = useState<ModuleSelection | null>(null);
  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamDraft, setTeamDraft] = useState(blankTeam);
  const [chart, setChart] = useState<ChartOfAccounts | null>(null);
  const [business, setBusiness] = useState<BusinessStructure | null>(null);
  const [masters, setMasters] = useState<EssentialMasters | null>(null);
  const [notifications, setNotifications] = useState<SetupNotifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError('');
    try {
      const [nextStatus, resource] = await Promise.all([
        api.get<SetupStatus>(`/companies/${companyId}/setup/status`),
        api.get<unknown>(`/companies/${companyId}/setup/${routeResource[step]}`),
      ]);
      setStatus(nextStatus);
      if (step === 'profile') setProfile(resource as SetupProfile);
      if (step === 'address') {
        const items = resource as Address[]; setAddresses(items);
        if (items[0]) {
          const { addressId: _addressId, ...value } = items[0];
          setAddress(value);
        }
      }
      if (step === 'contacts') {
        const items = resource as Contact[]; setContacts(items);
        if (items[0]) {
          const { contactId: _contactId, ...value } = items[0];
          setContact(value);
        }
      }
      if (step === 'localization') setLocalization(resource as Localization);
      if (step === 'accounting') setFiscal(resource as Fiscal);
      if (step === 'modules') setModules(resource as ModuleSelection);
      if (step === 'admin') setAdministrator(resource as Administrator);
      if (step === 'team') setTeam(resource as TeamMember[]);
      if (step === 'chart-of-accounts') setChart(resource as ChartOfAccounts);
      if (step === 'business-structure') setBusiness(resource as BusinessStructure);
      if (step === 'masters') setMasters(resource as EssentialMasters);
      if (step === 'notifications') setNotifications(resource as SetupNotifications);
      setDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Setup resource failed to load.');
    } finally {
      setLoading(false);
    }
  }, [companyId, step]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const touch = () => { setDirty(true); setSuccess(''); };
  const reloadStatus = async () => {
    if (!companyId) return;
    setStatus(await api.get<SetupStatus>(`/companies/${companyId}/setup/status`));
  };

  const save = async () => {
    if (!companyId || !editable) return false;
    setSaving(true); setError(''); setSuccess('');
    try {
      const root = `/companies/${companyId}/setup`;
      if (step === 'profile' && profile) setProfile(await api.patch<SetupProfile>(`${root}/profile`, profile));
      if (step === 'address') {
        const saved = addresses[0]
          ? await api.patch<Address>(`${root}/addresses/${addresses[0].addressId}`, address)
          : await api.post<Address>(`${root}/addresses`, address);
        setAddresses([saved, ...addresses.slice(1)]);
      }
      if (step === 'contacts') {
        const saved = contacts[0]
          ? await api.patch<Contact>(`${root}/contacts/${contacts[0].contactId}`, contact)
          : await api.post<Contact>(`${root}/contacts`, contact);
        setContacts([saved, ...contacts.slice(1)]);
      }
      if (step === 'localization' && localization) setLocalization(await api.patch<Localization>(`${root}/localization`, localization));
      if (step === 'accounting' && fiscal) setFiscal(await api.patch<Fiscal>(`${root}/fiscal`, fiscal));
      if (step === 'modules' && modules) setModules(await api.patch<ModuleSelection>(`${root}/modules`, modules));
      if (step === 'admin' && administrator) setAdministrator(await api.patch<Administrator>(`${root}/administrator`, administrator));
      if (step === 'team' && teamDraft.fullName) {
        const created = await api.post<TeamMember>(`${root}/team`, teamDraft);
        setTeam((items) => [...items, created]); setTeamDraft(blankTeam);
      }
      if (step === 'chart-of-accounts' && chart) setChart(await api.patch<ChartOfAccounts>(`${root}/chart-of-accounts`, chart));
      if (step === 'business-structure' && business) setBusiness(await api.patch<BusinessStructure>(`${root}/business-structure`, business));
      if (step === 'masters' && masters) setMasters(await api.patch<EssentialMasters>(`${root}/essential-masters`, masters));
      if (step === 'notifications' && notifications) setNotifications(await api.patch<SetupNotifications>(`${root}/notifications`, notifications));
      await reloadStatus();
      setDirty(false); setSuccess('Progress saved through the setup API.');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Setup changes could not be saved.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const navigate = async (target: SetupRoute | '/console/companies') => {
    if (dirty && !(await save())) return;
    router.push(target === '/console/companies' ? target : `/${companySlug}/setup/${target}`);
  };

  const routeStates = useMemo(() => {
    const result = new Map<string, SetupStatus['steps'][number]['status']>();
    status?.steps.forEach((item) => {
      const current = result.get(item.route);
      if (!current || item.status === 'BLOCKED' || item.status === 'CURRENT' || (item.status === 'PENDING' && current === 'COMPLETED')) result.set(item.route, item.status);
    });
    return result;
  }, [status]);
  const index = SETUP_ROUTES.indexOf(step);
  const next = SETUP_ROUTES[index + 1];
  const previous = SETUP_ROUTES[index - 1];

  if (!companyId) return <ErrorState message="The selected company is not part of your current session." />;
  if (loading || !status) return <LoadingState label={`Loading ${routeLabel[step]}…`} />;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Company setup"
        title={routeLabel[step]}
        description={`${membership?.companyName} · ${status.setupPercentage}% complete · workspace ${status.workspaceReady ? 'ready' : 'blocked'} · operations ${status.operationsReady ? 'ready' : 'blocked'}`}
        actions={<><StatusBadge status={status.setupComplete ? 'COMPLETED' : 'IN_PROGRESS'} />{!editable ? <span className="inline-flex items-center rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"><LockKeyhole className="mr-2 h-4 w-4" />Read only</span> : null}</>}
      />
      <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Company setup completion" aria-valuenow={status.setupPercentage}><div className="h-full rounded-full bg-blue-600" style={{ width: `${status.setupPercentage}%` }} /></div>
      <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <nav aria-label="Company setup steps" className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          <ol className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
            {SETUP_ROUTES.map((route, routeIndex) => {
              const state = routeStates.get(route) ?? 'PENDING';
              const active = route === step;
              return <li key={route}><button onClick={() => void navigate(route)} aria-current={active ? 'step' : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-bold ${active ? 'bg-[#101b52] text-white' : 'text-slate-600 hover:bg-slate-50'}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${state === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : state === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{state === 'COMPLETED' ? <Check className="h-3 w-3" /> : routeIndex + 1}</span><span>{routeLabel[route]}</span>{state === 'BLOCKED' ? <LockKeyhole className="ml-auto h-3 w-3" /> : null}</button></li>;
            })}
          </ol>
        </nav>
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          {success ? <div className="mb-5"><SuccessNotice message={success} /></div> : null}
          {error ? <div className="mb-5"><ErrorState message={error} onRetry={() => void load()} /></div> : null}
          {!editable ? <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Your role can view setup progress but cannot edit it.</p> : null}

          <div className={!editable && step !== 'review' ? 'pointer-events-none opacity-70' : ''} aria-disabled={!editable && step !== 'review'}>
          {step === 'profile' && profile ? <div className="grid gap-4 sm:grid-cols-2"><TextField label="Legal company name" value={profile.companyName} onChange={(companyName) => { setProfile({ ...profile, companyName }); touch(); }} /><TextField label="Display name" value={profile.displayName} onChange={(displayName) => { setProfile({ ...profile, displayName }); touch(); }} /><TextField label="Registration number" value={profile.registrationNumber} onChange={(registrationNumber) => { setProfile({ ...profile, registrationNumber }); touch(); }} /><TextField label="Website" value={profile.website} onChange={(website) => { setProfile({ ...profile, website }); touch(); }} /><label className="text-sm font-semibold">Company type<select disabled={!editable} className={`${inputClass} mt-1`} value={profile.companyType} onChange={(event) => { setProfile({ ...profile, companyType: event.target.value as SetupProfile['companyType'] }); touch(); }}><option>SOLE_PROPRIETORSHIP</option><option>PARTNERSHIP</option><option>PRIVATE_LIMITED</option><option>PUBLIC_LIMITED</option><option>COOPERATIVE</option></select></label><label className="text-sm font-semibold">Brand colour<input disabled={!editable} type="color" className="mt-1 h-11 w-full rounded-lg border border-slate-300 p-1" value={profile.brandColor} onChange={(event) => { setProfile({ ...profile, brandColor: event.target.value }); touch(); }} /></label></div> : null}

          {step === 'address' ? <div className="grid gap-4 sm:grid-cols-2"><TextField label="Address label" value={address.label} onChange={(label) => { setAddress({ ...address, label }); touch(); }} /><TextField label="Address line 1" value={address.line1} onChange={(line1) => { setAddress({ ...address, line1 }); touch(); }} /><TextField label="Address line 2" value={address.line2} onChange={(line2) => { setAddress({ ...address, line2 }); touch(); }} /><TextField label="City" value={address.city} onChange={(city) => { setAddress({ ...address, city }); touch(); }} /><TextField label="State" value={address.state} onChange={(state) => { setAddress({ ...address, state }); touch(); }} /><TextField label="Country" value={address.country} onChange={(country) => { setAddress({ ...address, country }); touch(); }} /><TextField label="Postal code" value={address.postalCode} onChange={(postalCode) => { setAddress({ ...address, postalCode }); touch(); }} /><label className="flex items-center gap-2 self-end py-3 text-sm font-semibold"><input disabled={!editable} type="checkbox" checked={address.isPrimary} onChange={(event) => { setAddress({ ...address, isPrimary: event.target.checked }); touch(); }} />Primary address</label></div> : null}

          {step === 'contacts' ? <div className="grid gap-4 sm:grid-cols-2"><TextField label="Full name" value={contact.fullName} onChange={(fullName) => { setContact({ ...contact, fullName }); touch(); }} /><TextField label="Email" type="email" value={contact.email} onChange={(email) => { setContact({ ...contact, email }); touch(); }} /><TextField label="Phone" value={contact.phone} onChange={(phone) => { setContact({ ...contact, phone }); touch(); }} /><label className="text-sm font-semibold">Contact type<select disabled={!editable} className={`${inputClass} mt-1`} value={contact.contactType} onChange={(event) => { setContact({ ...contact, contactType: event.target.value as Contact['contactType'] }); touch(); }}><option>OWNER</option><option>CEO</option><option>CFO</option><option>FARM_MANAGER</option><option>ACCOUNTANT</option><option>OPERATIONS</option><option>LEGAL</option><option>IT_ADMIN</option><option>OTHER</option></select></label><CheckField label="Receives alerts" checked={contact.receivesAlerts} onChange={(receivesAlerts) => { setContact({ ...contact, receivesAlerts }); touch(); }} /><CheckField label="Receives reports" checked={contact.receivesReports} onChange={(receivesReports) => { setContact({ ...contact, receivesReports }); touch(); }} /></div> : null}

          {step === 'localization' && localization ? <div className="grid gap-4 sm:grid-cols-2"><TextField label="Default language (BCP-47)" value={localization.defaultLanguage} onChange={(defaultLanguage) => { setLocalization({ ...localization, defaultLanguage, enabledLanguages: [defaultLanguage] }); touch(); }} /><label className="text-sm font-semibold">Base currency<select disabled={!editable} className={`${inputClass} mt-1`} value={localization.baseCurrency} onChange={(event) => { setLocalization({ ...localization, baseCurrency: event.target.value }); touch(); }}><option>INR</option><option>USD</option></select></label><label className="text-sm font-semibold">Timezone<select disabled={!editable} className={`${inputClass} mt-1`} value={localization.timezone} onChange={(event) => { setLocalization({ ...localization, timezone: event.target.value }); touch(); }}><option>Asia/Kolkata</option><option>UTC</option><option>America/New_York</option></select></label><TextField label="Country" value={localization.country} onChange={(country) => { setLocalization({ ...localization, country }); touch(); }} /><p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 sm:col-span-2">Base currency cannot change after the first real transaction; this demo has no production transactions.</p></div> : null}

          {step === 'accounting' && fiscal ? <div className="grid gap-4 sm:grid-cols-2"><NumberField label="Fiscal start month" value={fiscal.fiscalStartMonth} min={1} max={12} onChange={(fiscalStartMonth) => { setFiscal({ ...fiscal, fiscalStartMonth }); touch(); }} /><NumberField label="Fiscal start day" value={fiscal.fiscalStartDay} min={1} max={28} onChange={(fiscalStartDay) => { setFiscal({ ...fiscal, fiscalStartDay }); touch(); }} /><TextField label="Fiscal year format" value={fiscal.fiscalYearFormat} onChange={(fiscalYearFormat) => { setFiscal({ ...fiscal, fiscalYearFormat }); touch(); }} /><SelectField label="Accounting standard" value={fiscal.accountingStandard} options={['IND_AS', 'IFRS', 'LOCAL_GAAP']} onChange={(accountingStandard) => { setFiscal({ ...fiscal, accountingStandard: accountingStandard as Fiscal['accountingStandard'] }); touch(); }} /><SelectField label="Inventory valuation" value={fiscal.inventoryValuation} options={['STANDARD', 'FIFO', 'WAVG']} onChange={(inventoryValuation) => { setFiscal({ ...fiscal, inventoryValuation: inventoryValuation as Fiscal['inventoryValuation'] }); touch(); }} /><SelectField label="Period type" value={fiscal.periodType} options={['MONTHLY', 'FOUR_WEEK', 'CUSTOM']} onChange={(periodType) => { setFiscal({ ...fiscal, periodType: periodType as Fiscal['periodType'] }); touch(); }} /></div> : null}

          {step === 'modules' && modules ? <CheckboxGrid values={['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics', 'Resources', 'Scheduling']} selected={modules.enabledModules} onChange={(enabledModules) => { setModules({ enabledModules: enabledModules as ModuleSelection['enabledModules'] }); touch(); }} /> : null}

          {step === 'admin' && administrator ? <div className="grid gap-4 sm:grid-cols-2"><TextField label="Administrator name" value={administrator.fullName} onChange={(fullName) => { setAdministrator({ ...administrator, fullName }); touch(); }} /><TextField label="Administrator email" type="email" value={administrator.email} onChange={(email) => { setAdministrator({ ...administrator, email }); touch(); }} /><TextField label="Language" value={administrator.language} onChange={(language) => { setAdministrator({ ...administrator, language }); touch(); }} /><TextField label="Timezone" value={administrator.timezone} onChange={(timezone) => { setAdministrator({ ...administrator, timezone }); touch(); }} /><CheckField label="Require MFA" checked={administrator.mfaRequired} onChange={(mfaRequired) => { setAdministrator({ ...administrator, mfaRequired }); touch(); }} /></div> : null}

          {step === 'team' ? <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><TextField label="Team member name" value={teamDraft.fullName} onChange={(fullName) => { setTeamDraft({ ...teamDraft, fullName }); touch(); }} /><TextField label="Email" type="email" value={teamDraft.email} onChange={(email) => { setTeamDraft({ ...teamDraft, email }); touch(); }} /><SelectField label="Role" value={teamDraft.role} options={['FARM_MANAGER', 'ACCOUNTANT', 'SUPERVISOR', 'VIEWER']} onChange={(role) => { setTeamDraft({ ...teamDraft, role }); touch(); }} /></div>{team.map((member) => <div key={member.memberId} className="flex justify-between rounded-lg border border-slate-200 p-3 text-sm"><span><strong>{member.fullName}</strong><span className="ml-2 text-slate-500">{member.email}</span></span><StatusBadge status={member.status} /></div>)}</div> : null}

          {step === 'chart-of-accounts' && chart ? <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><CheckField label="Chart of accounts confirmed" checked={chart.confirmed} onChange={(confirmed) => { setChart({ ...chart, confirmed }); touch(); }} /><CheckField label="Required item and entry-type GL mappings ready" checked={chart.glMappingsReady} onChange={(glMappingsReady) => { setChart({ ...chart, glMappingsReady }); touch(); }} /></div><div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Code</th><th className="p-3">Account</th><th className="p-3">Type</th></tr></thead><tbody>{chart.accounts.map((account) => <tr key={account.accountCode} className="border-t border-slate-100"><td className="p-3 font-mono">{account.accountCode}</td><td className="p-3">{account.accountName}</td><td className="p-3">{account.accountType}</td></tr>)}</tbody></table></div></div> : null}

          {step === 'business-structure' && business ? <div className="space-y-5"><p className="text-sm text-slate-600">NOB and LOB options remain configuration-driven. This setup demonstrates one permitted LOB and costing policy.</p><SelectField label="Nature of business" value={business.nobs[0]?.nobCode ?? ''} options={['', 'POULTRY', 'LIVESTOCK', 'AGRICULTURE', 'AQUACULTURE', 'INSECT', 'PROCESSING']} onChange={(nobCode) => { setBusiness({ configured: Boolean(nobCode), nobs: nobCode ? [{ nobCode: nobCode as BusinessStructure['nobs'][number]['nobCode'], nobName: nobCode.replaceAll('_', ' '), lobs: [{ lobCode: 'PRIMARY', lobName: 'Primary Production', costingMethod: 'STANDARD', qcRequired: true, qrRequired: true }] }] : [] }); touch(); }} />{business.nobs[0] ? <div className="grid gap-4 sm:grid-cols-2"><TextField label="Line of business" value={business.nobs[0].lobs[0]?.lobName ?? ''} onChange={(lobName) => { const nob = business.nobs[0]; setBusiness({ configured: true, nobs: [{ ...nob, lobs: [{ ...(nob.lobs[0] ?? { lobCode: 'PRIMARY', costingMethod: 'STANDARD', qcRequired: true, qrRequired: true }), lobName }] }] }); touch(); }} /><SelectField label="Costing method" value={business.nobs[0].lobs[0]?.costingMethod ?? 'STANDARD'} options={['STANDARD', 'FIFO', 'BIO_ASSET', 'WAVG']} onChange={(costingMethod) => { const nob = business.nobs[0]; const lob = nob.lobs[0]; setBusiness({ configured: true, nobs: [{ ...nob, lobs: [{ ...lob, costingMethod: costingMethod as BusinessStructure['nobs'][number]['lobs'][number]['costingMethod'] }] }] }); touch(); }} /></div> : null}</div> : null}

          {step === 'masters' && masters ? <div className="space-y-3"><p className="text-sm text-slate-600">Confirm the minimum master data required for operational batch creation.</p>{([['uomReady', 'Units of measure'], ['itemsReady', 'Items'], ['breedsReady', 'Breeds'], ['locationsReady', 'Locations'], ['resourcesReady', 'Resources']] as const).map(([key, label]) => <CheckField key={key} label={label} checked={masters[key]} onChange={(checked) => { setMasters({ ...masters, [key]: checked }); touch(); }} />)}</div> : null}

          {step === 'notifications' && notifications ? <div className="space-y-3">{([['emailEnabled', 'Email notifications'], ['smsEnabled', 'SMS notifications'], ['pushEnabled', 'Push notifications'], ['kpiAlertsEnabled', 'KPI alerts'], ['scheduledReportsEnabled', 'Scheduled reports']] as const).map(([key, label]) => <CheckField key={key} label={label} checked={notifications[key]} onChange={(checked) => { setNotifications({ ...notifications, [key]: checked }); touch(); }} />)}<p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Delivery providers, credentials, retries, and external integrations are not implemented in this frontend demo.</p></div> : null}
          </div>

          {step === 'review' ? <Review status={status} onComplete={async () => {
            setSaving(true); setError('');
            try {
              const completed = await api.post<SetupStatus>(`/companies/${companyId}/setup/complete`);
              setStatus(completed); await refreshSession(); setSuccess('Company setup completed.');
            } catch (cause) { setError(cause instanceof Error ? cause.message : 'Setup completion failed.'); }
            finally { setSaving(false); }
          }} saving={saving} editable={editable} /> : null}

          {step !== 'review' ? <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" disabled={!previous} onClick={() => previous && void navigate(previous)} className={secondaryButtonClass}><ChevronLeft className="mr-2 h-4 w-4" />Previous</button><div className="flex flex-col gap-2 sm:flex-row"><button type="button" disabled={saving} onClick={() => void navigate('/console/companies')} className={secondaryButtonClass}>Save and exit</button><button type="button" disabled={!editable || saving} onClick={() => void save()} className={secondaryButtonClass}>{saving ? 'Saving…' : 'Save'}</button>{next ? <button type="button" disabled={!editable || saving} onClick={async () => { if (await save()) router.push(`/${companySlug}/setup/${next}`); }} className={primaryButtonClass}>Save and continue<ChevronRight className="ml-2 h-4 w-4" /></button> : null}</div></div> : null}
        </section>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="text-sm font-semibold">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} mt-1`} /></label>;
}
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="text-sm font-semibold">{label}<input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className={`${inputClass} mt-1`} /></label>;
}
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-sm font-semibold">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} mt-1`}>{options.map((option) => <option key={option} value={option}>{option || 'Select…'}</option>)}</select></label>;
}
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 text-sm font-semibold"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}
function CheckboxGrid({ values, selected, onChange }: { values: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  return <fieldset><legend className="text-sm font-bold">Enabled company modules</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{values.map((value) => <label key={value} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-semibold"><input type="checkbox" checked={selected.includes(value)} onChange={(event) => onChange(event.target.checked ? [...selected, value] : selected.filter((item) => item !== value))} />{value}</label>)}</div></fieldset>;
}
function Review({ status, onComplete, saving, editable }: { status: SetupStatus; onComplete: () => Promise<void>; saving: boolean; editable: boolean }) {
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><article className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Setup completion</p><p className="mt-1 text-2xl font-black">{status.setupPercentage}%</p></article><article className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Workspace</p><p className="mt-1 font-black">{status.workspaceReady ? 'Ready' : 'Blocked'}</p></article><article className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Operations</p><p className="mt-1 font-black">{status.operationsReady ? 'Ready' : 'Blocked'}</p></article></div>{status.blockingRequirements.length ? <section><h2 className="font-bold text-red-800">Blocking requirements</h2><div className="mt-2 space-y-2">{status.blockingRequirements.map((item) => <div key={item.code} className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertTriangle className="h-4 w-4" />{item.label}<StatusBadge status={item.kind} /></div>)}</div></section> : null}{status.recommendedRequirements.length ? <section><h2 className="font-bold">Recommended after readiness</h2><ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{status.recommendedRequirements.map((item) => <li key={item.code}>{item.label}</li>)}</ul></section> : null}<button disabled={!editable || saving || !status.workspaceReady || !status.operationsReady || status.setupComplete} onClick={() => void onComplete()} className={primaryButtonClass}>{status.setupComplete ? 'Setup completed' : saving ? 'Completing…' : 'Complete company setup'}</button></div>;
}
