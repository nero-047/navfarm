import {
  calculateVarianceForBatch,
  canGenerateQr,
  validateBatchClose,
  type WorkflowBatch,
} from '../src/modules/farm-demo/demo-store';

function batch(overrides: Partial<WorkflowBatch> = {}): WorkflowBatch {
  return {
    id: 'batch-test',
    code: 'PLT-2026-TEST',
    lob: 'Commercial Broiler',
    method: 'STANDARD',
    status: 'READY_TO_CLOSE',
    stage: 'Final output',
    inputName: 'Day-old chicks',
    inputQty: 10000,
    inputUom: 'birds',
    expectedOutput: 9800,
    actualOutput: 9750,
    standardRate: 20,
    actualRate: 21.5,
    expectedUsage: 83916,
    actualUsage: 86400,
    standardOverhead: 48750,
    actualOverhead: 55000,
    wip: 500000,
    qcRequired: true,
    qcStatus: 'PASS',
    createdAt: '2026-07-16T00:00:00.000Z',
    ...overrides,
  };
}

describe('documented costing and release rules', () => {
  it('calculates all four STANDARD close variances', () => {
    expect(calculateVarianceForBatch(batch())).toEqual({
      price: 129600,
      usage: 49680,
      output: 1000,
      overhead: 6250,
      total: 186530,
    });
  });

  it.each(['FIFO', 'BIO_ASSET'] as const)(
    'does not create standard variances for %s batches',
    (method) => {
      expect(calculateVarianceForBatch(batch({ method })).total).toBe(0);
    },
  );

  it('blocks close until output exists and mandatory QC passes', () => {
    expect(validateBatchClose(batch({ qcStatus: 'HOLD' }))).toMatch(/QC/);
    expect(validateBatchClose(batch({ actualOutput: 0 }))).toMatch(/output/);
    expect(validateBatchClose(batch())).toBeNull();
  });

  it('allows QR generation only from QC PASS output', () => {
    expect(canGenerateQr(batch())).toBe(true);
    expect(canGenerateQr(batch({ qcStatus: 'HOLD' }))).toBe(false);
    expect(canGenerateQr(undefined)).toBe(false);
  });
});
