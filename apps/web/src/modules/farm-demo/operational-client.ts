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

function parse<T>(schema: { parse(value: unknown): T }, value: unknown): T {
  return schema.parse(value);
}

export function createOperationalClients(client: NavfarmApiClient = api) {
  const root = (companyId: string) => `/companies/${encodeURIComponent(companyId)}`;
  return {
    workspace: {
      bootstrap: async <T>(companyId: string, seed: T) =>
        client.post<T>(`${root(companyId)}/operational-bootstrap`, { state: seed }),
      reset: async <T>(companyId: string, seed: T) =>
        client.put<T>(`${root(companyId)}/operational-bootstrap`, { state: seed }),
    },
    batches: {
      list: async (companyId: string) => parse(workflowBatchSchema.array(), await client.get(`${root(companyId)}/batches`)),
      create: async (companyId: string, input: NewBatchInput) => parse(workflowBatchSchema, await client.post(`${root(companyId)}/batches`, input)),
      save: async (companyId: string, batch: WorkflowBatch) => parse(workflowBatchSchema, await client.put(`${root(companyId)}/batches/${encodeURIComponent(batch.id)}`, batch)),
      transition: async (companyId: string, batchId: string, action: BatchTransitionAction, reason?: string, expectedStatus?: WorkflowBatch['status']) =>
        parse(transitionResultSchema, await client.post(`${root(companyId)}/batches/${encodeURIComponent(batchId)}/transitions`, { action, reason, expectedStatus })),
    },
    operations: {
      list: async (companyId: string) => parse(operationEntrySchema.array(), await client.get(`${root(companyId)}/operations`)),
      create: async (companyId: string, input: NewOperationInput) => parse(operationEntrySchema, await client.post(`${root(companyId)}/operations`, input)),
      save: async (companyId: string, operation: OperationEntry) => parse(operationEntrySchema, await client.put(`${root(companyId)}/operations/${encodeURIComponent(operation.id)}`, operation)),
    },
    qualityLots: {
      list: async (companyId: string) => parse(qualityLotSchema.array(), await client.get(`${root(companyId)}/quality-lots`)),
      create: async (companyId: string, input: { batchId: string; parameter: string }) => parse(qualityLotSchema, await client.post(`${root(companyId)}/quality-lots`, input)),
      save: async (companyId: string, lot: QualityLot) => parse(qualityLotSchema, await client.put(`${root(companyId)}/quality-lots/${encodeURIComponent(lot.id)}`, lot)),
      disposition: async (companyId: string, id: string, input: { status: 'HOLD' | 'PASS' | 'FAIL'; result: string }) =>
        parse(qualityLotSchema, await client.post(`${root(companyId)}/quality-lots/${encodeURIComponent(id)}/disposition`, input)),
    },
    qrPacks: {
      list: async (companyId: string) => parse(qrPackSchema.array(), await client.get(`${root(companyId)}/qr-packs`)),
      create: async (companyId: string, input: { batchId: string; quantity: number }) => parse(qrPackSchema, await client.post(`${root(companyId)}/qr-packs`, input)),
      save: async (companyId: string, pack: QrPack) => parse(qrPackSchema, await client.put(`${root(companyId)}/qr-packs/${encodeURIComponent(pack.id)}`, pack)),
    },
    resources: {
      list: async (companyId: string) => parse(resourceRecordSchema.array(), await client.get(`${root(companyId)}/resources`)),
      create: async (companyId: string, input: Omit<DemoResourceRecord, 'id'>) => parse(resourceRecordSchema, await client.post(`${root(companyId)}/resources`, input)),
      save: async (companyId: string, resource: DemoResourceRecord) => parse(resourceRecordSchema, await client.put(`${root(companyId)}/resources/${encodeURIComponent(resource.id)}`, resource)),
      usages: async (companyId: string) => parse(resourceUsageSchema.array(), await client.get(`${root(companyId)}/resource-usages`)),
      recordUsage: async (companyId: string, input: Omit<ResourceUsage, 'id' | 'createdAt' | 'cost'>) => parse(resourceUsageSchema, await client.post(`${root(companyId)}/resource-usages`, input)),
    },
    costing: { get: async (companyId: string) => parse(costingSnapshotSchema.array(), await client.get(`${root(companyId)}/costing`)) as CostingSnapshot[] },
    journals: { list: async (companyId: string) => parse(journalEntrySchema.array(), await client.get(`${root(companyId)}/journals`)) as JournalEntry[] },
    variances: { list: async (companyId: string) => parse(varianceResultSchema.array(), await client.get(`${root(companyId)}/variances`)) as VarianceResult[] },
    reports: { summary: async (companyId: string) => parse(operationalReportSchema, await client.get(`${root(companyId)}/reports/summary`)) as OperationalReport },
  };
}

export type OperationalClients = ReturnType<typeof createOperationalClients>;
export const operationalClients = createOperationalClients();
