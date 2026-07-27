import { z } from 'zod';

export const costingMethodSchema = z.enum(['STANDARD', 'FIFO', 'BIO_ASSET']);
export const workflowStatusSchema = z.enum([
  'DRAFT', 'APPROVED', 'ACTIVE', 'PAUSED', 'QC_HOLD',
  'READY_TO_CLOSE', 'CLOSED', 'CANCELLED',
]);
export const batchTransitionActionSchema = z.enum([
  'APPROVE', 'START', 'PAUSE', 'RESUME', 'CANCEL', 'CLOSE',
]);

export const workflowBatchSchema = z.object({
  id: z.string(), code: z.string(), lob: z.string(),
  method: costingMethodSchema, status: workflowStatusSchema,
  riskStatus: z.enum(['ON_TRACK', 'WARNING', 'AT_RISK', 'CRITICAL']),
  inventoryStatus: z.enum(['BLOCKED', 'PARTIAL', 'RELEASED']),
  costingStatus: z.enum(['DRAFT', 'OPEN', 'CLOSE_BLOCKED', 'FINALIZED']),
  stage: z.string(), inputName: z.string(), inputQty: z.number(),
  inputUom: z.string(), expectedOutput: z.number(), actualOutput: z.number(),
  standardRate: z.number(), actualRate: z.number(), expectedUsage: z.number(),
  actualUsage: z.number(), standardOverhead: z.number(), actualOverhead: z.number(),
  wip: z.number(), sourceBatchId: z.string().optional(), qcRequired: z.boolean(),
  qcStatus: z.enum(['NOT_STARTED', 'HOLD', 'PASS', 'FAIL']),
  borVersion: z.string().optional(),
  costSplitMethod: z.enum(['FIXED_PERCENT', 'BY_WEIGHT', 'MAIN_ALL']).optional(),
  createdAt: z.string(), closedAt: z.string().optional(),
});

export const operationEntrySchema = z.object({
  id: z.string(), batchId: z.string(),
  entryType: z.enum(['CONSUMPTION', 'OUTPUT', 'OVERHEAD', 'RESOURCE', 'MORTALITY', 'OBSERVATION']),
  parameter: z.string(), quantity: z.number(), uom: z.string(), unitCost: z.number(),
  expected: z.number().optional(), notes: z.string(),
  journal: z.object({ debit: z.string(), credit: z.string(), amount: z.number() }).optional(),
  createdAt: z.string(),
});

export const qualityLotSchema = z.object({
  id: z.string(), code: z.string(), batchId: z.string(), parameter: z.string(),
  result: z.string(), status: z.enum(['HOLD', 'PASS', 'FAIL']),
  owner: z.string(), createdAt: z.string(),
});

export const qrPackSchema = z.object({
  id: z.string(), code: z.string(), batchId: z.string(), quantity: z.number().positive(),
  payload: z.string(), createdAt: z.string(),
});

export const resourceRecordSchema = z.object({
  id: z.string(), name: z.string(),
  type: z.enum(['MANPOWER', 'EQUIPMENT', 'VEHICLE', 'UTILITY', 'OTHER']),
  allocation: z.string(), status: z.enum(['Available', 'In use', 'Maintenance due']),
  costRate: z.number().nonnegative(), costUom: z.enum(['HOUR', 'DAY', 'SHIFT', 'BATCH']),
});

export const varianceResultSchema = z.object({
  price: z.number(), usage: z.number(), output: z.number(),
  overhead: z.number(), total: z.number(),
});

export const newBatchSchema = z.object({
  lob: z.string().min(1), method: costingMethodSchema,
  inputQty: z.number().positive(), expectedOutput: z.number().positive(),
  sourceBatchId: z.string().optional(), borVersion: z.string().optional(),
  costSplitMethod: z.enum(['FIXED_PERCENT', 'BY_WEIGHT', 'MAIN_ALL']).optional(),
});

export const newOperationSchema = operationEntrySchema.omit({ id: true, journal: true, createdAt: true });
export const transitionRequestSchema = z.object({
  action: batchTransitionActionSchema, reason: z.string().optional(),
  expectedStatus: workflowStatusSchema.optional(),
});
export const transitionResultSchema = z.object({
  batch: workflowBatchSchema, message: z.string(), variance: varianceResultSchema.optional(),
});
export const qualityDispositionRequestSchema = z.object({
  status: z.enum(['HOLD', 'PASS', 'FAIL']), result: z.string().min(1),
});
export const createQualityLotSchema = z.object({ batchId: z.string(), parameter: z.string().min(1) });
export const createQrPackSchema = z.object({ batchId: z.string(), quantity: z.number().positive() });
export const resourceUsageSchema = z.object({
  id: z.string(), resourceId: z.string(), batchId: z.string(),
  quantity: z.number().positive(), cost: z.number().nonnegative(), createdAt: z.string(),
});
export const costingSnapshotSchema = z.object({
  batchId: z.string(), method: costingMethodSchema, wip: z.number(),
  standardRate: z.number(), actualRate: z.number(), authoritative: z.boolean(),
});
export const journalEntrySchema = z.object({
  id: z.string(), batchId: z.string(), debit: z.string(), credit: z.string(),
  amount: z.number(), sourceOperationId: z.string().optional(), createdAt: z.string(),
  authoritative: z.boolean(),
});
export const operationalReportSchema = z.object({
  companyId: z.string(), generatedAt: z.string(), batchCount: z.number(),
  openWip: z.number(), totalVariance: z.number(), authoritative: z.boolean(),
});

export type CostingMethod = z.infer<typeof costingMethodSchema>;
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;
export type WorkflowBatch = z.infer<typeof workflowBatchSchema>;
export type OperationEntry = z.infer<typeof operationEntrySchema>;
export type QualityLot = z.infer<typeof qualityLotSchema>;
export type QrPack = z.infer<typeof qrPackSchema>;
export type DemoResourceRecord = z.infer<typeof resourceRecordSchema>;
export type VarianceResult = z.infer<typeof varianceResultSchema>;
export type NewBatchInput = z.infer<typeof newBatchSchema>;
export type NewOperationInput = z.infer<typeof newOperationSchema>;
export type BatchTransitionAction = z.infer<typeof batchTransitionActionSchema>;
export type TransitionResult = z.infer<typeof transitionResultSchema>;
export type ResourceUsage = z.infer<typeof resourceUsageSchema>;
export type CostingSnapshot = z.infer<typeof costingSnapshotSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type OperationalReport = z.infer<typeof operationalReportSchema>;
