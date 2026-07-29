import type { AuthSession } from '../../contracts/api';
import {
  buildContextSwitcherGroups,
  currentContextSelection,
  currentWorkspaceSection,
  workspaceSwitchDestination,
} from './context-switcher';

const now = '2026-07-01T00:00:00.000Z';
const session: AuthSession = {
  state: 'AUTHENTICATED',
  user: {
    userId: 'user-1',
    fullName: 'Demo User',
    email: 'demo@navfarm.test',
    platformRole: null,
    language: 'en',
    timezone: 'Asia/Kolkata',
    emailVerified: true,
    mfaEnabled: false,
    userType: 'STANDARD_USER',
    companyId: 'company-1',
    tenantId: 'tenant-1',
    companies: [],
    permissions: [],
  },
  tenants: [
    {
      tenantId: 'tenant-1',
      tenantName: 'Invisible tenant',
      status: 'ACTIVE',
      role: 'TENANT_MEMBER',
      permissions: [],
    },
  ],
  companies: [
    {
      companyId: 'company-1',
      tenantId: 'tenant-1',
      companyName: 'Green Valley Poultry',
      companySlug: 'green-valley-poultry',
      status: 'ACTIVE',
      membershipStatus: 'ACTIVE',
      onboardingStatus: 'COMPLETED',
      role: 'FARM_MANAGER',
      permissions: ['company.view'],
      enabledModules: ['Batches'],
    },
    {
      companyId: 'company-inactive',
      tenantId: 'tenant-1',
      companyName: 'Inactive Farm',
      companySlug: 'inactive-farm',
      status: 'INACTIVE',
      membershipStatus: 'ACTIVE',
      onboardingStatus: 'COMPLETED',
      role: 'VIEWER',
      permissions: ['company.view'],
      enabledModules: [],
    },
  ],
  workspaces: [
    {
      workspaceId: 'workspace-1',
      tenantId: 'tenant-1',
      companyId: 'company-1',
      workspaceCode: 'POULTRY',
      workspaceSlug: 'poultry-operations',
      workspaceName: 'Poultry Operations',
      workspaceType: 'POULTRY',
      status: 'ACTIVE',
      configuredNob: { nobId: 'nob-poultry', code: 'POULTRY', name: 'Poultry' },
      enabledLobs: ['Rearing & Breeding'],
      enabledModules: ['Batches', 'QC'],
      memberCount: 1,
      role: 'MANAGER',
      permissions: [
        'workspaces.view',
        'batches.view',
        'operations.create',
        'quality.view',
      ],
    },
    {
      workspaceId: 'workspace-inactive',
      tenantId: 'tenant-1',
      companyId: 'company-1',
      workspaceCode: 'ARCHIVE',
      workspaceSlug: 'archive',
      workspaceName: 'Archive',
      workspaceType: 'POULTRY',
      status: 'INACTIVE',
      configuredNob: { nobId: 'nob-poultry', code: 'POULTRY', name: 'Poultry' },
      enabledLobs: ['Rearing & Breeding'],
      enabledModules: ['Batches'],
      memberCount: 0,
      role: 'VIEWER',
      permissions: ['workspaces.view', 'batches.view'],
    },
  ],
  activeTenantId: 'tenant-1',
  activeCompanyId: 'company-1',
  activeWorkspaceId: 'workspace-1',
  expiresAt: now,
};

describe('company and workspace switcher model', () => {
  it('groups only accessible active workspaces beneath accessible companies', () => {
    const groups = buildContextSwitcherGroups(session);
    expect(groups).toHaveLength(1);
    expect(groups[0].companyName).toBe('Green Valley Poultry');
    expect(groups[0].workspaces.map((item) => item.workspaceName)).toEqual([
      'Poultry Operations',
    ]);
    expect(JSON.stringify(groups)).not.toContain('Invisible tenant');
  });

  it('searches company and workspace names without exposing inaccessible rows', () => {
    expect(buildContextSwitcherGroups(session, 'poultry operations')).toHaveLength(1);
    expect(buildContextSwitcherGroups(session, 'inactive')).toHaveLength(0);
  });

  it('calculates company and workspace selections from the atomic tuple', () => {
    expect(currentContextSelection(session)).toEqual({
      kind: 'workspace',
      companyId: 'company-1',
      workspaceId: 'workspace-1',
    });
    expect(
      currentContextSelection({ ...session, activeWorkspaceId: null }),
    ).toEqual({ kind: 'company', companyId: 'company-1' });
  });

  it('preserves supported list modules but never preserves a record ID', () => {
    expect(
      workspaceSwitchDestination({
        pathname:
          '/green-valley-poultry/workspaces/old-workspace/batches/batch-99',
        companySlug: 'green-valley-poultry',
        workspace: session.workspaces[0],
        session,
      }),
    ).toBe(
      '/green-valley-poultry/workspaces/poultry-operations/batches',
    );
    expect(
      currentWorkspaceSection(
        '/green-valley-poultry/workspaces/old-workspace/batches/batch-99',
      ),
    ).toBe('batches');
  });

  it('falls back to dashboard when the destination module is unavailable', () => {
    expect(
      workspaceSwitchDestination({
        pathname: '/old-company/workspaces/old-workspace/reports',
        companySlug: 'green-valley-poultry',
        workspace: session.workspaces[0],
        session,
      }),
    ).toBe(
      '/green-valley-poultry/workspaces/poultry-operations/dashboard',
    );
  });
});
