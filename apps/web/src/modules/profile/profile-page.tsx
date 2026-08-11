'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Surface } from '@/components/ui/primitives';
import { useCompanyContext } from '@/modules/company';

export function ProfilePage() {
  const { user } = useAuth();
  const { company } = useCompanyContext();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile & preferences"
        description="Your identity, company context and personal application preferences."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Surface className="p-6">
          <h2 className="text-xl font-semibold text-(--text-primary)">
            Account identity
          </h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {[
              ['Name', user?.name],
              ['Email', user?.email],
              ['Account type', user?.userType],
              ['Current company', company?.name],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[13px] text-(--text-muted)">{label}</dt>
                <dd className="mt-1 text-[15px] font-medium text-(--text-primary)">
                  {value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </Surface>
        <Surface className="p-6">
          <h2 className="text-lg font-semibold text-(--text-primary)">
            Company preferences
          </h2>
          <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
            Language, timezone and notification policy are governed by company
            setup and your assigned permissions.
          </p>
          <Link
            href={`/${company?.slug}/settings/localization`}
            className="mt-5 inline-flex text-sm font-semibold text-(--accent)"
          >
            Review preferences
          </Link>
        </Surface>
      </div>
    </div>
  );
}
