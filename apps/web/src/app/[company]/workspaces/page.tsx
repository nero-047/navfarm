'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkspaceSelectionPage() {
  const { company } = useParams<{ company: string }>();
  const { session, selectContext } = useAuth();
  const router = useRouter();
  const membership = session?.companies.find((item) => item.companySlug === company);
  const workspaces = session?.workspaces.filter((item) => item.companyId === membership?.companyId) ?? [];

  async function open(workspaceId: string, workspaceSlug: string) {
    if (!membership) return;
    await selectContext(membership.tenantId, membership.companyId, workspaceId);
    router.push(`/${company}/workspaces/${workspaceSlug}/dashboard`);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Company workspaces</p><h1 className="mt-2 text-2xl font-bold">Choose a business area</h1><p className="mt-1 text-sm text-slate-600">Operational records stay isolated by workspace. Company accounting and shared masters remain company-scoped.</p></div>
        <Link href={`/${company}/workspaces/new`} className="inline-flex min-h-11 items-center rounded-xl bg-[#0b1248] px-4 text-sm font-semibold text-white">Create workspace</Link>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => (
          <button key={workspace.workspaceId} onClick={() => void open(workspace.workspaceId, workspace.workspaceSlug)} className="min-h-32 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{workspace.workspaceName}</h2><p className="mt-1 text-xs text-slate-500">{workspace.workspaceCode} · {workspace.workspaceType.replaceAll('_', ' ')}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{workspace.status}</span></div>
            <p className="mt-5 text-xs text-slate-600">{workspace.role} access · {workspace.enabledModules.length} modules</p>
          </button>
        ))}
        {!workspaces.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">No operational workspace is assigned. Ask a tenant or company administrator for explicit workspace access.</div>}
      </div>
    </div>
  );
}
