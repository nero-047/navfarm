import type { WorkspaceMembership } from '../../contracts/api';
import {
  activeNavigationItem,
  isNavigationItemActive,
  navigationForScope,
} from './navigation';

const workspace: WorkspaceMembership = {
  workspaceId: 'workspace-green-poultry',
  tenantId: 'tenant-demo',
  companyId: 'company-green-valley',
  workspaceCode: 'GV_POULTRY',
  workspaceSlug: 'poultry-operations',
  workspaceName: 'Poultry Operations',
  workspaceType: 'POULTRY',
  status: 'ACTIVE',
  configuredNob: {
    nobId: 'nob-poultry',
    code: 'POULTRY',
    name: 'Poultry',
  },
  enabledLobs: ['Rearing & Breeding'],
  enabledModules: ['Batches', 'QC', 'QR', 'Resources', 'Finance', 'Analytics'],
  memberCount: 2,
  role: 'MANAGER',
  permissions: [
    'workspaces.view',
    'batches.view',
    'quality.view',
    'traceability.view',
    'resources.view',
    'costs.view',
    'reports.export',
  ],
};

function activeLabels(pathname: string, items = navigationForScope(
  'company',
  'green-valley-poultry',
)) {
  return items
    .filter((item) => isNavigationItemActive(pathname, item))
    .map((item) => item.label);
}

describe('canonical sidebar route ownership', () => {
  it('resolves exactly one primary item for representative company routes', () => {
    expect(activeLabels('/green-valley-poultry/overview')).toEqual(['Overview']);
    expect(activeLabels('/green-valley-poultry/settings/business-structure')).toEqual(['Settings']);
    expect(activeLabels('/green-valley-poultry/masters')).toEqual(['Masters']);
  });

  it('owns every company accounting child with Accounting', () => {
    const items = navigationForScope('company', 'green-valley-poultry');
    for (const pathname of [
      '/green-valley-poultry/accounting/readiness',
      '/green-valley-poultry/accounting/chart-of-accounts',
      '/green-valley-poultry/accounting/chart-of-accounts/account-1',
      '/green-valley-poultry/accounting/gl-mappings',
      '/green-valley-poultry/accounting/costing',
    ]) {
      expect(activeNavigationItem(pathname, items)?.label).toBe('Accounting');
      expect(items.filter((item) => isNavigationItemActive(pathname, item))).toHaveLength(1);
    }
  });

  it('activates Batches only for workspace batch lists and details', () => {
    const items = navigationForScope(
      'workspace',
      'green-valley-poultry',
      workspace,
    );
    const pathname =
      '/green-valley-poultry/workspaces/poultry-operations/batches/batch-1';
    expect(activeNavigationItem(pathname, items)?.href.endsWith('/batches')).toBe(true);
    expect(items.filter((item) => isNavigationItemActive(pathname, item))).toHaveLength(1);
  });

  it('keeps Company and Workspace Masters and Settings distinct', () => {
    const companyItems = navigationForScope('company', 'green-valley-poultry');
    const workspaceItems = navigationForScope(
      'workspace',
      'green-valley-poultry',
      workspace,
    );
    expect(activeNavigationItem(
      '/green-valley-poultry/masters',
      companyItems,
    )?.label).toBe('Masters');
    expect(activeNavigationItem(
      '/green-valley-poultry/settings/business-structure',
      companyItems,
    )?.label).toBe('Settings');
    expect(activeNavigationItem(
      '/green-valley-poultry/workspaces/poultry-operations/masters',
      workspaceItems,
    )?.label).toBe('Workspace masters');
    expect(activeNavigationItem(
      '/green-valley-poultry/workspaces/poultry-operations/settings',
      workspaceItems,
    )?.label).toBe('Workspace settings');
  });

  it('has one Tenant profile destination and no duplicate Settings link', () => {
    const items = navigationForScope('tenant');
    expect(items.filter((item) => item.href === '/console/profile')).toHaveLength(1);
    expect(items.some((item) => item.label === 'Settings')).toBe(false);
  });
});
