import { z } from 'zod';
import type { RuntimeContract } from './api';

export const auditMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string(),
}).strict();

const statusSchema = z.enum(['ACTIVE', 'INACTIVE']);
const decimalSchema = z.string().regex(/^-?\d+(?:\.\d+)?$/, 'Use a decimal string.');
const codeSchema = z.string().trim().min(2).max(50).regex(/^[A-Z0-9_-]+$/);

export const nobTemplateSchema = z.object({
  nobTemplateId: z.string(),
  code: codeSchema,
  name: z.string().min(2),
  description: z.string(),
  sortOrder: z.number().int(),
  status: statusSchema,
  audit: auditMetadataSchema,
}).strict();

export const lobTemplateSchema = z.object({
  lobTemplateId: z.string(),
  nobTemplateId: z.string(),
  code: codeSchema,
  name: z.string().min(2),
  allowedCostingMethods: z.array(z.enum(['STANDARD', 'FIFO', 'BIO_ASSET'])),
  defaultCostingMethod: z.enum(['STANDARD', 'FIFO', 'BIO_ASSET']),
  qcRequired: z.boolean(),
  qrRequired: z.boolean(),
  traceabilityRequired: z.boolean(),
  dependencies: z.array(z.string()),
  status: statusSchema,
  audit: auditMetadataSchema,
}).strict();

export const moduleTemplateSchema = z.object({
  moduleId: z.string(),
  code: z.enum(['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics', 'Resources', 'Scheduling']),
  name: z.string(),
  description: z.string(),
  status: statusSchema,
}).strict();

export const referenceDataSchema = z.object({
  languages: z.array(z.object({ id: z.string(), code: z.string(), name: z.string(), status: statusSchema }).strict()),
  currencies: z.array(z.object({ id: z.string(), code: z.string().length(3), name: z.string(), symbol: z.string(), status: statusSchema }).strict()),
  timezones: z.array(z.object({ id: z.string(), code: z.string(), name: z.string(), status: statusSchema }).strict()),
}).strict();

export const companyNobSchema = z.object({
  companyNobId: z.string(),
  companyId: z.string(),
  nobTemplateId: z.string(),
  code: codeSchema,
  name: z.string().min(2),
  status: statusSchema,
  referencedBy: z.array(z.object({ resource: z.string(), count: z.number().int().nonnegative() }).strict()),
  audit: auditMetadataSchema,
}).strict();

export const companyLobSchema = z.object({
  companyLobId: z.string(),
  companyId: z.string(),
  companyNobId: z.string(),
  lobTemplateId: z.string(),
  code: codeSchema,
  name: z.string().min(2),
  costingMethod: z.enum(['STANDARD', 'FIFO', 'BIO_ASSET']),
  qcRequired: z.boolean(),
  qrRequired: z.boolean(),
  status: statusSchema,
  referencedBy: z.array(z.object({ resource: z.string(), count: z.number().int().nonnegative() }).strict()),
  audit: auditMetadataSchema,
}).strict();

export const businessStructureResponseSchema = z.object({
  companyId: z.string(),
  completeness: z.number().int().min(0).max(100),
  blockingIssues: z.array(z.string()),
  nobs: z.array(companyNobSchema),
  lobs: z.array(companyLobSchema),
}).strict();

const masterBase = {
  id: z.string(),
  companyId: z.string(),
  code: codeSchema,
  name: z.string().min(2),
  status: statusSchema,
  referencedBy: z.array(z.object({ resource: z.string(), count: z.number().int().nonnegative() }).strict()),
  audit: auditMetadataSchema,
};

export const uomSchema = z.object({
  ...masterBase,
  symbol: z.string(),
  decimalPlaces: z.number().int().min(0).max(8),
}).strict();

export const uomConversionSchema = z.object({
  ...masterBase,
  fromUomId: z.string(),
  toUomId: z.string(),
  itemId: z.string().nullable(),
  factor: decimalSchema,
  effectiveFrom: z.string(),
}).strict();

export const itemCategorySchema = z.object({
  ...masterBase,
  parentCategoryId: z.string().nullable(),
}).strict();

