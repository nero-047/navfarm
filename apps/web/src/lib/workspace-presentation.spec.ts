import type { WorkspaceMembership } from '../contracts/api';
import { WORKSPACE_PRESENTATION, workspaceModuleEnabled } from './workspace-presentation';

const workspace = (type: WorkspaceMembership['workspaceType'], enabledModules: string[]): WorkspaceMembership => ({
  workspaceId: `workspace-${type}`, tenantId: 'tenant-1', companyId: 'company-1',
  workspaceCode: type, workspaceSlug: type.toLowerCase(), workspaceName: type,
  workspaceType: type, status: 'ACTIVE', enabledModules, role: 'MANAGER',
  permissions: ['workspaces.view'],
});

describe('workspace presentation registry', () => {
  it('covers every supported DTO workspace type', () => {
    expect(Object.keys(WORKSPACE_PRESENTATION).sort()).toEqual([
      'AGRICULTURE', 'AQUACULTURE', 'DAIRY', 'FEED_PROCESSING', 'OTHER', 'PIGGERY', 'POULTRY',
    ]);
  });
  it('uses enabled modules without changing workspace identity', () => {
    const agriculture = workspace('AGRICULTURE', ['Batches', 'QC']);
    expect(workspaceModuleEnabled(agriculture, 'QC')).toBe(true);
    expect(workspaceModuleEnabled(agriculture, 'QR')).toBe(false);
    expect(agriculture.workspaceType).toBe('AGRICULTURE');
  });
});
