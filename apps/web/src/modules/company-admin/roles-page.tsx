'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  LockKeyhole,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import type {
  CompanyRoleCatalogue,
} from '../../contracts/company-admin';
import type { Permission } from '../../contracts/api';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
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

type RoleDetail =
  | CompanyRoleCatalogue['companyRoles'][number]
  | CompanyRoleCatalogue['workspaceRoles'][number];

const companyCapabilities: Permission[] = [
  'company.view',
  'company.manage',
  'users.view',
  'users.manage',
  'roles.view',
  'roles.manage',
  'masters.view',
  'masters.manage',
  'workspaces.view',
  'workspaces.manage',
  'finance.view',
  'finance.manage',
  'audit.view',
];

export function CompanyRolesPage() {
  const {
    companyId,
    companyName,
    companySlug,
    canManageRoles,
  } = useCompanyAdminScope();
  const [catalogue, setCatalogue] = useState<CompanyRoleCatalogue | null>(null);
  const [detail, setDetail] = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError('');
    try {
      setCatalogue(await companyAdminClient.getRoles(companyId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Company roles could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!companyId) {
    return (
      <ErrorState message="This company is not available in the active session." />
    );
  }
  if (loading) return <LoadingState label="Loading role catalogue…" />;
  if (error && !catalogue) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }
  if (!catalogue) {
    return (
      <EmptyState
        title="No role catalogue is available"
        description="The company role contract returned no data."
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Company administration"
        title="Roles & permissions"
        description={`${companyName} · Company administration and workspace operations use separate role assignments.`}
        actions={
          <Link href={`/${companySlug}/members`} className={primaryButtonClass}>
            <Users className="mr-2 h-4 w-4" />
            Assign roles in Members
          </Link>
        }
      />
      <DemoDataNotice>
        Demo data · This catalogue is read-only. Standard-role assignment is
        performed through Company Members; custom-role persistence is not
        implemented.
      </DemoDataNotice>
      {error ? <ErrorState message={error} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Company roles
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Company roles govern legal identity, settings, members, shared
              masters, accounting and workspace administration. They never
              grant operational workspace access by themselves.
            </p>
          </div>
          {!canManageRoles ? (
            <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Read only
            </span>
          ) : null}
        </div>
        <div className="mt-6 hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="sticky left-0 z-[1] bg-slate-50 px-4 py-3">
                  Role
                </th>
                <th className="px-3 py-3">Members</th>
                {companyCapabilities.map((permission) => (
                  <th
                    key={permission}
                    className="w-16 px-2 py-3 text-center"
                    title={permission}
                  >
                    {permission.split('.')[0]}
                    <span className="block font-normal">
                      {permission.split('.')[1]}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {catalogue.companyRoles.map((role) => (
                <tr key={role.code}>
                  <td className="sticky left-0 bg-white px-4 py-4">
                    <p className="font-bold text-slate-900">{role.name}</p>
                    <p className="mt-1 max-w-52 text-[11px] text-slate-500">
                      {role.code.replaceAll('_', ' ')}
                    </p>
                  </td>
                  <td className="px-3 py-4 font-bold">{role.memberCount}</td>
                  {companyCapabilities.map((permission) => (
                    <td key={permission} className="px-2 py-4 text-center">
                      {role.permissions.includes(permission) ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700" aria-label={`${permission} granted`}>
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-300" aria-label={`${permission} not granted`}>—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => setDetail(role)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-3 lg:hidden">
          {catalogue.companyRoles.map((role) => (
            <article
              key={role.code}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{role.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {role.description}
                  </p>
                </div>
                <CompanyAdminBadge value={`${role.memberCount} members`} />
              </div>
              <button
                type="button"
                className={`${secondaryButtonClass} mt-4 w-full`}
                onClick={() => setDetail(role)}
              >
                View permissions
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Workspace roles
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Workspace roles govern operations only and require an explicit
              assignment for each workspace.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {catalogue.workspaceRoles.map((role) => (
            <article
              key={role.code}
              className="flex flex-col rounded-xl border border-slate-200 p-5"
            >
              <BriefcaseBusiness className="h-5 w-5 text-violet-700" />
              <h3 className="mt-4 font-black text-slate-950">{role.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {role.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {role.memberCount} assignments
                </span>
                <button
                  type="button"
                  className="inline-flex items-center text-xs font-bold text-blue-700 hover:underline"
                  onClick={() => setDetail(role)}
                >
                  View role
                  <ArrowRight className="ml-1 h-3 w-3" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-black text-amber-950">
                {catalogue.customRoles.label}
              </h2>
              <CompanyAdminBadge value={catalogue.customRoles.status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              {catalogue.customRoles.description} No custom role is created or
              persisted by this frontend demo.
            </p>
          </div>
        </div>
      </section>

      {detail ? (
        <AdminDialog
          title={detail.name}
          description={`${detail.scope.toLowerCase()} role · ${detail.memberCount} current assignment${detail.memberCount === 1 ? '' : 's'}`}
          onClose={() => setDetail(null)}
          footer={
            <>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setDetail(null)}
              >
                Close
              </button>
              <Link
                href={`/${companySlug}/members`}
                className={primaryButtonClass}
              >
                Assign in Members
              </Link>
            </>
          }
        >
          <p className="text-sm leading-6 text-slate-600">
            {detail.description}
          </p>
          <h3 className="mt-6 text-sm font-black text-slate-950">
            Granted capabilities
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.permissions.map((permission) => (
              <code
                key={permission}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
              >
                {permission}
              </code>
            ))}
          </div>
        </AdminDialog>
      ) : null}
    </div>
  );
}
