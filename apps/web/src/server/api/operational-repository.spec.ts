/** @jest-environment node */
import {
  handleOperationalRequest,
  resetOperationalRepository,
  type OperationalActor,
} from './operational-repository';
import type { WorkflowBatch } from '../../modules/farm-demo/operational-contracts';

const scope = {
  tenantId: 'tenant-1',
  companyId: 'company-1',
  workspaceId: 'workspace-1',
};
const actor = {
  activeTenantId: scope.tenantId,
  activeCompanyId: scope.companyId,
  activeWorkspaceId: scope.workspaceId,
  accessibleWorkspaceIds: [scope.workspaceId],
  workspacePermissions: [
    'batches.create', 'batches.approve', 'batches.close', 'operations.create',
    'quality.manage', 'traceability.manage', 'resources.manage',
  ],
} satisfies OperationalActor;
const root = `/tenants/${scope.tenantId}/companies/${scope.companyId}/workspaces/${scope.workspaceId}`;

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
      `${root}/operational-bootstrap`,
      'request-1',
      actor,
    );
    expect(response?.status).toBe(201);
  }

  it('returns typed resource entities rather than a generic success response', async () => {
    await bootstrap();
    const response = await handleOperationalRequest(
      request('PUT', { ...draft, status: 'APPROVED' }),
      `${root}/batches/batch-1`,
      'request-2',
      actor,
    );
    expect(response?.status).toBe(200);
    await expect(response?.json()).resolves.toMatchObject({ id: 'batch-1', status: 'APPROVED' });
  });

  it('returns a conflict for a stale lifecycle transition', async () => {
    await bootstrap();
    const response = await handleOperationalRequest(
      request('POST', { action: 'APPROVE', expectedStatus: 'ACTIVE' }),
      `${root}/batches/batch-1/transitions`,
      'request-3',
      actor,
    );
    expect(response?.status).toBe(409);
    await expect(response?.json()).resolves.toMatchObject({ error: { requestId: 'request-3' } });
  });

  it('exercises QC hold/pass and then allows QR generation', async () => {
    await bootstrap();
    const created = await handleOperationalRequest(
      request('POST', { batchId: 'batch-1', parameter: 'Salmonella' }),
      `${root}/quality-lots`,
      'request-4',
      actor,
    );
    const lot = await created?.json() as { id: string };
    expect(created?.status).toBe(201);
    const passed = await handleOperationalRequest(
      request('POST', { status: 'PASS', result: 'Not detected' }),
      `${root}/quality-lots/${lot.id}/disposition`,
      'request-5',
      actor,
    );
    expect(passed?.status).toBe(200);
    const pack = await handleOperationalRequest(
      request('POST', { batchId: 'batch-1', quantity: 10 }),
      `${root}/qr-packs`,
      'request-6',
      actor,
    );
    expect(pack?.status).toBe(201);
    await expect(pack?.json()).resolves.toMatchObject({ batchId: 'batch-1', quantity: 10 });
  });

  it('rejects closing a batch that is not ready', async () => {
    await bootstrap();
    const response = await handleOperationalRequest(
      request('POST', { action: 'CLOSE', expectedStatus: 'DRAFT' }),
      `${root}/batches/batch-1/transitions`,
      'request-7',
      actor,
    );
    expect(response?.status).toBe(422);
  });

  it('does not claim Phase 2 or Phase 3 company resources', async () => {
    await expect(handleOperationalRequest(
      request('GET'),
      `${root}/masters/items`,
      'request-8',
      actor,
    )).resolves.toBeNull();
    await expect(handleOperationalRequest(
      request('GET'),
      `${root}/accounting/readiness`,
      'request-9',
      actor,
    )).resolves.toBeNull();
  });

  it('isolates every operational collection between workspaces in one company', async () => {
    await bootstrap();
    const secondScope = { ...scope, workspaceId: 'workspace-2' };
    const secondActor = {
      ...actor,
      activeWorkspaceId: secondScope.workspaceId,
      accessibleWorkspaceIds: [scope.workspaceId, secondScope.workspaceId],
    };
    const secondRoot = `/tenants/${secondScope.tenantId}/companies/${secondScope.companyId}/workspaces/${secondScope.workspaceId}`;
    const secondBootstrap = await handleOperationalRequest(
      request('POST', {
        state: {
          batches: [{ ...draft, id: 'batch-2', code: 'BATCH-002' }],
          operations: [],
          qualityLots: [],
          qrPacks: [],
          resources: [],
          resourceUsages: [],
        },
      }),
      `${secondRoot}/operational-bootstrap`,
      'request-isolation-bootstrap',
      secondActor,
    );
    expect(secondBootstrap?.status).toBe(201);

    for (const resource of ['batches', 'operations', 'quality-lots', 'qr-packs', 'resources', 'resource-usages', 'costing', 'journals', 'variances']) {
      const response = await handleOperationalRequest(
        request('GET'),
        `${secondRoot}/${resource}`,
        `request-isolation-${resource}`,
        secondActor,
      );
      expect(response?.status).toBe(200);
      const payload = await response?.json() as Array<{ id?: string }>;
      if (resource === 'batches') expect(payload.map((item) => item.id)).toEqual(['batch-2']);
      else expect(payload).toEqual(resource === 'costing' || resource === 'variances' ? expect.any(Array) : []);
    }

    const report = await handleOperationalRequest(
      request('GET'),
      `${secondRoot}/reports/summary`,
      'request-isolation-reports',
      secondActor,
    );
    expect(report?.status).toBe(200);
    await expect(report?.json()).resolves.toMatchObject({
      tenantId: secondScope.tenantId,
      companyId: secondScope.companyId,
      workspaceId: secondScope.workspaceId,
      batchCount: 1,
    });

    const crossWorkspaceMutation = await handleOperationalRequest(
      request('POST', {
        batchId: 'batch-1',
        entryType: 'OUTPUT',
        parameter: 'Harvest',
        quantity: 1,
        uom: 'NOS',
        unitCost: 1,
        notes: 'Must remain isolated',
      }),
      `${secondRoot}/operations`,
      'request-isolation-mutation',
      secondActor,
    );
    expect(crossWorkspaceMutation?.status).toBe(404);

    const wrongActiveScope = await handleOperationalRequest(
      request('GET'),
      `${root}/batches`,
      'request-wrong-active-scope',
      secondActor,
    );
    expect(wrongActiveScope?.status).toBe(403);
  });
});
