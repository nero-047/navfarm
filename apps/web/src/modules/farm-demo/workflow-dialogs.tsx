'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { CompanyMeta } from '@/modules/company';
import { INDUSTRY_CONFIG, SETUP_STEPS } from './data';
import {
  type CostingMethod,
  type DemoResourceRecord,
  type NewOperationInput,
  type QualityLot,
  type SetupState,
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
  const [draft, setDraft] = useState<SetupState>({ ...state.setup });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const required = step <= 9;
  const completed = state.setup.completedSteps >= step;
  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    password === confirmPassword;
  const valid =
    step === 1
      ? Boolean(draft.legalName && draft.companyType)
      : step === 2
        ? Boolean(
            draft.addressLine1 &&
            draft.city &&
            draft.stateProvince &&
            draft.country &&
            draft.postalCode,
          )
        : step === 3
          ? Boolean(draft.contactName && draft.contactEmail.includes('@'))
          : step === 4
            ? Boolean(draft.language && draft.dateFormat && draft.numberFormat)
            : step === 5
              ? Boolean(draft.currency)
              : step === 6
                ? Boolean(draft.timezone && draft.country)
                : step === 7
                  ? Boolean(
                      draft.fiscalStartMonth &&
                      draft.accountingStandard &&
                      draft.inventoryValuation,
                    )
                  : step === 8
                    ? draft.modules.length > 0
                    : step === 9
                      ? Boolean(
                          draft.adminName &&
                          draft.adminEmail.includes('@') &&
                          (completed || passwordValid),
                        )
                      : true;
  function save() {
    if (!valid) return;
    const address = [draft.city, draft.stateProvince]
      .filter(Boolean)
      .join(', ');
    const fiscalYear = `${draft.fiscalStartMonth} start`;
    const update =
      step === 2
        ? { ...draft, address }
        : step === 7
          ? { ...draft, fiscalYear }
          : draft;
    setDraft(update);
    saveSetupStep(step, update);
    if (step < 15) {
      setStep(step + 1);
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
        <div
          className="mt-3 flex gap-1.5 overflow-x-auto pb-1"
          aria-label="Setup steps"
        >
          {SETUP_STEPS.map((label, index) => {
            const number = index + 1;
            const locked = number > state.setup.completedSteps + 1;
            return (
              <button
                key={label}
                type="button"
                title={`${number}. ${label}`}
                aria-label={`Step ${number}: ${label}`}
                aria-current={step === number ? 'step' : undefined}
                disabled={locked}
                onClick={() => setStep(number)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${step === number ? 'bg-[#0b1248] text-white' : number <= state.setup.completedSteps ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {number}
              </button>
            );
          })}
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
              : step <= 9
                ? 'Required company foundation. Operations unlock after steps 1–9 are complete.'
                : 'Optional readiness configuration can be completed later from Settings.'}
        </p>
        <div className="mt-5">
          <SetupStepFields
            step={step}
            company={company}
            draft={draft}
            setDraft={setDraft}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            completed={completed}
          />
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
            disabled={!valid}
            className="h-10 rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === 15 ? 'Complete setup' : 'Save & continue'}
          </button>
        </div>
      </div>
    </WorkflowDialog>
  );
}

function SetupStepFields({
  step,
  company,
  draft,
  setDraft,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  completed,
}: {
  step: number;
  company: CompanyMeta;
  draft: SetupState;
  setDraft: (value: SetupState) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  completed: boolean;
}) {
  const update = <K extends keyof SetupState>(key: K, value: SetupState[K]) =>
    setDraft({ ...draft, [key]: value });
  const toggleList = (
    key:
      | 'modules'
      | 'additionalLanguages'
      | 'reportingCurrencies'
      | 'notificationChannels',
    value: string,
  ) =>
    update(
      key,
      draft[key].includes(value)
        ? draft[key].filter((item) => item !== value)
        : [...draft[key], value],
    );
  const grid = 'grid gap-4 sm:grid-cols-2';

  if (step === 1)
    return (
      <div className={grid}>
        <Field label="Company legal name">
          <input
            className={inputClass}
            value={draft.legalName}
            onChange={(e) => update('legalName', e.target.value)}
          />
        </Field>
        <Field label="Display name">
          <input
            className={inputClass}
            value={draft.displayName}
            onChange={(e) => update('displayName', e.target.value)}
          />
        </Field>
        <Field label="Company type">
          <select
            className={inputClass}
            value={draft.companyType}
            onChange={(e) => update('companyType', e.target.value)}
          >
            {[
              'Sole Proprietor',
              'Partnership',
              'Private Limited',
              'LLP',
              'Trust',
              'NGO',
              'Co-operative',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Registration number">
          <input
            className={inputClass}
            value={draft.registrationNumber}
            onChange={(e) => update('registrationNumber', e.target.value)}
          />
        </Field>
        <Field label="Tax ID">
          <input
            className={inputClass}
            value={draft.taxId}
            onChange={(e) => update('taxId', e.target.value)}
          />
        </Field>
        <Field label="Company website">
          <input
            className={inputClass}
            type="url"
            value={draft.website}
            onChange={(e) => update('website', e.target.value)}
          />
        </Field>
        <Field label="Brand primary colour">
          <input
            className={inputClass}
            type="color"
            value={draft.brandColor}
            onChange={(e) => update('brandColor', e.target.value)}
          />
        </Field>
        <Field
          label="Company logo"
          hint="Demo only: file selection is not uploaded."
        >
          <input
            className={`${inputClass} py-2.5`}
            type="file"
            accept="image/png,image/svg+xml"
          />
        </Field>
      </div>
    );
  if (step === 2)
    return (
      <div className={grid}>
        <Field label="Address line 1">
          <input
            className={inputClass}
            value={draft.addressLine1}
            onChange={(e) => update('addressLine1', e.target.value)}
          />
        </Field>
        <Field label="City">
          <input
            className={inputClass}
            value={draft.city}
            onChange={(e) => update('city', e.target.value)}
          />
        </Field>
        <Field label="State / province">
          <input
            className={inputClass}
            value={draft.stateProvince}
            onChange={(e) => update('stateProvince', e.target.value)}
          />
        </Field>
        <Field label="Country">
          <select
            className={inputClass}
            value={draft.country}
            onChange={(e) => update('country', e.target.value)}
          >
            {[
              'India',
              'United Arab Emirates',
              'United Kingdom',
              'United States',
              'Singapore',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="PIN / ZIP code">
          <input
            className={inputClass}
            value={draft.postalCode}
            onChange={(e) => update('postalCode', e.target.value)}
          />
        </Field>
        <Field label="Farm GPS coordinates" hint="Latitude, longitude">
          <input
            className={inputClass}
            value={draft.gpsCoordinates}
            onChange={(e) => update('gpsCoordinates', e.target.value)}
          />
        </Field>
      </div>
    );
  if (step === 3)
    return (
      <div className={grid}>
        <Field label="Primary contact">
          <input
            className={inputClass}
            value={draft.contactName}
            onChange={(e) => update('contactName', e.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={draft.contactEmail}
            onChange={(e) => update('contactEmail', e.target.value)}
          />
        </Field>
        <Field label="Mobile number">
          <input
            className={inputClass}
            type="tel"
            value={draft.contactPhone}
            onChange={(e) => update('contactPhone', e.target.value)}
          />
        </Field>
        <div className="space-y-2">
          <CheckOption
            label="Receive critical KPI alerts"
            checked={draft.receiveKpiAlerts}
            onChange={(checked) => update('receiveKpiAlerts', checked)}
          />
          <CheckOption
            label="Receive weekly reports"
            checked={draft.receiveWeeklyReports}
            onChange={(checked) => update('receiveWeeklyReports', checked)}
          />
        </div>
      </div>
    );
  if (step === 4)
    return (
      <div className={grid}>
        <Field label="Default language">
          <select
            className={inputClass}
            value={draft.language}
            onChange={(e) => update('language', e.target.value)}
          >
            {[
              'English',
              'Hindi',
              'Marathi',
              'Tamil',
              'Telugu',
              'Punjabi',
              'Gujarati',
              'Bengali',
              'Arabic',
              'French',
              'Spanish',
              'Chinese',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Date display format">
          <select
            className={inputClass}
            value={draft.dateFormat}
            onChange={(e) => update('dateFormat', e.target.value)}
          >
            {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Number format">
          <select
            className={inputClass}
            value={draft.numberFormat}
            onChange={(e) => update('numberFormat', e.target.value)}
          >
            {[
              'Indian (1,00,000)',
              'International (100,000)',
              'European (100.000)',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <div>
          <p className="mb-2 text-xs font-semibold text-[#515463]">
            Additional languages
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['Hindi', 'Marathi', 'Tamil', 'Arabic'].map((item) => (
              <CheckOption
                key={item}
                label={item}
                checked={draft.additionalLanguages.includes(item)}
                onChange={() => toggleList('additionalLanguages', item)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  if (step === 5)
    return (
      <div className={grid}>
        <Field
          label="Base accounting currency"
          hint="Locked after the first transaction."
        >
          <select
            className={inputClass}
            value={draft.currency}
            onChange={(e) => update('currency', e.target.value)}
          >
            {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <div>
          <p className="mb-2 text-xs font-semibold text-[#515463]">
            Reporting currencies
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['USD', 'EUR', 'GBP', 'AED', 'SGD'].map((item) => (
              <CheckOption
                key={item}
                label={item}
                checked={draft.reportingCurrencies.includes(item)}
                onChange={() => toggleList('reportingCurrencies', item)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  if (step === 6)
    return (
      <div className={grid}>
        <Field label="Company timezone">
          <select
            className={inputClass}
            value={draft.timezone}
            onChange={(e) => update('timezone', e.target.value)}
          >
            {[
              'Asia/Kolkata',
              'Asia/Dubai',
              'Europe/London',
              'America/New_York',
              'Asia/Singapore',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Regional country">
          <input className={inputClass} value={draft.country} readOnly />
        </Field>
      </div>
    );
  if (step === 7)
    return (
      <div className={grid}>
        <Field label="Fiscal year start month">
          <select
            className={inputClass}
            value={draft.fiscalStartMonth}
            onChange={(e) => update('fiscalStartMonth', e.target.value)}
          >
            {['January', 'April', 'July', 'October'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Accounting standard">
          <select
            className={inputClass}
            value={draft.accountingStandard}
            onChange={(e) => update('accountingStandard', e.target.value)}
          >
            {['IND AS', 'IFRS', 'US GAAP', 'Local GAAP'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Inventory valuation">
          <select
            className={inputClass}
            value={draft.inventoryValuation}
            onChange={(e) => update('inventoryValuation', e.target.value)}
          >
            {[
              'STANDARD COSTING',
              'FIFO',
              'Weighted Average',
              'LOB-level configuration',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>
    );
  if (step === 8)
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics'].map(
          (item) => (
            <CheckOption
              key={item}
              label={item}
              checked={draft.modules.includes(item)}
              onChange={() => toggleList('modules', item)}
            />
          ),
        )}
      </div>
    );
  if (step === 9)
    return (
      <div className={grid}>
        <Field label="Administrator full name">
          <input
            className={inputClass}
            value={draft.adminName}
            onChange={(e) => update('adminName', e.target.value)}
          />
        </Field>
        <Field label="Login email">
          <input
            className={inputClass}
            type="email"
            value={draft.adminEmail}
            onChange={(e) => update('adminEmail', e.target.value)}
          />
        </Field>
        <Field label="Mobile number">
          <input
            className={inputClass}
            type="tel"
            value={draft.adminPhone}
            onChange={(e) => update('adminPhone', e.target.value)}
          />
        </Field>
        <CheckOption
          label="Enable two-factor authentication"
          checked={draft.adminTwoFactor}
          onChange={(checked) => update('adminTwoFactor', checked)}
        />
        {!completed && (
          <>
            <Field
              label="Password"
              hint="8+ characters with uppercase, number and special character"
            >
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm password">
              <input
                className={inputClass}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>
          </>
        )}
      </div>
    );
  if (step === 10)
    return (
      <ReviewList
        items={[
          'Invite farm managers, accountants and supervisors',
          'Assign documented company-scoped roles',
          'Invitation messages use the company default language',
        ]}
      />
    );
  if (step === 11)
    return (
      <ReviewList
        items={[
          '1100 Inventory – Feed & Consumables',
          '1110 Inventory – Live Animals / Birds',
          '1190 Batch Work in Progress',
          'Variance accounts 6100–6150',
        ]}
      />
    );
  if (step === 12)
    return (
      <ReviewList
        items={company.lobs.map(
          (lob) => `${lob}: costing, scheduler and KPI defaults ready`,
        )}
      />
    );
  if (step === 13)
    return (
      <ReviewList
        items={[
          'UOM and conversions',
          'Items, breeds and varieties',
          'Locations, sub-locations and resources',
        ]}
      />
    );
  if (step === 14)
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          'In-app notifications',
          'Email',
          'SMS / WhatsApp',
          'Push notifications',
        ].map((item) => (
          <CheckOption
            key={item}
            label={item}
            checked={draft.notificationChannels.includes(item)}
            onChange={() => toggleList('notificationChannels', item)}
          />
        ))}
      </div>
    );
  return (
    <ReviewList
      items={[
        `${draft.legalName} · ${draft.country}`,
        `${draft.currency} · ${draft.accountingStandard} · ${draft.fiscalStartMonth} fiscal start`,
        `${draft.modules.length} modules · ${company.lobs.length} lines of business`,
        'Steps 1–9 complete: production workspace can be unlocked',
      ]}
    />
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-xl border border-[#dedede] bg-white px-3 text-xs font-medium text-[#515463]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#1c4aa9]"
      />
      {label}
    </label>
  );
}

function ReviewList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item}
          className="flex items-start gap-2 rounded-xl border border-[#ededed] bg-[#fafafa] p-3 text-xs text-[#515463]"
        >
          <CheckCircle2
            size={15}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          {item}
        </div>
      ))}
    </div>
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
