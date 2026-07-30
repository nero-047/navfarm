import type { AuthSession, CompanyRole, Permission } from '../contracts/api';
import { workspaceModuleEnabled } from './workspace-presentation';

export type AppScope = 'platform' | 'tenant' | 'company' | 'workspace';

const ALL_COMPANY_PERMISSIONS: Permission[] = [
  'company.view', 'company.manage', 'users.view', 'users.manage', 'roles.view',
  'roles.manage', 'workspaces.view', 'workspaces.manage', 'costs.view',
  'finance.view', 'finance.manage', 'masters.view', 'masters.manage',
  'audit.view', 'notifications.manage',
];

export const ROLE_PERMISSIONS: Record<CompanyRole, Permission[]> = {
  SUPER_ADMIN: ALL_COMPANY_PERMISSIONS,
  ADMIN: ALL_COMPANY_PERMISSIONS,
  FARM_MANAGER: [
    'company.view',
  ],
  ACCOUNTANT: [
    'company.view', 'masters.view', 'costs.view', 'finance.view', 'finance.manage',
    'audit.view',
  ],
  AUDITOR: [
    'company.view', 'masters.view', 'costs.view', 'finance.view', 'audit.view',
  ],
  SUPERVISOR: [
    'company.view',
  ],
  VIEWER: ['company.view'],
  CUSTOM: [],
};

const WORKSPACE_OPERATIONAL_PERMISSIONS = new Set<Permission>([
  'batches.view', 'batches.create', 'batches.approve', 'batches.close',
  'operations.create', 'costs.view', 'quality.view', 'quality.manage',
  'traceability.view', 'traceability.manage', 'resources.view', 'resources.manage', 'reports.export',
]);

export function activeCompanyMembership(session: AuthSession | null) {
  return session?.companies.find((company) => company.companyId === session.activeCompanyId) ?? null;
}

export function activeWorkspaceMembership(session: AuthSession | null) {
  return session?.workspaces?.find((workspace) => workspace.workspaceId === session.activeWorkspaceId) ?? null;
}

export const capabilities = (session: AuthSession | null) => {
  const permissions = grantedPermissions(session);
  const workspace = activeWorkspaceMembership(session);
  const workspacePermissions = new Set(workspace?.permissions ?? []);
  return {
    canManageTenant: permissions.has('tenant.manage'),
    canManageCompanies: permissions.has('company.manage'),
    canConfigureCompany: permissions.has('company.manage'),
    canManageCompanyMasters: permissions.has('company.manage'),
    canConfigureAccounting: permissions.has('finance.manage'),
    canManageWorkspaces: permissions.has('workspaces.manage'),
    canViewWorkspace: Boolean(workspace && workspace.status === 'ACTIVE'),
    canCreateOperations: workspacePermissions.has('operations.create'),
    canManageQuality: workspacePermissions.has('quality.manage'),
    canManageTraceability: workspacePermissions.has('traceability.manage'),
    canManageResources: workspacePermissions.has('resources.manage'),
    canCloseBatch: workspacePermissions.has('batches.close'),
    canViewReports: workspacePermissions.has('reports.export'),
  };
};

export function grantedPermissions(session: AuthSession | null): Set<Permission> {
  if (!session) return new Set();
  const tenant = session.tenants.find((item) => item.tenantId === session.activeTenantId);
  const company = activeCompanyMembership(session);
  const values: Permission[] = [...session.user.permissions];
  if (tenant) values.push(...tenant.permissions);
  if (company && company.membershipStatus !== 'INACTIVE') {
    values.push(...company.permissions);
  }
  return new Set(values);
}

export function can(session: AuthSession | null, permission: Permission): boolean {
  if (WORKSPACE_OPERATIONAL_PERMISSIONS.has(permission)) {
    const workspace = activeWorkspaceMembership(session);
    return Boolean(workspace?.status === 'ACTIVE' && workspace.permissions.includes(permission));
  }
  return grantedPermissions(session).has(permission);
}

export function canAccessScope(session: AuthSession | null, scope: AppScope): boolean {
  if (!session) return false;
  if (scope === 'platform') return session.user.platformRole === 'SYSTEM_ADMIN';
  if (scope === 'tenant') {
    return session.tenants.some((tenant) => tenant.status === 'ACTIVE') && can(session, 'tenant.view');
  }
  const company = activeCompanyMembership(session);
  return Boolean(
    company &&
    company.status === 'ACTIVE' &&
    company.membershipStatus !== 'INACTIVE' &&
    can(session, 'company.view'),
  );
}

