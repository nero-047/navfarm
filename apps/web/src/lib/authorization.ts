import type { AuthSession, CompanyRole, Permission } from '../contracts/api';
import { workspaceModuleEnabled } from './workspace-presentation';

export type AppScope = 'platform' | 'tenant' | 'company' | 'workspace';

const ALL_COMPANY_PERMISSIONS: Permission[] = [
  'company.view', 'company.manage', 'users.view', 'users.manage', 'roles.view',
  'roles.manage', 'workspaces.view', 'workspaces.manage', 'costs.view',
  'finance.view', 'finance.manage', 'audit.view', 'notifications.manage',
];

export const ROLE_PERMISSIONS: Record<CompanyRole, Permission[]> = {
  SUPER_ADMIN: ALL_COMPANY_PERMISSIONS,
  ADMIN: ALL_COMPANY_PERMISSIONS,
  FARM_MANAGER: [
    'company.view',
  ],
  ACCOUNTANT: [
    'company.view', 'costs.view', 'finance.view', 'finance.manage', 'audit.view',
  ],
  AUDITOR: [
    'company.view', 'costs.view', 'finance.view', 'audit.view',
  ],
  SUPERVISOR: [
    'company.view',
  ],
  VIEWER: ['company.view'],
  CUSTOM: [],
};

const WORKSPACE_OPERATIONAL_PERMISSIONS = new Set<Permission>([
  'workspaces.view', 'batches.view', 'batches.create', 'batches.approve', 'batches.close',
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
  if (company) values.push(...company.permissions);
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
  return Boolean(company && company.status === 'ACTIVE' && can(session, 'company.view'));
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