export const itemSchema = z.object({
  ...masterBase,
  categoryId: z.string(),
  primaryUomId: z.string(),
  secondaryUomId: z.string().nullable(),
  itemType: z.enum(['RAW_MATERIAL', 'CONSUMABLE', 'LIVING_ASSET', 'SEMI_FINISHED', 'FINISHED_GOOD', 'BY_PRODUCT', 'OVERHEAD']),
  companyNobId: z.string().nullable(),
  companyLobId: z.string().nullable(),
  valuationMethod: z.enum(['STANDARD', 'FIFO', 'BIO_ASSET']).nullable(),
  standardCost: decimalSchema.nullable(),
  lotTracking: z.boolean(),
}).strict();

export const attributeSchema = z.object({
  ...masterBase,
  dataType: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'LIST']),
  unitUomId: z.string().nullable(),
  allowedValues: z.array(z.string()),
  mandatory: z.boolean(),
  affectsCosting: z.boolean(),
  companyNobId: z.string().nullable(),
  companyLobId: z.string().nullable(),
}).strict();

export const breedSchema = z.object({
  ...masterBase,
  species: z.string(),
  companyNobId: z.string(),
  companyLobId: z.string().nullable(),
}).strict();

export const locationSchema = z.object({
  ...masterBase,
  locationType: z.enum(['FARM', 'SHED', 'WAREHOUSE', 'POND', 'FIELD', 'PROCESSING_UNIT', 'OTHER']),
  parentLocationId: z.string().nullable(),
}).strict();

export const resourceSchema = z.object({
  ...masterBase,
  resourceType: z.enum(['MANPOWER', 'EQUIPMENT', 'VEHICLE', 'UTILITY', 'OTHER']),
  costPerUnit: decimalSchema,
  costUomId: z.string(),
  currency: z.string().length(3),
  companyNobId: z.string().nullable(),
  companyLobId: z.string().nullable(),
}).strict();

export const operationalParameterSchema = z.object({
  ...masterBase,
  parameterType: z.enum(['CONSUMPTION', 'OUTPUT', 'DESCRIPTIVE', 'OVERHEAD', 'RESOURCE', 'QC']),
  entryTypeCode: codeSchema,
  defaultUomId: z.string(),
  defaultQuantityPerUnit: decimalSchema.nullable(),
  companyNobId: z.string(),
  companyLobId: z.string(),
  itemId: z.string().nullable(),
  resourceId: z.string().nullable(),
  essential: z.boolean(),
}).strict();

export const qcParameterSchema = z.object({
  ...masterBase,
  resultType: z.enum(['NUMERIC', 'VISUAL', 'GRADE', 'BOOLEAN']),
  uomId: z.string().nullable(),
  minValue: decimalSchema.nullable(),
  maxValue: decimalSchema.nullable(),
  passCriteria: z.string(),
  companyLobId: z.string(),
  mandatory: z.boolean(),
  essential: z.boolean(),
}).strict();

export const masterResourceSchema = z.enum([
  'uoms', 'uom-conversions', 'item-categories', 'items', 'attributes', 'breeds',
  'locations', 'resources', 'operational-parameters', 'qc-parameters',
]);
export type MasterResource = z.infer<typeof masterResourceSchema>;

export const masterSchemas = {
  uoms: uomSchema,
  'uom-conversions': uomConversionSchema,
  'item-categories': itemCategorySchema,
  items: itemSchema,
  attributes: attributeSchema,
  breeds: breedSchema,
  locations: locationSchema,
  resources: resourceSchema,
  'operational-parameters': operationalParameterSchema,
  'qc-parameters': qcParameterSchema,
} satisfies Record<MasterResource, z.ZodType>;

