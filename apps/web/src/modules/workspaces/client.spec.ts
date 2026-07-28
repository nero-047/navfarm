import type { NavfarmApiClient } from '../../lib/api-client';
import { createWorkspaceClient } from './client';

const workspace = {
  workspaceId: 'workspace-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  workspaceCode: 'POULTRY',
  workspaceSlug: 'poultry',
  workspaceName: 'Poultry Operations',
  workspaceType: 'POULTRY' as const,
  status: 'ACTIVE' as const,
  primaryNobId: 'nob-poultry',
  enabledModules: ['Batches'],
  readiness: { percentage: 100, operationalReady: true, blockingRequirements: [] },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

function fakeClient(request: jest.Mock): NavfarmApiClient {
  return {
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  };
}

describe('typed workspace administration client', () => {
  it('lists, creates, updates, and reads readiness through scoped API paths', async () => {
    const request = jest.fn()
      .mockResolvedValueOnce([workspace])
      .mockResolvedValueOnce(workspace)
      .mockResolvedValueOnce(workspace)
      .mockResolvedValueOnce(workspace.readiness);
    const client = createWorkspaceClient(fakeClient(request));
    await client.list('tenant-1', 'company-1');
    await client.create('tenant-1', 'company-1', {
      workspaceCode: 'POULTRY',
      workspaceSlug: 'poultry',
      workspaceName: 'Poultry Operations',
      workspaceType: 'POULTRY',
      primaryNobId: 'nob-poultry',
      enabledModules: ['Batches'],
    });
    await client.update('company-1', 'workspace-1', { enabledModules: ['Batches'] });
    await client.readiness('company-1', 'workspace-1');
    expect(request.mock.calls.map((call) => call[0])).toEqual([
      '/tenants/tenant-1/companies/company-1/workspaces',
      '/tenants/tenant-1/companies/company-1/workspaces',
      '/companies/company-1/workspaces/workspace-1',
      '/companies/company-1/workspaces/workspace-1/readiness',
    ]);
  });
});
