/** @jest-environment node */
import {
  handlePhase2Request,
  resetPhase2Repository,
  type Phase2Actor,
} from './phase2-repository';

const actor: Phase2Actor = {
  userId: 'user-system',
  fullName: 'System Administrator',
  platformRole: 'SYSTEM_ADMIN',
  activeTenantId: null,
  activeCompanyId: null,
  tenantAdmin: false,
  companyManage: false,
};

async function call(method: string, path: string, input?: unknown) {
  const pathname = new URL(`http://localhost${path}`).pathname;
  const response = await handlePhase2Request(
    new Request(`http://localhost/api/v1${path}`, {
      method,
      headers: input ? { 'content-type': 'application/json' } : undefined,
      body: input ? JSON.stringify(input) : undefined,
    }),
    pathname,
    'phase2-test',
    actor,
  );
  if (!response) throw new Error(`No handler for ${method} ${path}`);
  return { response, payload: await response.json() };
}

describe('Phase 2 platform tenant administration', () => {
  beforeEach(() => resetPhase2Repository());

  it('supports tenant search, filtering, and pagination', async () => {
    const { response, payload } = await call('GET', '/platform/tenants?search=green&page=1&pageSize=1');
    expect(response.status).toBe(200);
    expect(payload.total).toBe(1);
    expect(payload.items[0].code).toBe('GREEN_VALLEY');
  });

  it('creates a tenant and rejects a duplicate tenant code', async () => {
    const request = {
      code: 'NEW_TENANT', name: 'New Tenant', type: 'SME', planId: 'PLAN_STARTER',
      billingEmail: 'billing@new.demo', billingCurrency: 'INR', billingCycle: 'ANNUAL',
      subscriptionStart: '2026-07-24', subscriptionEnd: null,
      limits: { companies: 1, users: 8, batchesPerMonth: 50, apiRequestsPerMinute: 60, storageGb: 10 },
      features: ['Batches'], administrator: { fullName: 'New Admin', email: 'admin@new.demo' },
    };
    const first = await call('POST', '/platform/tenants', request);
    expect(first.response.status).toBe(201);
    expect(first.payload.code).toBe('NEW_TENANT');
    const duplicate = await call('POST', '/platform/tenants', request);
    expect(duplicate.response.status).toBe(409);
    expect(duplicate.payload.error.code).toBe('CONFLICT');
  });

  it('suspends and reactivates an active tenant', async () => {
    const suspended = await call('POST', '/platform/tenants/tenant-demo/suspend');
    expect(suspended.payload.status).toBe('SUSPENDED');
    const reactivated = await call('POST', '/platform/tenants/tenant-demo/reactivate');
    expect(reactivated.payload.status).toBe('ACTIVE');
  });

  it('denies platform operations to a tenant administrator', async () => {
    const response = await handlePhase2Request(
      new Request('http://localhost/api/v1/platform/dashboard'),
      '/platform/dashboard',
      'phase2-forbidden',
      { ...actor, platformRole: null, activeTenantId: 'tenant-demo', tenantAdmin: true },
    );
    expect(response?.status).toBe(403);
  });
});