export const masterRecordSchema = z.discriminatedUnion('resource', [
  z.object({ resource: z.literal('uoms'), record: uomSchema }).strict(),
  z.object({ resource: z.literal('uom-conversions'), record: uomConversionSchema }).strict(),
  z.object({ resource: z.literal('item-categories'), record: itemCategorySchema }).strict(),
  z.object({ resource: z.literal('items'), record: itemSchema }).strict(),
  z.object({ resource: z.literal('attributes'), record: attributeSchema }).strict(),
  z.object({ resource: z.literal('breeds'), record: breedSchema }).strict(),
  z.object({ resource: z.literal('locations'), record: locationSchema }).strict(),
  z.object({ resource: z.literal('resources'), record: resourceSchema }).strict(),
  z.object({ resource: z.literal('operational-parameters'), record: operationalParameterSchema }).strict(),
  z.object({ resource: z.literal('qc-parameters'), record: qcParameterSchema }).strict(),
]);

export const masterListResponseSchema = z.object({
  resource: masterResourceSchema,
  records: z.array(z.unknown()),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
}).strict().superRefine((value, context) => {
  const schema = masterSchemas[value.resource];
  value.records.forEach((record, index) => {
    const parsed = schema.safeParse(record);
    if (!parsed.success) context.addIssue({ code: 'custom', path: ['records', index], message: parsed.error.message });
  });
});

export const masterDashboardSchema = z.object({
  companyId: z.string(),
  categories: z.array(z.object({
    resource: masterResourceSchema,
    label: z.string(),
    total: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
    inactive: z.number().int().nonnegative(),
    configured: z.boolean(),
    blockingIssues: z.array(z.string()),
    lastUpdatedAt: z.string().datetime().nullable(),
    canManage: z.boolean(),
    importAvailable: z.boolean(),
  }).strict()),
}).strict();

export const accountSchema = z.object({
  accountId: z.string(),
  companyId: z.string(),
  code: codeSchema,
  name: z.string().min(2),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'CONTRA_ASSET']),
  category: z.string(),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  parentAccountId: z.string().nullable(),
  posting: z.boolean(),
  currency: z.string().length(3).nullable(),
  status: statusSchema,
  referencedBy: z.array(z.object({ resource: z.string(), count: z.number().int().nonnegative() }).strict()),
  audit: auditMetadataSchema,
}).strict();

export const glEventSchema = z.enum([
  'GRN_IN', 'CONSUMPTION_OUT', 'PRODUCTION_OUTPUT', 'MORTALITY',
  'WASTAGE', 'PRICE_VARIANCE', 'USAGE_VARIANCE', 'OUTPUT_VARIANCE',
]);

export const glMappingSchema = z.object({
  mappingId: z.string(),
  companyId: z.string(),
  eventType: glEventSchema,
  companyNobId: z.string().nullable(),
  companyLobId: z.string().nullable(),
  inventoryAccountId: z.string().nullable(),
  consumptionAccountId: z.string().nullable(),
  outputAccountId: z.string().nullable(),
  varianceAccountId: z.string().nullable(),
  wastageMortalityAccountId: z.string().nullable(),
  debitPreview: z.string(),
  creditPreview: z.string(),
  status: statusSchema,
  audit: auditMetadataSchema,
}).strict();

export const costingConfigurationSchema = z.object({
  companyId: z.string(),
  scope: z.enum(['COMPANY', 'NOB', 'LOB']),
  companyNobId: z.string().nullable(),
  companyLobId: z.string().nullable(),
  method: z.enum(['STANDARD', 'FIFO', 'BIO_ASSET']),
  standardCostReady: z.boolean(),
  explanation: z.string(),
  status: statusSchema,
  audit: auditMetadataSchema,
}).strict();

export const operationsReadinessSchema = z.object({
  companyId: z.string(),
  workspaceReady: z.boolean(),
  operationsReady: z.boolean(),
  setupComplete: z.boolean(),
  percentage: z.number().int().min(0).max(100),
  blockingRequirements: z.array(z.object({ code: z.string(), label: z.string(), href: z.string() }).strict()),
  warnings: z.array(z.string()),
  affectedModules: z.array(z.string()),
}).strict();

export const importPreviewSchema = z.object({
  importId: z.string(),
  companyId: z.string(),
  resource: masterResourceSchema,
  status: z.enum(['VALIDATED', 'CONFIRMED', 'FAILED']),
  validRows: z.number().int().nonnegative(),
  invalidRows: z.number().int().nonnegative(),
  errors: z.array(z.object({ row: z.number().int().positive(), field: z.string(), message: z.string() }).strict()),
  createdAt: z.string().datetime(),
}).strict();

