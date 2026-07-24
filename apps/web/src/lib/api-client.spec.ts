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
});
