import type {
  AuthSession,
  WorkspaceMembership,
} from '../../contracts/api';
import { filterNavigation } from '../../lib/authorization';
import { navigationForScope } from './navigation';

export type ContextSwitcherCompany = AuthSession['companies'][number] & {
  workspaces: WorkspaceMembership[];
};

export type ContextSelection =
  | { kind: 'company'; companyId: string }
  | { kind: 'workspace'; companyId: string; workspaceId: string }
  | null;

const canonicalWorkspaceRoute =
  /^\/[^/]+\/workspaces\/[^/]+\/(dashboard|batches|operations|quality|traceability|resources|costing|reports|masters|settings)(?:\/[^/]+)?\/?$/;

export function buildContextSwitcherGroups(
  session: AuthSession,
  query = '',
): ContextSwitcherCompany[] {
  const normalizedQuery = query.trim().toLowerCase();

  return session.companies
    .filter(
      (company) =>
        company.status === 'ACTIVE' &&
        company.membershipStatus !== 'INACTIVE',
    )
    .map((company) => {
      const accessibleWorkspaces = session.workspaces.filter(
        (workspace) =>
          workspace.companyId === company.companyId &&
          workspace.tenantId === company.tenantId &&
          workspace.status === 'ACTIVE',
      );
      const companyMatches = company.companyName
        .toLowerCase()
        .includes(normalizedQuery);
      const workspaces = normalizedQuery && !companyMatches
        ? accessibleWorkspaces.filter((workspace) =>
            workspace.workspaceName.toLowerCase().includes(normalizedQuery),
          )
        : accessibleWorkspaces;

      return { ...company, workspaces };
    })
    .filter(
      (company) =>
        !normalizedQuery ||
        company.companyName.toLowerCase().includes(normalizedQuery) ||
        company.workspaces.length > 0,
    );
}

export function currentContextSelection(
  session: AuthSession,
): ContextSelection {
  if (!session.activeCompanyId) return null;
  if (session.activeWorkspaceId) {
    return {
      kind: 'workspace',
      companyId: session.activeCompanyId,
      workspaceId: session.activeWorkspaceId,
    };
  }
  return { kind: 'company', companyId: session.activeCompanyId };
}

export function currentWorkspaceSection(pathname: string): string | null {
  return pathname.match(canonicalWorkspaceRoute)?.[1] ?? null;
}

export function workspaceSwitchDestination({
  pathname,
  companySlug,
  workspace,
  session,
}: {
  pathname: string;
  companySlug: string;
  workspace: WorkspaceMembership;
  session: AuthSession;
}): string {
  const section = currentWorkspaceSection(pathname) ?? 'dashboard';
  const targetSession: AuthSession = {
    ...session,
    activeTenantId: workspace.tenantId,
    activeCompanyId: workspace.companyId,
    activeWorkspaceId: workspace.workspaceId,
  };
  const destination = navigationForScope(
    'workspace',
    companySlug,
    workspace,
  ).find((item) => item.href.endsWith(`/${section}`));
  const supported = destination
    ? filterNavigation([destination], targetSession).length > 0
    : false;

  return `/${companySlug}/workspaces/${workspace.workspaceSlug}/${
    supported ? section : 'dashboard'
  }`;
}
