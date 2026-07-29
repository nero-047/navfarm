'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspacePage, type WorkspacePageKind } from '@/modules/farm-demo/workspace-page';
import { WorkspaceDetail } from './components';
import { AccessState } from '@/components/access/access-state';
import { filterNavigation } from '@/lib/authorization';
import { navigationForScope } from '@/components/shell/navigation';
import {
  WorkspaceCostingPage,
  WorkspaceMastersPage,
  WorkspaceSettingsPage,
} from './operational-support-pages';

export type OperationalRouteKind = 'dashboard' | 'batches' | 'operations' | 'quality' | 'traceability' | 'resources' | 'costing' | 'reports';

export function CanonicalWorkspaceContent({
  workspaceSlug,
  section,
}: {
  workspaceSlug: string;
  section?: string;
}) {
  const { company } = useParams<{ company: string }>();
  const { session } = useAuth();
  const membership = session?.companies.find((item) => item.companySlug === company);
  const assignedWorkspace = session?.workspaces.find((item) => item.companyId === membership?.companyId && item.workspaceSlug === workspaceSlug);
  const configuredWorkspace = session?.workspaces.find((item) => item.companyId === membership?.companyId && item.workspaceSlug === workspaceSlug);
  const workspace = assignedWorkspace;
  const needsContext = Boolean(workspace && workspace.status === 'ACTIVE' && session?.activeWorkspaceId !== workspace.workspaceId);

  if (!section) return <WorkspaceDetail workspaceSlug={workspaceSlug} />;
  if (configuredWorkspace && configuredWorkspace.status !== 'ACTIVE') {
    return <AccessState
      reason={membership?.onboardingStatus === 'COMPLETED' ? 'workspace_inactive' : 'onboarding_incomplete'}
      companySlug={company}
    />;
  }
  if (!workspace) return <AccessState reason="workspace_not_assigned" companySlug={company} />;
  if (needsContext) return <AccessState reason="workspace_selection_required" companySlug={company} />;
  const route = navigationForScope('workspace', company, workspace).find(
    (item) => item.href.endsWith(`/${section}`),
  );
  if (!route || filterNavigation([route], session).length === 0) {
    return <AccessState reason="insufficient_permission" companySlug={company} />;
  }
  if (section === 'costing') return <WorkspaceCostingPage />;
  if (section === 'masters') return <WorkspaceMastersPage />;
  if (section === 'settings') return <WorkspaceSettingsPage />;
  return <WorkspacePage kind={section as WorkspacePageKind} />;
}

export function WorkspaceIdentityBanner() {
  const { company, workspace: workspaceSlug } = useParams<{
    company: string;
    workspace: string;
  }>();
  const { session } = useAuth();
  const companyMembership = session?.companies.find(
    (item) => item.companySlug === company,
  );
  const workspace = session?.workspaces.find(
    (item) =>
      item.companyId === companyMembership?.companyId &&
      item.workspaceSlug === workspaceSlug,
  );

  if (!companyMembership || !workspace) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-950">
          {companyMembership.companyName}
          <span className="px-2 text-slate-300">/</span>
          {workspace.workspaceName}
        </p>
        <p className="mt-1 truncate text-[10px] text-slate-500">
          {workspace.configuredNob.name} · {workspace.enabledLobs.join(', ')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-800">
          {workspace.role}
        </span>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
          Demo data
        </span>
      </div>
    </div>
  );
}

export function LegacyOperationalRedirect({
  kind,
  suffix,
}: {
  kind: OperationalRouteKind;
  suffix?: string;
}) {
  const { company } = useParams<{ company: string }>();
  const { session, selectContext } = useAuth();
  const router = useRouter();
  const membership = session?.companies.find((item) => item.companySlug === company);
  const tenantAdmin = session?.tenants.some(
    (tenant) => tenant.tenantId === membership?.tenantId && tenant.role === 'TENANT_ADMIN',
  ) ?? false;
  const workspaces = useMemo(
    () => session?.workspaces.filter((item) => item.companyId === membership?.companyId && item.status === 'ACTIVE') ?? [],
    [membership?.companyId, session?.workspaces],
  );

  useEffect(() => {
    if (!membership) return;
    if (workspaces.length === 1) {
      const workspace = workspaces[0];
      const destination = `/${company}/workspaces/${workspace.workspaceSlug}/${kind}${
        suffix ? `/${encodeURIComponent(suffix)}` : ''
      }`;
      if (session?.activeWorkspaceId === workspace.workspaceId) {
        router.replace(destination);
      } else {
        void selectContext(membership.tenantId, membership.companyId, workspace.workspaceId).then(() => router.replace(destination));
      }
    } else if (workspaces.length > 1) {
      router.replace(`/${company}/workspaces`);
    }
  }, [
    company, kind, membership, router, selectContext,
    session?.activeWorkspaceId, suffix, workspaces,
  ]);

  if (!membership) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-800">Company access is not assigned.</div>;
  if (membership.onboardingStatus !== 'COMPLETED') {
    return <AccessState reason="onboarding_incomplete" companySlug={company} />;
  }
  if (!workspaces.length) return <AccessState reason="workspace_not_assigned" companySlug={company} noWorkspaceAssigned={!tenantAdmin} />;
  return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">{workspaces.length === 1 ? 'Opening your assigned workspace…' : 'Opening workspace selection…'}</div>;
}
