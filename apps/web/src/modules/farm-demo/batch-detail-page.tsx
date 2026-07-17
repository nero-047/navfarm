'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  GitBranch,
  PackageCheck,
} from 'lucide-react';
import { useCurrentCompany } from '@/modules/company/use-current-company';
import {
  DataTable,
  DemoBadge,
  EmptyCompany,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  TableCell,
  TableHead,
} from './components';
import { useDemoStore } from './demo-store';

const TABS = [
  'Overview',
  'Operations',
  'Quality',
  'Cost & journals',
  'Traceability',
  'Audit',
] as const;
type BatchTab = (typeof TABS)[number];

export function BatchDetailWorkspacePage({ batchKey }: { batchKey: string }) {
  const company = useCurrentCompany();
  const { state, calculateVariance } = useDemoStore();
  const [tab, setTab] = useState<BatchTab>('Overview');
  if (!company) return <EmptyCompany />;
  const decodedKey = decodeURIComponent(batchKey);
  const batch = state.batches.find(
    (item) => item.id === decodedKey || item.code === decodedKey,
  );
  if (!batch)
    return (
      <SectionCard>
        <div className="p-8 text-center">
          <h1 className="text-xl font-semibold text-[#2e313f]">
            Batch not found
          </h1>
          <p className="mt-2 text-sm text-[#707070]">
            The demo record may have been reset in this browser.
          </p>
          <Link
            href={`/${company.slug}/batches`}
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white"
          >
            Return to batches
          </Link>
        </div>
      </SectionCard>
    );

  const operations = state.operations.filter(
    (item) => item.batchId === batch.id,
  );
  const quality = state.qualityLots.filter((item) => item.batchId === batch.id);
  const packs = state.qrPacks.filter((item) => item.batchId === batch.id);
  const variance = calculateVariance(batch);
  const source = state.batches.find((item) => item.id === batch.sourceBatchId);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href={`/${company.slug}/batches`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#1c4aa9]"
      >
        <ArrowLeft size={14} /> Batch register
      </Link>
      <PageHeader
        eyebrow={`${batch.lob} · ${batch.method}`}
        title={batch.code}
        description="One workspace for production, quality, costing, traceability and audit evidence."
        action={
          <>
            <DemoBadge />
            <StatusBadge
              label={batch.status.replaceAll('_', ' ')}
              tone={
                batch.status === 'CLOSED'
                  ? 'green'
                  : batch.status === 'QC_HOLD'
                    ? 'amber'
                    : 'blue'
              }
            />
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Input"
          value={batch.inputQty.toLocaleString('en-IN')}
          detail={`${batch.inputName} · ${batch.inputUom}`}
          icon={Boxes}
        />
        <StatCard
          label="Actual output"
          value={batch.actualOutput.toLocaleString('en-IN')}
          detail={`Expected ${batch.expectedOutput.toLocaleString('en-IN')}`}
          icon={PackageCheck}
          tone="green"
        />
        <StatCard
          label="WIP"
          value={`₹ ${(batch.wip / 100000).toFixed(2)}L`}
          detail={batch.costingStatus.replaceAll('_', ' ')}
          icon={Coins}
          tone="blue"
        />
        <StatCard
          label="Quality"
          value={batch.qcStatus.replaceAll('_', ' ')}
          detail={batch.inventoryStatus.replaceAll('_', ' ')}
          icon={ClipboardCheck}
          tone={batch.qcStatus === 'PASS' ? 'green' : 'amber'}
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#e3e7ee] bg-white p-2">
        <div
          className="flex min-w-max gap-1"
          role="tablist"
          aria-label="Batch detail sections"
        >
          {TABS.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${tab === item ? 'bg-[#0b1248] text-white' : 'text-[#606779] hover:bg-[#f3f5f8]'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <SectionCard
            title="Lifecycle overview"
            description="Independent operational, inventory, quality and costing states"
          >
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {[
                ['Lifecycle', batch.status],
                ['Stage', batch.stage],
                ['Operational health', batch.riskStatus],
                ['Inventory', batch.inventoryStatus],
                ['Quality', batch.qcStatus],
                ['Costing', batch.costingStatus],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#ededed] p-4"
                >
                  <p className="text-xs text-[#707070]">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#2e313f]">
                    {value.replaceAll('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard
            title="Source lineage"
            description="Farm-to-fork relationship carried into this batch"
          >
            <div className="p-5">
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-blue-800">
                <GitBranch size={18} />
                <div>
                  <p className="text-xs font-semibold">
                    {source?.code ?? 'Purchased / opening inventory'}
                  </p>
                  <p className="mt-1 text-[11px]">
                    Source of {batch.inputName}
                  </p>
                </div>
              </div>
              <div className="my-2 ml-6 h-6 w-px bg-blue-200" />
              <div className="flex items-center gap-3 rounded-xl border border-[#ededed] p-4">
                <Boxes size={18} className="text-[#1c4aa9]" />
                <div>
                  <p className="text-xs font-semibold text-[#2e313f]">
                    {batch.code}
                  </p>
                  <p className="mt-1 text-[11px] text-[#707070]">
                    Current production batch
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'Operations' && (
        <SectionCard
          title="Operation ledger"
          description="Consumption, observations, losses, resources and output"
        >
          <DataTable>
            <thead>
              <tr>
                <TableHead>Entry</TableHead>
                <TableHead>Parameter</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead>Recorded</TableHead>
              </tr>
            </thead>
            <tbody>
              {operations.map((entry) => (
                <tr key={entry.id}>
                  <TableCell className="font-semibold">
                    {entry.entryType}
                  </TableCell>
                  <TableCell>{entry.parameter}</TableCell>
                  <TableCell>
                    {entry.quantity} {entry.uom}
                  </TableCell>
                  <TableCell>
                    {entry.journal
                      ? `Dr ${entry.journal.debit} → Cr ${entry.journal.credit}`
                      : 'No cost impact'}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.createdAt).toLocaleString('en-IN')}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {!operations.length && (
            <EmptyDetail
              text="No operation entries have been recorded for this batch yet."
              action={`/${company.slug}/operations`}
              label="Record an operation"
            />
          )}
        </SectionCard>
      )}

      {tab === 'Quality' && (
        <SectionCard
          title="Quality lots"
          description="PASS releases inventory; HOLD and FAIL keep it blocked"
        >
          <DataTable>
            <thead>
              <tr>
                <TableHead>QC lot</TableHead>
                <TableHead>Parameter</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Disposition</TableHead>
              </tr>
            </thead>
            <tbody>
              {quality.map((lot) => (
                <tr key={lot.id}>
                  <TableCell className="font-semibold">{lot.code}</TableCell>
                  <TableCell>{lot.parameter}</TableCell>
                  <TableCell>{lot.result}</TableCell>
                  <TableCell>{lot.owner}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={lot.status}
                      tone={
                        lot.status === 'PASS'
                          ? 'green'
                          : lot.status === 'HOLD'
                            ? 'amber'
                            : 'red'
                      }
                    />
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {!quality.length && (
            <EmptyDetail
              text="No QC lot is linked to this batch."
              action={`/${company.slug}/quality`}
              label="Open quality control"
            />
          )}
        </SectionCard>
      )}

      {tab === 'Cost & journals' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            title="Close variance"
            description={
              batch.method === 'STANDARD'
                ? 'Projected from locked standards and current actuals'
                : 'Actual-cost methods do not post STANDARD variances'
            }
          >
            <div className="space-y-3 p-5">
              {[
                ['Price', variance.price],
                ['Usage', variance.usage],
                ['Output', variance.output],
                ['Overhead', variance.overhead],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-[#ededed] p-3 text-xs"
                >
                  <span>{label} variance</span>
                  <span
                    className={`font-semibold ${Number(value) > 0 ? 'text-red-700' : 'text-emerald-700'}`}
                  >
                    ₹ {Number(value).toLocaleString('en-IN')}{' '}
                    {Number(value) > 0 ? 'UNFAV' : 'FAV'}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard
            title="Accounting controls"
            description="Demo preview of documented close safeguards"
          >
            <div className="space-y-3 p-5">
              <ControlLine
                label="Standards locked at approval"
                done={batch.status !== 'DRAFT'}
              />
              <ControlLine
                label="Mandatory QC passed"
                done={!batch.qcRequired || batch.qcStatus === 'PASS'}
              />
              <ControlLine
                label="Output recorded"
                done={batch.actualOutput > 0}
              />
              <ControlLine
                label="WIP finalized"
                done={batch.costingStatus === 'FINALIZED'}
              />
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'Traceability' && (
        <SectionCard
          title="QR pack lineage"
          description="Only QC PASS output can receive an active pack code"
        >
          <DataTable>
            <thead>
              <tr>
                <TableHead>Pack</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Source batch</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Public record</TableHead>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id}>
                  <TableCell className="font-semibold">{pack.code}</TableCell>
                  <TableCell>{pack.quantity}</TableCell>
                  <TableCell>{batch.code}</TableCell>
                  <TableCell>
                    {new Date(pack.createdAt).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Link
                      className="font-semibold text-[#1c4aa9]"
                      href={`/trace/${company.slug}/${pack.code}`}
                      target="_blank"
                    >
                      Open trace page
                    </Link>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {!packs.length && (
            <EmptyDetail
              text="No QR pack has been generated from this batch."
              action={`/${company.slug}/traceability`}
              label="Open traceability"
            />
          )}
        </SectionCard>
      )}

      {tab === 'Audit' && (
        <SectionCard
          title="Activity history"
          description="Local demo audit trail for the company workspace"
        >
          <div className="divide-y divide-[#ededed]">
            {state.auditLog.slice(0, 20).map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex gap-3 px-5 py-3.5 text-xs"
              >
                <span className="font-semibold text-[#1c4aa9]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[#515463]">{item}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function EmptyDetail({
  text,
  action,
  label,
}: {
  text: string;
  action: string;
  label: string;
}) {
  return (
    <div className="p-8 text-center">
      <p className="text-xs text-[#707070]">{text}</p>
      <Link
        href={action}
        className="mt-4 inline-flex h-9 items-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-[#1c4aa9]"
      >
        {label}
      </Link>
    </div>
  );
}

function ControlLine({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#ededed] p-3 text-xs">
      <CheckCircle2
        size={16}
        className={done ? 'text-emerald-600' : 'text-slate-300'}
      />
      <span className="flex-1 text-[#515463]">{label}</span>
      <StatusBadge
        label={done ? 'Ready' : 'Pending'}
        tone={done ? 'green' : 'gray'}
      />
    </div>
  );
}
