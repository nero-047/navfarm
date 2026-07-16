'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { CompanyMeta } from '@/modules/company';
import { INDUSTRY_CONFIG, SETUP_STEPS } from './data';
import {
  type CostingMethod,
  type DemoResourceRecord,
  type NewOperationInput,
  type QualityLot,
  type WorkflowBatch,
  useDemoStore,
} from './demo-store';
import { StatusBadge } from './components';
import { FullPageOverlay } from '@/components/ui/full-page-overlay';

const inputClass =
  'h-11 w-full rounded-xl border border-[#dedede] bg-white px-3.5 text-sm text-[#2e313f] outline-none focus:border-[#1c4aa9]';

export function WorkflowDialog({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <FullPageOverlay onClose={onClose} className="max-w-2xl">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#ededed] bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#2e313f]">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-[#707070]">
              {description}
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#707070] hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </FullPageOverlay>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#515463]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[10px] leading-4 text-[#8a8a8a]">
          {hint}
        </span>
      )}
    </label>
  );
}

function SubmitRow({
  label,
  onClose,
  disabled = false,
}: {
  label: string;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3 border-t border-[#ededed] pt-5">
      <button
        type="button"
        onClick={onClose}
        className="h-10 rounded-xl border border-[#dedede] px-4 text-xs font-semibold text-[#515463]"
      >
        Cancel
      </button>
      <button
        disabled={disabled}
        className="h-10 rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}

export function BatchDialog({
  company,
  onClose,
}: {
  company: CompanyMeta;
  onClose: () => void;
}) {
  const { state, createBatch } = useDemoStore();
  const config = INDUSTRY_CONFIG[company.nobCode];
  const [lob, setLob] = useState(company.lobs[0]);
  const [method, setMethod] = useState<CostingMethod>(
    config.costingMethods[0] as CostingMethod,
  );
  const [inputQty, setInputQty] = useState(10000);
  const [expectedOutput, setExpectedOutput] = useState(9800);
  const [sourceBatchId, setSourceBatchId] = useState('');
  const [borVersion, setBorVersion] = useState('BOR-2026-001 V1');
  const isSlaughter = lob.toLowerCase().includes('slaughter');
  function submit(event: FormEvent) {
    event.preventDefault();
    createBatch({
      lob,
      method,
      inputQty,
      expectedOutput,
      sourceBatchId: sourceBatchId || undefined,
      borVersion: company.nobCode === 'PROCESSING' ? borVersion : undefined,
      costSplitMethod: isSlaughter ? 'FIXED_PERCENT' : undefined,
    });
    onClose();
  }
  return (
    <WorkflowDialog
      title="Create production batch"
      description="The batch starts in DRAFT. Approval locks costing, standards, source lineage, BOR version and slaughter split method."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Line of business">
            <select
              className={inputClass}
              value={lob}
              onChange={(e) => setLob(e.target.value)}
            >
              {company.lobs.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Costing method">
            <select
              className={inputClass}
              value={method}
              onChange={(e) => setMethod(e.target.value as CostingMethod)}
            >
              {config.costingMethods.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label={`Opening quantity (${config.unit})`}>
            <input
              className={inputClass}
              min="1"
              type="number"
              value={inputQty}
              onChange={(e) => setInputQty(Number(e.target.value))}
            />
          </Field>
          <Field label="Expected output">
            <input
              className={inputClass}
              min="1"
              type="number"
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(Number(e.target.value))}
            />
          </Field>
          <Field
            label="Source batch"
            hint="Creates batch_input_lines.source_batch_id for farm-to-fork traceability."
          >
            <select
              className={inputClass}
              value={sourceBatchId}
              onChange={(e) => setSourceBatchId(e.target.value)}
            >
              <option value="">Purchased / opening inventory</option>
              {state.batches
                .filter(
                  (item) => item.status === 'CLOSED' || item.actualOutput > 0,
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code}
                  </option>
                ))}
            </select>
          </Field>
          {company.nobCode === 'PROCESSING' && (
            <Field
              label="Bill of Recipe version"
              hint="The selected version is locked at approval."
            >
              <input
                className={inputClass}
                value={borVersion}
                onChange={(e) => setBorVersion(e.target.value)}
              />
            </Field>
          )}
          {isSlaughter && (
            <Field label="Cost split method">
              <select className={inputClass}>
                <option>Fixed percentage</option>
                <option>By output weight</option>
                <option>Main product absorbs all</option>
              </select>
            </Field>
          )}
        </div>
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
          {method === 'STANDARD'
            ? 'Close will calculate price, usage, output and overhead variances.'
            : method === 'FIFO'
              ? 'FIFO layers retain actual cost; no variance journals are created.'
              : 'Costs capitalize to the biological asset NCA until maturity or harvest.'}
        </div>
        <SubmitRow
          label="Create draft batch"
          onClose={onClose}
          disabled={!lob || inputQty <= 0 || expectedOutput <= 0}
        />
      </form>
    </WorkflowDialog>
  );
}

export function OperationDialog({
  company,
  onClose,
}: {
  company: CompanyMeta;
  onClose: () => void;
}) {
  const { state, recordOperation } = useDemoStore();
  const approved = state.batches.filter(
    (item) =>
      item.status === 'APPROVED' ||
      item.status === 'ACTIVE' ||
      item.status === 'READY_TO_CLOSE',
  );
  const [entry, setEntry] = useState<NewOperationInput>({
    batchId: approved[0]?.id ?? '',
    entryType: 'CONSUMPTION',
    parameter: INDUSTRY_CONFIG[company.nobCode].dailyParameter,
    quantity: 100,
    uom: 'KG',
    unitCost: 20,
    expected: 95,
    notes: '',
  });
  const amount = entry.quantity * entry.unitCost;
  function submit(event: FormEvent) {
    event.preventDefault();
    recordOperation(entry);
    onClose();
  }
  const credit =
    entry.entryType === 'OUTPUT' || entry.entryType === 'MORTALITY'
      ? '1190 Batch WIP'
      : entry.entryType === 'CONSUMPTION'
        ? '1100 Input Inventory'
        : '2100 Accounts Payable';
  const debit =
    entry.entryType === 'OUTPUT'
      ? '1150 Output Inventory'
      : entry.entryType === 'MORTALITY'
        ? '7120 Mortality Loss'
        : '1190 Batch WIP';
  return (
    <WorkflowDialog
      title="Record batch operation"
      description="Only approved batches accept entries. Inventory and cost events generate a balanced double-entry journal preview."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {approved.length === 0 ? (
          <Notice tone="error">
            No approved batch is available. Approve a draft batch first.
          </Notice>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Approved batch">
              <select
                className={inputClass}
                value={entry.batchId}
                onChange={(e) =>
                  setEntry({ ...entry, batchId: e.target.value })
                }
              >
                {approved.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.lob}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Entry type">
              <select
                className={inputClass}
                value={entry.entryType}
                onChange={(e) =>
                  setEntry({
                    ...entry,
                    entryType: e.target.value as NewOperationInput['entryType'],
                  })
                }
              >
                {[
                  'CONSUMPTION',
                  'OUTPUT',
                  'OVERHEAD',
                  'RESOURCE',
                  'MORTALITY',
                  'OBSERVATION',
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Parameter">
              <input
                className={inputClass}
                value={entry.parameter}
                onChange={(e) =>
                  setEntry({ ...entry, parameter: e.target.value })
                }
              />
            </Field>
            <Field label="Expected quantity">
              <input
                className={inputClass}
                type="number"
                value={entry.expected}
                onChange={(e) =>
                  setEntry({ ...entry, expected: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Actual quantity">
              <input
                className={inputClass}
                min="0"
                type="number"
                value={entry.quantity}
                onChange={(e) =>
                  setEntry({ ...entry, quantity: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Unit">
              <select
                className={inputClass}
                value={entry.uom}
                onChange={(e) => setEntry({ ...entry, uom: e.target.value })}
              >
                <option>KG</option>
                <option>NOS</option>
                <option>HOUR</option>
                <option>LITRE</option>
              </select>
            </Field>
            <Field label="Unit cost (₹)">
              <input
                className={inputClass}
                min="0"
                step="0.01"
                type="number"
                value={entry.unitCost}
                onChange={(e) =>
                  setEntry({ ...entry, unitCost: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Notes">
              <input
                className={inputClass}
                value={entry.notes}
                onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
                placeholder="Observation or source detail"
              />
            </Field>
          </div>
        )}
        {entry.entryType !== 'OBSERVATION' && approved.length > 0 && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
            <p className="font-semibold">Balanced accounting preview</p>
            <p className="mt-1">
              Dr {debit} → Cr {credit} · ₹{amount.toLocaleString('en-IN')}
            </p>
          </div>
        )}
        <SubmitRow
          label="Save operation"
          onClose={onClose}
          disabled={!entry.batchId || entry.quantity < 0}
        />
      </form>
    </WorkflowDialog>
  );
}

export function QualityDialog({
  company,
  onClose,
}: {
  company: CompanyMeta;
  onClose: () => void;
}) {
  const { state, createQualityLot } = useDemoStore();
  const candidates = state.batches.filter(
    (item) => item.status !== 'DRAFT' && item.status !== 'CLOSED',
  );
  const [batchId, setBatchId] = useState(candidates[0]?.id ?? '');
  const [parameter, setParameter] = useState(
    INDUSTRY_CONFIG[company.nobCode].qualityParameter,
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    createQualityLot(batchId, parameter);
    onClose();
  }
  return (
    <WorkflowDialog
      title="Create QC batch"
      description="The selected output stays on hold until the inspection is completed."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Source production batch">
            <select
              className={inputClass}
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
            >
              {candidates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="QC parameter">
            <input
              className={inputClass}
              value={parameter}
              onChange={(e) => setParameter(e.target.value)}
            />
          </Field>
        </div>
        <Notice>
          Record a numeric, visual, grade or pass/fail result during inspection.
        </Notice>
        <SubmitRow
          label="Create QC hold"
          onClose={onClose}
          disabled={!batchId || !parameter}
        />
      </form>
    </WorkflowDialog>
  );
}

export function DispositionDialog({
  lot,
  onClose,
}: {
  lot: QualityLot;
  onClose: () => void;
}) {
  const { setQualityDisposition } = useDemoStore();
  const [status, setStatus] = useState<QualityLot['status']>(lot.status);
  const [result, setResult] = useState(lot.result);
  function submit(event: FormEvent) {
    event.preventDefault();
    setQualityDisposition(lot.id, status, result);
    onClose();
  }
  return (
    <WorkflowDialog
      title={`Inspect ${lot.code}`}
      description="PASS releases inventory for QR generation; HOLD and FAIL keep it blocked."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Disposition">
            <select
              className={inputClass}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as QualityLot['status'])
              }
            >
              <option>PASS</option>
              <option>HOLD</option>
              <option>FAIL</option>
            </select>
          </Field>
          <Field label="Measured result">
            <input
              className={inputClass}
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
          </Field>
        </div>
        <SubmitRow label="Save disposition" onClose={onClose} />
      </form>
    </WorkflowDialog>
  );
}

export function QrDialog({ onClose }: { onClose: () => void }) {
  const { state, generateQrPack } = useDemoStore();
  const passed = state.batches.filter((item) => item.qcStatus === 'PASS');
  const [batchId, setBatchId] = useState(passed[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    const result = generateQrPack(batchId, quantity);
    setMessage(result.message);
    if (result.ok) setTimeout(onClose, 500);
  }
  return (
    <WorkflowDialog
      title="Generate QR pack"
      description="Only QC PASS output can receive an active QR code. The payload includes company, batch, source batch and QC status."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {passed.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="QC-released batch">
              <select
                className={inputClass}
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
              >
                {passed.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pack quantity">
              <input
                className={inputClass}
                min="1"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </Field>
          </div>
        ) : (
          <Notice tone="error">
            No QC PASS batch is available. Complete a QC inspection first.
          </Notice>
        )}
        {message && <Notice>{message}</Notice>}
        <SubmitRow
          label="Generate pack"
          onClose={onClose}
          disabled={!batchId || quantity <= 0}
        />
      </form>
    </WorkflowDialog>
  );
}

export function ResourceDialog({
  company,
  onClose,
}: {
  company: CompanyMeta;
  onClose: () => void;
}) {
  const { addResource } = useDemoStore();
  const [resource, setResource] = useState<Omit<DemoResourceRecord, 'id'>>({
    name: '',
    type: 'EQUIPMENT',
    allocation: company.lobs[0],
    status: 'Available',
    costRate: 500,
    costUom: 'DAY',
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    addResource(resource);
    onClose();
  }
  return (
    <WorkflowDialog
      title="Add resource"
      description="Resources can be costed and allocated to scheduler parameters across LOBs."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Resource name">
            <input
              className={inputClass}
              value={resource.name}
              onChange={(e) =>
                setResource({ ...resource, name: e.target.value })
              }
            />
          </Field>
          <Field label="Type">
            <select
              className={inputClass}
              value={resource.type}
              onChange={(e) =>
                setResource({
                  ...resource,
                  type: e.target.value as DemoResourceRecord['type'],
                })
              }
            >
              {['MANPOWER', 'EQUIPMENT', 'VEHICLE', 'UTILITY', 'OTHER'].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="LOB allocation">
            <select
              className={inputClass}
              value={resource.allocation}
              onChange={(e) =>
                setResource({ ...resource, allocation: e.target.value })
              }
            >
              {company.lobs.map((item) => (
                <option key={item}>{item}</option>
              ))}
              <option>Shared resource</option>
            </select>
          </Field>
          <Field label="Cost rate (₹)">
            <input
              className={inputClass}
              min="0"
              type="number"
              value={resource.costRate}
              onChange={(e) =>
                setResource({ ...resource, costRate: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Cost unit">
            <select
              className={inputClass}
              value={resource.costUom}
              onChange={(e) =>
                setResource({
                  ...resource,
                  costUom: e.target.value as DemoResourceRecord['costUom'],
                })
              }
            >
              {['HOUR', 'DAY', 'SHIFT', 'BATCH'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
        <SubmitRow
          label="Add resource"
          onClose={onClose}
          disabled={!resource.name}
        />
      </form>
    </WorkflowDialog>
  );
}

export function BatchStatusDialog({
  batch,
  onClose,
}: {
  batch: WorkflowBatch;
  onClose: () => void;
}) {
  const { approveBatch, transitionBatch, closeBatch } = useDemoStore();
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const run = (
    action: 'APPROVE' | 'START' | 'PAUSE' | 'RESUME' | 'CANCEL' | 'CLOSE',
  ) => {
    if (action === 'APPROVE') {
      approveBatch(batch.id);
      setMessage('Batch approved; costing programme and standards are locked.');
      setTimeout(onClose, 650);
      return;
    }
    const result =
      action === 'CLOSE'
        ? closeBatch(batch.id)
        : transitionBatch(batch.id, action, reason);
    setMessage(result.message);
    if (result.ok) setTimeout(onClose, 650);
  };
  const actions =
    batch.status === 'DRAFT'
      ? ['APPROVE', 'CANCEL']
      : batch.status === 'APPROVED'
        ? ['START', 'CANCEL']
        : batch.status === 'ACTIVE'
          ? ['PAUSE']
          : batch.status === 'PAUSED'
            ? ['RESUME', 'CANCEL']
            : batch.status === 'READY_TO_CLOSE'
              ? ['CLOSE']
              : [];
  return (
    <WorkflowDialog
      title={`${batch.code} controls`}
      description="Lifecycle, operational risk, QC, inventory release and costing are tracked independently."
      onClose={onClose}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Lifecycle', batch.status.replaceAll('_', ' ')],
          ['Stage', batch.stage],
          ['Health', batch.riskStatus.replaceAll('_', ' ')],
          ['Quality', batch.qcStatus.replaceAll('_', ' ')],
          ['Inventory', batch.inventoryStatus.replaceAll('_', ' ')],
          ['Costing', batch.costingStatus.replaceAll('_', ' ')],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#ededed] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[#8a8a8a]">
              {label}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#2e313f]">{value}</p>
          </div>
        ))}
      </div>
      {(actions.includes('PAUSE') || actions.includes('CANCEL')) && (
        <Field label="Reason required for pause or cancellation">
          <input
            className={inputClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Operational reason and corrective action"
          />
        </Field>
      )}
      {message && (
        <Notice
          tone={
            message.includes('blocked') ||
            message.includes('required') ||
            message.includes('not allowed')
              ? 'error'
              : 'info'
          }
        >
          {message}
        </Notice>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          onClick={onClose}
          className="h-10 rounded-xl border border-[#dedede] px-4 text-xs font-semibold"
        >
          Close
        </button>
        {actions.map((action) => (
          <button
            key={action}
            onClick={() =>
              run(
                action as
                  'APPROVE' | 'START' | 'PAUSE' | 'RESUME' | 'CANCEL' | 'CLOSE',
              )
            }
            className={`h-10 rounded-xl px-4 text-xs font-semibold text-white ${action === 'CANCEL' ? 'bg-[#c24332]' : 'bg-[#0b1248]'}`}
          >
            {action === 'APPROVE'
              ? 'Approve & lock'
              : action === 'CLOSE'
                ? 'Validate & close'
                : action.charAt(0) + action.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </WorkflowDialog>
  );
}

const STEP_DETAILS = [
  'Legal identity, registration, logo and brand',
  'Registered address and farm GPS location',
  'Primary contact and alert preferences',
  'Default and additional languages',
  'Accounting currency; locked after first transaction',
  'Timezone, country and regional rules',
  'Fiscal year, accounting standard and valuation',
  'NOB and operational modules',
  'First SUPER_ADMIN account',
  'Invite company-scoped users and assign roles',
  'Review chart of accounts and item mappings',
  'Confirm LOB costing, schedulers and KPI thresholds',
  'UOM, items, breeds, locations and resources',
  'Email, SMS, push and report recipients',
  'Complete setup and unlock operations',
] as const;

export function OnboardingWizard({
  company,
  onClose,
}: {
  company: CompanyMeta;
  onClose: () => void;
}) {
  const { state, saveSetupStep } = useDemoStore();
  const [step, setStep] = useState(
    Math.min(15, state.setup.completedSteps + 1),
  );
  const [value, setValue] = useState('');
  const required = step <= 9 || step === 11 || step === 12;
  const completed = state.setup.completedSteps >= step;
  const defaultValue = useMemo(() => {
    if (value) return value;
    if (step === 1) return state.setup.legalName;
    if (step === 2) return state.setup.address;
    if (step === 3) return state.setup.contactEmail;
    if (step === 4) return state.setup.language;
    if (step === 5) return state.setup.currency;
    if (step === 6) return state.setup.timezone;
    if (step === 7) return state.setup.fiscalYear;
    if (step === 9) return state.setup.adminEmail;
    return value;
  }, [state.setup, step, value]);
  function save() {
    const update =
      step === 1
        ? { legalName: defaultValue, displayName: defaultValue }
        : step === 2
          ? { address: defaultValue }
          : step === 3
            ? { contactEmail: defaultValue }
            : step === 4
              ? { language: defaultValue }
              : step === 5
                ? { currency: defaultValue }
                : step === 6
                  ? { timezone: defaultValue }
                  : step === 7
                    ? { fiscalYear: defaultValue }
                    : step === 9
                      ? { adminEmail: defaultValue }
                      : {};
    saveSetupStep(step, update);
    if (step < 15) {
      setStep(step + 1);
      setValue('');
    } else onClose();
  }
  return (
    <WorkflowDialog
      title="Company setup wizard"
      description="Complete the company foundation before production begins. You can save and return at any time."
      onClose={onClose}
    >
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs">
          <span>Step {step} of 15</span>
          <StatusBadge
            label={required ? 'Required' : 'Optional'}
            tone={required ? 'amber' : 'gray'}
          />
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-[#1c4aa9]"
            style={{ width: `${(step / 15) * 100}%` }}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-[#ededed] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1c4aa9]">
          {SETUP_STEPS[step - 1]}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[#2e313f]">
          {STEP_DETAILS[step - 1]}
        </h3>
        <p className="mt-2 text-xs leading-5 text-[#707070]">
          {step === 8
            ? `Enable modules for ${company.nobName}; navigation and schedulers follow this configuration.`
            : step === 12
              ? `${company.lobs.join(', ')} inherit company settings with per-LOB costing.`
              : 'This value will be used as the company default.'}
        </p>
        <div className="mt-5">
          {[8, 10, 11, 12, 13, 14, 15].includes(step) ? (
            <Notice>
              {completed
                ? 'This step is already complete. Saving again reconfirms the configuration.'
                : 'Recommended defaults are ready to review and confirm.'}
            </Notice>
          ) : (
            <Field label="Configuration value">
              <input
                className={inputClass}
                value={defaultValue}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
          )}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button
          disabled={step === 1}
          onClick={() => setStep(step - 1)}
          className="h-10 rounded-xl border border-[#dedede] px-4 text-xs font-semibold disabled:opacity-30"
        >
          Previous
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="h-10 rounded-xl border border-[#dedede] px-4 text-xs font-semibold"
          >
            Save for later
          </button>
          <button
            onClick={save}
            className="h-10 rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white"
          >
            {step === 15 ? 'Complete setup' : 'Save & continue'}
          </button>
        </div>
      </div>
    </WorkflowDialog>
  );
}

export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'error';
}) {
  return (
    <div
      className={`mt-5 flex gap-2 rounded-xl border p-3.5 text-xs leading-5 ${tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}
    >
      {tone === 'error' ? (
        <AlertCircle className="mt-0.5 shrink-0" size={15} />
      ) : (
        <CheckCircle2 className="mt-0.5 shrink-0" size={15} />
      )}
      <span>{children}</span>
    </div>
  );
}
