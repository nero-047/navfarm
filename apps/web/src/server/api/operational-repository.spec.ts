/** @jest-environment node */
import { handleOperationalRequest, resetOperationalRepository } from './operational-repository';
import type { WorkflowBatch } from '../../modules/farm-demo/operational-contracts';

const draft: WorkflowBatch = {
  id: 'batch-1', code: 'BATCH-001', lob: 'Rearing', method: 'STANDARD',
  status: 'DRAFT', riskStatus: 'ON_TRACK', inventoryStatus: 'BLOCKED',
  costingStatus: 'DRAFT', stage: 'Draft', inputName: 'DOC', inputQty: 100,
  inputUom: 'NOS', expectedOutput: 95, actualOutput: 0, standardRate: 20,
  actualRate: 20, expectedUsage: 10, actualUsage: 0, standardOverhead: 50,
  actualOverhead: 0, wip: 0, qcRequired: true, qcStatus: 'NOT_STARTED',
  createdAt: '2026-07-27T00:00:00.000Z',
};

const request = (method: string, body?: unknown) => new Request('http://localhost/api/v1/test', {
  method, headers: body === undefined ? undefined : { 'content-type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});

describe('operational server-side mock adapter', () => {
  beforeEach(() => resetOperationalRepository());

  async function bootstrap() {
    const response = await handleOperationalRequest(
      request('POST', {
        state: { batches: [draft], operations: [], qualityLots: [], qrPacks: [], resources: [] },
      }),
      '/companies/company-1/operational-bootstrap',
      'request-1',
    );
    expect(response?.status).toBe(201);
  }

  it('returns typed resource entities rather than a generic success response', async () => {
    await bootstrap();
    const response = await handleOperationalRequest(
      request('PUT', { ...draft, status: 'APPROVED' }),
      '/companies/company-1/batches/batch-1',
      'request-2',
    );
    expect(response?.status).toBe(200);
    await expect(response?.json()).resolves.toMatchObject({ id: 'batch-1', status: 'APPROVED' });
  });

  it('returns a conflict for a stale lifecycle transition', async () => {
    await bootstrap();
    const response = await handleOperationalRequest(
      request('POST', { action: 'APPROVE', expectedStatus: 'ACTIVE' }),
      '/companies/company-1/batches/batch-1/transitions',
      'request-3',
    );
    expect(response?.status).toBe(409);
    await expect(response?.json()).resolves.toMatchObject({ error: { requestId: 'request-3' } });
  });

  it('exercises QC hold/pass and then allows QR generation', async () => {
    await bootstrap();
    const created = await handleOperationalRequest(
      request('POST', { batchId: 'batch-1', parameter: 'Salmonella' }),
      '/companies/company-1/quality-lots',
      'request-4',
    );
    const lot = await created?.json() as { id: string };
    expect(created?.status).toBe(201);
    const passed = await handleOperationalRequest(
      request('POST', { status: 'PASS', result: 'Not detected' }),
      `/companies/company-1/quality-lots/${lot.id}/disposition`,
      'request-5',
    );
    expect(passed?.status).toBe(200);
    const pack = await handleOperationalRequest(
      request('POST', { batchId: 'batch-1', quantity: 10 }),
      '/companies/company-1/qr-packs',
      'request-6',
    );
    expect(pack?.status).toBe(201);
    await expect(pack?.json()).resolves.toMatchObject({ batchId: 'batch-1', quantity: 10 });
  });

  it('rejects closing a batch that is not ready', async () => {
    await bootstrap();
    const response = await handleOperationalRequest(
      request('POST', { action: 'CLOSE', expectedStatus: 'DRAFT' }),
      '/companies/company-1/batches/batch-1/transitions',
      'request-7',
    );
    expect(response?.status).toBe(422);
  });
});
