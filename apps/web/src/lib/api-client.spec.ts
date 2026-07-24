import { createApiClient } from './api-client';

const companies = [
  {
    company_id: 'company-1',
    tenant_id: 'tenant-1',
    company_code: 'GREEN_VALLEY',
    company_name: 'Green Valley Poultry',
    company_display_name: 'Green Valley',
    industry_type: 'Poultry',
    onboarding_status: 'COMPLETED',
    is_active: true,
  },
];

function response(payload: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response);
}

describe('contract-first NAVFarm client', () => {
  it.each([
    ['mock response', companies],
    ['proxy-compatible data envelope', { data: companies, meta: { requestId: 'proxy-1' } }],
  ])('uses the same client for a %s', async (_label, payload) => {
    const fetcher = jest.fn(() => response(payload));
    const client = createApiClient(fetcher as typeof fetch);

    await expect(client.get('/company/tenant/tenant-1')).resolves.toEqual(companies);
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/company/tenant/tenant-1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rejects a response that violates a registered runtime contract', async () => {
    const client = createApiClient(
      jest.fn(() => response([{ company_id: 42 }])) as unknown as typeof fetch,
    );

    await expect(client.get('/company/tenant/tenant-1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      code: 'UPSTREAM_ERROR',
    });
  });

  it.each([
    ['mock response', {
      companyId: 'company-draft',
      setupPercentage: 25,
      workspaceReady: false,
      operationsReady: false,
      setupComplete: false,
      blockingRequirements: [{
        code: 'PROFILE',
        label: 'Company profile',
        route: 'profile',
        kind: 'WORKSPACE',
      }],
      recommendedRequirements: [],
      steps: [{
        id: 'profile',
        number: 1,
        label: 'Company profile',
        route: 'profile',
        status: 'CURRENT',
        requiredForWorkspace: true,
        requiredForOperations: false,
      }],
    }],
    ['proxy-compatible data envelope', {
      data: {
        companyId: 'company-draft',
        setupPercentage: 25,
        workspaceReady: false,
        operationsReady: false,
        setupComplete: false,
        blockingRequirements: [{
          code: 'PROFILE',
          label: 'Company profile',
          route: 'profile',
          kind: 'WORKSPACE',
        }],
        recommendedRequirements: [],
        steps: [{
          id: 'profile',
          number: 1,
          label: 'Company profile',
          route: 'profile',
          status: 'CURRENT',
          requiredForWorkspace: true,
          requiredForOperations: false,
        }],
      },
      meta: { requestId: 'proxy-phase2' },
    }],
  ])('validates the same Phase 2 setup contract for a %s', async (_label, payload) => {
    const fetcher = jest.fn(() => response(payload));
    const client = createApiClient(fetcher as typeof fetch);

    await expect(client.get('/companies/company-draft/setup/status')).resolves.toMatchObject({
      companyId: 'company-draft',
      setupPercentage: 25,
    });
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/companies/company-draft/setup/status',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it.each([
    ['mock response', {
      resource: 'items',
      records: [{
        id: 'item-feed', companyId: 'company-green-valley', code: 'FEED_GROWER',
        name: 'Grower feed', categoryId: 'category-feed', primaryUomId: 'uom-kg',
        secondaryUomId: null, itemType: 'CONSUMABLE',
        companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler',
        valuationMethod: 'FIFO', standardCost: null, lotTracking: true,
        status: 'ACTIVE', referencedBy: [],
        audit: { createdAt: '2026-07-24T08:00:00.000Z', createdBy: 'seed', updatedAt: '2026-07-24T08:00:00.000Z', updatedBy: 'seed' },
      }],
      page: 1, pageSize: 20, total: 1,
    }],
    ['proxy-compatible data envelope', { data: {
      resource: 'items',
      records: [{
        id: 'item-feed', companyId: 'company-green-valley', code: 'FEED_GROWER',
        name: 'Grower feed', categoryId: 'category-feed', primaryUomId: 'uom-kg',
        secondaryUomId: null, itemType: 'CONSUMABLE',
        companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler',
        valuationMethod: 'FIFO', standardCost: null, lotTracking: true,
        status: 'ACTIVE', referencedBy: [],
        audit: { createdAt: '2026-07-24T08:00:00.000Z', createdBy: 'seed', updatedAt: '2026-07-24T08:00:00.000Z', updatedBy: 'seed' },
      }],
      page: 1, pageSize: 20, total: 1,
    }, meta: { requestId: 'proxy-phase3' } }],
  ])('uses the same typed client for Phase 3 %s', async (_label, payload) => {
    const fetcher = jest.fn(() => response(payload));
    const client = createApiClient(fetcher as typeof fetch);
    await expect(client.get('/companies/company-green-valley/masters/items?status=ACTIVE')).resolves.toMatchObject({
      resource: 'items', total: 1,
    });
  });
});
