'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspacePage, type WorkspacePageKind } from '@/modules/farm-demo/workspace-page';
import { WorkspaceDetail } from './components';
import { AccessState } from '@/components/access/access-state';

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
  if (section === 'masters' || section === 'settings') return <WorkspacePage kind="settings" />;
  return <WorkspacePage kind={(section === 'costing' ? 'reports' : section) as WorkspacePageKind} />;
}

export function LegacyOperationalRedirect({ kind }: { kind: OperationalRouteKind }) {
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
      const destination = `/${company}/workspaces/${workspace.workspaceSlug}/${kind}`;
      if (session?.activeWorkspaceId === workspace.workspaceId) {
        router.replace(destination);
      } else {
        void selectContext(membership.tenantId, membership.companyId, workspace.workspaceId).then(() => router.replace(destination));
      }
    } else if (workspaces.length > 1) {
      router.replace(`/${company}/workspaces`);
    }
  }, [company, kind, membership, router, selectContext, session?.activeWorkspaceId, workspaces]);

  if (!membership) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-800">Company access is not assigned.</div>;
  if (membership.onboardingStatus !== 'COMPLETED') {
    return <AccessState reason="onboarding_incomplete" companySlug={company} />;
  }
  if (!workspaces.length) return <AccessState reason="workspace_not_assigned" companySlug={company} noWorkspaceAssigned={!tenantAdmin} />;
  return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">{workspaces.length === 1 ? 'Opening your assigned workspace…' : 'Opening workspace selection…'}</div>;
}
