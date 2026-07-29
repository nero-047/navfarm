'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { AccessState } from '@/components/access/access-state';
import {
  workspaceClient,
  type WorkspaceCreateInput,
} from './client';
import type { Workspace, WorkspaceMember } from '@/contracts/api';

const moduleOptions = ['Batches', 'Inventory', 'QC', 'QR', 'Resources', 'Finance', 'Analytics'];

function message(cause: unknown) {
  return cause instanceof ApiError || cause instanceof Error ? cause.message : 'The request could not be completed.';
}

function LoadingState({ label }: { label: string }) {
  return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">{label}</div>;
}

function ErrorState({ text, retry }: { text: string; retry: () => void }) {
  return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"><p>{text}</p><button onClick={retry} className="mt-4 min-h-11 rounded-xl border border-red-300 bg-white px-4 font-semibold">Retry</button></div>;
}

function canManageCompanyWorkspaces(
  session: ReturnType<typeof useAuth>['session'],
  companyId?: string,
  tenantId?: string,
) {
  const company = session?.companies.find((item) => item.companyId === companyId);
  const tenant = session?.tenants.find((item) => item.tenantId === tenantId);
  return Boolean(
    company?.permissions.includes('workspaces.manage') ||
    tenant?.permissions.includes('workspaces.manage'),
  );
}