export const exportResponseSchema = z.object({
  filename: z.string(),
  format: z.enum(['CSV', 'XLSX']),
  contentType: z.string(),
  content: z.string(),
}).strict();

const masterRecordRuntimeContracts: RuntimeContract[] = masterResourceSchema.options.flatMap((resource) => {
  const schema = masterSchemas[resource];
  const escaped = resource.replaceAll('-', '\\-');
  return [
    { method: 'POST', pattern: new RegExp(`^/companies/[^/]+/masters/${escaped}$`), response: schema },
    { method: 'GET', pattern: new RegExp(`^/companies/[^/]+/masters/${escaped}/[^/]+$`), response: schema },
    { method: 'PATCH', pattern: new RegExp(`^/companies/[^/]+/masters/${escaped}/[^/]+$`), response: schema },
    { method: 'POST', pattern: new RegExp(`^/companies/[^/]+/masters/${escaped}/[^/]+/(activate|deactivate)$`), response: schema },
  ];
});

export const phase3RuntimeContracts: RuntimeContract[] = [
  { method: 'GET', pattern: /^\/platform\/masters\/nobs$/, response: z.array(nobTemplateSchema) },
  { method: 'GET', pattern: /^\/platform\/masters\/lobs$/, response: z.array(lobTemplateSchema) },
  { method: 'GET', pattern: /^\/platform\/masters\/modules$/, response: z.array(moduleTemplateSchema) },
  { method: 'GET', pattern: /^\/platform\/masters\/reference-data$/, response: referenceDataSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/business-structure$/, response: businessStructureResponseSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/nobs$/, response: z.array(companyNobSchema) },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/nobs$/, response: companyNobSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/nobs\/[^/]+$/, response: companyNobSchema },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/nobs\/[^/]+\/(activate|deactivate)$/, response: companyNobSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/lobs$/, response: z.array(companyLobSchema) },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/lobs$/, response: companyLobSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/lobs\/[^/]+$/, response: companyLobSchema },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/lobs\/[^/]+\/(activate|deactivate)$/, response: companyLobSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/masters$/, response: masterDashboardSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/masters\/[^/]+$/, response: masterListResponseSchema },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/masters\/[^/]+\/import\/validate$/, response: importPreviewSchema },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/masters\/[^/]+\/import\/confirm$/, response: importPreviewSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/masters\/imports\/[^/]+$/, response: importPreviewSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/masters\/[^/]+\/export$/, response: exportResponseSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/masters\/[^/]+\/import-template$/, response: exportResponseSchema },
  ...masterRecordRuntimeContracts,
  { method: 'GET', pattern: /^\/companies\/[^/]+\/accounting\/accounts$/, response: z.array(accountSchema) },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/accounting\/accounts$/, response: accountSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/accounting\/accounts\/[^/]+$/, response: accountSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/accounting\/accounts\/[^/]+$/, response: accountSchema },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/accounting\/accounts\/[^/]+\/(activate|deactivate)$/, response: accountSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/accounting\/gl-mappings$/, response: z.array(glMappingSchema) },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/accounting\/gl-mappings$/, response: glMappingSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/accounting\/gl-mappings\/[^/]+$/, response: glMappingSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/accounting\/costing$/, response: costingConfigurationSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/accounting\/costing$/, response: costingConfigurationSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/accounting\/readiness$/, response: operationsReadinessSchema },
];

export type CompanyNob = z.infer<typeof companyNobSchema>;
export type CompanyLob = z.infer<typeof companyLobSchema>;
export type MasterDashboard = z.infer<typeof masterDashboardSchema>;
export type Account = z.infer<typeof accountSchema>;
export type GlMapping = z.infer<typeof glMappingSchema>;
export type CostingConfiguration = z.infer<typeof costingConfigurationSchema>;
export type OperationsReadiness = z.infer<typeof operationsReadinessSchema>;
export type ImportPreview = z.infer<typeof importPreviewSchema>;
