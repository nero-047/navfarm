import type { AuthSession, CompanyRole, Permission } from '../contracts/api';

export type AppScope = 'platform' | 'tenant' | 'company';

const ALL_COMPANY_PERMISSIONS: Permission[] = [
  'company.view', 'company.manage', 'users.view', 'users.manage', 'roles.view',
  'roles.manage', 'batches.view', 'batches.create', 'batches.approve',
  'operations.create', 'costs.view', 'finance.view', 'finance.manage',
  'quality.view', 'quality.manage', 'traceability.view', 'resources.view',
  'resources.manage', 'reports.export', 'audit.view', 'notifications.manage',
];

export const ROLE_PERMISSIONS: Record<CompanyRole, Permission[]> = {
  SUPER_ADMIN: ALL_COMPANY_PERMISSIONS,
  ADMIN: ALL_COMPANY_PERMISSIONS,
  FARM_MANAGER: [
    'company.view', 'batches.view', 'batches.create', 'batches.approve',
    'operations.create', 'costs.view', 'quality.view', 'quality.manage',
    'traceability.view', 'resources.view', 'resources.manage', 'reports.export',
  ],
  ACCOUNTANT: [
    'company.view', 'batches.view', 'costs.view', 'finance.view',
    'finance.manage', 'reports.export', 'audit.view',
  ],
  AUDITOR: [
    'company.view', 'batches.view', 'costs.view', 'finance.view',
    'quality.view', 'traceability.view', 'resources.view', 'reports.export',
    'audit.view',
  ],
  SUPERVISOR: [
    'company.view', 'batches.view', 'batches.create', 'operations.create',
    'quality.view', 'traceability.view', 'resources.view',
  ],
  VIEWER: ['company.view', 'batches.view', 'quality.view', 'traceability.view', 'resources.view'],
  CUSTOM: [],
};

export function activeCompanyMembership(session: AuthSession | null) {
  return session?.companies.find((company) => company.companyId === session.activeCompanyId) ?? null;
}

export function grantedPermissions(session: AuthSession | null): Set<Permission> {
  if (!session) return new Set();
  if (session.user.platformRole === 'SYSTEM_ADMIN') {
    return new Set(['platform.manage', 'tenant.view', 'tenant.manage', ...ALL_COMPANY_PERMISSIONS]);
  }
  const tenant = session.tenants.find((item) => item.tenantId === session.activeTenantId);
  const company = activeCompanyMembership(session);
  const values: Permission[] = [];
  if (tenant?.role === 'TENANT_ADMIN') {
    values.push('tenant.view', 'tenant.manage', 'company.view', 'company.manage', 'users.view', 'users.manage', 'roles.view', 'roles.manage', 'audit.view', 'notifications.manage');
  }
  if (company) values.push(...ROLE_PERMISSIONS[company.role], ...company.permissions);
  return new Set(values);
}

export function can(session: AuthSession | null, permission: Permission): boolean {
  return grantedPermissions(session).has(permission);
}

export function canAccessScope(session: AuthSession | null, scope: AppScope): boolean {
  if (!session) return false;
  if (scope === 'platform') return session.user.platformRole === 'SYSTEM_ADMIN';
  if (scope === 'tenant') {
    return session.tenants.some((tenant) => tenant.status === 'ACTIVE') && can(session, 'tenant.view');
  }
  const company = activeCompanyMembership(session);
  return Boolean(company && company.status === 'ACTIVE' && can(session, 'company.view'));
}

export function destinationForSession(session: AuthSession): string {
  if (session.mfaRequired) return '/mfa/verify';
  if (session.user.platformRole === 'SYSTEM_ADMIN') return '/admin/dashboard';
  const activeTenant = session.tenants.find((tenant) => tenant.tenantId === session.activeTenantId);
  if (activeTenant?.status === 'SUSPENDED') return '/access-denied?reason=suspended-tenant';
  if (session.tenants.length > 1 && !session.activeTenantId) return '/context-selection';
  const activeCompany = activeCompanyMembership(session);
  if (!activeCompany && session.companies.length > 1) return '/context-selection';
  if (!activeCompany) return can(session, 'tenant.view') ? '/console/dashboard' : '/access-denied?reason=no-company';
  // Tenant administrators begin in the tenant console. They can still choose a
  // company context, but operational permissions remain company-role based.
  if (activeTenant?.role === 'TENANT_ADMIN') return '/console/dashboard';
  if (activeCompany.status === 'INACTIVE') return '/access-denied?reason=inactive-company';
  if (activeCompany.onboardingStatus !== 'COMPLETED') return '/onboarding';
  return `/${activeCompany.companySlug}/dashboard`;
}

export interface NavigationRule {
  href: string;
  permission?: Permission;
  module?: string;
}

export function filterNavigation<T extends NavigationRule>(
  items: T[],
  session: AuthSession | null,
): T[] {
  const company = activeCompanyMembership(session);
  return items.filter(
    (item) =>
      (!item.permission || can(session, item.permission)) &&
      (!item.module || company?.enabledModules.includes(item.module)),
  );
}
