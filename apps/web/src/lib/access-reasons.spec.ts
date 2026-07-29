import type { AuthSession } from '../contracts/api';
import { accessReasonCodes, accessReasonContent, scopeAccessReason } from './access-reasons';

function baseSession(): AuthSession {
  return {
    state: 'AUTHENTICATED',
    user: {
      userId: 'user-1', fullName: 'User', email: 'user@example.com',
      platformRole: null, language: 'en', timezone: 'UTC', emailVerified: true,
      mfaEnabled: false, userType: 'STANDARD_USER', companyId: 'company-1',
      tenantId: 'tenant-1', companies: [], permissions: [],
    },
    tenants: [{
      tenantId: 'tenant-1', tenantName: 'Tenant', status: 'ACTIVE',
      role: 'TENANT_MEMBER', permissions: [],
    }],
    companies: [{
      companyId: 'company-1', tenantId: 'tenant-1', companyName: 'Company',
      companySlug: 'company', status: 'ACTIVE', onboardingStatus: 'COMPLETED',
      role: 'VIEWER', permissions: ['company.view'], enabledModules: [],
    }],
    workspaces: [],
    activeTenantId: 'tenant-1',
    activeCompanyId: 'company-1',
    activeWorkspaceId: null,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe('explicit access reasons', () => {
  it('defines content for every reason code', () => {
    expect(Object.keys(accessReasonContent).sort()).toEqual([...accessReasonCodes].sort());
  });

  it('checks suspension before membership and permissions', () => {
    const session = baseSession();
    session.tenants[0].status = 'SUSPENDED';
    session.activeCompanyId = null;
    session.companies = [];
    expect(scopeAccessReason(session, 'company', 'missing-company')).toBe('account_suspended');
  });

  it('distinguishes inactive companies and insufficient tenant permission', () => {
    const session = baseSession();
    session.companies[0].status = 'INACTIVE';
    expect(scopeAccessReason(session, 'company', 'company')).toBe('company_inactive');
    session.companies[0].status = 'ACTIVE';
    expect(scopeAccessReason(session, 'tenant')).toBe('insufficient_permission');
  });
});
