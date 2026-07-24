'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Building2, Gauge, Plus, Search, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api-client';
import type {
  ActivityEntry, CompanySummary, Invitation, PlatformTenant, RoleSummary,
  TenantDashboard, TenantUsage, TenantUser,
} from '../../contracts/phase2';
import {
  EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, SuccessNotice,
  UsageBar, inputClass, primaryButtonClass, secondaryButtonClass,
} from './common';

type TenantSection = 'dashboard' | 'profile' | 'companies' | 'users' | 'invitations' | 'roles' | 'subscription' | 'usage' | 'audit';

export function TenantAdminView({ section }: { section: TenantSection }) {
  const { session } = useAuth();
  const tenantId = session?.activeTenantId;
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [dashboard, setDashboard] = useState<TenantDashboard | null>(null);
  const [usage, setUsage] = useState<TenantUsage | null>(null);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [audit, setAudit] = useState<ActivityEntry[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setError('');
    try {
      if (section === 'dashboard') setDashboard(await api.get<TenantDashboard>(`/tenants/${tenantId}/dashboard`));
      if (section === 'profile' || section === 'subscription') setTenant(await api.get<PlatformTenant>(`/tenants/${tenantId}${section === 'subscription' ? '/subscription' : ''}`));
      if (section === 'usage') setUsage(await api.get<TenantUsage>(`/tenants/${tenantId}/usage`));
      if (section === 'companies') setCompanies(await api.get<CompanySummary[]>(`/tenants/${tenantId}/companies`));
      if (section === 'users') setUsers(await api.get<TenantUser[]>(`/tenants/${tenantId}/users`));
      if (section === 'invitations') setInvitations(await api.get<Invitation[]>(`/tenants/${tenantId}/invitations`));
      if (section === 'roles') setRoles(await api.get<RoleSummary[]>(`/tenants/${tenantId}/roles`));
      if (section === 'audit') setAudit((await api.get<{ items: ActivityEntry[] }>(`/tenants/${tenantId}/audit`)).items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tenant administration failed to load.');
    }
  }, [section, tenantId]);
  useEffect(() => { void load(); }, [load]);

  const invitationAction = async (invitationId: string, action: 'resend' | 'revoke') => {
    if (!tenantId) return;
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const updated = action === 'resend'
        ? await api.post<Invitation>(`/tenants/${tenantId}/invitations/${invitationId}/resend`)
        : await api.delete<Invitation>(`/tenants/${tenantId}/invitations/${invitationId}`);
      setInvitations((items) => items.map((item) => item.invitationId === invitationId ? updated : item));
      setSuccess(action === 'resend' ? 'Invitation resent.' : 'Invitation revoked.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invitation update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => users.filter((user) =>
    !search || `${user.fullName} ${user.email} ${user.status} ${user.tenantRole}`.toLowerCase().includes(search.toLowerCase()),
  ), [search, users]);

  if (!tenantId) return <ErrorState message="Select a tenant context to open tenant administration." />;
  const hasData =
    (section === 'dashboard' && dashboard) || ((section === 'profile' || section === 'subscription') && tenant) ||
    (section === 'usage' && usage) || (section === 'companies' && companies.length) ||
    (section === 'users' && users.length) || (section === 'invitations' && invitations.length) ||
    (section === 'roles' && roles.length) || (section === 'audit' && audit.length);
  if (!hasData && !error && !['companies', 'users', 'invitations', 'roles', 'audit'].includes(section)) return <LoadingState label="Loading tenant administration…" />;

  const title = {
    dashboard: 'Tenant dashboard', profile: 'Tenant profile', companies: 'Companies',
    users: 'Tenant users', invitations: 'Invitations', roles: 'Roles and permissions',
    subscription: 'Subscription', usage: 'Usage and limits', audit: 'Tenant audit',
  }[section];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader
        eyebrow="Tenant administration"
        title={title}
        description="Configuration and usage are loaded through the tenant-scoped contract API and independently enforced by the mock service."
        actions={section === 'companies' ? <Link href="/console/companies/new" className={primaryButtonClass}><Plus className="mr-2 h-4 w-4" />Create company</Link> : undefined}
      />
      {success ? <SuccessNotice message={success} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {section === 'dashboard' && dashboard ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Companies', `${dashboard.tenant.usage.companies.used} / ${dashboard.tenant.usage.companies.limit}`, Building2],
              ['Users', `${dashboard.tenant.usage.users.used} / ${dashboard.tenant.usage.users.limit}`, Users],
              ['Monthly batches', `${dashboard.tenant.usage.batches.used} / ${dashboard.tenant.usage.batches.limit ?? 'Unlimited'}`, Gauge],
              ['Pending invitations', String(dashboard.pendingInvitations.length), AlertTriangle],
            ].map(([label, value, Icon]) => <article key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between"><p className="text-xs font-bold uppercase text-slate-500">{String(label)}</p><Icon className="h-4 w-4 text-blue-600" /></div><p className="mt-3 text-2xl font-black">{String(value)}</p></article>)}
          </section>
          {dashboard.limitWarnings.length ? <section className="space-y-2">{dashboard.limitWarnings.map((warning) => <div key={warning.resource} className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><StatusBadge status={warning.state} />{warning.message}</div>)}</section> : null}
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-200 p-4"><h2 className="font-bold">Company setup progress</h2></div><div className="divide-y divide-slate-100">{dashboard.companies.map((company) => <Link key={company.companyId} href={`/console/companies/${company.companyId}`} className="block p-4 hover:bg-slate-50"><div className="flex justify-between"><span className="font-semibold">{company.name}</span><span className="text-sm font-bold text-blue-700">{company.setupPercentage}%</span></div><p className="mt-1 text-xs text-slate-500">Workspace {company.workspaceReady ? 'ready' : 'blocked'} · Operations {company.operationsReady ? 'ready' : 'blocked'}</p></Link>)}</div></section>
            <section className="rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-200 p-4"><h2 className="font-bold">Recent activity</h2></div><div className="divide-y divide-slate-100">{dashboard.recentActivity.map((item) => <div key={item.id} className="p-4"><p className="text-sm font-semibold">{item.summary}</p><p className="mt-1 text-xs text-slate-500">{item.actor} · {new Date(item.occurredAt).toLocaleString()}</p></div>)}</div></section>
          </div>
        </>
      ) : null}

      {section === 'profile' && tenant ? (
        <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2" onSubmit={async (event) => {
          event.preventDefault(); setSubmitting(true); setError('');
          const values = new FormData(event.currentTarget);
          try {
            setTenant(await api.patch<PlatformTenant>(`/tenants/${tenantId}`, { name: values.get('name'), billingEmail: values.get('billingEmail') }));
            setSuccess('Tenant profile updated.');
          } catch (cause) { setError(cause instanceof Error ? cause.message : 'Profile update failed.'); }
          finally { setSubmitting(false); }
        }}>
          <label className="text-sm font-semibold">Tenant code<input disabled defaultValue={tenant.code} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm font-semibold">Tenant type<input disabled defaultValue={tenant.type} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm font-semibold">Tenant name<input name="name" required defaultValue={tenant.name} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm font-semibold">Billing email<input name="billingEmail" required type="email" defaultValue={tenant.billingEmail} className={`${inputClass} mt-1`} /></label>
          <button disabled={submitting} className={primaryButtonClass}>{submitting ? 'Saving…' : 'Save tenant profile'}</button>
        </form>
      ) : null}

      {section === 'companies' ? (
        companies.length ? <div className="grid gap-3 md:grid-cols-2">{companies.map((company) => <article key={company.companyId} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><div><h2 className="font-bold">{company.name}</h2><p className="text-xs text-slate-500">{company.code}</p></div><StatusBadge status={company.status} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">Setup</dt><dd className="font-bold">{company.setupPercentage}%</dd></div><div><dt className="text-xs text-slate-500">Administrator</dt><dd className="font-semibold">{company.primaryAdministrator ?? 'Unassigned'}</dd></div><div><dt className="text-xs text-slate-500">Workspace</dt><dd>{company.workspaceReady ? 'Ready' : 'Blocked'}</dd></div><div><dt className="text-xs text-slate-500">Operations</dt><dd>{company.operationsReady ? 'Ready' : 'Blocked'}</dd></div></dl><div className="mt-4 flex gap-2"><Link className={secondaryButtonClass} href={`/console/companies/${company.companyId}`}>View details</Link>{company.status === 'DRAFT' ? <Link className={primaryButtonClass} href={`/${company.slug}/setup`}>Continue setup</Link> : null}</div></article>)}</div> : <EmptyState title="No companies yet" description="Create a draft company workspace to begin the 15-area setup workflow." action={<Link href="/console/companies/new" className={primaryButtonClass}>Create company</Link>} />
      ) : null}

      {section === 'users' ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="relative max-w-md flex-1"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><span className="sr-only">Search users</span><input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users, roles, or status" /></label><Link href="/console/invitations" className={primaryButtonClass}>Invite user</Link></div>
          {filteredUsers.length ? <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Tenant role</th><th className="px-4 py-3">Company memberships</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredUsers.map((user) => <tr key={user.userId}><td className="px-4 py-3"><p className="font-semibold">{user.fullName}</p><p className="text-xs text-slate-500">{user.email}</p></td><td className="px-4 py-3">{user.tenantRole.replaceAll('_', ' ')}</td><td className="px-4 py-3">{user.companyMemberships.length}</td><td className="px-4 py-3"><StatusBadge status={user.status} /></td></tr>)}</tbody></table></div> : <EmptyState title="No users match" description="Change the search or invitation status filter." />}
        </>
      ) : null}

      {section === 'invitations' ? (
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" onSubmit={async (event) => {
            event.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
            const values = new FormData(event.currentTarget);
            try {
              const created = await api.post<Invitation>(`/tenants/${tenantId}/invitations`, { email: values.get('email'), fullName: values.get('fullName'), tenantRole: values.get('tenantRole'), companyMemberships: [] });
              setInvitations((items) => [created, ...items]); setSuccess('Invitation created.'); event.currentTarget.reset();
            } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invitation failed.'); }
            finally { setSubmitting(false); }
          }}>
            <h2 className="font-bold">Invite tenant user</h2>
            <label className="block text-sm font-semibold">Full name<input required name="fullName" className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-semibold">Email<input required type="email" name="email" className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-semibold">Tenant role<select name="tenantRole" className={`${inputClass} mt-1`}><option>TENANT_MEMBER</option><option>TENANT_ADMIN</option></select></label>
            <button disabled={submitting} className={primaryButtonClass}>{submitting ? 'Inviting…' : 'Send invitation'}</button>
          </form>
          <div className="space-y-3">{invitations.length ? invitations.map((invitation) => <article key={invitation.invitationId} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{invitation.fullName}</h2><p className="text-xs text-slate-500">{invitation.email} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div><StatusBadge status={invitation.status} /></div>{invitation.status === 'PENDING' || invitation.status === 'EXPIRED' ? <div className="mt-4 flex gap-2"><button disabled={submitting} className={secondaryButtonClass} onClick={() => void invitationAction(invitation.invitationId, 'resend')}>Resend</button>{invitation.status === 'PENDING' ? <button disabled={submitting} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-700" onClick={() => void invitationAction(invitation.invitationId, 'revoke')}>Revoke</button> : null}</div> : null}</article>) : <EmptyState title="No invitations" description="Invite a tenant administrator or member." />}</div>
        </div>
      ) : null}

      {section === 'roles' ? <div className="grid gap-3 md:grid-cols-2">{roles.map((role) => <article key={role.roleId} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><div><p className="text-xs font-bold text-blue-700">{role.scope}</p><h2 className="font-bold">{role.name}</h2></div><span className="text-xs text-slate-500">{role.assignedUsers} assigned</span></div><p className="mt-2 text-sm text-slate-600">{role.description}</p><div className="mt-3 flex flex-wrap gap-1">{role.permissions.map((permission) => <span key={permission} className="rounded bg-slate-100 px-2 py-1 text-xs">{permission}</span>)}</div></article>)}</div> : null}

      {section === 'subscription' && tenant ? <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><h2 className="font-bold">{tenant.planName}</h2><StatusBadge status={tenant.status} /></div><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-xs text-slate-500">Billing cycle</dt><dd className="font-bold">{tenant.billingCycle}</dd></div><div><dt className="text-xs text-slate-500">Currency</dt><dd className="font-bold">{tenant.billingCurrency}</dd></div><div><dt className="text-xs text-slate-500">Start</dt><dd>{tenant.subscriptionStart}</dd></div><div><dt className="text-xs text-slate-500">End</dt><dd>{tenant.subscriptionEnd ?? 'Rolling'}</dd></div></dl></section><section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><h2 className="font-bold">Commercial rules pending</h2><p className="mt-2">Pricing, GST, taxes, gateways, payment retries, invoices, proration, overages, and grace periods are not defined in the RAK source and are not simulated.</p></section></div> : null}

      {section === 'usage' && usage ? <div className="grid gap-4 md:grid-cols-2"><section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5"><UsageBar label="Companies" {...usage.companies} /><UsageBar label="Users" {...usage.users} /><UsageBar label="Monthly batches" {...usage.batches} /></section><section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5"><UsageBar label="API requests / minute" {...usage.apiRequests} />{usage.storageGb.used !== null ? <UsageBar label="Storage GB" used={usage.storageGb.used} limit={usage.storageGb.limit} /> : <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Storage usage is unavailable for this tenant.</div>}</section></div> : null}

      {section === 'audit' ? audit.length ? <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{audit.map((item) => <article key={item.id} className="grid gap-1 p-4 sm:grid-cols-[11rem_12rem_1fr]"><time className="text-xs text-slate-500">{new Date(item.occurredAt).toLocaleString()}</time><span className="text-xs font-bold text-blue-700">{item.action.replaceAll('_', ' ')}</span><p className="text-sm">{item.summary}</p></article>)}</div> : <EmptyState title="No audit activity" description="Tenant and company administration changes will appear here." /> : null}
    </div>
  );
}
