'use client';

import Link from 'next/link';
import {
  Bell,
  Building2,
  ChevronRight,
  Coins,
  Database,
  Languages,
  LayoutGrid,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Surface,
} from '@/components/ui/primitives';
import { useCompanyContext } from '@/modules/company';
import {
  useApiResource,
  type DataRow,
} from '@/modules/workspace/use-api-resource';

const sections: Array<{
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  console: string;
}> = [
  {
    slug: 'company',
    title: 'Company profile',
    description: 'Legal identity, address, contacts and brand assets.',
    icon: Building2,
    console: '/console/companies',
  },
  {
    slug: 'localization',
    title: 'Language & region',
    description: 'Language, currency, timezone and number formats.',
    icon: Languages,
    console: '/console/companies',
  },
  {
    slug: 'fiscal',
    title: 'Fiscal & costing',
    description: 'Fiscal year, accounting standard and inventory valuation.',
    icon: Coins,
    console: '/console/finance',
  },
  {
    slug: 'modules',
    title: 'NOB & LOB modules',
    description: 'Enabled business domains and production configuration.',
    icon: LayoutGrid,
    console: '/console/companies',
  },
  {
    slug: 'users',
    title: 'Users & roles',
    description: 'Company membership, roles and authorization scopes.',
    icon: Users,
    console: '/console/users',
  },
  {
    slug: 'notifications',
    title: 'Notifications',
    description: 'KPI alert delivery and recipient configuration.',
    icon: Bell,
    console: '/console/notifications',
  },
  {
    slug: 'mappings',
    title: 'GL & item mappings',
    description: 'Posting rules that drive automatic double-entry journals.',
    icon: ShieldCheck,
    console: '/console/finance',
  },
  {
    slug: 'master-data',
    title: 'Master data',
    description: 'Items, UOM, breeds, locations, warehouses and resources.',
    icon: Database,
    console: '/console/master-data',
  },
];

export function SettingsPage({ section = 'setup' }: { section?: string }) {
  const { company } = useCompanyContext();
  const status = useApiResource<DataRow[]>(
    company?.id && section === 'setup'
      ? `/setup/wizard/status/${encodeURIComponent(company.id)}`
      : null,
  );
  const selected = sections.find((item) => item.slug === section);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title={
          section === 'setup'
            ? 'Company settings'
            : (selected?.title ?? 'Settings')
        }
        description={
          section === 'setup'
            ? 'Configure the company foundation, operational modules, authorization and posting rules.'
            : selected?.description
        }
      />
      {section === 'setup' ? (
        <>
          {status.loading ? (
            <LoadingState label="Loading setup status" />
          ) : status.error ? (
            <Surface>
              <ErrorState message={status.error} onRetry={status.reload} />
            </Surface>
          ) : (
            <Surface className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-(--text-primary)">
                    Onboarding status
                  </h2>
                  <p className="mt-1 text-sm text-(--text-secondary)">
                    The functional design defines 15 setup steps. Steps 1–9 form
                    the mandatory foundation.
                  </p>
                </div>
                <Badge
                  tone={
                    (company?.setupProgress ?? 0) === 100
                      ? 'success'
                      : 'warning'
                  }
                >
                  {company?.setupProgress ?? 0}% complete
                </Badge>
              </div>
              {status.data?.length ? (
                <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {status.data.map((step, index) => (
                    <div
                      key={String(step.step_id || step.step_no || index)}
                      className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-(--border-subtle) px-3.5 py-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--surface-raised) text-xs font-semibold text-(--text-secondary)">
                        {String(step.step_no || index + 1)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-(--text-primary)">
                        {String(
                          step.step_name ||
                            step.name ||
                            `Setup step ${index + 1}`,
                        )}
                      </span>
                      <Badge
                        tone={
                          step.status === 'COMPLETED' || step.is_completed
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {step.status === 'COMPLETED' || step.is_completed
                          ? 'Done'
                          : 'Open'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    title="Setup status is not available"
                    description="Open company management to continue the production onboarding workflow."
                  />
                </div>
              )}
            </Surface>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((item) => (
              <Link
                key={item.slug}
                href={`/${company?.slug}/settings/${item.slug}`}
                className="group flex min-h-36 items-start gap-4 rounded-[var(--radius-md)] border border-(--border) bg-(--surface) p-5 hover:border-(--accent)"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-(--accent-muted) text-(--accent)">
                  <item.icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-(--text-primary)">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-(--text-secondary)">
                    {item.description}
                  </span>
                </span>
                <ChevronRight
                  size={17}
                  className="mt-1 text-(--text-muted) group-hover:text-(--accent)"
                />
              </Link>
            ))}
          </div>
        </>
      ) : selected ? (
        <Surface className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-(--accent-muted) text-(--accent)">
              <selected.icon size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-(--text-primary)">
                {selected.title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-(--text-secondary)">
                {selected.description} Changes are saved through the
                tenant-scoped production console and remain subject to role
                permissions.
              </p>
              <Link
                href={selected.console}
                className="mt-5 inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-(--accent) px-4 text-sm font-semibold text-white hover:bg-(--accent-hover)"
              >
                Open management console
              </Link>
            </div>
          </div>
        </Surface>
      ) : (
        <Surface>
          <EmptyState
            title="Settings section not found"
            description="Choose a valid company settings area."
          />
        </Surface>
      )}
    </div>
  );
}
