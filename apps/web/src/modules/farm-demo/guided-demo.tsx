'use client';

import Link from 'next/link';
import { ArrowRight, Check, PlayCircle } from 'lucide-react';
import type { CompanyMeta } from '@/modules/company';
import { ProgressBar, SectionCard, StatusBadge } from './components';
import { useDemoStore } from './demo-store';

export function GuidedPoultryDemo({ company }: { company: CompanyMeta }) {
  const { state } = useDemoStore();
  if (company.nobCode !== 'POULTRY') return null;
  const batch = state.batches[0];
  if (!batch) return null;
  const steps = [
    {
      label: 'Open the production batch',
      detail: 'Review source, standards and lifecycle controls',
      done: batch.status !== 'DRAFT',
      href: `/${company.slug}/batches/${encodeURIComponent(batch.code)}`,
    },
    {
      label: 'Record daily feed or mortality',
      detail: 'See inventory and WIP journal impact',
      done: state.operations.some((item) => item.batchId === batch.id),
      href: `/${company.slug}/operations`,
    },
    {
      label: 'Record the production output',
      detail: 'Move the batch toward close readiness',
      done: batch.actualOutput > 0,
      href: `/${company.slug}/operations`,
    },
    {
      label: 'Inspect and release quality',
      detail: 'PASS unlocks inventory and QR generation',
      done: batch.qcStatus === 'PASS',
      href: `/${company.slug}/quality`,
    },
    {
      label: 'Generate a traceable QR pack',
      detail: 'Open the consumer farm-to-fork record',
      done: state.qrPacks.some((item) => item.batchId === batch.id),
      href: `/${company.slug}/traceability`,
    },
    {
      label: 'Validate close and variances',
      detail: 'Finalize STANDARD cost and clear WIP',
      done: batch.status === 'CLOSED',
      href: `/${company.slug}/batches/${encodeURIComponent(batch.code)}`,
    },
  ];
  const complete = steps.filter((item) => item.done).length;
  const next = steps.find((item) => !item.done) ?? steps[steps.length - 1];
  return (
    <SectionCard
      title="Guided poultry demo"
      description="A connected production-to-traceability walkthrough based on the RAK poultry flow"
      action={
        <StatusBadge
          label={`${complete}/6 complete`}
          tone={complete === 6 ? 'green' : 'blue'}
        />
      }
      className="border-blue-200 shadow-[0_12px_35px_rgba(28,74,169,0.08)]"
    >
      <div className="grid gap-5 p-5 lg:grid-cols-[.72fr_1.28fr] lg:p-6">
        <div className="rounded-2xl bg-[linear-gradient(135deg,#0b1248,#1c4aa9)] p-5 text-white">
          <PlayCircle size={26} />
          <h3 className="mt-4 text-lg font-semibold">
            Follow one complete story
          </h3>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Use {batch.code} to demonstrate batch controls, daily accounting, QC
            release, QR lineage and close variance.
          </p>
          <div className="mt-5">
            <ProgressBar value={(complete / steps.length) * 100} tone="green" />
          </div>
          <Link
            href={next.href}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-[#0b1248]"
          >
            {complete === 0
              ? 'Start walkthrough'
              : complete === 6
                ? 'Review completed flow'
                : 'Continue walkthrough'}{' '}
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex gap-3 rounded-xl border border-[#e3e7ee] p-3.5 hover:border-blue-300 hover:bg-blue-50/40"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {item.done ? <Check size={13} /> : index + 1}
              </span>
              <span>
                <span className="block text-xs font-semibold text-[#2e313f]">
                  {item.label}
                </span>
                <span className="mt-1 block text-[11px] leading-4 text-[#707070]">
                  {item.detail}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
