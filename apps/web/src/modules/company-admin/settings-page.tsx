'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Blocks,
  Building2,
  ChevronRight,
  Globe2,
  Landmark,
  LockKeyhole,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {
  type CompanySettings,
  type CompanySettingsMutation,
} from '../../contracts/company-admin';
import {
  ErrorState,
  LoadingState,
  PageHeader,
  SuccessNotice,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/phase2/common';
import { companyAdminClient } from './client';
import {
  CompanyAdminBadge,
  DemoDataNotice,
  useCompanyAdminScope,
  useUnsavedChanges,
} from './shared';

export const companySettingsSections = [
  'overview',
  'localization',
  'fiscal',
  'modules',
  'notifications',
] as const;
export type CompanySettingsSection = (typeof companySettingsSections)[number];

const navigation = [
  ['overview', 'Settings overview', SlidersHorizontal],
  ['localization', 'Localisation & region', Globe2],
  ['fiscal', 'Fiscal configuration', Landmark],
  ['modules', 'Enabled modules', Blocks],
  ['notifications', 'Notifications', Bell],
] as const;

export function CompanySettingsPage({
  section = 'overview',
}: {
  section?: CompanySettingsSection;
}) {
  const {
    companyId,
    companyName,
    companySlug,
    canManageCompany,
  } = useCompanyAdminScope();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useUnsavedChanges(dirty);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError('');
    try {
      setSettings(await companyAdminClient.getSettings(companyId));
      setDirty(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Company settings could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  function update(next: CompanySettings) {
    setSettings(next);
    setDirty(true);
    setSuccess('');
  }

  async function save() {
    if (!companyId || !settings || !canManageCompany || section === 'overview') {
      return;
    }
    const payload: CompanySettingsMutation =
      section === 'localization'
        ? { localization: settings.localization }
        : section === 'fiscal'
          ? { fiscal: settings.fiscal }
          : section === 'modules'
            ? { modules: settings.modules }
            : { notifications: settings.notifications };
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      setSettings(await companyAdminClient.updateSettings(companyId, payload));
      setDirty(false);
      setSuccess(`${sectionLabel(section)} saved in the mock demo.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Company settings could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!companyId) {
    return (
      <ErrorState message="This company is not available in the active session." />
    );
  }
  if (loading) return <LoadingState label="Loading company settings…" />;
  if (error && !settings) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }
  if (!settings) {
    return (
      <ErrorState
        message="No company settings resource is configured."
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Company administration"
        title="Company settings"
        description={`${companyName} · Company-wide configuration that remains independent of operational workspace state.`}
        actions={
          !canManageCompany ? (
            <span className="inline-flex min-h-10 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-900">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Read only
            </span>
          ) : section !== 'overview' ? (
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={() => void save()}
                className={primaryButtonClass}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
          ) : null
        }
      />
      <DemoDataNotice />
      {success ? <SuccessNotice message={success} /> : null}
      {error ? <ErrorState message={error} /> : null}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav
          aria-label="Company settings sections"
          className="flex min-w-0 gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 lg:flex-col lg:overflow-visible"
        >
          {navigation.map(([slug, label, Icon]) => (
            <Link
              key={slug}
              href={slug === 'overview'
                ? `/${companySlug}/settings`
                : `/${companySlug}/settings/${slug}`}
              aria-current={section === slug ? 'page' : undefined}
              onClick={(event) => {
                if (
                  dirty &&
                  !window.confirm('Leave without saving these settings?')
                ) {
                  event.preventDefault();
                }
              }}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 lg:w-full ${
                section === slug
                  ? 'bg-[#101b52] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {section === 'overview' ? (
            <SettingsOverview
              companySlug={companySlug}
              settings={settings}
              canManageCompany={canManageCompany}
            />
          ) : null}
          {section === 'localization' ? (
            <LocalizationSettings
              settings={settings}
              disabled={!canManageCompany || saving}
              update={update}
            />
          ) : null}
          {section === 'fiscal' ? (
            <FiscalSettings
              settings={settings}
              disabled={!canManageCompany || saving}
              update={update}
              companySlug={companySlug}
            />
          ) : null}
          {section === 'modules' ? (
            <ModuleSettings
              settings={settings}
              disabled={!canManageCompany || saving}
              update={update}
            />
          ) : null}
          {section === 'notifications' ? (
            <NotificationSettings
              settings={settings}
              disabled={!canManageCompany || saving}
              update={update}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function SettingsOverview({
  companySlug,
  settings,
  canManageCompany,
}: {
  companySlug: string;
  settings: CompanySettings;
  canManageCompany: boolean;
}) {
  const cards = [
    {
      title: 'Company profile',
      description: settings.profile.displayName,
      href: `/${companySlug}/profile`,
      icon: Building2,
    },
    {
      title: 'Business structure',
      description: 'Company-owned NOB and LOB configuration',
      href: `/${companySlug}/settings/business-structure`,
      icon: Blocks,
    },
    {
      title: 'Accounting configuration',
      description: `${settings.fiscal.accountingStandard.replaceAll('_', ' ')} · ${settings.fiscal.inventoryValuation}`,
      href: `/${companySlug}/accounting/readiness`,
      icon: Landmark,
    },
    {
      title: 'Members & security',
      description: 'Company roles and explicit workspace assignments',
      href: `/${companySlug}/members`,
      icon: ShieldCheck,
    },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Company configuration
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Review setup progress and open the company-owned configuration areas.
          </p>
        </div>
        <CompanyAdminBadge
          value={settings.setupStatus.setupComplete ? 'READY' : 'IN_PROGRESS'}
        />
      </div>
      {!canManageCompany ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your company role can inspect these settings but cannot change them.
        </p>
      ) : null}
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-bold text-slate-800">Company setup progress</span>
          <strong>{settings.setupStatus.setupPercentage}%</strong>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="Company setup progress"
          aria-valuenow={settings.setupStatus.setupPercentage}
        >
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${settings.setupStatus.setupPercentage}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CompanyAdminBadge
            value={settings.setupStatus.workspaceReady ? 'READY' : 'ACTION_NEEDED'}
          />
          <span className="text-xs text-slate-500">Workspace foundation</span>
          <CompanyAdminBadge
            value={settings.setupStatus.operationsReady ? 'READY' : 'ACTION_NEEDED'}
          />
          <span className="text-xs text-slate-500">Operations foundation</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex min-h-28 items-start gap-4 rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-700">
              <card.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="text-sm text-slate-950">{card.title}</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-600">
                {card.description}
              </span>
            </span>
            <ChevronRight className="mt-2 h-4 w-4 text-slate-400 group-hover:text-blue-700" />
          </Link>
        ))}
      </div>
      <Link href={`/${companySlug}/setup`} className={secondaryButtonClass}>
        Open guided company setup
      </Link>
    </div>
  );
}

function LocalizationSettings({
  settings,
  disabled,
  update,
}: SettingsEditorProps) {
  const value = settings.localization;
  const set = <K extends keyof typeof value>(
    key: K,
    next: (typeof value)[K],
  ) => update({
    ...settings,
    localization: { ...value, [key]: next },
  });
  return (
    <SettingsSection
      title="Localisation & regional settings"
      description="Company defaults for language, currency, country and timezone."
    >
      <fieldset disabled={disabled} className="grid gap-5 sm:grid-cols-2">
        <TextField label="Default language" value={value.defaultLanguage} onChange={(next) => set('defaultLanguage', next)} />
        <TextField label="Enabled languages" value={value.enabledLanguages.join(', ')} onChange={(next) => set('enabledLanguages', list(next))} />
        <TextField label="Base currency" value={value.baseCurrency} maxLength={3} onChange={(next) => set('baseCurrency', next.toUpperCase())} />
        <TextField label="Reporting currencies" value={value.reportingCurrencies.join(', ')} onChange={(next) => set('reportingCurrencies', list(next).map((item) => item.toUpperCase()))} />
        <TextField label="Timezone" value={value.timezone} onChange={(next) => set('timezone', next)} />
        <TextField label="Country" value={value.country} onChange={(next) => set('country', next)} />
      </fieldset>
    </SettingsSection>
  );
}

function FiscalSettings({
  settings,
  disabled,
  update,
  companySlug,
}: SettingsEditorProps & { companySlug: string }) {
  const value = settings.fiscal;
  const set = <K extends keyof typeof value>(
    key: K,
    next: (typeof value)[K],
  ) => update({ ...settings, fiscal: { ...value, [key]: next } });
  return (
    <SettingsSection
      title="Fiscal configuration"
      description="Company fiscal calendar and documented inventory valuation defaults."
    >
      <fieldset disabled={disabled} className="grid gap-5 sm:grid-cols-2">
        <NumberField label="Fiscal start month" value={value.fiscalStartMonth} min={1} max={12} onChange={(next) => set('fiscalStartMonth', next)} />
        <NumberField label="Fiscal start day" value={value.fiscalStartDay} min={1} max={28} onChange={(next) => set('fiscalStartDay', next)} />
        <TextField label="Fiscal year format" value={value.fiscalYearFormat} onChange={(next) => set('fiscalYearFormat', next)} />
        <SelectField label="Accounting standard" value={value.accountingStandard} options={['IND_AS', 'IFRS', 'LOCAL_GAAP']} onChange={(next) => set('accountingStandard', next as typeof value.accountingStandard)} />
        <SelectField label="Inventory valuation" value={value.inventoryValuation} options={['STANDARD', 'FIFO', 'WAVG']} onChange={(next) => set('inventoryValuation', next as typeof value.inventoryValuation)} />
        <SelectField label="Period type" value={value.periodType} options={['MONTHLY', 'FOUR_WEEK', 'CUSTOM']} onChange={(next) => set('periodType', next as typeof value.periodType)} />
      </fieldset>
      <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
        Costing and GL readiness are maintained on the dedicated accounting page.
        This form does not classify unresolved accounting policy as an operational blocker.
      </p>
      <Link
        className={`${secondaryButtonClass} mt-4`}
        href={`/${companySlug}/accounting/readiness`}
      >
        Open accounting readiness
      </Link>
    </SettingsSection>
  );
}

function ModuleSettings({
  settings,
  disabled,
  update,
}: SettingsEditorProps) {
  const options = [
    'Batches',
    'Inventory',
    'QC',
    'QR',
    'Finance',
    'Analytics',
    'Resources',
    'Scheduling',
  ] as const;
  return (
    <SettingsSection
      title="Enabled company modules"
      description="Company-level module availability configured during onboarding."
    >
      <fieldset disabled={disabled}>
        <legend className="sr-only">Enabled company modules</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option}
              className="flex min-h-14 items-center justify-between rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800"
            >
              {option}
              <input
                type="checkbox"
                checked={settings.modules.enabledModules.includes(option)}
                onChange={(event) => {
                  const current = settings.modules.enabledModules;
                  const enabledModules = event.target.checked
                    ? [...current, option]
                    : current.filter((item) => item !== option);
                  update({
                    ...settings,
                    modules: { enabledModules },
                  });
                }}
              />
            </label>
          ))}
        </div>
      </fieldset>
    </SettingsSection>
  );
}

function NotificationSettings({
  settings,
  disabled,
  update,
}: SettingsEditorProps) {
  const options = [
    ['emailEnabled', 'Email notifications'],
    ['smsEnabled', 'SMS notifications'],
    ['pushEnabled', 'Push notifications'],
    ['kpiAlertsEnabled', 'KPI alerts'],
    ['scheduledReportsEnabled', 'Scheduled reports'],
  ] as const;
  return (
    <SettingsSection
      title="Company notifications"
      description="Documented notification preferences. Delivery integrations are not connected."
    >
      <fieldset disabled={disabled} className="space-y-3">
        {options.map(([key, label]) => (
          <label
            key={key}
            className="flex min-h-14 items-center justify-between rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800"
          >
            {label}
            <input
              type="checkbox"
              checked={settings.notifications[key]}
              onChange={(event) =>
                update({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    [key]: event.target.checked,
                  },
                })
              }
            />
          </label>
        ))}
      </fieldset>
      <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
        Frontend contract ready · Provider credentials, delivery, retries and
        durable preferences require backend implementation.
      </p>
    </SettingsSection>
  );
}

type SettingsEditorProps = {
  settings: CompanySettings;
  disabled: boolean;
  update: (settings: CompanySettings) => void;
};

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mb-6 mt-1 text-sm text-slate-600">{description}</p>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="text-sm font-semibold text-slate-800">
      {label}
      <input
        className={`${inputClass} mt-1`}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-800">
      {label}
      <input
        type="number"
        className={`${inputClass} mt-1`}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-800">
      {label}
      <select
        className={`${inputClass} mt-1`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function list(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function sectionLabel(section: CompanySettingsSection) {
  return navigation.find(([slug]) => slug === section)?.[1] ?? 'Settings';
}