export function destinationForSession(session: AuthSession): string {
  if (session.user.platformRole === 'SYSTEM_ADMIN') return '/admin/dashboard';
  const activeTenant = session.tenants.find((tenant) => tenant.tenantId === session.activeTenantId);
  if (activeTenant?.status === 'SUSPENDED' || session.tenants.some((tenant) => tenant.status === 'SUSPENDED')) {
    return '/access-denied?reason=account_suspended';
  }
  if (!session.activeTenantId) return session.tenants.length ? '/context-selection' : '/access-denied?reason=tenant_not_assigned';
  const activeCompany = activeCompanyMembership(session);
  if (!activeCompany && session.companies.length) return '/context-selection';
  if (!activeCompany) return can(session, 'tenant.view') ? '/console/dashboard' : '/access-denied?reason=company_not_assigned';
  // Tenant administrators begin in the tenant console. They can still choose a
  // company context, but operational permissions remain company-role based.
  if (activeTenant?.permissions.includes('tenant.manage')) return '/console/dashboard';
  if (activeCompany.status === 'INACTIVE') return '/access-denied?reason=company_inactive';
  const assignedWorkspaces = session.workspaces.filter((workspace) => workspace.companyId === activeCompany.companyId);
  const workspaces = assignedWorkspaces.filter((workspace) => workspace.status === 'ACTIVE');
  const activeWorkspace = activeWorkspaceMembership(session);
  if (activeCompany.onboardingStatus !== 'COMPLETED') return '/onboarding';
  if (activeWorkspace?.status === 'ACTIVE') {
    return `/${activeCompany.companySlug}/workspaces/${activeWorkspace.workspaceSlug}/dashboard`;
  }
  if (activeCompany.permissions.includes('finance.manage') && activeCompany.role === 'ACCOUNTANT') {
    return `/${activeCompany.companySlug}/accounting/readiness`;
  }
  if (activeCompany.permissions.includes('company.manage') || activeCompany.permissions.includes('audit.view')) {
    return `/${activeCompany.companySlug}/overview`;
  }
  if (!assignedWorkspaces.length) return `/${activeCompany.companySlug}/workspaces`;
  if (!workspaces.length) return `/${activeCompany.companySlug}/workspaces`;
  return `/${activeCompany.companySlug}/workspaces`;
}

const COMPANY_SETUP_STEPS = new Set([
  'profile', 'address', 'contacts', 'localization', 'accounting', 'modules',
  'admin', 'team', 'chart-of-accounts', 'business-structure', 'masters',
  'notifications', 'review',
]);
const COMPANY_SETTINGS_SECTIONS = new Set([
  'localization', 'fiscal', 'modules', 'notifications', 'business-structure',
]);
const WORKSPACE_SECTIONS: Record<
  string,
  { permission: Permission; module?: string }
> = {
  dashboard: { permission: 'workspaces.view' },
  batches: { permission: 'batches.view', module: 'Batches' },
  operations: { permission: 'workspaces.view', module: 'Batches' },
  quality: { permission: 'quality.view', module: 'QC' },
  traceability: { permission: 'traceability.view', module: 'QR' },
  resources: { permission: 'resources.view', module: 'Resources' },
  costing: { permission: 'costs.view', module: 'Finance' },
  reports: { permission: 'reports.export', module: 'Analytics' },
  masters: { permission: 'workspaces.view' },
  settings: { permission: 'workspaces.view' },
};

