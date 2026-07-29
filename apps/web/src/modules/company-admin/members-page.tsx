'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  BriefcaseBusiness,
  Filter,
  LockKeyhole,
  MailPlus,
  MoreHorizontal,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
  UserRoundX,
  Users,
} from 'lucide-react';
import type {
  CompanyInvitation,
  CompanyMember,
  CompanyMemberListResponse,
} from '../../contracts/company-admin';
import type {
  CompanyRole,
  Workspace,
} from '../../contracts/api';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SuccessNotice,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/phase2/common';
import { companyAdminClient } from './client';
import {
  AdminDialog,
  CompanyAdminBadge,
  DemoDataNotice,
  useCompanyAdminScope,
} from './shared';

const assignableCompanyRoles: Array<Exclude<CompanyRole, 'CUSTOM'>> = [
  'ADMIN',
  'FARM_MANAGER',
  'ACCOUNTANT',
  'AUDITOR',
  'SUPERVISOR',
  'VIEWER',
];
const workspaceRoles = ['MANAGER', 'OPERATOR', 'VIEWER'] as const;

type ConfirmAction =
  | {
      kind: 'membership';
      member: CompanyMember;
      nextStatus: 'ACTIVE' | 'INACTIVE';
    }
  | {
      kind: 'workspace';
      member: CompanyMember;
      workspaceId: string;
      workspaceName: string;
    }
  | {
      kind: 'invitation';
      invitation: CompanyInvitation;
    };

