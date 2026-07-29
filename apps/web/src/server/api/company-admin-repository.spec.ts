/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  companyMemberListResponseSchema,
  companyRoleCatalogueSchema,
  companyReadinessAggregateSchema,
} from '../../contracts/company-admin';
import { handleMockRequest, resetMockRepositoryState } from './mock-repository';

type JsonPayload = Record<string, any>;

async function login(email: string) {
  const response = await handleMockRequest(
    new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'Demo123!' }),
    }),
    '/auth/login',
    `company-admin-login-${email}`,
  );
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error(`No session cookie returned for ${email}`);
  return { cookie, payload: await response.json() as JsonPayload };
}

async function call(
  cookie: string,
  method: string,
  path: string,
  input?: unknown,
) {
  const response = await handleMockRequest(
    new Request(`http://localhost/api/v1${path}`, {
      method,
      headers: {
        cookie,
        ...(input === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: input === undefined ? undefined : JSON.stringify(input),
    }),
    path,
    `company-admin-${method}-${path}`,
  );
  return { response, payload: await response.json() as JsonPayload };
}

describe('Milestone 2 company administration boundary', () => {
  beforeEach(() => resetMockRepositoryState());

  it('mounts operational state only under the canonical workspace subtree', () => {
    const companyLayout = readFileSync(
      resolve(process.cwd(), 'src/app/[company]/layout.tsx'),
      'utf8',
    );
    const workspaceLayout = readFileSync(
      resolve(
        process.cwd(),
        'src/app/[company]/workspaces/[workspace]/layout.tsx',
      ),
      'utf8',
    );
    expect(companyLayout).not.toContain('DemoStoreProvider');
    expect(workspaceLayout).toContain('DemoStoreProvider');
    expect(workspaceLayout).toContain('useCurrentCompany');
  });

  it('keeps company profile and settings independent from farm-demo modules', () => {
    for (const path of [
      'src/app/[company]/profile/page.tsx',
      'src/app/[company]/settings/page.tsx',
      'src/app/[company]/settings/[section]/page.tsx',
    ]) {
      expect(readFileSync(resolve(process.cwd(), path), 'utf8')).not.toContain(
        'farm-demo',
      );
    }
  });

  it('serves all company resources while activeWorkspaceId is null', async () => {
    const session = await login('companyadmin@navfarm.demo');
    expect(session.payload.activeWorkspaceId).toBeNull();
    for (const path of [
      '/companies/company-green-valley/setup/profile',
      '/companies/company-green-valley/settings',
      '/companies/company-green-valley/members',
      '/companies/company-green-valley/roles',
      '/companies/company-green-valley/readiness',
    ]) {
      const result = await call(session.cookie, 'GET', path);
      expect(result.response.status).toBe(200);
    }
  });

  it('validates company member, role, and readiness responses', async () => {
    const { cookie } = await login('companyadmin@navfarm.demo');
    const members = await call(
      cookie,
      'GET',
      '/companies/company-green-valley/members',
    );
    const roles = await call(
      cookie,
      'GET',
      '/companies/company-green-valley/roles',
    );
    const readiness = await call(
      cookie,
      'GET',
      '/companies/company-green-valley/readiness',
    );
    expect(companyMemberListResponseSchema.safeParse(members.payload).success)
      .toBe(true);
    expect(companyRoleCatalogueSchema.safeParse(roles.payload).success)
      .toBe(true);
    expect(companyReadinessAggregateSchema.safeParse(readiness.payload).success)
      .toBe(true);
  });

  it('keeps company and workspace roles explicitly separated', async () => {
    const { cookie } = await login('companyadmin@navfarm.demo');
    const before = await call(
      cookie,
      'GET',
      '/companies/company-green-valley/members/user-manager',
    );
    expect(before.payload.companyRole).toBe('FARM_MANAGER');
    expect(before.payload.workspaceAssignments[0].workspaceRole).toBe('MANAGER');

    const companyRole = await call(
      cookie,
      'PATCH',
      '/companies/company-green-valley/members/user-manager/role',
      { companyRole: 'VIEWER' },
    );
    expect(companyRole.response.status).toBe(200);
    expect(companyRole.payload.companyRole).toBe('VIEWER');
    expect(companyRole.payload.workspaceAssignments[0].workspaceRole)
      .toBe('MANAGER');

    resetMockRepositoryState();
    const nextSession = await login('companyadmin@navfarm.demo');
    const workspaceRole = await call(
      nextSession.cookie,
      'PATCH',
      '/companies/company-green-valley/members/user-manager/workspace-assignments/workspace-green-poultry',
      { workspaceRole: 'VIEWER' },
    );
    expect(workspaceRole.response.status).toBe(200);
    expect(workspaceRole.payload.companyRole).toBe('FARM_MANAGER');
    expect(workspaceRole.payload.workspaceAssignments[0].workspaceRole)
      .toBe('VIEWER');
  });

  it('adds session workspace visibility and revokes it on removal', async () => {
    const { cookie } = await login('companyadmin@navfarm.demo');
    let restored = await call(cookie, 'GET', '/auth/session');
    expect(restored.payload.workspaces).toEqual([]);

    const assigned = await call(
      cookie,
      'POST',
      '/companies/company-green-valley/members/user-company-admin/workspace-assignments',
      { workspaceId: 'workspace-green-poultry', workspaceRole: 'VIEWER' },
    );
    expect(assigned.response.status).toBe(201);
    restored = await call(cookie, 'GET', '/auth/session');
    expect(
      restored.payload.workspaces.map(
        (workspace: { workspaceId: string }) => workspace.workspaceId,
      ),
    ).toContain('workspace-green-poultry');

    const removed = await call(
      cookie,
      'DELETE',
      '/companies/company-green-valley/members/user-company-admin/workspace-assignments/workspace-green-poultry',
    );
    expect(removed.response.status).toBe(200);
    restored = await call(cookie, 'GET', '/auth/session');
    expect(restored.payload.workspaces).toEqual([]);
  });

  it('does not grant Tenant Admin implicit workspace membership', async () => {
    const { payload } = await login('tenant@navfarm.demo');
    expect(payload.activeWorkspaceId).toBeNull();
    expect(payload.workspaces).toEqual([]);
  });

  it.each([
    'accountant@navfarm.demo',
    'auditor@navfarm.demo',
  ])('denies member and workspace mutations for %s', async (email) => {
    const { cookie } = await login(email);
    const role = await call(
      cookie,
      'PATCH',
      '/companies/company-green-valley/members/user-manager/role',
      { companyRole: 'VIEWER' },
    );
    const assignment = await call(
      cookie,
      'POST',
      '/companies/company-green-valley/members/user-accountant/workspace-assignments',
      { workspaceId: 'workspace-green-poultry', workspaceRole: 'VIEWER' },
    );
    expect(role.response.status).toBe(403);
    expect(assignment.response.status).toBe(403);
    expect(role.payload.error.code).toBe('CAPABILITY_REQUIRED');
    expect(assignment.payload.error.code).toBe('CAPABILITY_REQUIRED');
  });

  it('keeps unresolved readiness policy non-blocking', async () => {
    const { cookie } = await login('companyadmin@navfarm.demo');
    const result = await call(
      cookie,
      'GET',
      '/companies/company-green-valley/readiness',
    );
    expect(result.payload.policyNotes).not.toHaveLength(0);
    expect(
      result.payload.policyNotes.every(
        (note: { policy: string }) => note.policy === 'POLICY_PENDING',
      ),
    ).toBe(true);
    expect(
      result.payload.sections.flatMap(
        (section: { incompleteRequirements: Array<{ policy: string }> }) =>
          section.incompleteRequirements,
      ).some(
        (requirement: { policy: string }) =>
          requirement.policy === 'POLICY_PENDING',
      ),
    ).toBe(false);
  });

  it('restores canonical memberships, roles, and invitations on reset', async () => {
    const { cookie } = await login('companyadmin@navfarm.demo');
    await call(
      cookie,
      'PATCH',
      '/companies/company-green-valley/members/user-manager/role',
      { companyRole: 'VIEWER' },
    );
    await call(
      cookie,
      'DELETE',
      '/companies/company-green-valley/invitations/company-invitation-supervisor',
    );

    resetMockRepositoryState();
    const restoredSession = await login('companyadmin@navfarm.demo');
    const member = await call(
      restoredSession.cookie,
      'GET',
      '/companies/company-green-valley/members/user-manager',
    );
    const invitations = await call(
      restoredSession.cookie,
      'GET',
      '/companies/company-green-valley/invitations',
    );
    expect(member.payload.companyRole).toBe('FARM_MANAGER');
    expect(member.payload.workspaceAssignments[0].workspaceRole).toBe('MANAGER');
    expect(
      invitations.payload.map(
        (invitation: { invitationId: string }) => invitation.invitationId,
      ),
    ).toContain('company-invitation-supervisor');
  });
});
