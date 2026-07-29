'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Info,
  Layers,
} from 'lucide-react';
import type {
  CompanyReadinessAggregate,
} from '../../contracts/company-admin';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  secondaryButtonClass,
} from '../../components/phase2/common';
import { companyAdminClient } from './client';
import {
  CompanyAdminBadge,
  DemoDataNotice,
  useCompanyAdminScope,
} from './shared';

export function CompanyReadinessPage() {
  const { companyId, companyName } = useCompanyAdminScope();
  const [readiness, setReadiness] =
    useState<CompanyReadinessAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError('');
    try {
      setReadiness(await companyAdminClient.getReadiness(companyId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Company readiness could not be recalculated.',
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
  if (loading) return <LoadingState label="Recalculating company readiness…" />;
  if (error && !readiness) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }
  if (!readiness) {
    return (
      <EmptyState
        title="No readiness aggregate is available"
        description="The typed readiness endpoint returned no company sections."
      />
    );
  }

  const readySections = readiness.sections.filter(
    (section) => section.status === 'READY',
  ).length;
  const workspaceAttention = readiness.workspaces.filter(
    (workspace) => workspace.status === 'ACTION_NEEDED',
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Company administration"
        title="Company readiness"
        description={`${companyName} · Company foundations, shared data and workspace readiness in one aggregate view.`}
        actions={
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => void load()}
          >
            <Clock3 className="mr-2 h-4 w-4" />
            Recalculate
          </button>
        }
      />
      <DemoDataNotice>
        Demo data · Readiness is recalculated from company setup, shared master,
        accounting and workspace fixtures. Accounting retains its own detailed page.
      </DemoDataNotice>
      {error ? <ErrorState message={error} /> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Summary
          label="Overall status"
          value={readiness.overallStatus.replaceAll('_', ' ')}
          icon={CheckCircle2}
          tone={readiness.overallStatus === 'READY' ? 'green' : 'amber'}
        />
        <Summary
          label="Company sections ready"
          value={`${readySections} of ${readiness.sections.length}`}
          icon={Building2}
          tone="blue"
        />
        <Summary
          label="Workspaces needing action"
          value={String(workspaceAttention)}
          icon={Layers}
          tone={workspaceAttention ? 'amber' : 'green'}
        />
      </section>

      <section aria-labelledby="company-readiness-sections">
        <div className="mb-4">
          <h2
            id="company-readiness-sections"
            className="text-lg font-black text-slate-950"
          >
            Company readiness sections
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Foundation, onboarding, shared masters, accounting, business
            structure, workspace creation and membership are evaluated separately.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {readiness.sections.map((section) => (
            <article
              key={section.code}
              className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-black text-slate-950">{section.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {section.description}
                  </p>
                </div>
                <CompanyAdminBadge value={section.status} />
              </div>
              {section.percentage !== null ? (
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Progress</span>
                    <strong>{section.percentage}%</strong>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${section.title} progress`}
                    aria-valuenow={section.percentage}
                  >
                    <div
                      className={`h-full rounded-full ${
                        section.status === 'READY'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${section.percentage}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <RequirementLists
                completed={section.completedRequirements}
                incomplete={section.incompleteRequirements}
              />
              <Link
                href={section.route}
                className={`${secondaryButtonClass} mt-5 self-start`}
              >
                Open responsible area
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="workspace-readiness">
        <div className="mb-4">
          <h2
            id="workspace-readiness"
            className="text-lg font-black text-slate-950"
          >
            Operational readiness by workspace
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Each workspace keeps its own operational prerequisites and explicit
            membership count.
          </p>
        </div>
        {readiness.workspaces.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {readiness.workspaces.map((workspace) => (
              <article
                key={workspace.workspaceId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">
                      {workspace.workspaceName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {workspace.workspaceStatus} ·{' '}
                      {workspace.assignedMemberCount} assigned member
                      {workspace.assignedMemberCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <CompanyAdminBadge value={workspace.status} />
                </div>
                {workspace.percentage !== null ? (
                  <div className="mt-4 flex items-center gap-3">
                    <strong className="text-2xl text-slate-950">
                      {workspace.percentage}%
                    </strong>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          workspace.status === 'READY'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${workspace.percentage}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                <RequirementLists
                  completed={workspace.completedRequirements}
                  incomplete={workspace.incompleteRequirements}
                  compact
                />
                <Link
                  href={workspace.route}
                  className={`${secondaryButtonClass} mt-5`}
                >
                  Open {workspace.workspaceName}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No workspaces have been created"
            description="Create a company workspace before operational readiness can be evaluated."
          />
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          <div className="min-w-0">
            <h2 className="font-black text-amber-950">
              Policy decisions pending
            </h2>
            <p className="mt-1 text-sm text-amber-900">
              These unresolved rules are explicitly non-blocking in the demo.
            </p>
            <div className="mt-4 space-y-3">
              {readiness.policyNotes.map((note) => (
                <div
                  key={note.code}
                  className="rounded-xl border border-amber-200 bg-white/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-amber-950">
                      {note.label}
                    </p>
                    <CompanyAdminBadge value={note.policy} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <p className="text-right text-xs text-slate-500">
        Last recalculated{' '}
        <time dateTime={readiness.recalculatedAt}>
          {new Date(readiness.recalculatedAt).toLocaleString()}
        </time>
      </p>
    </div>
  );
}

function RequirementLists({
  completed,
  incomplete,
  compact = false,
}: {
  completed: string[];
  incomplete: CompanyReadinessAggregate['sections'][number]['incompleteRequirements'];
  compact?: boolean;
}) {
  return (
    <div className={`mt-5 grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
      <div>
        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          Completed
        </h4>
        {completed.length ? (
          <ul className="mt-2 space-y-2">
            {completed.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs leading-5 text-slate-600"
              >
                <CircleDot className="mt-1 h-3 w-3 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-400">None recorded yet.</p>
        )}
      </div>
      <div>
        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Remaining
        </h4>
        {incomplete.length ? (
          <ul className="mt-2 space-y-2">
            {incomplete.map((item) => (
              <li
                key={item.code}
                className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 leading-5">{item.label}</span>
                  <CompanyAdminBadge value={item.policy} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-emerald-700">
            No incomplete requirements.
          </p>
        )}
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof CheckCircle2;
  tone: 'green' | 'amber' | 'blue';
}) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </article>
  );
}
