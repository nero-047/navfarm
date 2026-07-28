'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspacePage, type WorkspacePageKind } from '@/modules/farm-demo/workspace-page';
import { WorkspaceDetail } from './components';

export type OperationalRouteKind = 'dashboard' | 'batches' | 'operations' | 'quality' | 'traceability' | 'resources' | 'costing' | 'reports';

export function CanonicalWorkspaceContent({
  workspaceSlug,
  section,
}: {
  workspaceSlug: string;
  section?: string;
}) {
  const { company } = useParams<{ company: string }>();
  const { session, selectContext } = useAuth();
  const membership = session?.companies.find((item) => item.companySlug === company);
  const workspace = session?.workspaces.find((item) => item.companyId === membership?.companyId && item.workspaceSlug === workspaceSlug);
  const needsContext = Boolean(workspace && session?.activeWorkspaceId !== workspace.workspaceId);

  useEffect(() => {
    if (membership && workspace && needsContext) {
      void selectContext(membership.tenantId, membership.companyId, workspace.workspaceId);
    }
  }, [membership, needsContext, selectContext, workspace]);

  if (!section || section === 'settings') return <WorkspaceDetail workspaceSlug={workspaceSlug} />;
  if (!workspace) return <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-900"><h1 className="text-lg font-bold">Workspace access required</h1><p className="mt-2">This workspace is not assigned to your account. A tenant administrator can manage configuration, but operational access must be explicitly assigned.</p></div>;
  if (needsContext) return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Establishing workspace context…</div>;
  if (section === 'masters') return <WorkspacePage kind="settings" />;
  return <WorkspacePage kind={(section === 'costing' ? 'reports' : section) as WorkspacePageKind} />;
}

export function LegacyOperationalRedirect({ kind }: { kind: OperationalRouteKind }) {
  const { company } = useParams<{ company: string }>();
  const { session, selectContext } = useAuth();
  const router = useRouter();
  const membership = session?.companies.find((item) => item.companySlug === company);
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
  if (!workspaces.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8"><h1 className="text-lg font-bold">No operational workspace access</h1><p className="mt-2 text-sm text-slate-600">Company configuration is available, but operational routes require an explicit active workspace membership.</p></div>;
  return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">{workspaces.length === 1 ? 'Opening your assigned workspace…' : 'Opening workspace selection…'}</div>;
}
