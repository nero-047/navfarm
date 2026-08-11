'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Building2, CheckCircle2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ManagementShell } from '@/components/layouts/management-shell';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import { fetchTenantCompanies, type CompanyMeta } from '@/modules/company';

interface TenantDetails {
  tenant_id: string;
  tenant_code: string;
  tenant_name: string;
  tenant_type: string;
  plan_id: string;
  max_companies: number;
  max_users: number;
  billing_email: string;
  subscription?: { plan_code?: string; support_tier?: string };
}
interface UserRow {
  userId?: string;
  user_id?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  userType?: string;
  user_type?: string;
  is_active?: boolean;
}

export function OrganizationPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [companies, setCompanies] = useState<CompanyMeta[]>([]);
  const [members, setMembers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user?.tenantId) return;
    Promise.all([
      api.get<TenantDetails>(`/tenant/${user.tenantId}`),
      fetchTenantCompanies(user.tenantId),
      api.get<UserRow[]>('/auth/users'),
    ])
      .then(([tenantDetails, companyRows, userRows]) => {
        setTenant(tenantDetails);
        setCompanies(companyRows);
        setMembers(userRows);
      })
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : 'Could not load organization',
        ),
      );
  }, [user?.tenantId]);
  const metrics: Array<[string, string | number, LucideIcon, string]> = [
    [
      'Companies',
      companies.length,
      Building2,
      tenant
        ? `${companies.length} of ${tenant.max_companies} plan limit`
        : 'Loading plan',
    ],
    [
      'Users',
      members.length,
      Users,
      tenant
        ? `${members.length} of ${tenant.max_users} plan limit`
        : 'Loading plan',
    ],
    [
      'Setup ready',
      companies.filter((item) => item.setupProgress === 100).length,
      CheckCircle2,
      'Operational companies',
    ],
    [
      'API status',
      tenant ? 'Connected' : 'Loading',
      BarChart3,
      'Tenant-scoped services',
    ],
  ];
  return (
    <ManagementShell
      title="Organization"
      eyebrow={tenant?.tenant_name || 'Tenant workspace'}
    >
      <p className="mt-2 text-sm text-(--text-secondary)">
        Manage companies, members and plan capacity with tenant-scoped data.
      </p>
      {error && (
        <p className="mt-4 rounded-[var(--radius-sm)] bg-red-500/10 px-4 py-3 text-sm text-(--danger)">
          {error}
        </p>
      )}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, detail]) => (
          <div
            key={label}
            className="rounded-[var(--radius-md)] border border-(--border) bg-(--surface) p-5"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-[13px] text-(--text-secondary)">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-(--text-primary)">
                  {value}
                </p>
              </div>
              <Icon size={19} className="text-(--accent)" />
            </div>
            <p className="mt-3 text-xs text-(--text-muted)">{detail}</p>
          </div>
        ))}
      </div>
      <section className="mt-6 overflow-hidden rounded-[var(--radius-md)] border border-(--border) bg-(--surface)">
        <header className="border-b border-(--border-subtle) px-6 py-4">
          <h2 className="font-semibold text-(--text-primary)">
            Company portfolio
          </h2>
        </header>
        <div className="divide-y divide-(--border-subtle)">
          {companies.length === 0 && (
            <p className="px-6 py-8 text-sm text-(--text-secondary)">
              No operating companies yet.
            </p>
          )}
          {companies.map((company) => (
            <div
              key={company.slug}
              className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_160px_140px_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-(--text-primary)">
                  {company.name}
                </p>
                <p className="mt-1 text-xs text-(--text-secondary)">
                  {company.location}
                </p>
              </div>
              <span className="text-xs text-(--text-secondary)">
                {company.nobName}
              </span>
              <span className="text-xs text-(--text-secondary)">
                Setup {company.setupProgress}%
              </span>
              <Link
                href={`/${company.slug}/dashboard`}
                className="text-xs font-semibold text-(--accent)"
              >
                Open workspace
              </Link>
            </div>
          ))}
        </div>
      </section>
    </ManagementShell>
  );
}
