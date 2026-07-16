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
  LockKeyhole,
  PackageCheck,
  Plus,
  QrCode,
  Settings2,
  ShieldCheck,
  TrendingUp,
  UserRoundCog,
  Users,
  Wrench,
} from 'lucide-react';
import { useCurrentCompany } from '@/modules/company/use-current-company';
import {
  getDemoBatches,
  getDemoTasks,
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
import { useDemoStore, type MasterRecord, type QualityLot, type WorkflowBatch } from './demo-store';
import {
  BatchDialog,
  DispositionDialog,
  OnboardingWizard,
  OperationDialog,
  QrDialog,
  QualityDialog,
  ResourceDialog,
} from './workflow-dialogs';

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
  const { state } = useDemoStore();
  if (!company) return <EmptyCompany />;

  if (state.setup.completedSteps < 9 && kind !== 'settings' && kind !== 'dashboard')
    return <LockedWorkspace company={company} />;

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

function LockedWorkspace({ company }: { company: Company }) {
  const { state } = useDemoStore();
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <SectionCard className="max-w-xl">
        <div className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><LockKeyhole size={24} /></div>
          <h1 className="mt-5 text-xl font-semibold text-[#2e313f]">Mandatory setup is incomplete</h1>
          <p className="mt-2 text-sm leading-6 text-[#707070]">Complete steps 1–9 before creating batches or entering production data. Current progress: {state.setup.completedSteps}/15 steps.</p>
          <Link href={`/${company.slug}/settings`} className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white">Continue company setup</Link>
        </div>
      </SectionCard>
    </div>
  );
}

type Company = NonNullable<ReturnType<typeof useCurrentCompany>>;

function PrimaryButton({
  icon: Icon = Plus,
  children,
  onClick,
  disabled = false,
}: {
  icon?: typeof Plus;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button disabled={disabled} onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#151d5e] disabled:cursor-not-allowed disabled:opacity-40">
      <Icon size={15} /> {children}
    </button>
  );
}

