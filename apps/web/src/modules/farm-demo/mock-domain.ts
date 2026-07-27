import type {
  NewBatchInput, NewOperationInput, OperationEntry, VarianceResult, WorkflowBatch,
} from './operational-contracts';

// TEMPORARY MOCK RULES. NestJS must authoritatively enforce these rules and
// return the resulting entities when the real operational API is implemented.
const money = (value: number) => Math.round(value * 100) / 100;

export function mockVariance(batch: WorkflowBatch): VarianceResult {
  if (batch.method !== 'STANDARD') return { price: 0, usage: 0, output: 0, overhead: 0, total: 0 };
  const price = money((batch.actualRate - batch.standardRate) * batch.actualUsage);
  const usage = money((batch.actualUsage - batch.expectedUsage) * batch.standardRate);
  const output = money(Math.max(0, batch.expectedOutput - batch.actualOutput) * batch.standardRate);
  const overhead = money(batch.actualOverhead - batch.standardOverhead);
  return { price, usage, output, overhead, total: money(price + usage + output + overhead) };
}

export function mockJournal(input: NewOperationInput): OperationEntry['journal'] {
  const amount = money(input.quantity * input.unitCost);
  if (input.entryType === 'OBSERVATION') return undefined;
  if (input.entryType === 'OUTPUT') return { debit: '1150 Output Inventory', credit: '1190 Batch WIP', amount };
  if (input.entryType === 'MORTALITY') return { debit: '7120 Mortality Loss', credit: '1190 Batch WIP', amount };
  if (input.entryType === 'CONSUMPTION') return { debit: '1190 Batch WIP', credit: '1100 Input Inventory', amount };
  return { debit: '1190 Batch WIP', credit: '2100 Accounts Payable', amount };
}

export function assertMockTransition(batch: WorkflowBatch, action: 'START' | 'PAUSE' | 'RESUME' | 'CANCEL', reason = '') {
  const allowed = action === 'START' ? batch.status === 'APPROVED'
    : action === 'PAUSE' ? batch.status === 'ACTIVE'
      : action === 'RESUME' ? batch.status === 'PAUSED'
        : ['DRAFT', 'APPROVED', 'PAUSED'].includes(batch.status);
  if (!allowed) return `${action.toLowerCase()} is not allowed from ${batch.status.replaceAll('_', ' ')}.`;
  if ((action === 'PAUSE' || action === 'CANCEL') && !reason.trim()) return 'A reason is required for this action.';
  return null;
}

export function assertMockClose(batch: WorkflowBatch) {
  if (batch.status !== 'READY_TO_CLOSE') return 'Record final output before closing this batch.';
  if (batch.qcRequired && batch.qcStatus !== 'PASS') return 'QC must pass before inventory release and batch close.';
  if (batch.actualOutput <= 0) return 'Record an output or harvest before closing this batch.';
  return null;
}

export function assertMockQr(batch: WorkflowBatch, quantity: number) {
  if (quantity <= 0) return 'Pack quantity must be greater than zero.';
  if (batch.qcStatus !== 'PASS' || batch.inventoryStatus !== 'RELEASED') return 'QR packs can be generated only after QC pass and inventory release.';
  return null;
}

export function mockCreateBatch(
  input: NewBatchInput,
  context: { number: number; prefix: string; inputName: string; inputUom: string },
): WorkflowBatch {
  return {
    id: `batch-${Date.now()}`, code: `${context.prefix}-2026-${String(context.number).padStart(3, '0')}`,
    lob: input.lob, method: input.method, status: 'DRAFT', riskStatus: 'ON_TRACK',
    inventoryStatus: 'BLOCKED', costingStatus: 'DRAFT', stage: 'Draft setup',
    inputName: context.inputName, inputQty: input.inputQty, inputUom: context.inputUom,
    expectedOutput: input.expectedOutput, actualOutput: 0, standardRate: 20, actualRate: 20,
    expectedUsage: input.inputQty * 0.2, actualUsage: 0,
    standardOverhead: input.inputQty * 5, actualOverhead: 0, wip: 0,
    sourceBatchId: input.sourceBatchId, qcRequired: true, qcStatus: 'NOT_STARTED',
    borVersion: input.borVersion, costSplitMethod: input.costSplitMethod,
    createdAt: new Date().toISOString(),
  };
}

export function mockApproveBatch(batch: WorkflowBatch): WorkflowBatch {
  return {
    ...batch, status: 'APPROVED',
    stage: batch.method === 'BIO_ASSET' ? 'Premature / NCA' : 'Daily operations',
    wip: money(batch.inputQty * batch.standardRate), costingStatus: 'OPEN',
  };
}

export function mockApplyOperation(batch: WorkflowBatch, input: NewOperationInput): WorkflowBatch {
  const amount = input.quantity * input.unitCost;
  return {
    ...batch,
    actualUsage: input.entryType === 'CONSUMPTION' ? batch.actualUsage + input.quantity : batch.actualUsage,
    actualOutput: input.entryType === 'OUTPUT' ? batch.actualOutput + input.quantity : batch.actualOutput,
    actualOverhead: input.entryType === 'OVERHEAD' || input.entryType === 'RESOURCE' ? batch.actualOverhead + amount : batch.actualOverhead,
    wip: input.entryType === 'OUTPUT' || input.entryType === 'MORTALITY'
      ? Math.max(0, batch.wip - amount)
      : input.entryType === 'OBSERVATION' ? batch.wip : batch.wip + amount,
    status: input.entryType === 'OUTPUT' ? 'READY_TO_CLOSE' : batch.status === 'APPROVED' ? 'ACTIVE' : batch.status,
    riskStatus: input.expected !== undefined && input.quantity > input.expected * 1.05 ? 'WARNING' : batch.riskStatus,
    stage: input.entryType === 'OUTPUT' ? 'Final output' : batch.status === 'APPROVED' ? 'Daily operations' : batch.stage,
  };
}

export function mockApplyQualityDisposition(batch: WorkflowBatch, status: 'HOLD' | 'PASS' | 'FAIL'): WorkflowBatch {
  return {
    ...batch, qcStatus: status, status: status === 'PASS' ? 'READY_TO_CLOSE' : 'QC_HOLD',
    inventoryStatus: status === 'PASS' ? 'RELEASED' : 'BLOCKED',
    costingStatus: status === 'FAIL' ? 'CLOSE_BLOCKED' : batch.costingStatus,
  };
}

export function mockFinalizeBatch(batch: WorkflowBatch): WorkflowBatch {
  return {
    ...batch, status: 'CLOSED', stage: 'Cost finalized', costingStatus: 'FINALIZED',
    inventoryStatus: 'RELEASED', wip: 0, closedAt: new Date().toISOString(),
  };
}
