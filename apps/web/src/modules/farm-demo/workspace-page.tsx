'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Coins,
  FileBarChart,
  Gauge,
  GitBranch,
  PackageCheck,
  Plus,
  QrCode,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserRoundCog,
  Users,
  Wrench,
} from 'lucide-react';
import { useCurrentCompany } from '@/modules/company/use-current-company';
import {
  getDemoBatches,
  getDemoTasks,
  getQualityRecords,
  getResources,
  INDUSTRY_CONFIG,
  SETUP_STEPS,
  statusTone,
} from './data';
import {
  DataTable,
  DemoBadge,
  EmptyCompany,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusBadge,
  TableCell,
  TableHead,
  TextButton,
} from './components';

export type WorkspacePageKind =
  | 'dashboard'
  | 'batches'
  | 'operations'
  | 'quality'
  | 'traceability'
  | 'resources'
  | 'reports'
  | 'settings';

export function WorkspacePage({ kind }: { kind: WorkspacePageKind }) {
  const company = useCurrentCompany();
  if (!company) return <EmptyCompany />;

  switch (kind) {
    case 'dashboard':
      return <Dashboard company={company} />;
    case 'batches':
      return <Batches company={company} />;
    case 'operations':
      return <Operations company={company} />;
    case 'quality':
      return <Quality company={company} />;
    case 'traceability':
      return <Traceability company={company} />;
    case 'resources':
      return <Resources company={company} />;
    case 'reports':
      return <Reports company={company} />;
    case 'settings':
      return <Settings company={company} />;
  }
}

type Company = NonNullable<ReturnType<typeof useCurrentCompany>>;

function PrimaryButton({
  icon: Icon = Plus,
  children,
}: {
  icon?: typeof Plus;
  children: React.ReactNode;
}) {
  return (
    <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#151d5e]">
      <Icon size={15} /> {children}
    </button>
  );
}