function Dashboard({ company }: { company: Company }) {
  const batches = getDemoBatches(company);
  const tasks = getDemoTasks(company);
  const config = INDUSTRY_CONFIG[company.nobCode];
  const { state, calculateVariance } = useDemoStore();
  const activeCount = state.batches.filter((batch) => batch.status === 'APPROVED' || batch.status === 'QC_HOLD' || batch.status === 'READY_TO_CLOSE').length;
  const passRate = state.qualityLots.length ? (state.qualityLots.filter((lot) => lot.status === 'PASS').length / state.qualityLots.length) * 100 : 0;
  const totalVariance = state.batches.reduce((sum, batch) => sum + calculateVariance(batch).total, 0);
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
          value={String(activeCount)}
          detail={`${state.batches.filter((batch) => batch.status === 'READY_TO_CLOSE').length} approaching close`}
          icon={Boxes}
          tone="blue"
        />
        <StatCard
          label="Tasks due today"
          value={String(tasks.filter((task) => task.status !== 'Completed').length)}
          detail={`${tasks.filter((task) => task.status === 'Deviation').length} KPI reading needs attention`}
          icon={CalendarClock}
          tone="amber"
        />
        <StatCard
          label="QC release rate"
          value={`${passRate.toFixed(1)}%`}
          detail="Across the last 30 QC lots"
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="Cost variance"
          value={`₹ ${(totalVariance / 100000).toFixed(2)}L`}
          detail="Projected STANDARD close variance"
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
  const { state, approveBatch, closeBatch, calculateVariance } = useDemoStore();
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const active = state.batches.filter((batch) => batch.status === 'APPROVED' || batch.status === 'QC_HOLD').length;
  const ready = state.batches.filter((batch) => batch.status === 'READY_TO_CLOSE').length;
  const wip = state.batches.reduce((sum, batch) => sum + batch.wip, 0);
  function close(batch: WorkflowBatch) {
    const result = closeBatch(batch.id);
    setNotice(result.message);
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Production lifecycle"
        title="Batches"
        description="Create, approve, operate, output and close traceable production batches. Costing is locked when a draft batch is approved."
        action={
          <>
            <DemoBadge />
            <PrimaryButton onClick={() => setCreating(true)}>New batch</PrimaryButton>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total batches"
          value={String(state.batches.length)}
          detail={`${active} active · ${state.batches.filter((batch) => batch.status === 'DRAFT').length} draft`}
          icon={Boxes}
        />
        <StatCard
          label="WIP value"
          value={`₹ ${(wip / 100000).toFixed(2)}L`}
          detail="Across all active batches"
          icon={Coins}
          tone="blue"
        />
        <StatCard
          label="Ready to close"
          value={String(ready)}
          detail="Balance check pending"
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="At risk / hold"
          value={String(state.batches.filter((batch) => batch.status === 'QC_HOLD').length)}
          detail="One QC hold, one KPI risk"
          icon={AlertTriangle}
          tone="amber"
        />
      </div>
      <DomainProcess company={company} />
      <SectionCard
        title="Batch register"
        description="Document-aligned local fixtures; no backend records are created"
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
            {state.batches.map((batch) => {
              const variance = calculateVariance(batch);
              return (
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
                    <ProgressBar value={batch.status === 'CLOSED' ? 100 : batch.actualOutput > 0 ? Math.min(96, (batch.actualOutput / batch.expectedOutput) * 100) : batch.status === 'DRAFT' ? 10 : 55} />
                  </div>
                </TableCell>
                <TableCell>
                  <p>{batch.inputQty.toLocaleString('en-IN')} {batch.inputUom}</p>
                  <p className="mt-1 text-[11px] text-[#707070]">
                    Output {batch.actualOutput.toLocaleString('en-IN')} / {batch.expectedOutput.toLocaleString('en-IN')}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-[#2e313f]">₹ {batch.wip.toLocaleString('en-IN')}</p>
                  <p className="mt-1 text-[11px] text-[#707070]">
                    {batch.method === 'STANDARD' ? `Projected variance ₹ ${variance.total.toLocaleString('en-IN')}` : 'Actual-cost settlement'}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={batch.status.replaceAll('_', ' ')}
                    tone={batch.status === 'CLOSED' ? 'green' : batch.status === 'QC_HOLD' ? 'amber' : batch.status === 'DRAFT' ? 'gray' : 'blue'}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {batch.status === 'DRAFT' && <button onClick={() => approveBatch(batch.id)} className="text-[10px] font-semibold text-[#1c4aa9]">Approve & lock</button>}
                    {batch.status === 'READY_TO_CLOSE' && <button onClick={() => close(batch)} className="text-[10px] font-semibold text-[#c24332]">Run close</button>}
                  </div>
                </TableCell>
              </tr>
              );
            })}
          </tbody>
        </DataTable>
      </SectionCard>
      {notice && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">{notice}</div>}
      {creating && <BatchDialog company={company} onClose={() => setCreating(false)} />}
    </div>
  );
}

function DomainProcess({ company }: { company: Company }) {
  const rules: Record<typeof company.nobCode, string[]> = {
    POULTRY: ['Rearing → laying/CB source-batch transfer', 'Hatching candling at days 7/14/18 with setter-to-hatcher transfer', 'Mortality is expensed; slaughter supports main/by-product cost split'],
    LIVESTOCK: ['Premature costs capitalize to biological-asset NCA', 'Maturity starts amortisation and fair-value review', 'Milk, offspring, wool and disposal retain animal/batch lineage'],
    AGRICULTURE: ['Bearer plant premature-to-mature stage control', 'Annual harvest enters FIFO inventory', 'Closed mature-season batches copy scheduler and location to next year'],
    AQUACULTURE: ['Fingerling stocking and pond sub-location tracking', 'Feed capitalizes to biological-asset NCA', 'Partial/full harvests create FIFO lots before aqua slaughter split'],
    INSECT: ['Colony/hive placement and maintenance costs', 'Honey and wax are separate traceable outputs', 'Moisture, HMF and grade QC gate jar QR generation'],
    PROCESSING: ['BOR version and ingredient lines lock at approval', 'Actual inclusion is compared with recipe quantity and nutrition', 'Resource/indirect costs enter WIP before QC-released finished feed'],
  };
  return (
    <SectionCard title={`${company.nobName} process controls`} description="Documented LOB rules represented by the shared batch, operation, QC and close engine">
      <div className="grid gap-3 p-5 md:grid-cols-3">{rules[company.nobCode].map((rule, index) => <div key={rule} className="rounded-xl border border-[#ededed] p-4"><span className="text-[10px] font-semibold text-[#1c4aa9]">RULE {index + 1}</span><p className="mt-2 text-xs leading-5 text-[#515463]">{rule}</p></div>)}</div>
    </SectionCard>
  );
}

function Operations({ company }: { company: Company }) {
  const tasks = getDemoTasks(company);
  const config = INDUSTRY_CONFIG[company.nobCode];
  const { state } = useDemoStore();
  const [recording, setRecording] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Daily / weekly entry"
        title="Operations"
        description="Record scheduled consumption, outputs, observations, overheads, resources and loss events against an approved batch."
        action={
          <>
            <DemoBadge />
            <PrimaryButton onClick={() => setRecording(true)}>Record entry</PrimaryButton>
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
      <SectionCard title="Saved operation entries" description="Local demo transactions shared with batch costing, QC and reports">
        {state.operations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#707070]">No user-entered transactions yet. Record an entry to see the connected workflow.</div>
        ) : (
          <DataTable><thead><tr><TableHead>Entry</TableHead><TableHead>Batch</TableHead><TableHead>Actual / expected</TableHead><TableHead>Journal</TableHead></tr></thead><tbody>{state.operations.slice(0, 8).map((entry) => { const batch = state.batches.find((item) => item.id === entry.batchId); return <tr key={entry.id}><TableCell><p className="font-semibold text-[#2e313f]">{entry.entryType}</p><p className="mt-1 text-[11px]">{entry.parameter}</p></TableCell><TableCell>{batch?.code}</TableCell><TableCell>{entry.quantity} {entry.uom}{entry.expected !== undefined ? ` / ${entry.expected}` : ''}</TableCell><TableCell>{entry.journal ? `Dr ${entry.journal.debit} → Cr ${entry.journal.credit} · ₹${entry.journal.amount.toLocaleString('en-IN')}` : 'No cost impact'}</TableCell></tr>; })}</tbody></DataTable>
        )}
      </SectionCard>
      {recording && <OperationDialog company={company} onClose={() => setRecording(false)} />}
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
  const { state } = useDemoStore();
  const records = state.qualityLots;
  const config = INDUSTRY_CONFIG[company.nobCode];
  const [creating, setCreating] = useState(false);
  const [inspecting, setInspecting] = useState<QualityLot | null>(null);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Quality control"
        title="QC batches & release"
        description="Separate QC batches evaluate numeric, visual, grade and boolean parameters before inventory is released or QR packs are generated."
        action={
          <>
            <DemoBadge />
            <PrimaryButton icon={ClipboardCheck} onClick={() => setCreating(true)}>New QC batch</PrimaryButton>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting inspection"
          value={String(records.filter((record) => record.status === 'HOLD').length)}
          detail="Oldest: 3h 18m"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Pass rate"
          value={`${records.length ? ((records.filter((record) => record.status === 'PASS').length / records.length) * 100).toFixed(1) : '0.0'}%`}
          detail="30-day rolling result"
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="On hold"
          value={String(records.filter((record) => record.status === 'HOLD').length)}
          detail="Manager disposition required"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Failed"
          value={String(records.filter((record) => record.status === 'FAIL').length)}
          detail="Temperature excursion"
          icon={Activity}
          tone="red"
        />
      </div>
      <SectionCard
        title="QC lot register"
        description={`Primary configured parameter: ${config.qualityParameter} · Target ${config.qualityTarget}`}
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
              <tr key={record.id}>
                <TableCell className="font-semibold text-[#2e313f]">
                  {record.code}
                </TableCell>
                <TableCell>{state.batches.find((batch) => batch.id === record.batchId)?.code ?? 'Unknown'}</TableCell>
                <TableCell>{record.parameter}</TableCell>
                <TableCell>{record.result}</TableCell>
                <TableCell>{record.owner}</TableCell>
                <TableCell>
                  <button onClick={() => setInspecting(record)} className="flex items-center gap-2"><StatusBadge label={record.status} tone={statusTone(record.status)} /><span className="text-[10px] font-semibold text-[#1c4aa9]">Inspect</span></button>
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
      {creating && <QualityDialog company={company} onClose={() => setCreating(false)} />}
      {inspecting && <DispositionDialog lot={inspecting} onClose={() => setInspecting(null)} />}
    </div>
  );
}

function Traceability({ company }: { company: Company }) {
  const config = INDUSTRY_CONFIG[company.nobCode];
  const { state } = useDemoStore();
  const [generating, setGenerating] = useState(false);
  const workflowBatch = state.batches.find((item) => item.qcStatus === 'PASS') ?? state.batches[0];
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
            <PrimaryButton icon={QrCode} onClick={() => setGenerating(true)}>Generate QR pack</PrimaryButton>
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
              {(state.qrPacks.length ? state.qrPacks : [
                { id: 'seed-1', code: 'PACK-2026-0009512', batchId: workflowBatch.id, createdAt: new Date(2026, 6, 15, 10, 42).toISOString(), quantity: 1, payload: '{}' },
              ]).map((pack) => (
                <tr key={pack.id}>
                  <TableCell className="font-semibold text-[#2e313f]">
                    {pack.code}
                  </TableCell>
                  <TableCell>{config.primaryOutput}</TableCell>
                  <TableCell>
                    <StatusBadge label="PASS" tone="green" />
                  </TableCell>
                  <TableCell>{new Date(pack.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
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
                <Metric label="Batch" value={workflowBatch.code} />
                <Metric label="Origin" value={company.location} />
                <Metric label="Produced" value="15 Jul 2026" />
                <Metric label="Expiry" value="22 Jul 2026" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
      {generating && <QrDialog onClose={() => setGenerating(false)} />}
    </div>
  );
}

function Resources({ company }: { company: Company }) {
  const { state } = useDemoStore();
  const resources = state.resources;
  const config = INDUSTRY_CONFIG[company.nobCode];
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Capacity & scheduler"
        title="Resources and KPIs"
        description="Assign manpower, equipment and utilities to LOB schedulers, track usage cost, and monitor threshold-based performance."
        action={
          <>
            <DemoBadge />
            <PrimaryButton icon={Wrench} onClick={() => setAdding(true)}>Add resource</PrimaryButton>
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
              ₹ {resource.costRate.toLocaleString('en-IN')} / {resource.costUom.toLowerCase()}
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
      {adding && <ResourceDialog company={company} onClose={() => setAdding(false)} />}
    </div>
  );
}

function Reports({ company }: { company: Company }) {
  const config = INDUSTRY_CONFIG[company.nobCode];
  const { state, calculateVariance } = useDemoStore();
  const totals = state.batches.reduce((sum, batch) => {
    const current = calculateVariance(batch);
    return { price: sum.price + current.price, usage: sum.usage + current.usage, output: sum.output + current.output, overhead: sum.overhead + current.overhead };
  }, { price: 0, usage: 0, output: 0, overhead: 0 });
  const maxVariance = Math.max(1, totals.price, totals.usage, totals.output, totals.overhead);
  const variances = [
    {
      name: 'Price variance',
      value: (totals.price / maxVariance) * 100,
      amount: `₹ ${totals.price.toLocaleString('en-IN')}`,
      tone: 'bg-red-400',
    },
    {
      name: 'Usage variance',
      value: (totals.usage / maxVariance) * 100,
      amount: `₹ ${totals.usage.toLocaleString('en-IN')}`,
      tone: 'bg-amber-400',
    },
    {
      name: 'Output variance',
      value: (totals.output / maxVariance) * 100,
      amount: `₹ ${totals.output.toLocaleString('en-IN')}`,
      tone: 'bg-blue-400',
    },
    {
      name: 'Overhead variance',
      value: (totals.overhead / maxVariance) * 100,
      amount: `₹ ${totals.overhead.toLocaleString('en-IN')}`,
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
          value={`₹ ${(state.batches.reduce((sum, batch) => sum + batch.wip, 0) / 100000).toFixed(2)}L`}
          detail="Across active batches"
          icon={Coins}
        />
        <StatCard
          label="Output value"
          value={`₹ ${(state.batches.reduce((sum, batch) => sum + batch.actualOutput * batch.standardRate, 0) / 100000).toFixed(2)}L`}
          detail={`${config.primaryOutput}`}
          icon={PackageCheck}
          tone="green"
        />
        <StatCard
          label="Unfavourable variance"
          value={`₹ ${((totals.price + totals.usage + totals.output + totals.overhead) / 100000).toFixed(2)}L`}
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
          description="Downloadable local CSV views from the connected demo state"
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
                onClick={() => downloadDemoReport(title, state)}
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
      <SectionCard title="Audit trail" description="Cross-module actions recorded by the local demo boundary">
        <div className="divide-y divide-[#ededed]">{state.auditLog.slice(0, 10).map((item, index) => <div key={`${item}-${index}`} className="flex gap-3 px-5 py-3.5 text-xs text-[#515463]"><span className="font-semibold text-[#1c4aa9]">{String(index + 1).padStart(2, '0')}</span><span>{item}</span></div>)}</div>
      </SectionCard>
    </div>
  );
}

function downloadDemoReport(title: string, state: ReturnType<typeof useDemoStore>['state']) {
  const header = ['Report', 'Batch', 'LOB', 'Method', 'Status', 'WIP', 'Actual output'];
  const rows = state.batches.map((batch) => [title, batch.code, batch.lob, batch.method, batch.status, batch.wip, batch.actualOutput]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `navfarm-${title.toLowerCase().replaceAll(' ', '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const { resetDemo } = useDemoStore();
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Configuration"
        title="Settings & onboarding"
        description="The documented 15-step company setup, module configuration and master-data foundation in a frontend-only demo."
        action={
          <>
            <DemoBadge />
            <button onClick={resetDemo} className="h-10 rounded-xl border border-[#dedede] px-3 text-xs font-semibold text-[#515463]">Reset demo</button>
            <PrimaryButton icon={Check} onClick={() => setWizardOpen(true)}>Open setup wizard</PrimaryButton>
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
      {wizardOpen && <OnboardingWizard company={company} onClose={() => setWizardOpen(false)} />}
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
  const { state } = useDemoStore();
  const completedCount = state.setup.completedSteps;
  const progress = (completedCount / SETUP_STEPS.length) * 100;
  return (
    <SectionCard
      title="Initial setup checklist"
      description="Steps 1–9 are the mandatory foundation; remaining configuration can be completed progressively"
      action={
        <StatusBadge
          label={`${Math.round(progress)}% complete`}
          tone={progress === 100 ? 'green' : 'amber'}
        />
      }
    >
      <div className="p-5 sm:p-6">
        <ProgressBar
          value={progress}
          tone={progress === 100 ? 'green' : 'blue'}
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
                    {index < 9 ? 'Mandatory foundation' : index === 10 || index === 11 ? 'Operational readiness' : 'Progressive configuration'}
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
  const { state } = useDemoStore();
  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Company identity"
        description="Core profile used on reports, QR frames and mobile headers"
      >
        <SettingsGrid
          fields={[
            ['Legal name', state.setup.legalName],
            ['Display name', state.setup.displayName],
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
            ['Primary location', state.setup.address],
            ['Address type', 'Farm / registered'],
            ['Primary contact', state.setup.contactName],
            ['Support email', state.setup.contactEmail],
          ]}
        />
      </SettingsPanel>
      <SettingsPanel
        title="Language & region"
        description="English fallback with user-level language override"
      >
        <SettingsGrid
          fields={[
            ['Default language', state.setup.language],
            ['Additional languages', 'Hindi, Marathi'],
            ['Timezone', state.setup.timezone],
            ['Country', 'India'],
          ]}
        />
      </SettingsPanel>
    </div>
  );
}

function ModuleSettings({ company }: { company: Company }) {
  const { state, setModule } = useDemoStore();
  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Enabled modules"
        description="Modules drive navigation, schedulers and configuration"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            'Batches',
            'Inventory',
            'QC',
            'QR',
            'Finance',
            'Analytics',
          ].map((module) => (
            <ToggleRow key={module} label={module} enabled={state.setup.modules.includes(module)} onChange={(enabled) => setModule(module, enabled)} />
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
  const { state } = useDemoStore();
  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Fiscal & accounting"
        description="Base currency is locked after the first batch transaction"
      >
        <SettingsGrid
          fields={[
            ['Base currency', state.setup.currency],
            ['Fiscal year', state.setup.fiscalYear],
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
      <SettingsPanel title="Role permission matrix" description="Documented company-scoped permissions used for the future authorization boundary">
        <DataTable><thead><tr><TableHead>Role</TableHead><TableHead>Create</TableHead><TableHead>Approve</TableHead><TableHead>Cost</TableHead><TableHead>Finance</TableHead><TableHead>Users</TableHead><TableHead>Export</TableHead></tr></thead><tbody>{[
          ['SUPER_ADMIN', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'], ['FARM_MANAGER', 'Yes', 'Yes', 'Own farms', 'No', 'No', 'Yes'], ['ACCOUNTANT', 'No', 'No', 'All', 'Yes', 'No', 'Yes'], ['AUDITOR', 'No', 'No', 'All', 'Read only', 'No', 'Yes'], ['SUPERVISOR', 'Yes', 'No', 'Own batches', 'No', 'No', 'No'], ['VIEWER', 'No', 'No', 'No', 'No', 'No', 'No'],
        ].map((row) => <tr key={row[0]}>{row.map((cell, index) => <TableCell key={`${row[0]}-${index}`} className={index === 0 ? 'font-semibold text-[#2e313f]' : ''}>{cell}</TableCell>)}</tr>)}</tbody></DataTable>
      </SettingsPanel>
    </div>
  );
}

function NotificationSettings() {
  const { state, setNotificationChannel } = useDemoStore();
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
        ].map(([name, detail]) => (
          <ToggleRow
            key={name}
            label={name}
            detail={detail}
            enabled={state.setup.notificationChannels.includes(name)}
            onChange={(enabled) => setNotificationChannel(name, enabled)}
          />
        ))}
      </div>
    </SettingsPanel>
  );
}

function MasterDataSettings() {
  const { state, addMasterRecord, removeMasterRecord } = useDemoStore();
  const [record, setRecord] = useState<Omit<MasterRecord, 'id'>>({ type: 'ITEM', code: '', name: '', uom: 'KG' });
  function add() {
    if (!record.code.trim() || !record.name.trim()) return;
    addMasterRecord(record);
    setRecord({ ...record, code: '', name: '' });
  }
  return (
    <div className="space-y-5">
      <SettingsPanel title="Add master record" description="Configuration-driven UOM, item, breed/variety and multi-level location fixtures">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={record.type} onChange={(e) => setRecord({ ...record, type: e.target.value as MasterRecord['type'] })} className="h-11 rounded-xl border border-[#dedede] px-3 text-xs"><option>UOM</option><option>ITEM</option><option>BREED</option><option>LOCATION</option></select>
          <input value={record.code} onChange={(e) => setRecord({ ...record, code: e.target.value })} placeholder="Code" className="h-11 rounded-xl border border-[#dedede] px-3 text-xs" />
          <input value={record.name} onChange={(e) => setRecord({ ...record, name: e.target.value })} placeholder="Name" className="h-11 rounded-xl border border-[#dedede] px-3 text-xs" />
          <button onClick={add} className="h-11 rounded-xl bg-[#0b1248] px-3 text-xs font-semibold text-white">Add local record</button>
        </div>
      </SettingsPanel>
      <SettingsPanel title="Master data register" description="Local fixtures remain easy to replace with the future master-data API">
        <div className="divide-y divide-[#ededed]">{state.masterData.map((item) => <div key={item.id} className="grid grid-cols-[70px_100px_1fr_auto] items-center gap-3 py-3 text-xs"><StatusBadge label={item.type} tone="blue" /><span className="font-semibold text-[#2e313f]">{item.code}</span><span className="text-[#707070]">{item.name} · {item.uom}</span><button onClick={() => removeMasterRecord(item.id)} className="font-semibold text-[#c24332]">Remove</button></div>)}</div>
      </SettingsPanel>
    </div>
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
  onChange,
}: {
  label: string;
  detail?: string;
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
}) {
  const [on, setOn] = useState(enabled);
  const active = onChange ? enabled : on;
  return (
    <button
      onClick={() => {
        setOn(!active);
        onChange?.(!active);
      }}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#ededed] p-3.5 text-left"
    >
      <div>
        <p className="text-xs font-semibold text-[#2e313f]">{label}</p>
        {detail && <p className="mt-1 text-[11px] text-[#707070]">{detail}</p>}
      </div>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${active ? 'bg-[#1c4aa9]' : 'bg-[#d8d8d8]'}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </span>
    </button>
  );
}