export function WorkspaceList() {
  const { company } = useParams<{ company: string }>();
  const { session, selectContext } = useAuth();
  const router = useRouter();
  const companyMembership = session?.companies.find((item) => item.companySlug === company);
  const [items, setItems] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canManage = canManageCompanyWorkspaces(
    session, companyMembership?.companyId, companyMembership?.tenantId,
  );
  const visibleItems = canManage ? items : items.filter((workspace) => workspace.status === 'ACTIVE');

  const load = useCallback(async () => {
    if (!companyMembership) return;
    setLoading(true);
    setError('');
    try {
      setItems(await workspaceClient.list(companyMembership.tenantId, companyMembership.companyId));
    } catch (cause) {
      setError(message(cause));
    } finally {
      setLoading(false);
    }
  }, [companyMembership]);

  useEffect(() => {
    void load();
  }, [load]);

  async function open(workspace: Workspace) {
    if (!companyMembership) return;
    const assigned = session?.workspaces.some((item) => item.workspaceId === workspace.workspaceId);
    if (assigned) {
      await selectContext(companyMembership.tenantId, companyMembership.companyId, workspace.workspaceId);
      router.push(`/${company}/workspaces/${workspace.workspaceSlug}/dashboard`);
    } else {
      router.push(`/${company}/workspaces/${workspace.workspaceSlug}`);
    }
  }

  if (!companyMembership) return <ErrorState text="This company is not part of your current memberships." retry={() => router.push('/context-selection')} />;
  if (loading) return <LoadingState label="Loading company workspaces…" />;
  if (error) return <ErrorState text={error} retry={() => void load()} />;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Company workspaces</p><h1 className="mt-2 text-2xl font-bold">Choose a business area</h1><p className="mt-1 text-sm text-slate-600">Operational records stay isolated by workspace. Company accounting and shared masters remain company-scoped.</p></div>
      {canManage ? <Link href={`/${company}/workspaces/new`} className="inline-flex min-h-11 items-center rounded-xl bg-[#0b1248] px-4 text-sm font-semibold text-white">Create workspace</Link> : null}
    </header>
    <div className="grid gap-4 md:grid-cols-2">
      {visibleItems.map((workspace) => <button key={workspace.workspaceId} onClick={() => void open(workspace)} className="min-h-36 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{workspace.workspaceName}</h2><p className="mt-1 text-xs text-slate-500">{workspace.workspaceCode} · {workspace.workspaceType.replaceAll('_', ' ')}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{workspace.status}</span></div>
        <p className="mt-5 text-xs text-slate-600">{workspace.enabledModules.length} modules · {workspace.readiness.percentage}% ready</p>
      </button>)}
      {!visibleItems.length ? canManage ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600"><h2 className="font-bold text-slate-900">No workspaces configured</h2><p className="mt-2">Create the first business area, then assign operational users.</p></div> : <AccessState reason="workspace_not_assigned" noWorkspaceAssigned /> : null}
    </div>
  </div>;
}

export function WorkspaceCreateForm() {
  const { company } = useParams<{ company: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const companyMembership = session?.companies.find((item) => item.companySlug === company);
  const canManage = canManageCompanyWorkspaces(
    session, companyMembership?.companyId, companyMembership?.tenantId,
  );
  const [input, setInput] = useState<WorkspaceCreateInput>({
    workspaceCode: '',
    workspaceSlug: '',
    workspaceName: '',
    workspaceType: 'POULTRY',
    primaryNobId: null,
    enabledModules: ['Batches', 'Inventory'],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleModule(module: string) {
    setInput((current) => ({ ...current, enabledModules: current.enabledModules.includes(module) ? current.enabledModules.filter((item) => item !== module) : [...current.enabledModules, module] }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!companyMembership) return;
    setSaving(true);
    setError('');
    try {
      const created = await workspaceClient.create(companyMembership.tenantId, companyMembership.companyId, input);
      router.push(`/${company}/workspaces/${created.workspaceSlug}`);
    } catch (cause) {
      setError(message(cause));
      setSaving(false);
    }
  }

  if (!canManage) return <AccessState reason="insufficient_permission" companySlug={company} />;

  return <form onSubmit={(event) => void submit(event)} className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
    <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Workspace setup</p><h1 className="mt-2 text-2xl font-bold">Create workspace</h1>
    {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Workspace name<input required value={input.workspaceName} onChange={(event) => setInput((current) => ({ ...current, workspaceName: event.target.value, workspaceSlug: event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
      <label className="text-sm font-semibold">Workspace code<input required value={input.workspaceCode} onChange={(event) => setInput((current) => ({ ...current, workspaceCode: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
      <label className="text-sm font-semibold">Workspace slug<input required value={input.workspaceSlug} onChange={(event) => setInput((current) => ({ ...current, workspaceSlug: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
      <label className="text-sm font-semibold">Workspace type<select value={input.workspaceType} onChange={(event) => setInput((current) => ({ ...current, workspaceType: event.target.value as WorkspaceCreateInput['workspaceType'] }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal"><option value="POULTRY">Poultry</option><option value="AGRICULTURE">Agriculture</option><option value="PIGGERY">Piggery</option><option value="DAIRY">Dairy</option><option value="AQUACULTURE">Aquaculture</option><option value="FEED_PROCESSING">Feed & Processing</option><option value="OTHER">Other</option></select></label>
    </div>
    <fieldset className="mt-6"><legend className="text-sm font-semibold">Enabled modules</legend><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{moduleOptions.map((module) => <label key={module} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm"><input type="checkbox" checked={input.enabledModules.includes(module)} onChange={() => toggleModule(module)} />{module}</label>)}</div></fieldset>
    <div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} className="min-h-11 rounded-xl bg-[#0b1248] px-4 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating…' : 'Create draft workspace'}</button><Link href={`/${company}/workspaces`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold">Cancel</Link></div>
  </form>;
}

export function WorkspaceDetail({ workspaceSlug }: { workspaceSlug: string }) {
  const { company } = useParams<{ company: string }>();
  const { session } = useAuth();
  const companyMembership = session?.companies.find((item) => item.companySlug === company);
  const companyId = companyMembership?.companyId;
  const tenantId = companyMembership?.tenantId;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'OPERATOR' | 'VIEWER'>('VIEWER');
  const loadGeneration = useRef(0);
  const canManage = canManageCompanyWorkspaces(session, companyId, tenantId);

  const load = useCallback(async () => {
    if (!companyId || !tenantId) return;
    const generation = ++loadGeneration.current;
    setLoading(true); setError('');
    try {
      const list = await workspaceClient.list(tenantId, companyId);
      const match = list.find((item) => item.workspaceSlug === workspaceSlug);
      if (!match) throw new ApiError('Workspace not found.', 404, 'NOT_FOUND');
      const [detail, membershipRows] = await Promise.all([workspaceClient.get(companyId, match.workspaceId), workspaceClient.members(companyId, match.workspaceId)]);
      if (generation === loadGeneration.current) {
        setWorkspace(detail); setMembers(membershipRows);
      }
    } catch (cause) {
      if (generation === loadGeneration.current) setError(message(cause));
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, [companyId, tenantId, workspaceSlug]);
  useEffect(() => { void load(); }, [load]);

  const operationalHref = useMemo(() => workspace ? `/${company}/workspaces/${workspace.workspaceSlug}/dashboard` : '#', [company, workspace]);
  if (loading) return <LoadingState label="Loading workspace configuration…" />;
  if (error || !workspace) return <ErrorState text={error || 'Workspace not found.'} retry={() => void load()} />;
  const configuredWorkspace = workspace;

  async function save() {
    if (!companyMembership) return;
    setSaving(true); setError('');
    try {
      setWorkspace(await workspaceClient.update(companyMembership.companyId, configuredWorkspace.workspaceId, {
        workspaceName: configuredWorkspace.workspaceName,
        status: configuredWorkspace.status,
        enabledModules: configuredWorkspace.enabledModules,
      }));
    } catch (cause) { setError(message(cause)); } finally { setSaving(false); }
  }
  async function addMember(event: FormEvent) {
    event.preventDefault();
    if (!companyMembership) return;
    try {
      const created = await workspaceClient.addMember(companyMembership.companyId, configuredWorkspace.workspaceId, { email: inviteEmail, role: inviteRole });
      setMembers((current) => [...current, created]); setInviteEmail('');
    } catch (cause) { setError(message(cause)); }
  }
  function toggleModule(module: string) {
    setWorkspace((current) => current ? { ...current, enabledModules: current.enabledModules.includes(module) ? current.enabledModules.filter((item) => item !== module) : [...current.enabledModules, module] } : current);
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Workspace configuration</p><h1 className="mt-2 text-2xl font-bold">{workspace.workspaceName}</h1><p className="mt-1 text-sm text-slate-600">{workspace.workspaceCode} · {workspace.workspaceType.replaceAll('_', ' ')}</p></div><Link href={operationalHref} className="inline-flex min-h-11 items-center rounded-xl bg-[#0b1248] px-4 text-sm font-semibold text-white">Open dashboard</Link></header>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold">Readiness</h2><div className="mt-4 flex items-center gap-4"><span className="text-3xl font-black">{workspace.readiness.percentage}%</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${workspace.readiness.operationalReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{workspace.readiness.operationalReady ? 'Operationally ready' : 'Setup required'}</span></div>{workspace.readiness.blockingRequirements.length ? <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">{workspace.readiness.blockingRequirements.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold">Details and modules</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Workspace name<input disabled={!canManage} value={workspace.workspaceName} onChange={({ target: { value } }) => setWorkspace((current) => current ? { ...current, workspaceName: value } : current)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal disabled:bg-slate-50" /></label><label className="text-sm font-semibold">Status<select disabled={!canManage} value={workspace.status} onChange={({ target: { value } }) => setWorkspace((current) => current ? { ...current, status: value as Workspace['status'] } : current)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal disabled:bg-slate-50"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{moduleOptions.map((module) => <label key={module} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm"><input disabled={!canManage} type="checkbox" checked={workspace.enabledModules.includes(module)} onChange={() => toggleModule(module)} />{module}</label>)}</div>{canManage ? <button disabled={saving} onClick={() => void save()} className="mt-5 min-h-11 rounded-xl bg-[#0b1248] px-4 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save workspace'}</button> : null}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold">Workspace membership</h2><div className="mt-4 divide-y divide-slate-100">{members.map((member) => <div key={member.membershipId} className="flex min-h-14 items-center justify-between gap-4 py-3 text-sm"><span><strong className="block">{member.fullName}</strong><span className="text-xs text-slate-500">{member.email}</span></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{member.role}</span></div>)}{!members.length ? <p className="py-4 text-sm text-slate-600">No operational users assigned.</p> : null}</div>{canManage ? <form onSubmit={(event) => void addMember(event)} className="mt-5 grid gap-3 sm:grid-cols-[1fr_160px_auto]"><input required type="email" aria-label="Member email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="user@example.com" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" /><select aria-label="Workspace role" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as typeof inviteRole)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="VIEWER">Viewer</option><option value="OPERATOR">Operator</option><option value="MANAGER">Manager</option></select><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold">Add member</button></form> : null}</section>
  </div>;
}
