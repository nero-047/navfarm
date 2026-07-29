/** @jest-environment node */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { handleMockRequest, mockFixtures } from './mock-repository';

describe('mock HTTP-only session authentication', () => {
  it('logs in with a cookie and never exposes tokens', async () => {
    const response = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'manager@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-login');
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(payload.access_token).toBeUndefined();
    expect(payload.activeCompanyId).toBe('company-green-valley');
    expect(payload.activeWorkspaceId).toBe('workspace-green-poultry');
    expect(payload.workspaces).toHaveLength(1);
  });

  it('MFA completion returns complete workspace context', async () => {
    const challenge = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'mfa@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-mfa');
    const pending = await challenge.json();
    expect(challenge.headers.get('set-cookie')).toBeNull();
    expect(pending.state).toBe('MFA_PENDING');
    const verified = await handleMockRequest(new Request('http://localhost/api/v1/auth/mfa/verify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ challengeId: pending.challengeId, code: '123456' }),
    }), '/auth/mfa/verify', 'request-mfa-verify');
    const session = await verified.json();
    expect(session.state).toBe('AUTHENTICATED');
    expect(session.activeTenantId).toBeNull();
    expect(session.activeCompanyId).toBeNull();
    expect(session.activeWorkspaceId).toBeNull();
    expect(session.workspaces[0].companyId).toBe('company-green-valley');
  });

  it('rejects invalid credentials', async () => {
    const response = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'manager@navfarm.demo', password: 'wrong' }),
    }), '/auth/login', 'request-failure');
    expect(response.status).toBe(401);
  });

  it('loads and logs out the current cookie session', async () => {
    const login = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'viewer@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-session');
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const loaded = await handleMockRequest(new Request('http://localhost/api/v1/auth/session', {
      headers: { cookie },
    }), '/auth/session', 'request-load');
    expect(loaded.status).toBe(200);
    const logout = await handleMockRequest(new Request('http://localhost/api/v1/auth/logout', {
      method: 'POST', headers: { cookie },
    }), '/auth/logout', 'request-logout');
    expect(logout.status).toBe(200);
    expect(logout.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('validates the full tenant, company, and workspace tuple before mutation', async () => {
    const login = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'multi@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-context-login');
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const update = async (value: Record<string, unknown>, requestId: string) => {
      const response = await handleMockRequest(new Request('http://localhost/api/v1/auth/context', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify(value),
      }), '/auth/context', requestId);
      return { response, payload: await response.json() };
    };

    const crossTenant = await update({
      tenantId: 'tenant-second',
      companyId: 'company-green-valley',
      workspaceId: null,
    }, 'request-cross-tenant');
    expect(crossTenant.response.status).toBe(403);
    expect(crossTenant.payload.error.code).toBe('COMPANY_NOT_IN_TENANT');

    const crossCompanyWorkspace = await update({
      tenantId: 'tenant-demo',
      companyId: 'company-harvest-ridge',
      workspaceId: 'workspace-green-poultry',
    }, 'request-cross-company-workspace');
    expect(crossCompanyWorkspace.response.status).toBe(403);
    expect(crossCompanyWorkspace.payload.error.code).toBe('WORKSPACE_NOT_IN_COMPANY');

    const inactiveCompany = await update({
      tenantId: 'tenant-demo',
      companyId: 'company-inactive',
      workspaceId: null,
    }, 'request-inactive-company');
    expect(inactiveCompany.response.status).toBe(403);
    expect(inactiveCompany.payload.error.code).toBe('COMPANY_INACTIVE');

    const valid = await update({
      tenantId: 'tenant-demo',
      companyId: 'company-green-valley',
      workspaceId: 'workspace-green-feed',
    }, 'request-valid-context');
    expect(valid.response.status).toBe(200);
    expect([
      valid.payload.activeTenantId,
      valid.payload.activeCompanyId,
      valid.payload.activeWorkspaceId,
    ]).toEqual(['tenant-demo', 'company-green-valley', 'workspace-green-feed']);
  });

  it('requires explicit company and workspace membership', async () => {
    const login = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'manager@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-membership-login');
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const call = async (value: Record<string, unknown>, requestId: string) => {
      const response = await handleMockRequest(new Request('http://localhost/api/v1/auth/context', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify(value),
      }), '/auth/context', requestId);
      return { response, payload: await response.json() };
    };

    const company = await call({
      tenantId: 'tenant-demo',
      companyId: 'company-harvest-ridge',
      workspaceId: null,
    }, 'request-company-membership');
    expect(company.payload.error.code).toBe('COMPANY_MEMBERSHIP_REQUIRED');

    const workspace = await call({
      tenantId: 'tenant-demo',
      companyId: 'company-green-valley',
      workspaceId: 'workspace-green-feed',
    }, 'request-workspace-membership');
    expect(workspace.payload.error.code).toBe('WORKSPACE_MEMBERSHIP_REQUIRED');
  });

  it('blocks protected data for a suspended session', async () => {
    const login = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'suspended@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-suspended-login');
    const payload = await login.json();
    expect(payload.state).toBe('SUSPENDED');
    expect(payload.companies).toEqual([]);
    expect(payload.workspaces).toEqual([]);
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const protectedResponse = await handleMockRequest(new Request('http://localhost/api/v1/tenant', {
      headers: { cookie },
    }), '/tenant', 'request-suspended-protected');
    expect(protectedResponse.status).toBe(403);
    await expect(protectedResponse.json()).resolves.toMatchObject({
      error: { code: 'ACCOUNT_SUSPENDED' },
    });
  });

  it('does not let company administration or Viewer membership authorize operational writes', async () => {
    const login = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'multi@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-escalation-login');
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const context = await handleMockRequest(new Request('http://localhost/api/v1/auth/context', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({
        tenantId: 'tenant-demo',
        companyId: 'company-green-valley',
        workspaceId: 'workspace-green-feed',
      }),
    }), '/auth/context', 'request-escalation-context');
    expect(context.status).toBe(200);

    const mutation = await handleMockRequest(new Request(
      'http://localhost/api/v1/tenants/tenant-demo/companies/company-green-valley/workspaces/workspace-green-feed/batches',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({}),
      },
    ), '/tenants/tenant-demo/companies/company-green-valley/workspaces/workspace-green-feed/batches', 'request-escalation-mutation');
    expect(mutation.status).toBe(403);
    await expect(mutation.json()).resolves.toMatchObject({
      error: {
        code: 'CAPABILITY_REQUIRED',
        details: { requiredCapability: 'batches.create' },
      },
    });
  });

  it('declares every demo identity and all memberships explicitly', () => {
    for (const identity of mockFixtures.fixtureUsers) {
      expect(identity.authenticationState).toMatch(/AUTHENTICATED|MFA_REQUIRED|SUSPENDED/);
      expect(typeof identity.mfaEnabled).toBe('boolean');
      expect(typeof identity.suspended).toBe('boolean');
      expect(Array.isArray(identity.tenantMemberships)).toBe(true);
      expect(Array.isArray(identity.companies)).toBe(true);
      expect(Array.isArray(identity.workspaces)).toBe(true);
      expect(Array.isArray(identity.allowedCapabilities)).toBe(true);
      expect(identity.initialContext).toHaveProperty('tenantId');
      expect(identity.initialContext).toHaveProperty('companyId');
      expect(identity.initialContext).toHaveProperty('workspaceId');
      expect(identity.expectedLandingRoute.startsWith('/')).toBe(true);
      identity.tenantMemberships.forEach((membership) => {
        expect(Array.isArray(membership.permissions)).toBe(true);
      });
      identity.companies.forEach((membership) => {
        expect(Array.isArray(membership.permissions)).toBe(true);
      });
      identity.workspaces.forEach((membership) => {
        expect(Array.isArray(membership.permissions)).toBe(true);
      });
    }
    expect(mockFixtures.fixtureUsers.find(
      (identity) => identity.email === 'accountant@navfarm.demo',
    )?.workspaces).toEqual([]);
    expect(mockFixtures.fixtureUsers.find(
      (identity) => identity.email === 'auditor@navfarm.demo',
    )?.workspaces).toEqual([]);
  });

  it('returns exactly the declared workspace memberships without email-derived fallback', async () => {
    for (const identity of mockFixtures.fixtureUsers) {
      const login = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: identity.email, password: identity.password }),
      }), '/auth/login', `request-explicit-${identity.userId}`);
      let payload = await login.json();

      if (payload.state === 'MFA_PENDING') {
        const verified = await handleMockRequest(new Request('http://localhost/api/v1/auth/mfa/verify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ challengeId: payload.challengeId, code: '123456' }),
        }), '/auth/mfa/verify', `request-explicit-mfa-${identity.userId}`);
        payload = await verified.json();
      }

      expect(payload.workspaces.map(
        (workspace: { workspaceId: string }) => workspace.workspaceId,
      )).toEqual(identity.workspaces.map((workspace) => workspace.workspaceId));
    }
  });
});
