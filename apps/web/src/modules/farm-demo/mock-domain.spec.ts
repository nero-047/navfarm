import type { WorkflowBatch } from './operational-contracts';
import {
  assertMockClose, assertMockQr, assertMockTransition, mockJournal, mockVariance,
} from './mock-domain';

const batch = (changes: Partial<WorkflowBatch> = {}): WorkflowBatch => ({
  id: 'batch-1', code: 'BATCH-001', lob: 'Rearing', method: 'STANDARD',
  status: 'APPROVED', riskStatus: 'ON_TRACK', inventoryStatus: 'BLOCKED',
  costingStatus: 'OPEN', stage: 'Operations', inputName: 'DOC', inputQty: 100,
  inputUom: 'NOS', expectedOutput: 95, actualOutput: 90, standardRate: 20,
  actualRate: 21, expectedUsage: 10, actualUsage: 12, standardOverhead: 50,
  actualOverhead: 60, wip: 100, qcRequired: true, qcStatus: 'HOLD',
  createdAt: '2026-07-27T00:00:00.000Z', ...changes,
});

describe('temporary operational mock rules', () => {
  it('enforces transition conflicts and mandatory reasons', () => {
    expect(assertMockTransition(batch(), 'RESUME')).toContain('not allowed');
    expect(assertMockTransition(batch({ status: 'ACTIVE' }), 'PAUSE')).toContain('reason');
    expect(assertMockTransition(batch({ status: 'ACTIVE' }), 'PAUSE', 'Maintenance')).toBeNull();
  });

  it('blocks close while QC is held and permits a ready released batch', () => {
    expect(assertMockClose(batch({ status: 'READY_TO_CLOSE' }))).toContain('QC must pass');
    expect(assertMockClose(batch({ status: 'READY_TO_CLOSE', qcStatus: 'PASS', inventoryStatus: 'RELEASED' }))).toBeNull();
  });

  it('blocks QR before QC release', () => {
    expect(assertMockQr(batch(), 10)).toContain('QC pass');
    expect(assertMockQr(batch({ qcStatus: 'PASS', inventoryStatus: 'RELEASED' }), 10)).toBeNull();
  });

  it('keeps mock variance and balanced journal behavior', () => {
    expect(mockVariance(batch())).toEqual({ price: 12, usage: 40, output: 100, overhead: 10, total: 162 });
    expect(mockJournal({
      batchId: 'batch-1', entryType: 'CONSUMPTION', parameter: 'Feed',
      quantity: 2, uom: 'KG', unitCost: 20, notes: '',
    })).toEqual({ debit: '1190 Batch WIP', credit: '1100 Input Inventory', amount: 40 });
  });
});
