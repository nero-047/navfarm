/** @jest-environment node */
import {
  handlePhase2Request,
  resetPhase2Repository,
  type Phase2Actor,
} from './phase2-repository';

const tenantAdmin: Phase2Actor = {
  userId: 'user-tenant', fullName: 'Tenant Administrator',
  platformRole: null, activeTenantId: 'tenant-demo', activeCompanyId: 'company-green-valley',
  tenantAdmin: true, companyView: true, companyManage: true,
};

async function call(actor: Phase2Actor, method: string, path: string, input?: unknown) {
  const response = await handlePhase2Request(
    new Request(`http://localhost/api/v1${path}`, {
      method,
      headers: input ? { 'content-type': 'application/json' } : undefined,
      body: input ? JSON.stringify(input) : undefined,
    }),
    path,
    'phase2-tenant-test',
    actor,
  );
  if (!response) throw new Error(`No handler for ${method} ${path}`);
  return { response, payload: await response.json() };
}

describe('Phase 2 tenant administration', () => {
  beforeEach(() => resetPhase2Repository());

  it('returns tenant dashboard readiness and limit warnings', async () => {
    const { response, payload } = await call(tenantAdmin, 'GET', '/tenants/tenant-demo/dashboard');
    expect(response.status).toBe(200);
    expect(payload.companies).toHaveLength(3);
    expect(payload.limitWarnings.some((warning: { resource: string }) => warning.resource === 'Users')).toBe(true);
  });

  it('enforces company and user limits in the mock service', async () => {
    const limited = { ...tenantAdmin, activeTenantId: 'tenant-near-limit' };
    const company = await call(limited, 'POST', '/tenants/tenant-near-limit/companies', {
      code: 'EXTRA_COMPANY', name: 'Extra Company', type: 'COOPERATIVE',
    });
    expect(company.response.status).toBe(409);
    expect(company.payload.error.details.resource).toBe('companies');
    const invitation = await call(limited, 'POST', '/tenants/tenant-near-limit/invitations', {
      email: 'new@sunrise.demo', fullName: 'New User', tenantRole: 'TENANT_MEMBER', companyMemberships: [],
    });
    expect(invitation.response.status).toBe(409);
    expect(invitation.payload.error.details.resource).toBe('users');
  });

  it('supports invitation creation, resend, and revocation', async () => {
    const created = await call(tenantAdmin, 'POST', '/tenants/tenant-demo/invitations', {
      email: 'new.member@greenvalley.demo', fullName: 'New Member',
      tenantRole: 'TENANT_MEMBER', companyMemberships: ['company-green-valley'],
    });
    expect(created.response.status).toBe(201);
    const invitationId = created.payload.invitationId;
    const resent = await call(tenantAdmin, 'POST', `/tenants/tenant-demo/invitations/${invitationId}/resend`);
    expect(resent.payload.status).toBe('PENDING');
    const revoked = await call(tenantAdmin, 'DELETE', `/tenants/tenant-demo/invitations/${invitationId}`);
    expect(revoked.payload.status).toBe('REVOKED');
  });

  it('denies suspended and permission-restricted tenant access', async () => {
    const suspended = await call(
      { ...tenantAdmin, activeTenantId: 'tenant-suspended' },
      'GET',
      '/tenants/tenant-suspended/dashboard',
    );
    expect(suspended.response.status).toBe(403);
    const restricted = await call(
      { ...tenantAdmin, tenantAdmin: false },
      'GET',
      '/tenants/tenant-demo/dashboard',
    );
    expect(restricted.response.status).toBe(403);
  });
});