function normalizeReturnTo(candidate: string | null | undefined): URL | null {
  if (
    !candidate ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  ) {
    return null;
  }
  try {
    const parsed = new URL(candidate, 'https://navfarm.demo');
    if (parsed.origin !== 'https://navfarm.demo') return null;
    if (parsed.searchParams.has('returnTo')) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Resolves a protected return destination only when the newly authenticated
 * session already owns the complete route scope. Record-detail and
 * compatibility URLs are intentionally excluded from cross-session reuse.
 */
export function authorizedReturnTo(
  session: AuthSession,
  candidate: string | null | undefined,
): string | null {
  if (session.state !== 'AUTHENTICATED') return null;
  const parsed = normalizeReturnTo(candidate);
  if (!parsed) return null;
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  const segments = pathname.split('/').filter(Boolean);

  if (pathname === '/profile' || pathname === '/context-selection') {
    return pathname;
  }

  if (segments[0] === 'admin') {
    if (!canAccessScope(session, 'platform')) return null;
    const allowed = new Set([
      '/admin/dashboard',
      '/admin/tenants',
      '/admin/tenants/new',
      '/admin/plans',
      '/admin/masters',
      '/admin/masters/nobs',
      '/admin/masters/lobs',
      '/admin/masters/modules',
      '/admin/masters/reference-data',
      '/admin/audit',
    ]);
    return allowed.has(pathname) ? pathname : null;
  }

  if (segments[0] === 'console') {
    if (!canAccessScope(session, 'tenant')) return null;
    const allowed = new Set([
      '/console/dashboard',
      '/console/profile',
      '/console/companies',
      '/console/companies/new',
      '/console/users',
      '/console/invitations',
      '/console/roles',
      '/console/subscription',
      '/console/usage',
      '/console/audit',
      '/console/notifications',
    ]);
    return allowed.has(pathname) ? pathname : null;
  }

  const company = session.companies.find(
    (membership) =>
      membership.companySlug === segments[0] &&
      membership.companyId === session.activeCompanyId &&
      membership.tenantId === session.activeTenantId &&
      membership.status === 'ACTIVE' &&
      membership.membershipStatus !== 'INACTIVE',
  );
  if (!company || !segments[1]) return null;

  const companyRoot = `/${company.companySlug}`;
  const section = segments[1];
  if (section === 'overview' && segments.length === 2 && can(session, 'company.view')) {
    return pathname;
  }
  if (section === 'profile' && segments.length === 2 && can(session, 'company.view')) {
    return pathname;
  }
  if (
    section === 'setup' &&
    (segments.length === 2 ||
      (segments.length === 3 && COMPANY_SETUP_STEPS.has(segments[2]))) &&
    can(session, 'company.view')
  ) {
    return pathname;
  }
  if (
    section === 'settings' &&
    (segments.length === 2 ||
      (segments.length === 3 && COMPANY_SETTINGS_SECTIONS.has(segments[2]))) &&
    can(session, 'company.view')
  ) {
    const search = segments[2] === 'business-structure' &&
      ['nobs', 'lobs'].includes(parsed.searchParams.get('section') ?? '')
      ? `?section=${parsed.searchParams.get('section')}`
      : '';
    return `${pathname}${search}`;
  }
  if (section === 'masters' && segments.length === 2 && can(session, 'masters.view')) {
    return pathname;
  }
  if (section === 'members' && segments.length === 2 && can(session, 'users.view')) {
    return pathname;
  }
  if (section === 'roles' && segments.length === 2 && can(session, 'roles.view')) {
    return pathname;
  }
  if (section === 'readiness' && segments.length === 2 && can(session, 'company.view')) {
    return pathname;
  }
  if (section === 'accounting' && can(session, 'finance.view')) {
    const accountingPage = segments.slice(2).join('/');
    if (
      ['readiness', 'chart-of-accounts', 'gl-mappings', 'costing'].includes(
        accountingPage,
      )
    ) {
      return pathname;
    }
    return null;
  }
  if (section !== 'workspaces') return null;
  if (segments.length === 2 && can(session, 'workspaces.view')) return pathname;
  if (
    segments.length === 3 &&
    segments[2] === 'new' &&
    can(session, 'workspaces.manage')
  ) {
    return pathname;
  }
  if (segments.length !== 4) return null;

  const workspace = session.workspaces.find(
    (membership) =>
      membership.workspaceSlug === segments[2] &&
      membership.workspaceId === session.activeWorkspaceId &&
      membership.companyId === company.companyId &&
      membership.tenantId === company.tenantId &&
      membership.status === 'ACTIVE',
  );
  const routeRule = WORKSPACE_SECTIONS[segments[3]];
  if (
    !workspace ||
    !routeRule ||
    !workspace.permissions.includes(routeRule.permission) ||
    (routeRule.module && !workspaceModuleEnabled(workspace, routeRule.module))
  ) {
    return null;
  }
  return `${companyRoot}/workspaces/${workspace.workspaceSlug}/${segments[3]}`;
}

export interface NavigationRule {
  href: string;
  permission?: Permission;
  workspacePermission?: Permission;
  module?: string;
}

export function filterNavigation<T extends NavigationRule>(
  items: T[],
  session: AuthSession | null,
): T[] {
  const workspace = activeWorkspaceMembership(session);
  return items.filter(
    (item) =>
      (!item.permission || can(session, item.permission)) &&
      (!item.workspacePermission || Boolean(workspace?.permissions.includes(item.workspacePermission))) &&
      (!item.module || Boolean(workspace && workspaceModuleEnabled(workspace, item.module))),
  );
}
