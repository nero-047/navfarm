import type { AuthSession } from '../contracts/api';
import type { AppScope } from './authorization';

export const accessReasonCodes = [
  'account_suspended',
  'tenant_inactive',
  'company_inactive',
  'workspace_inactive',
  'tenant_not_assigned',
  'company_not_assigned',
  'workspace_not_assigned',
  'company_selection_required',
  'workspace_selection_required',
  'insufficient_permission',
  'onboarding_incomplete',
] as const;

export type AccessReason = (typeof accessReasonCodes)[number];

type AccessAction = 'sign_out' | 'choose_company' | 'back_to_company' | 'manage_workspace_access' | 'continue_onboarding' | 'go_back';

export const accessReasonContent: Record<AccessReason, { heading: string; description: string; actions: AccessAction[] }> = {
  account_suspended: {
    heading: 'Account suspended',
    description: 'Your NAVFarm account has been suspended. You cannot access tenant, company or workspace data at this time. Contact your organisation administrator if you believe this is a mistake.',
    actions: ['sign_out'],
  },
  tenant_inactive: {
    heading: 'Tenant inactive',
    description: 'This tenant is inactive. Tenant, company and workspace data cannot be accessed until it is reactivated.',
    actions: ['sign_out'],
  },
  company_inactive: {
    heading: 'Company inactive',
    description: 'This company is inactive. Choose another active company or contact your organisation administrator.',
    actions: ['choose_company', 'sign_out'],
  },
  workspace_inactive: {
    heading: 'Workspace inactive',
    description: 'This workspace is inactive and cannot accept operational access.',
    actions: ['back_to_company', 'choose_company'],
  },
  tenant_not_assigned: {
    heading: 'Tenant not assigned',
    description: 'Your account is not assigned to this tenant.',
    actions: ['sign_out'],
  },
  company_not_assigned: {
    heading: 'Company not assigned',
    description: 'Your account is not assigned to this company.',
    actions: ['choose_company', 'sign_out'],
  },
  workspace_not_assigned: {
    heading: 'Workspace access not assigned',
    description: 'Your account does not have an operational role in this workspace.',
    actions: ['back_to_company', 'manage_workspace_access'],
  },
  company_selection_required: {
    heading: 'Choose a company',
    description: 'Select a company before continuing.',
    actions: ['choose_company', 'sign_out'],
  },
  workspace_selection_required: {
    heading: 'Choose a workspace',
    description: 'Select one of your assigned workspaces before continuing.',
    actions: ['choose_company', 'sign_out'],
  },
  insufficient_permission: {
    heading: 'Permission required',
    description: 'Your current role does not include permission to access this area.',
    actions: ['go_back', 'sign_out'],
  },
  onboarding_incomplete: {
    heading: 'Company setup incomplete',
    description: 'Complete company onboarding before opening operational workspace data.',
    actions: ['continue_onboarding', 'sign_out'],
  },
};

export function scopeAccessReason(
  session: AuthSession,
  scope: AppScope,
  companySlug?: string,
  workspaceSlug?: string,
): AccessReason | null {
  const activeTenant = session.tenants.find((tenant) => tenant.tenantId === session.activeTenantId);
  if (activeTenant?.status === 'SUSPENDED' || session.tenants.some((tenant) => tenant.status === 'SUSPENDED')) {
    return 'account_suspended';
  }
  if (scope === 'platform') {
    return session.user.platformRole === 'SYSTEM_ADMIN' &&
      session.user.permissions.includes('platform.manage')
      ? null
      : 'insufficient_permission';
  }
  if (!session.activeTenantId) return session.tenants.length ? 'company_selection_required' : 'tenant_not_assigned';
  if (!activeTenant) return 'tenant_not_assigned';
  if (activeTenant.status !== 'ACTIVE') return 'tenant_inactive';
  if (scope === 'tenant') {
    return activeTenant.permissions.includes('tenant.view') ? null : 'insufficient_permission';
  }

  const company = companySlug
    ? session.companies.find((item) => item.companySlug === companySlug)
    : session.companies.find((item) => item.companyId === session.activeCompanyId);
  if (!company) return 'company_not_assigned';
  if (company.status !== 'ACTIVE') return 'company_inactive';
  if (
    company.tenantId !== session.activeTenantId ||
    company.companyId !== session.activeCompanyId
  ) {
    return 'company_selection_required';
  }
  if (!company.permissions.includes('company.view')) return 'insufficient_permission';
  if (scope !== 'workspace') return null;

  const workspace = workspaceSlug
    ? session.workspaces.find(
      (item) =>
        item.companyId === company.companyId &&
        item.workspaceSlug === workspaceSlug,
    )
    : session.workspaces.find((item) => item.workspaceId === session.activeWorkspaceId);
  if (!workspace) return 'workspace_not_assigned';
  if (workspace.status !== 'ACTIVE') return 'workspace_inactive';
  if (workspace.workspaceId !== session.activeWorkspaceId) return 'workspace_selection_required';
  if (!workspace.permissions.includes('workspaces.view')) return 'insufficient_permission';
  if (company.onboardingStatus !== 'COMPLETED') return 'onboarding_incomplete';
  return null;
}
