'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Boxes,
  Building2,
  CheckCircle2,
  Coins,
  Layers3,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  WorkspaceMaster,
  WorkspaceSettings,
} from '@/contracts/api';
import { useDemoStore } from '@/modules/farm-demo/demo-store';
import {
  DataTable,
  DemoBadge,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  TableCell,
  TableHead,
} from '@/modules/farm-demo/components';
import { workspaceClient } from './client';

function useWorkspaceIdentity() {
  const { company: companySlug, workspace: workspaceSlug } = useParams<{
    company: string;
    workspace: string;
  }>();
  const { session } = useAuth();
  const company = session?.companies.find(
    (item) => item.companySlug === companySlug,
  );
  const workspace = session?.workspaces.find(
    (item) =>
      item.companyId === company?.companyId &&
      item.workspaceSlug === workspaceSlug,
  );
  return { companySlug, workspaceSlug, company, workspace, session };
}

function RequestState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  if (loading) {
    return (
      <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
        Loading workspace configuration…
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p>{error}</p>
        <button
          onClick={retry}
          className="mt-4 min-h-11 rounded-xl border border-red-300 bg-white px-4 font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }
  return null;
}

export function WorkspaceCostingPage() {
  const { company, state, calculateVariance, isReady } = useDemoStore();
  const { companySlug, workspaceSlug } = useWorkspaceIdentity();
  const workspaceRoot = `/${companySlug}/workspaces/${workspaceSlug}`;
  const totalWip = state.batches.reduce((sum, batch) => sum + batch.wip, 0);
  const standardBatches = state.batches.filter(
    (batch) => batch.method === 'STANDARD',
  );
  const projectedVariance = standardBatches.reduce(
    (sum, batch) => sum + calculateVariance(batch).total,
    0,
  );

  if (!isReady) {
    return (
      <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
        Loading workspace costing…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace costing"
        title="Costing"
        description={`Mock operational costing for ${company.nobName}. Values are deterministic demo calculations, not posted financial transactions.`}
        action={<DemoBadge />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open WIP" value={`₹ ${totalWip.toLocaleString('en-IN')}`} detail="Represented by workspace batch fixtures" icon={Coins} />
        <StatCard label="STANDARD batches" value={String(standardBatches.length)} detail="Price, usage, output and overhead preview" icon={Boxes} tone="blue" />
        <StatCard label="Projected variance" value={`₹ ${projectedVariance.toLocaleString('en-IN')}`} detail="Demo calculation; final only on supported close" icon={Layers3} tone="amber" />
        <StatCard label="Costing methods" value={String(new Set(state.batches.map((batch) => batch.method)).size)} detail="Configured on current workspace batches" icon={CheckCircle2} tone="green" />
      </div>
      <SectionCard
        title="Batch costing register"
        description="Workspace WIP and variance previews remain separate from company accounting configuration."
      >
        <DataTable>
          <thead>
            <tr>
              <TableHead>Batch</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>WIP</TableHead>
              <TableHead>Cost status</TableHead>
              <TableHead>Variance preview</TableHead>
            </tr>
          </thead>
          <tbody>
            {state.batches.map((batch) => (
              <tr key={batch.id}>
                <TableCell>
                  <Link
                    href={`${workspaceRoot}/batches/${encodeURIComponent(batch.code)}`}
                    className="font-semibold text-blue-700"
                  >
                    {batch.code}
                  </Link>
                  <p className="mt-1 text-[11px] text-slate-500">{batch.lob}</p>
                </TableCell>
                <TableCell><StatusBadge label={batch.method} tone="gray" /></TableCell>
                <TableCell>₹ {batch.wip.toLocaleString('en-IN')}</TableCell>
                <TableCell>{batch.costingStatus.replaceAll('_', ' ')}</TableCell>
                <TableCell>
                  {batch.method === 'STANDARD'
                    ? `₹ ${calculateVariance(batch).total.toLocaleString('en-IN')}`
                    : 'Not represented for this method'}
                </TableCell>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
        <strong>Company accounting stays company-scoped.</strong>
        <p className="mt-1 text-xs leading-5 text-blue-800">
          GL mappings, chart of accounts and accounting readiness are not owned
          by this workspace.
        </p>
        <Link
          href={`/${companySlug}/accounting/readiness`}
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-blue-800"
        >
          Open company accounting readiness
        </Link>
      </div>
    </div>
  );
}

export function WorkspaceMastersPage() {
  const { companySlug, company, workspace } = useWorkspaceIdentity();
  const [masters, setMasters] = useState<WorkspaceMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!company || !workspace) return;
    setLoading(true);
    setError('');
    try {
      setMasters(
        await workspaceClient.masters(
          company.tenantId,
          company.companyId,
          workspace.workspaceId,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Workspace masters could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [company, workspace]);

  useEffect(() => {
    void load();
  }, [load]);

  const requestState = (
    <RequestState loading={loading} error={error} retry={() => void load()} />
  );
  if (loading || error) return requestState;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace configuration"
        title="Workspace masters"
        description="Operational values for this workspace’s configured NOB and LOBs. Company-owned reference and accounting data is not changed here."
        action={<DemoBadge />}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Workspace-owned" description="Operational configuration isolated to this workspace">
          <div className="space-y-3 p-5 text-sm text-slate-700">
            <p><strong>NOB:</strong> {workspace?.configuredNob.name}</p>
            <p><strong>LOBs:</strong> {workspace?.enabledLobs.join(', ') || 'Not configured'}</p>
            <p><strong>Values:</strong> operational parameters, QC parameters, locations and resources</p>
          </div>
        </SectionCard>
        <SectionCard title="Company shared masters" description="Owned once by company administration">
          <div className="p-5 text-sm text-slate-700">
            <p>UOMs, shared items, accounting mappings and company reference data remain company-scoped.</p>
            <Link href={`/${companySlug}/masters`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-blue-700">
              Open company masters
            </Link>
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Operational master values" description="Typed mock endpoint · read-only in this milestone">
        {masters.length ? (
          <DataTable>
            <thead>
              <tr>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>LOB</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody>
              {masters.map((master) => (
                <tr key={master.masterId}>
                  <TableCell className="font-semibold">{master.code}</TableCell>
                  <TableCell>{master.name}</TableCell>
                  <TableCell>{master.type.replaceAll('_', ' ')}</TableCell>
                  <TableCell>{master.lobName ?? 'Workspace-wide'}</TableCell>
                  <TableCell><StatusBadge label={master.status} tone="green" /></TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <div className="p-8 text-center text-sm text-slate-600">
            No workspace-owned operational masters are configured.
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export function WorkspaceSettingsPage() {
  const { companySlug, company, workspace, session } = useWorkspaceIdentity();
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canConfigure = useMemo(() => {
    const companyMembership = session?.companies.find(
      (item) => item.companyId === company?.companyId,
    );
    const tenantMembership = session?.tenants.find(
      (item) => item.tenantId === company?.tenantId,
    );
    return Boolean(
      companyMembership?.permissions.includes('workspaces.manage') ||
      tenantMembership?.permissions.includes('workspaces.manage'),
    );
  }, [company, session]);

  const load = useCallback(async () => {
    if (!company || !workspace) return;
    setLoading(true);
    setError('');
    try {
      setSettings(
        await workspaceClient.settings(
          company.tenantId,
          company.companyId,
          workspace.workspaceId,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Workspace settings could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [company, workspace]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || error || !settings) {
    return (
      <RequestState
        loading={loading}
        error={error || (loading ? '' : 'Workspace settings were not returned.')}
        retry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace configuration"
        title="Workspace settings"
        description="Identity, operational scope, modules, readiness and membership for the selected workspace."
        action={
          <>
            <DemoBadge />
            {canConfigure ? (
              <Link
                href={`/${companySlug}/workspaces/${settings.workspaceSlug}`}
                className="inline-flex min-h-10 items-center rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white"
              >
                Configure in company administration
              </Link>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Read only</span>
            )}
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Company owner" value={settings.companyName} detail={settings.workspaceCode} icon={Building2} />
        <StatCard label="Current role" value={settings.currentUserRole} detail="Explicit workspace membership" icon={ShieldCheck} tone="blue" />
        <StatCard label="Members" value={String(settings.memberCount)} detail="Active workspace assignments" icon={Users} tone="green" />
        <StatCard label="Readiness" value={`${settings.readiness.percentage}%`} detail={settings.readiness.operationalReady ? 'Operationally ready' : 'Setup required'} icon={CheckCircle2} tone={settings.readiness.operationalReady ? 'green' : 'amber'} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Identity and ownership" description="Stable frontend-demo workspace metadata">
          <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
            {[
              ['Workspace', settings.workspaceName],
              ['Status', settings.status],
              ['Company', settings.companyName],
              ['NOB', settings.configuredNob.name],
              ['LOBs', settings.enabledLobs.join(', ') || 'Not configured'],
              ['Role', settings.currentUserRole],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
        <SectionCard title="Enabled modules" description="Navigation is filtered by both module and exact capability">
          <div className="grid gap-2 p-5 sm:grid-cols-2">
            {settings.enabledModules.map((module) => (
              <div key={module} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm">
                <Settings2 size={15} className="text-blue-700" />
                {module}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      {!settings.readiness.operationalReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <strong>Readiness requirements</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
            {settings.readiness.blockingRequirements.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
