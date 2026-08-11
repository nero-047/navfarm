'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  ShieldAlert,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../../services/api-client';
import {
  getStoredUser,
  getStoredToken,
  getStoredTenantId,
  getActiveCompanyId,
  NavUser,
} from '../../../hooks/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tenantPlanInfo, setTenantPlanInfo] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const tenantId = getStoredTenantId();
    if (!token || !storedUser || !tenantId) {
      router.replace('/');
      return;
    }
    setUser(storedUser);
    loadDashboard(storedUser, tenantId);
  }, [router]);

  const loadDashboard = async (storedUser: NavUser, tenantId: string) => {
    setLoading(true);
    try {
      const [tenant, companiesList, usersList] = await Promise.all([
        api.get(`/tenant/${tenantId}`),
        api.get(`/company/tenant/${tenantId}`),
        api.get('/auth/users').catch(() => []),
      ]);
      setTenantPlanInfo(tenant);

      // Use the active company from localStorage (reflects company switch)
      const activeId =
        getActiveCompanyId() ||
        storedUser.companyId ||
        (storedUser as any).company_id;

      let filteredCompanies = companiesList;
      if (storedUser.userType !== 'TENANT_ADMIN') {
        // For non-tenant-admins show only the currently active company
        filteredCompanies = companiesList.filter(
          (c: any) => c.company_id === activeId,
        );
        // Fallback: show all if filter returns nothing (e.g. first load)
        if (filteredCompanies.length === 0) filteredCompanies = companiesList;
      }
      setCompanies(filteredCompanies);
      setUsers(usersList);

      // Active company = the one matching the switched/active ID
      const assigned =
        companiesList.find((c: any) => c.company_id === activeId) ||
        filteredCompanies[0] ||
        null;
      setActiveCompany(assigned);
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw
          className="animate-spin w-5 h-5 mr-2"
          style={{ color: 'var(--accent)' }}
        />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Loading dashboard…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  const userPercent = Math.min(
    100,
    (users.length / (tenantPlanInfo?.max_users || 5)) * 100,
  );
  const compPercent = Math.min(
    100,
    (companies.length / (tenantPlanInfo?.max_companies || 1)) * 100,
  );
  const isTenantAdmin = user?.userType === 'TENANT_ADMIN';

  const quickActions = [
    {
      label: 'Companies',
      description: 'Manage company setup & settings',
      href: '/console/companies',
      icon: Building2,
      color: '#2563EB',
    },
    {
      label: 'Team Management',
      description: 'Invite and manage users',
      href: '/console/users',
      icon: Users,
      color: '#16A34A',
    },
    {
      label: 'Role Permissions',
      description: 'Configure RBAC policies',
      href: '/console/roles',
      icon: ShieldAlert,
      color: '#7C3AED',
    },
  ];

  const statCard = (
    label: string,
    icon: React.ElementType,
    main: React.ReactNode,
    sub: React.ReactNode,
    bar?: { pct: number; color: string },
  ) => (
    <div
      className="rounded-[var(--radius-sm)] p-5 border"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        {React.createElement(icon, {
          className: 'w-4 h-4',
          style: { color: 'var(--accent)' },
        })}
      </div>
      <div
        className="text-xl font-black"
        style={{ color: 'var(--text-primary)' }}
      >
        {main}
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {sub}
      </div>
      {bar && (
        <div className="mt-3">
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--border)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${bar.pct}%`, backgroundColor: bar.color }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {isTenantAdmin ? 'Operational Dashboard' : 'Company Dashboard'}
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Welcome back,{' '}
            <span
              className="font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {user?.fullName}
            </span>
          </p>
        </div>
        <span
          className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-[var(--radius-sm)] border"
          style={{
            backgroundColor: 'var(--accent-muted)',
            color: 'var(--accent)',
            borderColor: 'var(--accent)',
          }}
        >
          {user?.userType?.replace('_', ' ')}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Company */}
        <div
          className="rounded-[var(--radius-sm)] p-5 border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Active Company
            </span>
            <Building2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div
            className="text-base font-bold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {activeCompany?.company_name || '—'}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {activeCompany?.onboarding_status === 'COMPLETED' ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">
                  Setup Complete
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">
                  Setup Pending
                </span>
              </>
            )}
          </div>
        </div>

        {statCard(
          'Companies',
          Building2,
          <span className="text-3xl font-black">{companies.length}</span>,
          `of ${tenantPlanInfo?.max_companies || 1} limit · ${compPercent.toFixed(0)}%`,
          { pct: compPercent, color: 'var(--accent)' },
        )}

        {statCard(
          'Team Members',
          Users,
          <span className="text-3xl font-black">{users.length}</span>,
          `of ${tenantPlanInfo?.max_users || 5} seats · ${userPercent.toFixed(0)}%`,
          { pct: userPercent, color: '#16A34A' },
        )}

        {statCard(
          'Subscription',
          TrendingUp,
          tenantPlanInfo?.plan_id?.replace('PLAN_', '') || '—',
          `${tenantPlanInfo?.billing_cycle || 'Monthly'} · ${tenantPlanInfo?.db_name || '—'}`,
        )}
      </div>

      {/* Active Company Card */}
      {activeCompany && (
        <div
          className="rounded-[var(--radius-sm)] border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Active Company Details
            </h2>
            <Link
              href="/console/companies"
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              <Settings className="w-3.5 h-3.5" /> Manage
            </Link>
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 divide-x"
            style={{ borderColor: 'var(--border)' }}
          >
            {[
              {
                label: 'Company Name',
                value: activeCompany.company_name || '—',
              },
              {
                label: 'Registration No.',
                value: activeCompany.registration_no || '—',
              },
              { label: 'Country', value: activeCompany.country_id || '—' },
              {
                label: 'Onboarding',
                value: activeCompany.onboarding_status || '—',
              },
            ].map((row) => (
              <div
                key={row.label}
                className="px-5 py-4 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {row.label}
                </div>
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2
          className="text-xs font-bold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-[var(--radius-sm)] p-5 border flex items-start gap-4 transition-all hover:shadow-md"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="p-2.5 rounded-[var(--radius-sm)] shrink-0"
                style={{ backgroundColor: 'var(--accent-muted)' }}
              >
                <action.icon
                  className="w-5 h-5"
                  style={{ color: action.color }}
                />
              </div>
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {action.label}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {action.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
