'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, LockKeyhole, Save } from 'lucide-react';
import { setupProfileSchema, type SetupProfile } from '../../contracts/phase2';
import {
  EmptyState,
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
  DemoDataNotice,
  useCompanyAdminScope,
  useUnsavedChanges,
} from './shared';

export function CompanyProfilePage() {
  const {
    companyId,
    companyName,
    companySlug,
    canManageCompany,
  } = useCompanyAdminScope();
  const [profile, setProfile] = useState<SetupProfile | null>(null);
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
      setProfile(await companyAdminClient.getProfile(companyId));
      setDirty(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Company profile could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!companyId || !profile || !canManageCompany) return;
    const parsed = setupProfileSchema.safeParse(profile);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ??
          'Review the company profile fields.',
      );
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      setProfile(await companyAdminClient.updateProfile(companyId, parsed.data));
      setDirty(false);
      setSuccess('Company profile saved in the mock demo.');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Company profile could not be saved.',
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
  if (loading) return <LoadingState label="Loading company profile…" />;
  if (error && !profile) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }
  if (!profile) {
    return (
      <EmptyState
        title="No company profile is configured"
        description="Start company setup to create the legal profile."
        action={
          <Link
            className={primaryButtonClass}
            href={`/${companySlug}/setup/profile`}
          >
            Open company setup
          </Link>
        }
      />
    );
  }

  const set = <K extends keyof SetupProfile>(
    key: K,
    value: SetupProfile[K],
  ) => {
    setProfile((current) => current ? { ...current, [key]: value } : current);
    setDirty(true);
    setSuccess('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        eyebrow="Company administration"
        title="Company profile"
        description={`${companyName} · Legal identity and company-facing presentation fields.`}
        actions={
          canManageCompany ? (
            <button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || saving}
              className={primaryButtonClass}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-900">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Read only
            </span>
          )
        }
      />
      <DemoDataNotice />
      {success ? <SuccessNotice message={success} /> : null}
      {error ? <ErrorState message={error} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-start gap-4 border-b border-slate-100 pb-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-black text-slate-950">Legal identity</h2>
            <p className="mt-1 text-sm text-slate-600">
              These fields follow the documented company onboarding contract.
            </p>
          </div>
        </div>
        <fieldset
          disabled={!canManageCompany || saving}
          className="grid gap-5 sm:grid-cols-2"
        >
          <TextInput
            label="Legal company name"
            value={profile.companyName}
            onChange={(value) => set('companyName', value)}
          />
          <TextInput
            label="Display name"
            value={profile.displayName}
            onChange={(value) => set('displayName', value)}
          />
          <label className="text-sm font-semibold text-slate-800">
            Company type
            <select
              className={`${inputClass} mt-1`}
              value={profile.companyType}
              onChange={(event) =>
                set(
                  'companyType',
                  event.target.value as SetupProfile['companyType'],
                )
              }
            >
              <option value="SOLE_PROPRIETORSHIP">Sole proprietorship</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="PRIVATE_LIMITED">Private limited</option>
              <option value="PUBLIC_LIMITED">Public limited</option>
              <option value="COOPERATIVE">Cooperative</option>
            </select>
          </label>
          <TextInput
            label="Registration number"
            value={profile.registrationNumber}
            onChange={(value) => set('registrationNumber', value)}
          />
          <TextInput
            label="Website"
            type="url"
            value={profile.website}
            onChange={(value) => set('website', value)}
          />
          <label className="text-sm font-semibold text-slate-800">
            Brand colour
            <div className="mt-1 flex gap-2">
              <input
                aria-label="Brand colour picker"
                type="color"
                className="h-11 w-14 rounded-lg border border-slate-300 bg-white p-1"
                value={profile.brandColor}
                onChange={(event) => set('brandColor', event.target.value)}
              />
              <input
                aria-label="Brand colour hex value"
                className={inputClass}
                value={profile.brandColor}
                onChange={(event) => set('brandColor', event.target.value)}
              />
            </div>
          </label>
        </fieldset>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <Link
            href={`/${companySlug}/setup/profile`}
            className={secondaryButtonClass}
            onClick={(event) => {
              if (
                dirty &&
                !window.confirm('Leave without saving the profile changes?')
              ) {
                event.preventDefault();
              }
            }}
          >
            Open guided setup
          </Link>
          <Link
            href={`/${companySlug}/settings`}
            className={secondaryButtonClass}
            onClick={(event) => {
              if (
                dirty &&
                !window.confirm('Leave without saving the profile changes?')
              ) {
                event.preventDefault();
              }
            }}
          >
            Company settings
          </Link>
        </div>
      </section>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-sm font-semibold text-slate-800">
      {label}
      <input
        type={type}
        className={`${inputClass} mt-1`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
