import type { NavfarmApiClient } from '../../lib/api-client';
import { createOperationalClients } from './operational-client';
import type { WorkflowBatch } from './operational-contracts';

const batch: WorkflowBatch = {
  id: 'batch-1', code: 'BATCH-001', lob: 'Rearing', method: 'STANDARD',
  status: 'DRAFT', riskStatus: 'ON_TRACK', inventoryStatus: 'BLOCKED',
  costingStatus: 'DRAFT', stage: 'Draft', inputName: 'DOC', inputQty: 100,
  inputUom: 'NOS', expectedOutput: 95, actualOutput: 0, standardRate: 20,
  actualRate: 20, expectedUsage: 10, actualUsage: 0, standardOverhead: 50,
  actualOverhead: 0, wip: 0, qcRequired: true, qcStatus: 'NOT_STARTED',
  createdAt: '2026-07-27T00:00:00.000Z',
};

function fakeClient(request: jest.Mock): NavfarmApiClient {
  return {
    request, get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  };
}

describe('typed operational resource clients', () => {
  it('uses the proposed company-scoped batch path and parses the entity', async () => {
    const request = jest.fn().mockResolvedValue(batch);
    const clients = createOperationalClients(fakeClient(request));
    await expect(clients.batches.save('green valley', batch)).resolves.toEqual(batch);
    expect(request).toHaveBeenCalledWith('/companies/green%20valley/batches/batch-1', {
      method: 'PUT', body: batch,
    });
  });

  it('rejects an invalid resource response at the client boundary', async () => {
    const clients = createOperationalClients(fakeClient(jest.fn().mockResolvedValue({ id: 'broken' })));
    await expect(clients.batches.list('company-1')).rejects.toThrow();
  });

  it('exposes QC disposition and batch transition result endpoints', async () => {
    const request = jest.fn()
      .mockResolvedValueOnce({ ...batch, status: 'APPROVED' })
      .mockResolvedValueOnce({ batch: { ...batch, status: 'APPROVED' }, message: 'Approved.' });
    const clients = createOperationalClients(fakeClient(request));
    await clients.qualityLots.disposition('company-1', 'qc-1', { status: 'PASS', result: 'Compliant' }).catch(() => undefined);
    await expect(clients.batches.transition('company-1', 'batch-1', 'APPROVE')).resolves.toMatchObject({ message: 'Approved.' });
    expect(request.mock.calls[0][0]).toBe('/companies/company-1/quality-lots/qc-1/disposition');
    expect(request.mock.calls[1][0]).toBe('/companies/company-1/batches/batch-1/transitions');
  });
});
