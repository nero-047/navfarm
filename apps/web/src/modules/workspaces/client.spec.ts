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
  configuredNob: { nobId: 'nob-poultry', code: 'POULTRY' as const, name: 'Poultry' },
  enabledLobs: ['Rearing & Breeding'],
  enabledModules: ['Batches'],
  memberCount: 1,
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
    await client.update('tenant-1', 'company-1', 'workspace-1', { enabledModules: ['Batches'] });
    await client.readiness('tenant-1', 'company-1', 'workspace-1');
    expect(request.mock.calls.map((call) => call[0])).toEqual([
      '/tenants/tenant-1/companies/company-1/workspaces',
      '/tenants/tenant-1/companies/company-1/workspaces',
      '/tenants/tenant-1/companies/company-1/workspaces/workspace-1',
      '/tenants/tenant-1/companies/company-1/workspaces/workspace-1/readiness',
    ]);
  });

  it('validates canonical workspace settings and workspace-only masters', async () => {
    const settings = {
      ...workspace,
      companyName: 'Green Valley Poultry',
      currentUserRole: 'MANAGER' as const,
      currentUserPermissions: ['workspaces.view' as const],
    };
    const masters = [{
      masterId: 'workspace-1-location',
      type: 'LOCATION' as const,
      code: 'PRIMARY_SITE',
      name: 'Primary site',
      nobCode: 'POULTRY' as const,
      lobName: 'Rearing & Breeding',
      scope: 'WORKSPACE' as const,
      status: 'ACTIVE' as const,
    }];
    const request = jest.fn()
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce(masters);
    const client = createWorkspaceClient(fakeClient(request));

    await expect(
      client.settings('tenant-1', 'company-1', 'workspace-1'),
    ).resolves.toEqual(settings);
    await expect(
      client.masters('tenant-1', 'company-1', 'workspace-1'),
    ).resolves.toEqual(masters);
    expect(request.mock.calls.map((call) => call[0])).toEqual([
      '/tenants/tenant-1/companies/company-1/workspaces/workspace-1/settings',
      '/tenants/tenant-1/companies/company-1/workspaces/workspace-1/masters',
    ]);
  });
});