function Dashboard({ company }: { company: Company }) {
  const batches = getDemoBatches(company);
  const tasks = getDemoTasks(company);
  const config = INDUSTRY_CONFIG[company.nobCode];
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow={`${company.nobName} workspace`}
        title={`${company.icon} ${company.name}`}
        description={`${company.location} · ${company.lobs.length} configured lines of business · Frontend demonstration using document-aligned sample records.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active batches"
          value="12"
          detail="3 approaching planned output"
          icon={Boxes}
          tone="blue"
        />
        <StatCard
          label="Tasks due today"
          value="8"
          detail="2 KPI readings need attention"
          icon={CalendarClock}
          tone="amber"
        />
        <StatCard
          label="QC release rate"
          value="96.4%"
          detail="Across the last 30 QC lots"
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="Cost variance"
          value="+2.4%"
          detail="₹ 48,620 unfavourable this period"
          icon={TrendingUp}
          tone="red"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <SectionCard
          title="Batch performance"
          description="Live stage, cost and output position by LOB"
          action={
            <Link href={`/${company.slug}/batches`}>
              <TextButton>View batches</TextButton>
            </Link>
          }
        >
          <div className="divide-y divide-[#ededed]">
            {batches.slice(0, 3).map((batch) => (
              <div
                key={batch.code}
                className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_120px_110px] sm:items-center sm:px-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-[#2e313f]">
                      {batch.code}
                    </p>
                    <StatusBadge
                      label={batch.status}
                      tone={statusTone(batch.status)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#707070]">
                    {batch.lob} · {batch.method}
                  </p>
                  <div className="mt-3 max-w-lg">
                    <ProgressBar
                      value={batch.progress}
                      tone={batch.status === 'QC hold' ? 'amber' : 'blue'}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#8a8a8a]">
                    Batch cost
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2e313f]">
                    {batch.cost}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#8a8a8a]">
                    Progress
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2e313f]">
                    {batch.progress}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Attention required"
          description="Warnings from KPI, QC and setup rules"
        >
          <div className="space-y-3 p-5">
            <AlertCard
              tone="amber"
              title={`${config.qualityParameter} warning`}
              text={`${company.lobs[Math.min(1, company.lobs.length - 1)]} is below ${config.qualityTarget}. QC lot placed on hold.`}
            />
            <AlertCard
              tone="red"
              title="Unfavourable usage variance"
              text={`${config.dailyParameter} is 2.4% above the locked standard programme.`}
            />
            {company.setupProgress < 100 && (
              <AlertCard
                tone="blue"
                title="Setup incomplete"
                text={`${company.setupProgress}% complete. Finish master data and notifications.`}
              />
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Today’s operations"
          description="Entries scheduled from the active batch programmes"
          action={
            <Link href={`/${company.slug}/operations`}>
              <TextButton>Open daily entry</TextButton>
            </Link>
          }
        >
          <div className="divide-y divide-[#ededed]">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={`${task.time}-${task.parameter}`}
                className="flex items-center gap-4 px-5 py-3.5 sm:px-6"
              >
                <div className="w-11 text-xs font-semibold text-[#2e313f]">
                  {task.time}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#2e313f]">
                    {task.parameter}
                  </p>
                  <p className="truncate text-[11px] text-[#707070]">
                    {task.batch}
                  </p>
                </div>
                <StatusBadge
                  label={task.status}
                  tone={statusTone(task.status)}
                />
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard
          title="Configured LOBs"
          description="Each LOB inherits company settings and its own costing programme"
        >
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {company.lobs.map((lob, index) => (
              <div key={lob} className="rounded-xl border border-[#ededed] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[#2e313f]">
                    {lob}
                  </p>
                  <StatusBadge label="Active" tone="green" />
                </div>
                <p className="mt-2 text-xs text-[#707070]">
                  {config.costingMethods[index % config.costingMethods.length]}{' '}
                  costing
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AlertCard({
  tone,
  title,
  text,
}: {
  tone: 'amber' | 'red' | 'blue';
  title: string;
  text: string;
}) {
  const classes =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-blue-200 bg-blue-50 text-blue-800';
  return (
    <div className={`rounded-xl border p-3.5 ${classes}`}>
      <div className="flex gap-2">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold">{title}</p>
          <p className="mt-1 text-[11px] leading-5 opacity-80">{text}</p>
        </div>
      </div>
    </div>
  );
}

function Batches({ company }: { company: Company }) {
  const batches = getDemoBatches(company);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Production lifecycle"
        title="Batches"
        description="Create, approve, operate, output and close traceable production batches. Costing is locked when a draft batch is approved."
        action={
          <>
            <DemoBadge />
            <PrimaryButton>New batch</PrimaryButton>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total batches"
          value="28"
          detail="12 active · 4 planned"
          icon={Boxes}
        />
        <StatCard
          label="WIP value"
          value="₹ 18.4L"
          detail="Across all active batches"
          icon={Coins}
          tone="blue"
        />
        <StatCard
          label="Ready to close"
          value="3"
          detail="Balance check pending"
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="At risk / hold"
          value="2"
          detail="One QC hold, one KPI risk"
          icon={AlertTriangle}
          tone="amber"
        />
      </div>
      <SectionCard
        title="Batch register"
        description="Document-aligned local fixtures; no backend records are created"
        action={<FilterBar />}
      >
        <DataTable>
          <thead>
            <tr>
              <TableHead>Batch / LOB</TableHead>
              <TableHead>Costing</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Quantity & output</TableHead>
              <TableHead>Cost / variance</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.code} className="hover:bg-[#fcfcfc]">
                <TableCell>
                  <p className="font-semibold text-[#2e313f]">{batch.code}</p>
                  <p className="mt-1 text-[11px] text-[#707070]">{batch.lob}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge label={batch.method} tone="gray" />
                </TableCell>
                <TableCell>
                  <p>{batch.stage}</p>
                  <div className="mt-2 w-28">
                    <ProgressBar value={batch.progress} />
                  </div>
                </TableCell>
                <TableCell>
                  <p>{batch.quantity}</p>
                  <p className="mt-1 text-[11px] text-[#707070]">
                    {batch.output}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-[#2e313f]">{batch.cost}</p>
                  <p className="mt-1 text-[11px] text-[#707070]">
                    Variance {batch.variance}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={batch.status}
                    tone={statusTone(batch.status)}
                  />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
    </div>
  );
}

function FilterBar() {
  return (
    <div className="flex items-center gap-2">
      <button className="rounded-lg border border-[#e5e5e5] p-2 text-[#707070]">
        <Search size={15} />
      </button>
      <button className="rounded-lg border border-[#e5e5e5] p-2 text-[#707070]">
        <SlidersHorizontal size={15} />
      </button>
    </div>
  );
}

function Operations({ company }: { company: Company }) {
  const tasks = getDemoTasks(company);
  const config = INDUSTRY_CONFIG[company.nobCode];
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Daily / weekly entry"
        title="Operations"
        description="Record scheduled consumption, outputs, observations, overheads, resources and loss events against an approved batch."
        action={
          <>
            <DemoBadge />
            <PrimaryButton>Record entry</PrimaryButton>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <OperationType
          icon={Activity}
          title="Consumption"
          description={`${config.dailyParameter}, medicine and other items reduce inventory and add to WIP.`}
        />
        <OperationType
          icon={Gauge}
          title="Observations & KPIs"
          description={`${config.qualityParameter}, environment and performance readings trigger threshold alerts.`}
        />
        <OperationType
          icon={PackageCheck}
          title="Output / harvest"
          description={`${config.primaryOutput} enters inventory with complete source-batch traceability.`}
        />
      </div>
      <SectionCard
        title="Today’s scheduler"
        description="Expected values come from the LOB scheduler parameter lines"
        action={<StatusBadge label="15 July 2026" tone="blue" />}
      >
        <DataTable>
          <thead>
            <tr>
              <TableHead>Time</TableHead>
              <TableHead>Parameter</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={`${task.time}-${task.parameter}`}>
                <TableCell className="font-semibold text-[#2e313f]">
                  {task.time}
                </TableCell>
                <TableCell>{task.parameter}</TableCell>
                <TableCell className="font-medium text-[#2e313f]">
                  {task.batch}
                </TableCell>
                <TableCell>{task.expected}</TableCell>
                <TableCell>{task.actual}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={task.status}
                    tone={statusTone(task.status)}
                  />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Automatic accounting preview"
          description="Shown for demo only; no GL journal is posted"
        >
          <div className="space-y-3 p-5">
            <JournalLine
              debit="1190 Batch WIP"
              credit="1100 Inventory - Inputs"
              amount="₹ 23,980"
              label={config.dailyParameter}
            />
            <JournalLine
              debit="1190 Batch WIP"
              credit="2100 Accounts Payable"
              amount="₹ 405"
              label="Daily overhead"
            />
          </div>
        </SectionCard>
        <SectionCard
          title="KPI evaluation"
          description="Threshold checks run when an operation is saved"
        >
          <div className="p-5">
            <div className="rounded-xl bg-[#fafafa] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2e313f]">
                  {config.qualityParameter}
                </p>
                <StatusBadge label="Warning" tone="amber" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <Metric label="Target" value={config.qualityTarget} />
                <Metric label="Actual" value="Below target" />
                <Metric label="Alert to" value="Farm manager" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function OperationType({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e7e7e7] bg-white p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1c4aa9]">
        <Icon size={19} />
      </div>
      <h2 className="text-sm font-semibold text-[#2e313f]">{title}</h2>
      <p className="mt-1.5 text-xs leading-5 text-[#707070]">{description}</p>
    </div>
  );
}

function JournalLine({
  debit,
  credit,
  amount,
  label,
}: {
  debit: string;
  credit: string;
  amount: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-[#ededed] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold text-[#2e313f]">{label}</p>
        <p className="text-xs font-semibold text-[#2e313f]">{amount}</p>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-[#707070]">
        <span>Dr {debit}</span>
        <ChevronRight size={12} />
        <span>Cr {credit}</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#8a8a8a]">
        {label}
      </p>
      <p className="mt-1 font-semibold text-[#2e313f]">{value}</p>
    </div>
  );
}

function Quality({ company }: { company: Company }) {
  const records = getQualityRecords(company);
  const config = INDUSTRY_CONFIG[company.nobCode];
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Quality control"
        title="QC batches & release"
        description="Separate QC batches evaluate numeric, visual, grade and boolean parameters before inventory is released or QR packs are generated."
        action={
          <>
            <DemoBadge />
            <PrimaryButton icon={ClipboardCheck}>New QC batch</PrimaryButton>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting inspection"
          value="6"
          detail="Oldest: 3h 18m"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Pass rate"
          value="96.4%"
          detail="30-day rolling result"
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="On hold"
          value="1"
          detail="Manager disposition required"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Failed"
          value="1"
          detail="Temperature excursion"
          icon={Activity}
          tone="red"
        />
      </div>
      <SectionCard
        title="QC lot register"
        description={`Primary configured parameter: ${config.qualityParameter} · Target ${config.qualityTarget}`}
        action={<FilterBar />}
      >
        <DataTable>
          <thead>
            <tr>
              <TableHead>QC lot</TableHead>
              <TableHead>Source batch</TableHead>
              <TableHead>Parameter</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Disposition</TableHead>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.lot}>
                <TableCell className="font-semibold text-[#2e313f]">
                  {record.lot}
                </TableCell>
                <TableCell>{record.batch}</TableCell>
                <TableCell>{record.parameter}</TableCell>
                <TableCell>{record.result}</TableCell>
                <TableCell>{record.owner}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={record.status}
                    tone={statusTone(record.status)}
                  />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Configured QC parameters"
          description="Parameter types and limits are inherited from the LOB"
        >
          <div className="space-y-3 p-5">
            {[
              config.qualityParameter,
              'Visual grade',
              'Contamination / health screen',
              'Pack integrity',
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border border-[#ededed] p-3.5"
              >
                <div>
                  <p className="text-xs font-semibold text-[#2e313f]">{item}</p>
                  <p className="mt-1 text-[11px] text-[#707070]">
                    {index === 0
                      ? config.qualityTarget
                      : index === 1
                        ? 'Grade A or B'
                        : 'PASS required'}
                  </p>
                </div>
                <StatusBadge
                  label={
                    index === 0 ? 'NUMERIC' : index === 1 ? 'GRADE' : 'BOOLEAN'
                  }
                />
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard
          title="Hold workflow"
          description="A held lot cannot be packed or transferred"
        >
          <div className="p-5">
            <div className="space-y-4">
              {[
                'Inspector records result',
                'System compares limits',
                'Manager reviews HOLD',
                'Release, rework or reject',
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${index < 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {index < 2 ? <Check size={13} /> : index + 1}
                  </div>
                  <p className="text-xs text-[#515463]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Traceability({ company }: { company: Company }) {
  const config = INDUSTRY_CONFIG[company.nobCode];
  const batch = getDemoBatches(company)[0];
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Farm-to-fork"
        title="QR traceability"
        description="Follow input lots, source batches, operational events, QC release and output packs through one auditable chain."
        action={
          <>
            <DemoBadge />
            <PrimaryButton icon={QrCode}>Generate QR pack</PrimaryButton>
          </>
        }
      />
      <SectionCard
        title="Trace chain"
        description={`${batch.code} · Complete sample lineage`}
        action={<StatusBadge label="Verified" tone="green" />}
      >
        <div className="overflow-x-auto p-6">
          <div className="flex min-w-[820px] items-center">
            {config.traceSteps.map((step, index) => (
              <div key={step} className="contents">
                <div className="w-28 shrink-0 text-center">
                  <div
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${index === config.traceSteps.length - 1 ? 'bg-[#0b1248] text-white' : 'bg-blue-50 text-[#1c4aa9]'}`}
                  >
                    {index === 0 ? (
                      <GitBranch size={18} />
                    ) : index === config.traceSteps.length - 1 ? (
                      <QrCode size={18} />
                    ) : (
                      <Boxes size={18} />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-[#2e313f]">
                    {step}
                  </p>
                  <p className="mt-1 text-[10px] text-[#8a8a8a]">
                    {index < 4 ? `LOT-${202 + index}` : `PACK-${9500 + index}`}
                  </p>
                </div>
                {index < config.traceSteps.length - 1 && (
                  <div className="mx-2 h-px min-w-8 flex-1 bg-[#d9d9d9]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="QR pack register"
          description="Only PASS inventory can receive an active QR code"
        >
          <DataTable>
            <thead>
              <tr>
                <TableHead>Pack</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>QC</TableHead>
                <TableHead>Generated</TableHead>
              </tr>
            </thead>
            <tbody>
              {['0009512', '0009511', '0009510', '0009509'].map((id, index) => (
                <tr key={id}>
                  <TableCell className="font-semibold text-[#2e313f]">
                    PACK-2026-{id}
                  </TableCell>
                  <TableCell>{config.primaryOutput}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={index === 3 ? 'HOLD' : 'PASS'}
                      tone={index === 3 ? 'amber' : 'green'}
                    />
                  </TableCell>
                  <TableCell>
                    {index === 0 ? '10:42 today' : `${index + 1}h ago`}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </SectionCard>
        <SectionCard
          title="Consumer QR preview"
          description="Public landing-page payload"
        >
          <div className="p-6">
            <div className="mx-auto max-w-sm rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white text-[#0b1248] shadow-sm">
                  <QrCode size={54} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2e313f]">
                    {company.name}
                  </p>
                  <p className="mt-1 text-xs text-[#707070]">
                    {config.primaryOutput}
                  </p>
                  <StatusBadge label="Quality verified" tone="green" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Batch" value={batch.code} />
                <Metric label="Origin" value={company.location} />
                <Metric label="Produced" value="15 Jul 2026" />
                <Metric label="Expiry" value="22 Jul 2026" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Resources({ company }: { company: Company }) {
  const resources = getResources(company);
  const config = INDUSTRY_CONFIG[company.nobCode];
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Capacity & scheduler"
        title="Resources and KPIs"
        description="Assign manpower, equipment and utilities to LOB schedulers, track usage cost, and monitor threshold-based performance."
        action={
          <>
            <DemoBadge />
            <PrimaryButton icon={Wrench}>Add resource</PrimaryButton>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <div
            key={resource.name}
            className="rounded-2xl border border-[#e7e7e7] bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1c4aa9]">
                {resource.type === 'MANPOWER' ? (
                  <Users size={18} />
                ) : (
                  <Wrench size={18} />
                )}
              </div>
              <StatusBadge
                label={resource.status}
                tone={statusTone(resource.status)}
              />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-[#2e313f]">
              {resource.name}
            </h2>
            <p className="mt-1 text-xs text-[#707070]">
              {resource.type} · {resource.allocation}
            </p>
            <div className="mt-4 border-t border-[#ededed] pt-3 text-xs font-medium text-[#515463]">
              {resource.cost}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="KPI scheduler"
          description="Thresholds are evaluated on operation save"
        >
          <DataTable>
            <thead>
              <tr>
                <TableHead>Parameter</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Alert</TableHead>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  config.dailyParameter,
                  'Daily',
                  'Programme ± 5%',
                  'Farm manager',
                ],
                [
                  config.qualityParameter,
                  'Per QC lot',
                  config.qualityTarget,
                  'Quality + Vet',
                ],
                ['Resource cost', 'Per shift', 'Budget ± 10%', 'Operations'],
                [
                  'Output yield',
                  'At output',
                  'Standard ≥ 98%',
                  'Finance + Manager',
                ],
              ].map((row, index) => (
                <tr key={row[0]}>
                  <TableCell className="font-semibold text-[#2e313f]">
                    {row[0]}
                  </TableCell>
                  <TableCell>{row[1]}</TableCell>
                  <TableCell>{row[2]}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={row[3]}
                      tone={index === 1 ? 'amber' : 'blue'}
                    />
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </SectionCard>
        <SectionCard
          title="Maintenance schedule"
          description="Equipment downtime is visible before batch assignment"
        >
          <div className="space-y-3 p-5">
            {resources
              .filter((r) => r.type !== 'MANPOWER')
              .map((resource, index) => (
                <div
                  key={resource.name}
                  className="rounded-xl border border-[#ededed] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#2e313f]">
                      {resource.name}
                    </p>
                    <StatusBadge
                      label={index ? 'Due soon' : 'Scheduled'}
                      tone={index ? 'amber' : 'blue'}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#707070]">
                    {index
                      ? '21 Jul 2026 · Preventive service'
                      : '18 Jul 2026 · Calibration'}
                  </p>
                </div>
              ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Reports({ company }: { company: Company }) {
  const config = INDUSTRY_CONFIG[company.nobCode];
  const variances = [
    {
      name: 'Price variance',
      value: 72,
      amount: '₹ 1,29,600',
      tone: 'bg-red-400',
    },
    {
      name: 'Usage variance',
      value: 48,
      amount: '₹ 49,680',
      tone: 'bg-amber-400',
    },
    {
      name: 'Output variance',
      value: 22,
      amount: '₹ 4,250',
      tone: 'bg-blue-400',
    },
    {
      name: 'Overhead variance',
      value: 34,
      amount: '₹ 5,000',
      tone: 'bg-violet-400',
    },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Analytics & finance"
        title="Reports"
        description="Operational, KPI, traceability and financial views derived from the same batch activity and costing rules."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Period WIP"
          value="₹ 18.4L"
          detail="Across active batches"
          icon={Coins}
        />
        <StatCard
          label="Output value"
          value="₹ 32.8L"
          detail={`${config.primaryOutput}`}
          icon={PackageCheck}
          tone="green"
        />
        <StatCard
          label="Unfavourable variance"
          value="₹ 1.88L"
          detail="Standard-cost batches only"
          icon={TrendingUp}
          tone="red"
        />
        <StatCard
          label="Gross margin"
          value="18.6%"
          detail="Demo management view"
          icon={BarChart3}
          tone="blue"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Variance analysis"
          description="Generated automatically when STANDARD batches close"
          action={<StatusBadge label="Jul 2026" tone="blue" />}
        >
          <div className="space-y-5 p-6">
            {variances.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="font-medium text-[#515463]">
                    {item.name}
                  </span>
                  <span className="font-semibold text-[#2e313f]">
                    {item.amount}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#ededed]">
                  <div
                    className={`h-2 rounded-full ${item.tone}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard
          title="Management reports"
          description="Ready-to-build report surfaces from the functional specification"
        >
          <div className="grid gap-3 p-5">
            {[
              ['Batch performance', 'Cost, output, FCR/yield and deviations'],
              ['Variance report', 'Price, usage, output and overhead'],
              ['Quality summary', 'QC pass, hold, fail and parameter trends'],
              ['Traceability register', 'Source batch to QR pack lineage'],
              ['Profit & loss', 'LOB and company contribution view'],
            ].map(([title, text], index) => (
              <button
                key={title}
                className="flex items-center gap-3 rounded-xl border border-[#ededed] p-3.5 text-left transition-colors hover:border-[#1c4aa9]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-[#1c4aa9]">
                  {index === 3 ? (
                    <QrCode size={16} />
                  ) : (
                    <FileBarChart size={16} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#2e313f]">
                    {title}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-[#707070]">
                    {text}
                  </p>
                </div>
                <ChevronRight size={15} className="text-[#aaa]" />
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard
        title="LOB performance"
        description="Comparative management summary"
      >
        <DataTable>
          <thead>
            <tr>
              <TableHead>Line of business</TableHead>
              <TableHead>Active batches</TableHead>
              <TableHead>Output achievement</TableHead>
              <TableHead>QC pass</TableHead>
              <TableHead>Cost position</TableHead>
            </tr>
          </thead>
          <tbody>
            {company.lobs.map((lob, index) => (
              <tr key={lob}>
                <TableCell className="font-semibold text-[#2e313f]">
                  {lob}
                </TableCell>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <ProgressBar value={92 - index * 3} tone="green" />
                    </div>
                    <span>{92 - index * 3}%</span>
                  </div>
                </TableCell>
                <TableCell>{98 - index * 0.8}%</TableCell>
                <TableCell>
                  <StatusBadge
                    label={index === 1 ? '2.4% over' : 'On plan'}
                    tone={index === 1 ? 'amber' : 'green'}
                  />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
    </div>
  );
}

const SETTINGS_TABS = [
  'Setup checklist',
  'Company',
  'Modules & LOBs',
  'Finance',
  'People',
  'Notifications',
  'Master data',
] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

function Settings({ company }: { company: Company }) {
  const [tab, setTab] = useState<SettingsTab>('Setup checklist');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Configuration"
        title="Settings & onboarding"
        description="The documented 15-step company setup, module configuration and master-data foundation in a frontend-only demo."
        action={
          <>
            <DemoBadge />
            <PrimaryButton icon={Check}>Save demo changes</PrimaryButton>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[230px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#e7e7e7] bg-white p-2">
          {SETTINGS_TABS.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors ${tab === item ? 'bg-[#0b1248] text-white' : 'text-[#606372] hover:bg-[#f7f7f7]'}`}
            >
              {settingsIcon(item)}
              {item}
            </button>
          ))}
        </aside>
        <div>
          {tab === 'Setup checklist' && <SetupChecklist company={company} />}
          {tab === 'Company' && <CompanySettings company={company} />}
          {tab === 'Modules & LOBs' && <ModuleSettings company={company} />}
          {tab === 'Finance' && <FinanceSettings />}
          {tab === 'People' && <PeopleSettings />}
          {tab === 'Notifications' && <NotificationSettings />}
          {tab === 'Master data' && <MasterDataSettings />}
        </div>
      </div>
    </div>
  );
}

function settingsIcon(tab: SettingsTab) {
  const props = { size: 15 };
  if (tab === 'Setup checklist') return <ClipboardCheck {...props} />;
  if (tab === 'Company') return <Building2 {...props} />;
  if (tab === 'Modules & LOBs') return <Boxes {...props} />;
  if (tab === 'Finance') return <Coins {...props} />;
  if (tab === 'People') return <UserRoundCog {...props} />;
  if (tab === 'Notifications') return <Bell {...props} />;
  return <Settings2 {...props} />;
}

function SetupChecklist({ company }: { company: Company }) {
  const completedCount = Math.round(
    (company.setupProgress / 100) * SETUP_STEPS.length,
  );
  return (
    <SectionCard
      title="Initial setup checklist"
      description="Steps 1–9 are the mandatory foundation; remaining configuration can be completed progressively"
      action={
        <StatusBadge
          label={`${company.setupProgress}% complete`}
          tone={company.setupProgress === 100 ? 'green' : 'amber'}
        />
      }
    >
      <div className="p-5 sm:p-6">
        <ProgressBar
          value={company.setupProgress}
          tone={company.setupProgress === 100 ? 'green' : 'blue'}
        />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {SETUP_STEPS.map((step, index) => {
            const complete = index < completedCount;
            return (
              <div
                key={step}
                className="flex items-center gap-3 rounded-xl border border-[#ededed] p-3.5"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {complete ? <Check size={13} /> : index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#2e313f]">{step}</p>
                  <p className="mt-0.5 text-[10px] text-[#8a8a8a]">
                    {index < 9
                      ? 'Mandatory foundation'
                      : 'Progressive configuration'}
                  </p>
                </div>
                <StatusBadge
                  label={complete ? 'Done' : 'Pending'}
                  tone={complete ? 'green' : 'gray'}
                />
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

function CompanySettings({ company }: { company: Company }) {
  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Company identity"
        description="Core profile used on reports, QR frames and mobile headers"
      >
        <SettingsGrid
          fields={[
            ['Legal name', company.name],
            ['Display name', company.name],
            ['Company code', company.slug.toUpperCase().slice(0, 12)],
            ['Registration no.', 'U01100MH2026PTC00184'],
          ]}
        />
      </SettingsPanel>
      <SettingsPanel
        title="Address & contacts"
        description="Registered office, operating locations and alert recipients"
      >
        <SettingsGrid
          fields={[
            ['Primary location', company.location],
            ['Address type', 'Farm / registered'],
            ['Primary contact', 'Rajesh Kumar Sharma'],
            ['Support email', 'operations@navfarm.demo'],
          ]}
        />
      </SettingsPanel>
      <SettingsPanel
        title="Language & region"
        description="English fallback with user-level language override"
      >
        <SettingsGrid
          fields={[
            ['Default language', 'English (en)'],
            ['Additional languages', 'Hindi, Marathi'],
            ['Timezone', 'Asia/Kolkata'],
            ['Country', 'India'],
          ]}
        />
      </SettingsPanel>
    </div>
  );
}

function ModuleSettings({ company }: { company: Company }) {
  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Enabled modules"
        description="Modules drive navigation, schedulers and configuration"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            'Batch Management',
            'Inventory & Costing',
            'Quality Control',
            'QR Traceability',
            'Finance & GL',
            'Analytics',
          ].map((module) => (
            <ToggleRow key={module} label={module} enabled />
          ))}
        </div>
      </SettingsPanel>
      <SettingsPanel
        title={`${company.nobName} lines of business`}
        description="Costing is configured per LOB and locked per approved batch"
      >
        <div className="space-y-3">
          {company.lobs.map((lob, index) => (
            <div
              key={lob}
              className="grid gap-3 rounded-xl border border-[#ededed] p-4 sm:grid-cols-[1fr_150px_90px] sm:items-center"
            >
              <div>
                <p className="text-xs font-semibold text-[#2e313f]">{lob}</p>
                <p className="mt-1 text-[11px] text-[#707070]">
                  Scheduler, QC and traceability enabled
                </p>
              </div>
              <StatusBadge
                label={
                  INDUSTRY_CONFIG[company.nobCode].costingMethods[
                    index %
                      INDUSTRY_CONFIG[company.nobCode].costingMethods.length
                  ]
                }
              />
              <StatusBadge label="Active" tone="green" />
            </div>
          ))}
        </div>
      </SettingsPanel>
    </div>
  );
}

function FinanceSettings() {
  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Fiscal & accounting"
        description="Base currency is locked after the first batch transaction"
      >
        <SettingsGrid
          fields={[
            ['Base currency', 'INR — Indian Rupee'],
            ['Fiscal year', 'April to March'],
            ['Accounting standard', 'IND AS / IAS 41'],
            ['Inventory valuation', 'LOB-level configuration'],
          ]}
        />
      </SettingsPanel>
      <SettingsPanel
        title="GL & item mapping"
        description="Entry type and item mapping determine automatic double-entry previews"
      >
        <div className="space-y-3">
          {[
            ['1100', 'Inventory - Feed & Consumables'],
            ['1110', 'Inventory - Live Animals / Birds'],
            ['1190', 'Batch Work in Progress'],
            ['6120', 'Usage Variance'],
            ['6140', 'Output Variance'],
          ].map(([code, name]) => (
            <div
              key={code}
              className="flex items-center gap-4 rounded-xl border border-[#ededed] p-3.5"
            >
              <span className="w-12 text-xs font-semibold text-[#1c4aa9]">
                {code}
              </span>
              <span className="flex-1 text-xs text-[#515463]">{name}</span>
              <StatusBadge label="Mapped" tone="green" />
            </div>
          ))}
        </div>
      </SettingsPanel>
    </div>
  );
}

function PeopleSettings() {
  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Users & roles"
        description="Company-scoped role-based access with granular module actions"
      >
        <div className="space-y-3">
          {[
            ['Rajesh Sharma', 'SUPER_ADMIN', 'All modules'],
            ['Anita Patel', 'FARM_MANAGER', 'Batches, operations, KPI'],
            ['Harish Rao', 'QC_INSPECTOR', 'QC and QR'],
            ['Meera Iyer', 'ACCOUNTANT', 'Finance and reports'],
          ].map(([name, role, scope]) => (
            <div
              key={name}
              className="grid gap-2 rounded-xl border border-[#ededed] p-4 sm:grid-cols-[1fr_150px_1fr] sm:items-center"
            >
              <p className="text-xs font-semibold text-[#2e313f]">{name}</p>
              <StatusBadge label={role} tone="blue" />
              <p className="text-[11px] text-[#707070]">{scope}</p>
            </div>
          ))}
        </div>
      </SettingsPanel>
    </div>
  );
}

function NotificationSettings() {
  return (
    <SettingsPanel
      title="Alert channels"
      description="KPI alerts and reports follow recipient language preferences"
    >
      <div className="space-y-3">
        {[
          ['In-app notifications', 'Immediate KPI and system alerts'],
          ['Email', 'Critical alerts and weekly reports'],
          ['SMS / WhatsApp', 'Critical operations alerts'],
          ['Push notifications', 'Flutter app delivery'],
          ['Webhook', 'Future external integration'],
        ].map(([name, detail], index) => (
          <ToggleRow
            key={name}
            label={name}
            detail={detail}
            enabled={index < 2}
          />
        ))}
      </div>
    </SettingsPanel>
  );
}

function MasterDataSettings() {
  return (
    <SettingsPanel
      title="Master data readiness"
      description="Reusable master records shared by configured LOBs"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['Units of measure', '24 records'],
          ['Items', '186 records'],
          ['Breeds / varieties', '32 records'],
          ['Locations', '18 records'],
          ['Resources', '41 records'],
          ['QC parameters', '28 records'],
          ['Schedulers', '16 templates'],
          ['Costing methods', '3 active'],
        ].map(([name, count], index) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-xl border border-[#ededed] p-4"
          >
            <div>
              <p className="text-xs font-semibold text-[#2e313f]">{name}</p>
              <p className="mt-1 text-[11px] text-[#707070]">{count}</p>
            </div>
            <StatusBadge
              label={index === 6 ? 'Review' : 'Ready'}
              tone={index === 6 ? 'amber' : 'green'}
            />
          </div>
        ))}
      </div>
    </SettingsPanel>
  );
}

function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <SectionCard title={title} description={description}>
      <div className="p-5 sm:p-6">{children}</div>
    </SectionCard>
  );
}
function SettingsGrid({ fields }: { fields: string[][] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <label key={label} className="block">
          <span className="mb-1.5 block text-[11px] font-semibold text-[#515463]">
            {label}
          </span>
          <input
            value={value}
            readOnly
            className="h-11 w-full rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-3.5 text-xs text-[#2e313f] outline-none"
          />
        </label>
      ))}
    </div>
  );
}
function ToggleRow({
  label,
  detail,
  enabled = false,
}: {
  label: string;
  detail?: string;
  enabled?: boolean;
}) {
  const [on, setOn] = useState(enabled);
  return (
    <button
      onClick={() => setOn(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#ededed] p-3.5 text-left"
    >
      <div>
        <p className="text-xs font-semibold text-[#2e313f]">{label}</p>
        {detail && <p className="mt-1 text-[11px] text-[#707070]">{detail}</p>}
      </div>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? 'bg-[#1c4aa9]' : 'bg-[#d8d8d8]'}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </span>
    </button>
  );
}
