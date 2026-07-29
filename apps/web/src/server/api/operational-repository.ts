import { NextResponse } from 'next/server';
import {
  createQrPackSchema, createQualityLotSchema, newBatchSchema, newOperationSchema,
  operationEntrySchema, qualityDispositionRequestSchema, qualityLotSchema,
  qrPackSchema, resourceRecordSchema, transitionRequestSchema, workflowBatchSchema,
  type OperationEntry, type QualityLot, type WorkflowBatch,
} from '../../modules/farm-demo/operational-contracts';
import {
  assertMockClose, assertMockQr, assertMockTransition, mockJournal, mockVariance,
} from '../../modules/farm-demo/mock-domain';
import type { Permission } from '../../contracts/api';
import { apiErrorResponse } from './errors';

type OperationalState = {
  batches: WorkflowBatch[];
  operations: OperationEntry[];
  qualityLots: QualityLot[];
  qrPacks: Array<Record<string, unknown>>;
  resources: Array<Record<string, unknown>>;
  resourceUsages: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type OperationalScope = {
  tenantId: string;
  companyId: string;
  workspaceId: string;
};

export type OperationalActor = {
  activeTenantId: string | null;
  activeCompanyId: string | null;
  activeWorkspaceId: string | null;
  accessibleWorkspaceIds: string[];
  workspacePermissions: Permission[];
};

const workspaces = new Map<string, OperationalState>();
const json = (value: unknown, status = 200) => NextResponse.json(value, { status });

export function resetOperationalRepository() {
  workspaces.clear();
}

function collectionConfig(resource: string) {
  if (resource === 'batches') return { key: 'batches', schema: workflowBatchSchema };
  if (resource === 'operations') return { key: 'operations', schema: operationEntrySchema };
  if (resource === 'quality-lots') return { key: 'qualityLots', schema: qualityLotSchema };
  if (resource === 'qr-packs') return { key: 'qrPacks', schema: qrPackSchema };
  if (resource === 'resources') return { key: 'resources', schema: resourceRecordSchema };
  return null;
}

function scopeKey(scope: OperationalScope) {
  return `${scope.tenantId}:${scope.companyId}:${scope.workspaceId}`;
}

function hasScope(actor: OperationalActor, scope: OperationalScope) {
  return actor.activeTenantId === scope.tenantId
    && actor.activeCompanyId === scope.companyId
    && actor.activeWorkspaceId === scope.workspaceId
    && actor.accessibleWorkspaceIds.includes(scope.workspaceId);
}

function requireCapability(
  actor: OperationalActor,
  permission: Permission,
  requestId: string,
) {
  return actor.workspacePermissions.includes(permission)
    ? null
    : apiErrorResponse(
      403,
      `Workspace capability ${permission} is required for this operation.`,
      requestId,
      { requiredCapability: permission },
      'CAPABILITY_REQUIRED',
    );
}

export async function handleOperationalRequest(
  request: Request,
  path: string,
  requestId: string,
  actor: OperationalActor,
): Promise<NextResponse | null> {
  const match = path.match(/^\/tenants\/([^/]+)\/companies\/([^/]+)\/workspaces\/([^/]+)\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if (!match) return null;
  const [, tenantId, companyId, workspaceId, resource, entityId, action] = match.map((value) => value ? decodeURIComponent(value) : value);
  const scope = { tenantId, companyId, workspaceId };
  const method = request.method;
  const operationalResources = new Set([
    'operational-bootstrap',
    'batches',
    'operations',
    'quality-lots',
    'qr-packs',
    'resources',
    'resource-usages',
    'costing',
    'journals',
    'variances',
    'reports',
  ]);
  if (!operationalResources.has(resource)) return null;
  if (!hasScope(actor, scope)) {
    return apiErrorResponse(403, 'Active tenant, company, and workspace scope is required.', requestId);
  }
  if (!['GET', 'HEAD'].includes(method) && resource !== 'operational-bootstrap') {
    const required: Permission | null = resource === 'batches'
      ? entityId && action === 'transitions' ? null : 'batches.create'
      : resource === 'operations' ? 'operations.create'
      : resource === 'quality-lots' ? 'quality.manage'
      : resource === 'qr-packs' ? 'traceability.manage'
      : resource === 'resources' || resource === 'resource-usages' ? 'resources.manage'
      : null;
    if (required) {
      const denied = requireCapability(actor, required, requestId);
      if (denied) return denied;
    }
  }
  const key = scopeKey(scope);

  if (resource === 'operational-bootstrap') {
    const payload = await request.json().catch(() => null) as { state?: OperationalState } | null;
    if (!payload?.state) return apiErrorResponse(400, 'A seeded operational state is required.', requestId);
    if (method === 'POST' && workspaces.has(key)) return json(workspaces.get(key));
    if (method === 'POST' || method === 'PUT') {
      workspaces.set(key, {
        ...structuredClone(payload.state),
        resourceUsages: structuredClone(payload.state.resourceUsages ?? []),
      });
      return json(workspaces.get(key), method === 'POST' ? 201 : 200);
    }
    return apiErrorResponse(405, 'Method not allowed.', requestId);
  }

  const state = workspaces.get(key);
  if (!state) return apiErrorResponse(409, 'Operational workspace is not initialized.', requestId);
  const config = collectionConfig(resource);
  if (config) {
    const collection = state[config.key] as Array<{ id?: string }>;
    if (method === 'GET' && !entityId) return json(collection);
    if (method === 'PUT' && entityId) {
      const parsed = config.schema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return apiErrorResponse(422, 'Operational entity validation failed.', requestId, parsed.error.flatten());
      const index = collection.findIndex((item) => item.id === entityId);
      if (index >= 0) collection[index] = parsed.data;
      else collection.unshift(parsed.data);
      return json(parsed.data, index >= 0 ? 200 : 201);
    }
  }

  if (method === 'POST' && resource === 'batches' && !entityId) {
    const parsed = newBatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiErrorResponse(422, 'Batch validation failed.', requestId, parsed.error.flatten());
    const input = parsed.data;
    const created = workflowBatchSchema.parse({
      id: `batch-${Date.now()}`, code: `BATCH-${Date.now()}`, lob: input.lob,
      method: input.method, status: 'DRAFT', riskStatus: 'ON_TRACK',
      inventoryStatus: 'BLOCKED', costingStatus: 'DRAFT', stage: 'Draft setup',
      inputName: 'Configured input', inputQty: input.inputQty, inputUom: 'NOS',
      expectedOutput: input.expectedOutput, actualOutput: 0, standardRate: 20,
      actualRate: 20, expectedUsage: input.inputQty * 0.2, actualUsage: 0,
      standardOverhead: input.inputQty * 5, actualOverhead: 0, wip: 0,
      sourceBatchId: input.sourceBatchId, qcRequired: true, qcStatus: 'NOT_STARTED',
      borVersion: input.borVersion, costSplitMethod: input.costSplitMethod,
      createdAt: new Date().toISOString(),
    });
    state.batches.unshift(created);
    return json(created, 201);
  }

  if (method === 'POST' && resource === 'batches' && entityId && action === 'transitions') {
    const batch = state.batches.find((item) => item.id === entityId);
    if (!batch) return apiErrorResponse(404, 'Batch not found.', requestId);
    const parsed = transitionRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiErrorResponse(422, 'Transition validation failed.', requestId, parsed.error.flatten());
    if (parsed.data.expectedStatus && parsed.data.expectedStatus !== batch.status) {
      return apiErrorResponse(409, 'Batch status changed; refresh and retry.', requestId, { currentStatus: batch.status });
    }
    const action = parsed.data.action;
    const denied = requireCapability(
      actor,
      action === 'APPROVE'
        ? 'batches.approve'
        : action === 'CLOSE'
          ? 'batches.close'
          : 'operations.create',
      requestId,
    );
    if (denied) return denied;
    if (action === 'CLOSE') {
      const error = assertMockClose(batch);
      if (error) return apiErrorResponse(422, error, requestId);
      Object.assign(batch, { status: 'CLOSED', costingStatus: 'FINALIZED', inventoryStatus: 'RELEASED', wip: 0, closedAt: new Date().toISOString() });
      return json({ batch, message: `${batch.code} closed.`, variance: mockVariance(batch) });
    }
    if (action === 'APPROVE') {
      if (batch.status !== 'DRAFT') return apiErrorResponse(409, 'Only a draft batch can be approved.', requestId);
      Object.assign(batch, { status: 'APPROVED', costingStatus: 'OPEN', wip: batch.inputQty * batch.standardRate });
      return json({ batch, message: `${batch.code} approved.` });
    }
    const error = assertMockTransition(batch, action, parsed.data.reason);
    if (error) return apiErrorResponse(409, error, requestId);
    const status = action === 'START' || action === 'RESUME' ? 'ACTIVE' : action === 'PAUSE' ? 'PAUSED' : 'CANCELLED';
    Object.assign(batch, { status, wip: action === 'CANCEL' ? 0 : batch.wip });
    return json({ batch, message: `${batch.code} changed to ${status}.` });
  }

  if (method === 'POST' && resource === 'operations' && !entityId) {
    const parsed = newOperationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiErrorResponse(422, 'Operation validation failed.', requestId, parsed.error.flatten());
    if (!state.batches.some((item) => item.id === parsed.data.batchId)) return apiErrorResponse(404, 'Batch not found.', requestId);
    const created = operationEntrySchema.parse({
      ...parsed.data, id: `operation-${Date.now()}`, journal: mockJournal(parsed.data),
      createdAt: new Date().toISOString(),
    });
    state.operations.unshift(created);
    return json(created, 201);
  }

  if (method === 'POST' && resource === 'quality-lots' && !entityId) {
    const parsed = createQualityLotSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiErrorResponse(422, 'Quality lot validation failed.', requestId, parsed.error.flatten());
    const batch = state.batches.find((item) => item.id === parsed.data.batchId);
    if (!batch) return apiErrorResponse(404, 'Batch not found.', requestId);
    const lot = qualityLotSchema.parse({
      id: `qc-${Date.now()}`, code: `QC-${Date.now()}`, ...parsed.data,
      result: 'Awaiting result', status: 'HOLD', owner: 'Current user', createdAt: new Date().toISOString(),
    });
    state.qualityLots.unshift(lot);
    Object.assign(batch, { status: 'QC_HOLD', qcStatus: 'HOLD', inventoryStatus: 'BLOCKED' });
    return json(lot, 201);
  }

  if (method === 'POST' && resource === 'quality-lots' && entityId && action === 'disposition') {
    const lot = state.qualityLots.find((item) => item.id === entityId);
    if (!lot) return apiErrorResponse(404, 'Quality lot not found.', requestId);
    const parsed = qualityDispositionRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiErrorResponse(422, 'Disposition validation failed.', requestId, parsed.error.flatten());
    Object.assign(lot, parsed.data);
    const batch = state.batches.find((item) => item.id === lot.batchId);
    if (batch) Object.assign(batch, {
      qcStatus: parsed.data.status, status: parsed.data.status === 'PASS' ? 'READY_TO_CLOSE' : 'QC_HOLD',
      inventoryStatus: parsed.data.status === 'PASS' ? 'RELEASED' : 'BLOCKED',
      costingStatus: parsed.data.status === 'FAIL' ? 'CLOSE_BLOCKED' : batch.costingStatus,
    });
    return json(lot);
  }

  if (method === 'POST' && resource === 'qr-packs' && !entityId) {
    const parsed = createQrPackSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiErrorResponse(422, 'QR pack validation failed.', requestId, parsed.error.flatten());
    const batch = state.batches.find((item) => item.id === parsed.data.batchId);
    if (!batch) return apiErrorResponse(404, 'Batch not found.', requestId);
    const error = assertMockQr(batch, parsed.data.quantity);
    if (error) return apiErrorResponse(422, error, requestId);
    const pack = qrPackSchema.parse({
      id: `qr-${Date.now()}`, code: `PACK-${Date.now()}`, ...parsed.data,
      payload: JSON.stringify({ tenantId, companyId, workspaceId, batchId: batch.id }), createdAt: new Date().toISOString(),
    });
    state.qrPacks.unshift(pack);
    return json(pack, 201);
  }

  if (method === 'POST' && resource === 'resources' && !entityId) {
    const parsed = resourceRecordSchema.omit({ id: true }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiErrorResponse(422, 'Resource validation failed.', requestId, parsed.error.flatten());
    const created = resourceRecordSchema.parse({ ...parsed.data, id: `resource-${Date.now()}` });
    state.resources.unshift(created);
    return json(created, 201);
  }

  if (method === 'GET' && resource === 'resource-usages') return json(state.resourceUsages);
  if (method === 'POST' && resource === 'resource-usages') {
    const input = await request.json().catch(() => null) as {
      resourceId?: string; batchId?: string; quantity?: number;
    } | null;
    if (!input?.resourceId || !input.batchId || !input.quantity || input.quantity <= 0) {
      return apiErrorResponse(422, 'Resource usage validation failed.', requestId);
    }
    const resourceRecord = state.resources.find((item) => item.id === input.resourceId);
    if (!resourceRecord) return apiErrorResponse(404, 'Resource not found.', requestId);
    if (!state.batches.some((item) => item.id === input.batchId)) return apiErrorResponse(404, 'Batch not found.', requestId);
    const usage = {
      id: `resource-usage-${Date.now()}`, ...input,
      cost: Number(resourceRecord.costRate) * input.quantity, createdAt: new Date().toISOString(),
    };
    state.resourceUsages.unshift(usage);
    return json(usage, 201);
  }
  if (method === 'GET' && resource === 'costing') {
    return json((state.batches as Array<Record<string, unknown>>).map((batch) => ({
      batchId: batch.id, method: batch.method, wip: batch.wip,
      standardRate: batch.standardRate, actualRate: batch.actualRate, authoritative: false,
    })));
  }
  if (method === 'GET' && resource === 'journals') {
    return json((state.operations as Array<Record<string, unknown>>).flatMap((operation) => {
      const journal = operation.journal as Record<string, unknown> | undefined;
      return journal ? [{
        id: `journal-${operation.id}`, batchId: operation.batchId,
        ...journal, sourceOperationId: operation.id, createdAt: operation.createdAt,
        authoritative: false,
      }] : [];
    }));
  }
  if (method === 'GET' && resource === 'variances') {
    return json(state.batches.map((batch) => mockVariance(batch)));
  }
  if (method === 'GET' && resource === 'reports' && entityId === 'summary') {
    return json({
      tenantId, companyId, workspaceId, generatedAt: new Date().toISOString(), batchCount: state.batches.length,
      openWip: state.batches.reduce((sum, batch) => sum + batch.wip, 0),
      totalVariance: state.batches.reduce((sum, batch) => sum + mockVariance(batch).total, 0),
      authoritative: false,
    });
  }
  return null;
}
