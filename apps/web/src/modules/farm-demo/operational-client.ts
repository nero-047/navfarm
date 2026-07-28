import { api, type NavfarmApiClient } from '../../lib/api-client';
import {
  costingSnapshotSchema, journalEntrySchema, operationEntrySchema,
  operationalReportSchema, qualityLotSchema, qrPackSchema, resourceRecordSchema,
  resourceUsageSchema, transitionResultSchema, varianceResultSchema,
  workflowBatchSchema, type BatchTransitionAction, type CostingSnapshot,
  type DemoResourceRecord, type JournalEntry, type NewBatchInput,
  type NewOperationInput, type OperationalReport, type OperationEntry,
  type QrPack, type QualityLot, type ResourceUsage,
  type VarianceResult, type WorkflowBatch,
} from './operational-contracts';

export type OperationalScope = {
  tenantId: string;
  companyId: string;
  workspaceId: string;
};

function parse<T>(schema: { parse(value: unknown): T }, value: unknown): T {
  return schema.parse(value);
}

export function createOperationalClients(client: NavfarmApiClient = api) {
  const root = ({ tenantId, companyId, workspaceId }: OperationalScope) =>
    `/tenants/${encodeURIComponent(tenantId)}/companies/${encodeURIComponent(companyId)}/workspaces/${encodeURIComponent(workspaceId)}`;
  return {
    workspace: {
      bootstrap: async <T>(scope: OperationalScope, seed: T) =>
        client.post<T>(`${root(scope)}/operational-bootstrap`, { state: seed }),
      reset: async <T>(scope: OperationalScope, seed: T) =>
        client.put<T>(`${root(scope)}/operational-bootstrap`, { state: seed }),
    },
    batches: {
      list: async (scope: OperationalScope) => parse(workflowBatchSchema.array(), await client.get(`${root(scope)}/batches`)),
      create: async (scope: OperationalScope, input: NewBatchInput) => parse(workflowBatchSchema, await client.post(`${root(scope)}/batches`, input)),
      save: async (scope: OperationalScope, batch: WorkflowBatch) => parse(workflowBatchSchema, await client.put(`${root(scope)}/batches/${encodeURIComponent(batch.id)}`, batch)),
      transition: async (scope: OperationalScope, batchId: string, action: BatchTransitionAction, reason?: string, expectedStatus?: WorkflowBatch['status']) =>
        parse(transitionResultSchema, await client.post(`${root(scope)}/batches/${encodeURIComponent(batchId)}/transitions`, { action, reason, expectedStatus })),
    },
    operations: {
      list: async (scope: OperationalScope) => parse(operationEntrySchema.array(), await client.get(`${root(scope)}/operations`)),
      create: async (scope: OperationalScope, input: NewOperationInput) => parse(operationEntrySchema, await client.post(`${root(scope)}/operations`, input)),
      save: async (scope: OperationalScope, operation: OperationEntry) => parse(operationEntrySchema, await client.put(`${root(scope)}/operations/${encodeURIComponent(operation.id)}`, operation)),
    },
    qualityLots: {
      list: async (scope: OperationalScope) => parse(qualityLotSchema.array(), await client.get(`${root(scope)}/quality-lots`)),
      create: async (scope: OperationalScope, input: { batchId: string; parameter: string }) => parse(qualityLotSchema, await client.post(`${root(scope)}/quality-lots`, input)),
      save: async (scope: OperationalScope, lot: QualityLot) => parse(qualityLotSchema, await client.put(`${root(scope)}/quality-lots/${encodeURIComponent(lot.id)}`, lot)),
      disposition: async (scope: OperationalScope, id: string, input: { status: 'HOLD' | 'PASS' | 'FAIL'; result: string }) =>
        parse(qualityLotSchema, await client.post(`${root(scope)}/quality-lots/${encodeURIComponent(id)}/disposition`, input)),
    },
    qrPacks: {
      list: async (scope: OperationalScope) => parse(qrPackSchema.array(), await client.get(`${root(scope)}/qr-packs`)),
      create: async (scope: OperationalScope, input: { batchId: string; quantity: number }) => parse(qrPackSchema, await client.post(`${root(scope)}/qr-packs`, input)),
      save: async (scope: OperationalScope, pack: QrPack) => parse(qrPackSchema, await client.put(`${root(scope)}/qr-packs/${encodeURIComponent(pack.id)}`, pack)),
    },
    resources: {
      list: async (scope: OperationalScope) => parse(resourceRecordSchema.array(), await client.get(`${root(scope)}/resources`)),
      create: async (scope: OperationalScope, input: Omit<DemoResourceRecord, 'id'>) => parse(resourceRecordSchema, await client.post(`${root(scope)}/resources`, input)),
      save: async (scope: OperationalScope, resource: DemoResourceRecord) => parse(resourceRecordSchema, await client.put(`${root(scope)}/resources/${encodeURIComponent(resource.id)}`, resource)),
      usages: async (scope: OperationalScope) => parse(resourceUsageSchema.array(), await client.get(`${root(scope)}/resource-usages`)),
      recordUsage: async (scope: OperationalScope, input: Omit<ResourceUsage, 'id' | 'createdAt' | 'cost'>) => parse(resourceUsageSchema, await client.post(`${root(scope)}/resource-usages`, input)),
    },
    costing: { get: async (scope: OperationalScope) => parse(costingSnapshotSchema.array(), await client.get(`${root(scope)}/costing`)) as CostingSnapshot[] },
    journals: { list: async (scope: OperationalScope) => parse(journalEntrySchema.array(), await client.get(`${root(scope)}/journals`)) as JournalEntry[] },
    variances: { list: async (scope: OperationalScope) => parse(varianceResultSchema.array(), await client.get(`${root(scope)}/variances`)) as VarianceResult[] },
    reports: { summary: async (scope: OperationalScope) => parse(operationalReportSchema, await client.get(`${root(scope)}/reports/summary`)) as OperationalReport },
  };
}

export type OperationalClients = ReturnType<typeof createOperationalClients>;
export const operationalClients = createOperationalClients();