export function CompanyMembersPage() {
  const {
    companyId,
    tenantId,
    companyName,
    canManageMembers,
    canManageRoles,
    canManageWorkspaces,
    refreshSession,
  } = useCompanyAdminScope();
  const [data, setData] = useState<CompanyMemberListResponse | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState<CompanyMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [workspaceFilter, setWorkspaceFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!companyId || !tenantId) return;
    setLoading(true);
    setError('');
    try {
      const [nextData, nextWorkspaces] = await Promise.all([
        companyAdminClient.listMembers(companyId),
        companyAdminClient.listWorkspaces(tenantId, companyId),
      ]);
      setData(nextData);
      setWorkspaces(nextWorkspaces);
      setSelected((current) => current
        ? nextData.items.find((item) => item.userId === current.userId) ?? null
        : null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Company members could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [companyId, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data?.items.filter((member) => {
      const matchesSearch =
        !query ||
        member.fullName.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.workspaceAssignments.some((assignment) =>
          assignment.workspaceName.toLowerCase().includes(query),
        );
      const matchesStatus =
        statusFilter === 'ALL' ||
        member.accountStatus === statusFilter ||
        member.companyMembershipStatus === statusFilter;
      const matchesRole =
        roleFilter === 'ALL' || member.companyRole === roleFilter;
      const matchesWorkspace =
        workspaceFilter === 'ALL' ||
        member.workspaceAssignments.some(
          (assignment) => assignment.workspaceId === workspaceFilter,
        );
      return (
        matchesSearch &&
        matchesStatus &&
        matchesRole &&
        matchesWorkspace
      );
    }) ?? [];
  }, [data?.items, roleFilter, search, statusFilter, workspaceFilter]);

  const supportsLastActivity =
    data?.items.some((member) => member.lastActivityAt !== null) ?? false;

  async function applyMember(next: CompanyMember, message: string) {
    setData((current) => current ? {
      ...current,
      items: current.items.map((item) =>
        item.userId === next.userId ? next : item,
      ),
    } : current);
    setSelected(next);
    await refreshSession();
    setSuccess(message);
  }

  async function mutate(
    action: () => Promise<CompanyMember>,
    message: string,
  ) {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await applyMember(await action(), message);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The member change failed.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function confirm() {
    if (!companyId || !confirmAction) return;
    if (confirmAction.kind === 'membership') {
      const { member, nextStatus } = confirmAction;
      if (await mutate(
        () => companyAdminClient.changeMembershipStatus(
          companyId,
          member.userId,
          nextStatus,
        ),
        `${member.fullName}'s company membership is now ${nextStatus.toLowerCase()}.`,
      )) {
        setConfirmAction(null);
      }
      return;
    }
    if (confirmAction.kind === 'workspace') {
      const { member, workspaceId, workspaceName } = confirmAction;
      if (await mutate(
        () => companyAdminClient.removeWorkspace(
          companyId,
          member.userId,
          workspaceId,
        ),
        `${workspaceName} access removed from ${member.fullName}.`,
      )) {
        setConfirmAction(null);
      }
      return;
    }
    setSaving(true);
    setError('');
    try {
      await companyAdminClient.cancelInvitation(
        companyId,
        confirmAction.invitation.invitationId,
      );
      setData((current) => current ? {
        ...current,
        invitations: current.invitations.filter(
          (item) =>
            item.invitationId !== confirmAction.invitation.invitationId,
        ),
      } : current);
      setSuccess(`Invitation for ${confirmAction.invitation.email} cancelled.`);
      setConfirmAction(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The invitation could not be cancelled.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!companyId || !tenantId) {
    return (
      <ErrorState message="This company is not available in the active session." />
    );
  }
  if (loading) return <LoadingState label="Loading company members…" />;
  if (error && !data) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }
  if (!data) {
    return (
      <EmptyState
        title="No company membership resource is available"
        description="The typed member endpoint returned no data."
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Company administration"
        title="Company members"
        description={`${companyName} · Company roles and operational workspace assignments are managed independently.`}
        actions={
          canManageMembers ? (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className={primaryButtonClass}
            >
              <MailPlus className="mr-2 h-4 w-4" />
              Invite member
            </button>
          ) : (
            <span className="nf-warning-state inline-flex min-h-11 items-center rounded-lg border px-3 text-xs font-bold">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Read only
            </span>
          )
        }
      />
      <DemoDataNotice />
      {success ? <SuccessNotice message={success} /> : null}
      {error ? <ErrorState message={error} /> : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_190px_210px_auto]">
          <label className="relative">
            <span className="sr-only">Search members</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              aria-label="Search members"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputClass} pl-9`}
              placeholder="Search name, email or workspace"
            />
          </label>
          <FilterSelect
            label="Status filter"
            value={statusFilter}
            onChange={setStatusFilter}
            options={['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']}
          />
          <FilterSelect
            label="Company role filter"
            value={roleFilter}
            onChange={setRoleFilter}
            options={['ALL', ...assignableCompanyRoles]}
          />
          <label>
            <span className="sr-only">Workspace filter</span>
            <select
              aria-label="Workspace filter"
              className={inputClass}
              value={workspaceFilter}
              onChange={(event) => setWorkspaceFilter(event.target.value)}
            >
              <option value="ALL">All workspaces</option>
              {workspaces.map((workspace) => (
                <option key={workspace.workspaceId} value={workspace.workspaceId}>
                  {workspace.workspaceName}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => void load()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Showing {filteredMembers.length} of {data.items.length} members
        </p>
      </section>

      {filteredMembers.length ? (
        <>
          <div role="region" aria-label="Company members table" tabIndex={0} className="hidden overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] lg:block">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Company role</th>
                  <th className="px-4 py-3">Membership</th>
                  <th className="px-4 py-3">Workspace access</th>
                  {supportsLastActivity ? (
                    <th className="px-4 py-3">Last activity</th>
                  ) : null}
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.userId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-950">
                        {member.fullName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {member.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <CompanyAdminBadge value={member.accountStatus} />
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {member.companyRole.replaceAll('_', ' ')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <CompanyAdminBadge
                          value={member.companyMembershipStatus}
                        />
                        <CompanyAdminBadge value={member.invitationStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">
                        {member.assignedWorkspaceCount} assigned
                      </p>
                      <p className="mt-1 max-w-72 text-xs text-slate-500">
                        {workspaceSummary(member)}
                      </p>
                    </td>
                    {supportsLastActivity ? (
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {member.lastActivityAt
                          ? new Date(member.lastActivityAt).toLocaleString()
                          : '—'}
                      </td>
                    ) : null}
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        aria-label={`View ${member.fullName}`}
                        className={secondaryButtonClass}
                        onClick={() => setSelected(member)}
                      >
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 lg:hidden">
            {filteredMembers.map((member) => (
              <article
                key={member.userId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-black text-slate-950">
                      {member.fullName}
                    </h2>
                    <p className="truncate text-xs text-slate-500">
                      {member.email}
                    </p>
                  </div>
                  <CompanyAdminBadge value={member.accountStatus} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    <dt className="text-slate-500">Company role</dt>
                    <dd className="mt-1 font-bold">
                      {member.companyRole.replaceAll('_', ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Membership</dt>
                    <dd className="mt-1 font-bold">
                      {member.companyMembershipStatus}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500">Workspace access</dt>
                    <dd className="mt-1 font-bold">
                      {workspaceSummary(member)}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  aria-label={`View ${member.fullName}`}
                  className={`${secondaryButtonClass} mt-4 w-full`}
                  onClick={() => setSelected(member)}
                >
                  View member details
                </button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No members match these filters"
          description="Change the search term or filters to see another membership."
          action={
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setRoleFilter('ALL');
                setWorkspaceFilter('ALL');
              }}
            >
              Clear filters
            </button>
          }
        />
      )}

      <InvitationPanel
        invitations={data.invitations}
        canManage={canManageMembers}
        saving={saving}
        onResend={async (invitation) => {
          setSaving(true);
          setError('');
          try {
            const resent = await companyAdminClient.resendInvitation(
              companyId,
              invitation.invitationId,
            );
            setData((current) => current ? {
              ...current,
              invitations: current.invitations.map((item) =>
                item.invitationId === resent.invitationId ? resent : item,
              ),
            } : current);
            setSuccess(`Invitation resent to ${resent.email}.`);
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : 'The invitation could not be resent.',
            );
          } finally {
            setSaving(false);
          }
        }}
        onCancel={(invitation) =>
          setConfirmAction({ kind: 'invitation', invitation })
        }
      />

      {inviteOpen ? (
        <InviteDialog
          companyId={companyId}
          saving={saving}
          onClose={() => setInviteOpen(false)}
          onStart={() => {
            setSaving(true);
            setError('');
          }}
          onSuccess={(invitation) => {
            setData((current) => current ? {
              ...current,
              invitations: [...current.invitations, invitation],
            } : current);
            setSaving(false);
            setInviteOpen(false);
            setSuccess(`Invitation sent to ${invitation.email}.`);
          }}
          onError={(message) => {
            setSaving(false);
            setError(message);
          }}
        />
      ) : null}

      {selected ? (
        <MemberDetailDialog
          member={selected}
          workspaces={workspaces}
          canManageMembers={canManageMembers}
          canManageRoles={canManageRoles}
          canManageWorkspaces={canManageWorkspaces}
          saving={saving}
          onClose={() => setSelected(null)}
          onRole={(role) =>
            mutate(
              () => companyAdminClient.changeCompanyRole(
                companyId,
                selected.userId,
                role,
              ),
              `${selected.fullName}'s company role changed to ${role.replaceAll('_', ' ')}.`,
            )
          }
          onMembership={(nextStatus) =>
            setConfirmAction({
              kind: 'membership',
              member: selected,
              nextStatus,
            })
          }
          onAssign={(workspaceId, workspaceRole) =>
            mutate(
              () => companyAdminClient.assignWorkspace(
                companyId,
                selected.userId,
                { workspaceId, workspaceRole },
              ),
              `Workspace access added for ${selected.fullName}.`,
            )
          }
          onWorkspaceRole={(workspaceId, workspaceRole) =>
            mutate(
              () => companyAdminClient.changeWorkspaceRole(
                companyId,
                selected.userId,
                workspaceId,
                workspaceRole,
              ),
              `Workspace role changed without changing ${selected.fullName}'s company role.`,
            )
          }
          onRemove={(assignment) =>
            setConfirmAction({
              kind: 'workspace',
              member: selected,
              workspaceId: assignment.workspaceId,
              workspaceName: assignment.workspaceName,
            })
          }
        />
      ) : null}

      {confirmAction ? (
        <ConfirmDialog
          action={confirmAction}
          saving={saving}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => void confirm()}
        />
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL'
              ? label.replace(' filter', '').replace('Company role', 'All roles')
              : option.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function InvitationPanel({
  invitations,
  canManage,
  saving,
  onResend,
  onCancel,
}: {
  invitations: CompanyInvitation[];
  canManage: boolean;
  saving: boolean;
  onResend: (invitation: CompanyInvitation) => Promise<void>;
  onCancel: (invitation: CompanyInvitation) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <MailPlus className="mt-0.5 h-5 w-5 text-blue-700" />
        <div>
          <h2 className="font-black text-slate-950">Invitations</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pending and recently expired company membership invitations.
          </p>
        </div>
      </div>
      {invitations.length ? (
        <div className="mt-5 divide-y divide-slate-100">
          {invitations.map((invitation) => (
            <div
              key={invitation.invitationId}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-950">
                  {invitation.fullName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {invitation.email} · {invitation.companyRole.replaceAll('_', ' ')}
                </p>
              </div>
              <CompanyAdminBadge value={invitation.status} />
              {canManage && invitation.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    className={secondaryButtonClass}
                    onClick={() => void onResend(invitation)}
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-sm font-bold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                    onClick={() => onCancel(invitation)}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No company invitations are pending.
        </p>
      )}
    </section>
  );
}

function InviteDialog({
  companyId,
  saving,
  onClose,
  onStart,
  onSuccess,
  onError,
}: {
  companyId: string;
  saving: boolean;
  onClose: () => void;
  onStart: () => void;
  onSuccess: (invitation: CompanyInvitation) => void;
  onError: (message: string) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyRole, setCompanyRole] =
    useState<Exclude<CompanyRole, 'CUSTOM'>>('VIEWER');

  async function submit(event: FormEvent) {
    event.preventDefault();
    onStart();
    try {
      onSuccess(await companyAdminClient.inviteMember(companyId, {
        fullName,
        email,
        companyRole,
      }));
    } catch (cause) {
      onError(
        cause instanceof Error
          ? cause.message
          : 'The invitation could not be sent.',
      );
    }
  }

  return (
    <AdminDialog
      title="Invite company member"
      description="Company membership does not grant workspace access. Assign operational access separately after invitation acceptance."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button
            form="invite-company-member"
            disabled={saving}
            className={primaryButtonClass}
          >
            {saving ? 'Sending…' : 'Send invitation'}
          </button>
        </>
      }
    >
      <form id="invite-company-member" onSubmit={(event) => void submit(event)} className="grid gap-4">
        <label className="text-sm font-semibold text-slate-800">
          Full name
          <input
            required
            minLength={2}
            className={`${inputClass} mt-1`}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Email
          <input
            required
            type="email"
            className={`${inputClass} mt-1`}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Company role
          <select
            aria-label="Invite company role"
            className={`${inputClass} mt-1`}
            value={companyRole}
            onChange={(event) =>
              setCompanyRole(event.target.value as typeof companyRole)
            }
          >
            {assignableCompanyRoles.map((role) => (
              <option key={role} value={role}>
                {role.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      </form>
    </AdminDialog>
  );
}

function MemberDetailDialog({
  member,
  workspaces,
  canManageMembers,
  canManageRoles,
  canManageWorkspaces,
  saving,
  onClose,
  onRole,
  onMembership,
  onAssign,
  onWorkspaceRole,
  onRemove,
}: {
  member: CompanyMember;
  workspaces: Workspace[];
  canManageMembers: boolean;
  canManageRoles: boolean;
  canManageWorkspaces: boolean;
  saving: boolean;
  onClose: () => void;
  onRole: (role: Exclude<CompanyRole, 'CUSTOM'>) => Promise<boolean>;
  onMembership: (status: 'ACTIVE' | 'INACTIVE') => void;
  onAssign: (
    workspaceId: string,
    role: (typeof workspaceRoles)[number],
  ) => Promise<boolean>;
  onWorkspaceRole: (
    workspaceId: string,
    role: (typeof workspaceRoles)[number],
  ) => Promise<boolean>;
  onRemove: (assignment: CompanyMember['workspaceAssignments'][number]) => void;
}) {
  const [companyRole, setCompanyRole] =
    useState<Exclude<CompanyRole, 'CUSTOM'>>(
      member.companyRole === 'CUSTOM' || member.companyRole === 'SUPER_ADMIN'
        ? 'ADMIN'
        : member.companyRole,
    );
  const available = workspaces.filter(
    (workspace) =>
      !member.workspaceAssignments.some(
        (assignment) => assignment.workspaceId === workspace.workspaceId,
      ),
  );
  const [workspaceId, setWorkspaceId] = useState(available[0]?.workspaceId ?? '');
  const [workspaceRole, setWorkspaceRole] =
    useState<(typeof workspaceRoles)[number]>('VIEWER');

  return (
    <AdminDialog
      title={member.fullName}
      description={`${member.email} · Company membership detail`}
      onClose={onClose}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Account status" value={member.accountStatus} icon={UserRound} />
        <SummaryCard label="Company membership" value={member.companyMembershipStatus} icon={ShieldCheck} />
        <SummaryCard label="Workspace assignments" value={String(member.assignedWorkspaceCount)} icon={BriefcaseBusiness} />
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-950">Company role</h3>
            <p className="mt-1 text-xs text-slate-500">
              Company permissions only; workspace roles below are unchanged.
            </p>
          </div>
          <CompanyAdminBadge value={member.companyRole} />
        </div>
        {canManageMembers && canManageRoles &&
        !['SUPER_ADMIN', 'CUSTOM'].includes(member.companyRole) ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label>
              <span className="sr-only">Company role</span>
              <select
                aria-label="Company role"
                className={inputClass}
                value={companyRole}
                onChange={(event) =>
                  setCompanyRole(event.target.value as typeof companyRole)
                }
              >
                {assignableCompanyRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={saving || companyRole === member.companyRole}
              className={secondaryButtonClass}
              onClick={() => void onRole(companyRole)}
            >
              Save company role
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            This role is read-only for your current capability or is reserved
            by the system catalogue.
          </p>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-950">
              Workspace assignments
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Every operational workspace role is explicit and independent.
            </p>
          </div>
          <CompanyAdminBadge
            value={`${member.assignedWorkspaceCount} assigned`}
          />
        </div>
        <div className="mt-4 space-y-3">
          {member.workspaceAssignments.map((assignment) => (
            <WorkspaceAssignment
              key={assignment.workspaceId}
              assignment={assignment}
              editable={canManageMembers && canManageWorkspaces}
              saving={saving}
              onRole={(role) => onWorkspaceRole(assignment.workspaceId, role)}
              onRemove={() => onRemove(assignment)}
            />
          ))}
          {!member.workspaceAssignments.length ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              No operational workspace access is assigned.
            </p>
          ) : null}
        </div>
        {canManageMembers && canManageWorkspaces && available.length ? (
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
            <label>
              <span className="sr-only">Workspace</span>
              <select
                aria-label="Workspace"
                className={inputClass}
                value={workspaceId}
                onChange={(event) => setWorkspaceId(event.target.value)}
              >
                {available.map((workspace) => (
                  <option key={workspace.workspaceId} value={workspace.workspaceId}>
                    {workspace.workspaceName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Workspace role</span>
              <select
                aria-label="Workspace role"
                className={inputClass}
                value={workspaceRole}
                onChange={(event) =>
                  setWorkspaceRole(
                    event.target.value as (typeof workspaceRoles)[number],
                  )
                }
              >
                {workspaceRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={saving || !workspaceId}
              className={primaryButtonClass}
              onClick={() => void onAssign(workspaceId, workspaceRole)}
            >
              Add workspace access
            </button>
          </div>
        ) : null}
      </section>

      <section className="mt-5 rounded-xl border border-red-100 bg-red-50/50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-black text-slate-950">Membership status</h3>
            <p className="mt-1 text-xs text-slate-600">
              Deactivation removes company access. Workspace assignments remain
              recorded but cannot authorize access without active company membership.
            </p>
          </div>
          {canManageMembers && member.companyRole !== 'SUPER_ADMIN' ? (
            <button
              type="button"
              disabled={saving}
              className={member.companyMembershipStatus === 'ACTIVE'
                ? 'inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-700 hover:bg-red-50'
                : primaryButtonClass}
              onClick={() => onMembership(
                member.companyMembershipStatus === 'ACTIVE'
                  ? 'INACTIVE'
                  : 'ACTIVE',
              )}
            >
              {member.companyMembershipStatus === 'ACTIVE'
                ? 'Deactivate company membership'
                : 'Activate company membership'}
            </button>
          ) : (
            <CompanyAdminBadge value="READ ONLY" />
          )}
        </div>
      </section>
    </AdminDialog>
  );
}

function WorkspaceAssignment({
  assignment,
  editable,
  saving,
  onRole,
  onRemove,
}: {
  assignment: CompanyMember['workspaceAssignments'][number];
  editable: boolean;
  saving: boolean;
  onRole: (role: (typeof workspaceRoles)[number]) => Promise<boolean>;
  onRemove: () => void;
}) {
  const [role, setRole] =
    useState<(typeof workspaceRoles)[number]>(assignment.workspaceRole);
  return (
    <article className="rounded-xl bg-slate-50 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[12rem] flex-1">
          <p className="font-bold text-slate-950">{assignment.workspaceName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {assignment.workspaceSlug} · {assignment.status}
          </p>
        </div>
        {editable ? (
          <>
            <label>
              <span className="sr-only">
                Workspace role for {assignment.workspaceName}
              </span>
              <select
                aria-label={`Workspace role for ${assignment.workspaceName}`}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as (typeof workspaceRoles)[number],
                  )
                }
              >
                {workspaceRoles.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={saving || role === assignment.workspaceRole}
              aria-label={`Save workspace role for ${assignment.workspaceName}`}
              className={secondaryButtonClass}
              onClick={() => void onRole(role)}
            >
              Save role
            </button>
            <button
              type="button"
              disabled={saving}
              aria-label={`Remove ${assignment.workspaceName} assignment`}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-sm font-bold text-red-700 hover:bg-red-50"
              onClick={onRemove}
            >
              Remove
            </button>
          </>
        ) : (
          <CompanyAdminBadge value={assignment.workspaceRole} />
        )}
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <article className="rounded-xl bg-slate-50 p-4">
      <Icon className="h-4 w-4 text-blue-700" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-950">
        {value.replaceAll('_', ' ')}
      </p>
    </article>
  );
}

function ConfirmDialog({
  action,
  saving,
  onClose,
  onConfirm,
}: {
  action: ConfirmAction;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const copy =
    action.kind === 'workspace'
      ? {
          title: 'Remove workspace assignment?',
          description: `${action.member.fullName} will lose visibility and operational access to ${action.workspaceName} after the session refresh.`,
          button: 'Remove workspace access',
        }
      : action.kind === 'membership'
        ? {
            title: `${action.nextStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'} company membership?`,
            description: action.nextStatus === 'INACTIVE'
              ? `${action.member.fullName} will no longer be able to enter this company. Workspace roles are not converted into company permissions.`
              : `${action.member.fullName} will regain the company permissions already assigned to their company role.`,
            button: action.nextStatus === 'INACTIVE'
              ? 'Deactivate membership'
              : 'Activate membership',
          }
        : {
            title: 'Cancel pending invitation?',
            description: `${action.invitation.email} will no longer be able to accept this invitation.`,
            button: 'Cancel invitation',
          };
  return (
    <AdminDialog
      title={copy.title}
      description={copy.description}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Keep unchanged
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {saving ? 'Updating…' : copy.button}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        {action.kind === 'workspace' ? (
          <BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <UserRoundX className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        This action changes the canonical mock authorization state immediately.
      </div>
    </AdminDialog>
  );
}

function workspaceSummary(member: CompanyMember) {
  return member.workspaceAssignments.length
    ? member.workspaceAssignments
        .map(
          (assignment) =>
            `${assignment.workspaceName} (${assignment.workspaceRole})`,
        )
        .join(', ')
    : 'No operational access';
}
