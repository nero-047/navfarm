import { authSessionSchema, workspaceSchema } from './api';

const workspace = {
  workspaceId: 'workspace-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  workspaceCode: 'POULTRY',
  workspaceSlug: 'poultry',
  workspaceName: 'Poultry Operations',
  workspaceType: 'POULTRY',
  status: 'ACTIVE',
  primaryNobId: 'nob-poultry',
  enabledModules: ['Batches'],
  readiness: { percentage: 100, operationalReady: true, blockingRequirements: [] },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
} as const;

describe('workspace hierarchy contracts', () => {
  it('requires explicit tenant, company, identity and readiness fields', () => {
    expect(workspaceSchema.parse(workspace)).toEqual(workspace);
    expect(workspaceSchema.safeParse({ ...workspace, companyId: undefined }).success).toBe(false);
  });

  it('rejects a session active workspace without the new membership collections', () => {
    expect(authSessionSchema.safeParse({
      activeTenantId: 'tenant-1',
      activeCompanyId: 'company-1',
      activeWorkspaceId: 'workspace-1',
    }).success).toBe(false);
  });
});
