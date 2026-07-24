import { NextResponse } from 'next/server';
import {
  accountSchema,
  companyLobSchema,
  companyNobSchema,
  costingConfigurationSchema,
  glMappingSchema,
  masterResourceSchema,
  masterSchemas,
  type Account,
  type CompanyLob,
  type CompanyNob,
  type CostingConfiguration,
  type MasterResource,
} from '../../contracts/phase3';
import { apiErrorResponse } from './errors';

type Json = Record<string, unknown>;
export interface Phase3Actor {
  userId: string;
  fullName: string;
  platformRole: string | null;
  activeCompanyId: string | null;
  companyView: boolean;
  companyManage: boolean;
  financeView: boolean;
  financeManage: boolean;
}

const seedTime = '2026-07-24T08:00:00.000Z';
const audit = (user = 'NAVFarm seed') => ({
  createdAt: seedTime, createdBy: user, updatedAt: seedTime, updatedBy: user,
});
const ref = (resource: string, count: number) => [{ resource, count }];

const nobTemplates = [
  ['nob-poultry', 'POULTRY', 'Poultry', 'Birds: rearing, laying, hatching and slaughter'],
  ['nob-livestock', 'LIVESTOCK', 'Livestock', 'Cattle, buffalo, piggery, goats and sheep'],
  ['nob-agriculture', 'AGRI', 'Agriculture', 'Crops, fruit, flowers and seeds'],
  ['nob-aquaculture', 'AQUA', 'Aquaculture', 'Fish, shrimp and other aquatic production'],
  ['nob-insect', 'INSECT', 'Insect Farming', 'Beekeeping and insect production'],
  ['nob-processing', 'PRODUCTION', 'Feed & Processing', 'Feed mills and processing plants'],
].map(([nobTemplateId, code, name, description], index) => ({
  nobTemplateId, code, name, description, sortOrder: index + 1, status: 'ACTIVE' as const, audit: audit(),
}));

const lobTemplates = [
  ['lob-rearing', 'nob-poultry', 'PLT_REARING', 'Rearing & Breeding', ['STANDARD', 'FIFO', 'BIO_ASSET'], 'STANDARD', false, true],
  ['lob-laying', 'nob-poultry', 'PLT_LAYING', 'Laying', ['STANDARD', 'FIFO', 'BIO_ASSET'], 'STANDARD', true, true],
  ['lob-hatching', 'nob-poultry', 'PLT_HATCHING', 'Hatching', ['STANDARD', 'FIFO'], 'STANDARD', true, true],
  ['lob-broiler', 'nob-poultry', 'PLT_CB', 'Commercial Broiler', ['STANDARD', 'FIFO'], 'STANDARD', false, true],
  ['lob-slaughter', 'nob-poultry', 'PLT_SLAUGHTER', 'Poultry Slaughter', ['STANDARD', 'FIFO'], 'FIFO', true, true],
  ['lob-piggery', 'nob-livestock', 'LVS_PIGGERY', 'Piggery', ['BIO_ASSET'], 'BIO_ASSET', false, true],
  ['lob-fruit', 'nob-agriculture', 'AGRI_FRUIT', 'Fruit & Orchard', ['STANDARD', 'FIFO', 'BIO_ASSET'], 'BIO_ASSET', true, true],
  ['lob-aqua', 'nob-aquaculture', 'AQUA_FARMING', 'Aquaculture Farming', ['STANDARD', 'FIFO', 'BIO_ASSET'], 'FIFO', true, true],
  ['lob-bee', 'nob-insect', 'INS_BEE', 'Beekeeping', ['STANDARD', 'FIFO'], 'FIFO', true, true],
  ['lob-feed', 'nob-processing', 'PRD_FEED', 'Feed Mill', ['STANDARD', 'FIFO'], 'STANDARD', true, true],
] as const;

const platformLobs = lobTemplates.map((row) => ({
  lobTemplateId: row[0], nobTemplateId: row[1], code: row[2], name: row[3],
  allowedCostingMethods: [...row[4]], defaultCostingMethod: row[5],
  qcRequired: row[6], qrRequired: row[7], traceabilityRequired: true,
  dependencies: row[2] === 'PLT_SLAUGHTER' ? ['items', 'locations', 'qc-parameters', 'gl-mappings'] : [],
  status: 'ACTIVE' as const, audit: audit(),
}));

const modules = [
  ['Batches', 'Production batches'], ['Inventory', 'Inventory and item lots'],
  ['QC', 'Quality control'], ['QR', 'QR traceability'], ['Finance', 'Accounting and costing'],
  ['Analytics', 'Reports and analytics'], ['Resources', 'Resource planning'], ['Scheduling', 'Schedulers and KPIs'],
].map(([code, description], index) => ({
  moduleId: `module-${index + 1}`, code, name: code, description, status: 'ACTIVE',
}));

type CompanyState = {
  nobs: CompanyNob[];
  lobs: CompanyLob[];
  masters: Record<MasterResource, Json[]>;
  accounts: Account[];
  mappings: Array<ReturnType<typeof glMappingSchema.parse>>;
  costing: CostingConfiguration;
  imports: Json[];
};
type State = { companies: Map<string, CompanyState>; sequence: number };
declare global { var __navfarmPhase3State: State | undefined; }

const baseMasters = (): Record<MasterResource, Json[]> => ({
  uoms: [
    { id: 'uom-kg', companyId: 'company-green-valley', code: 'KG', name: 'Kilogram', symbol: 'kg', decimalPlaces: 4, status: 'ACTIVE', referencedBy: ref('items', 2), audit: audit() },
    { id: 'uom-bag', companyId: 'company-green-valley', code: 'BAG', name: 'Bag', symbol: 'bag', decimalPlaces: 2, status: 'ACTIVE', referencedBy: ref('uom-conversions', 1), audit: audit() },
    { id: 'uom-nos', companyId: 'company-green-valley', code: 'NOS', name: 'Numbers', symbol: 'nos', decimalPlaces: 0, status: 'ACTIVE', referencedBy: ref('items', 1), audit: audit() },
  ],
  'uom-conversions': [
    { id: 'conversion-bag-kg', companyId: 'company-green-valley', code: 'BAG_TO_KG', name: 'Bag to kilogram', fromUomId: 'uom-bag', toUomId: 'uom-kg', itemId: 'item-feed', factor: '50.00000000', effectiveFrom: '2026-01-01', status: 'ACTIVE', referencedBy: [], audit: audit() },
  ],
  'item-categories': [
    { id: 'category-feed', companyId: 'company-green-valley', code: 'FEED', name: 'Feed', parentCategoryId: null, status: 'ACTIVE', referencedBy: ref('items', 1), audit: audit() },
    { id: 'category-output', companyId: 'company-green-valley', code: 'OUTPUT', name: 'Production output', parentCategoryId: null, status: 'ACTIVE', referencedBy: ref('items', 2), audit: audit() },
  ],
  items: [
    { id: 'item-feed', companyId: 'company-green-valley', code: 'FEED_GROWER', name: 'Grower Feed 18% Protein', categoryId: 'category-feed', primaryUomId: 'uom-kg', secondaryUomId: 'uom-bag', itemType: 'CONSUMABLE', companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler', valuationMethod: 'STANDARD', standardCost: '20.000000', lotTracking: true, status: 'ACTIVE', referencedBy: ref('operational-parameters', 1), audit: audit() },
    { id: 'item-live-bird', companyId: 'company-green-valley', code: 'LIVE_BIRD', name: 'Live Broiler Bird', categoryId: 'category-output', primaryUomId: 'uom-nos', secondaryUomId: null, itemType: 'FINISHED_GOOD', companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler', valuationMethod: 'STANDARD', standardCost: '185.000000', lotTracking: true, status: 'ACTIVE', referencedBy: ref('gl-mappings', 1), audit: audit() },
  ],
  attributes: [
    { id: 'attribute-protein', companyId: 'company-green-valley', code: 'PROTEIN_PCT', name: 'Protein percentage', dataType: 'NUMBER', unitUomId: null, allowedValues: [], mandatory: false, affectsCosting: false, companyNobId: 'company-nob-poultry', companyLobId: null, status: 'ACTIVE', referencedBy: [], audit: audit() },
  ],
  breeds: [
    { id: 'breed-ross', companyId: 'company-green-valley', code: 'ROSS_308', name: 'Ross 308 Broiler', species: 'Chicken', companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler', status: 'ACTIVE', referencedBy: ref('schedulers', 1), audit: audit() },
  ],
  locations: [
    { id: 'location-farm', companyId: 'company-green-valley', code: 'FARM_01', name: 'Green Valley Farm', locationType: 'FARM', parentLocationId: null, status: 'ACTIVE', referencedBy: ref('locations', 1), audit: audit() },
    { id: 'location-shed', companyId: 'company-green-valley', code: 'SHED_01', name: 'Broiler Shed 01', locationType: 'SHED', parentLocationId: 'location-farm', status: 'ACTIVE', referencedBy: ref('batches', 1), audit: audit() },
  ],
  resources: [
    { id: 'resource-worker', companyId: 'company-green-valley', code: 'FARM_WORKER_01', name: 'Senior Farm Worker', resourceType: 'MANPOWER', costPerUnit: '150.0000', costUomId: 'uom-hour', currency: 'INR', companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler', status: 'ACTIVE', referencedBy: [], audit: audit() },
  ],
  'operational-parameters': [
    { id: 'parameter-feed', companyId: 'company-green-valley', code: 'CONS_FEED_GROWER', name: 'Grower feed consumption', parameterType: 'CONSUMPTION', entryTypeCode: 'CONS_FEED', defaultUomId: 'uom-kg', defaultQuantityPerUnit: '0.12000000', companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler', itemId: 'item-feed', resourceId: null, essential: true, status: 'ACTIVE', referencedBy: [], audit: audit() },
  ],
  'qc-parameters': [
    { id: 'qc-live-weight', companyId: 'company-green-valley', code: 'QC_BIRD_WEIGHT', name: 'Live bird weight', resultType: 'NUMERIC', uomId: 'uom-kg', minValue: '1.8000', maxValue: '2.5000', passCriteria: 'Weight between 1.8 and 2.5 kg', companyLobId: 'company-lob-broiler', mandatory: true, essential: true, status: 'ACTIVE', referencedBy: [], audit: audit() },
  ],
});

function seedCompany(companyId: string, mode: 'FULL' | 'PARTIAL' | 'EMPTY'): CompanyState {
  const nobs: CompanyNob[] = mode === 'EMPTY' ? [] : [{
    companyNobId: 'company-nob-poultry', companyId, nobTemplateId: 'nob-poultry',
    code: 'POULTRY', name: 'Poultry', status: 'ACTIVE',
    referencedBy: mode === 'FULL' ? ref('lines of business', 1) : [], audit: audit(),
  }];
  const lobs: CompanyLob[] = mode === 'EMPTY' ? [] : [{
    companyLobId: 'company-lob-broiler', companyId, companyNobId: 'company-nob-poultry',
    lobTemplateId: 'lob-broiler', code: 'PLT_CB', name: 'Commercial Broiler',
    costingMethod: mode === 'PARTIAL' ? 'STANDARD' : 'FIFO', qcRequired: true,
    qrRequired: true, status: 'ACTIVE', referencedBy: mode === 'FULL' ? ref('items', 2) : [], audit: audit(),
  }];
  const masters = mode === 'FULL' ? baseMasters() : baseMasters();
  for (const rows of Object.values(masters)) {
    for (const row of rows) row.companyId = companyId;
    if (mode === 'EMPTY') rows.splice(0);
    if (mode === 'PARTIAL' && rows !== masters.uoms && rows !== masters['item-categories']) rows.splice(0);
  }
  const accounts: Account[] = mode === 'EMPTY' ? [] : [
    { accountId: 'account-inventory', companyId, code: '1100', name: 'Inventory - Feed & Consumables', accountType: 'ASSET', category: 'CURRENT_ASSET', normalBalance: 'DEBIT', parentAccountId: null, posting: true, currency: 'INR', status: 'ACTIVE', referencedBy: mode === 'FULL' ? ref('gl-mappings', 1) : [], audit: audit() },
    { accountId: 'account-wip', companyId, code: '1190', name: 'Work In Progress', accountType: 'ASSET', category: 'CURRENT_ASSET', normalBalance: 'DEBIT', parentAccountId: null, posting: true, currency: 'INR', status: 'ACTIVE', referencedBy: [], audit: audit() },
    { accountId: 'account-consumption', companyId, code: '5100', name: 'Feed Consumption', accountType: 'EXPENSE', category: 'COGS', normalBalance: 'DEBIT', parentAccountId: null, posting: true, currency: 'INR', status: 'ACTIVE', referencedBy: [], audit: audit() },
  ];
  const mappings = mode === 'FULL' ? [glMappingSchema.parse({
    mappingId: 'mapping-consumption', companyId, eventType: 'CONSUMPTION_OUT',
    companyNobId: 'company-nob-poultry', companyLobId: 'company-lob-broiler',
    inventoryAccountId: 'account-inventory', consumptionAccountId: 'account-consumption',
    outputAccountId: null, varianceAccountId: null, wastageMortalityAccountId: null,
    debitPreview: 'Feed Consumption', creditPreview: 'Inventory - Feed & Consumables',
    status: 'ACTIVE', audit: audit(),
  })] : [];
  return {
    nobs, lobs, masters, accounts, mappings,
    costing: costingConfigurationSchema.parse({
      companyId, scope: 'LOB', companyNobId: nobs[0]?.companyNobId ?? null,
      companyLobId: lobs[0]?.companyLobId ?? null,
      method: mode === 'FULL' ? 'FIFO' : 'STANDARD', standardCostReady: mode === 'FULL',
      explanation: mode === 'FULL'
        ? 'FIFO consumes the oldest available inventory layer first.'
        : 'STANDARD requires standard costs and variance GL mappings.',
      status: 'ACTIVE', audit: audit(),
    }),
    imports: [],
  };
}

function initialState(): State {
  return {
    companies: new Map([
      ['company-green-valley', seedCompany('company-green-valley', 'FULL')],
      ['company-bluewater', seedCompany('company-bluewater', 'PARTIAL')],
      ['company-harvest-ridge', seedCompany('company-harvest-ridge', 'EMPTY')],
    ]),
    sequence: 100,
  };
}
const state = globalThis.__navfarmPhase3State ?? initialState();
globalThis.__navfarmPhase3State = state;

const json = (value: unknown, status = 200) => NextResponse.json(value, { status });
const inputBody = async (request: Request): Promise<Json> =>
  request.headers.get('content-type')?.includes('application/json')
    ? (await request.json().catch(() => ({}))) as Json
    : {};
const updatedAudit = (actor: Phase3Actor, previous?: Json) => ({
  createdAt: (previous?.createdAt as string | undefined) ?? seedTime,
  createdBy: (previous?.createdBy as string | undefined) ?? actor.fullName,
  updatedAt: new Date().toISOString(),
  updatedBy: actor.fullName,
});

function conflict(requestId: string, message: string, details: Json) {
  return NextResponse.json({
    error: { code: 'resource_in_use', message, status: 409, requestId, details },
  }, { status: 409, headers: { 'x-request-id': requestId } });
}
function companyState(companyId: string) {
  const existing = state.companies.get(companyId);
  if (existing) return existing;
  const created = seedCompany(companyId, 'EMPTY');
  state.companies.set(companyId, created);
  return created;
}
function canSeeCompany(actor: Phase3Actor, companyId: string) {
  return actor.platformRole === 'SYSTEM_ADMIN' || (actor.companyView && actor.activeCompanyId === companyId);
}
function activeReference(rows: Json[], id: unknown) {
  return rows.find((row) => row.id === id && row.status === 'ACTIVE');
}
function createsLocationCycle(rows: Json[], id: string, parentId: string | null) {
  let cursor = parentId;
  const seen = new Set([id]);
  while (cursor) {
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = String(rows.find((row) => row.id === cursor)?.parentLocationId ?? '') || null;
  }
  return false;
}
function createsAccountCycle(rows: Account[], id: string, parentId: string | null) {
  let cursor = parentId;
  const seen = new Set([id]);
  while (cursor) {
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = rows.find((row) => row.accountId === cursor)?.parentAccountId ?? null;
  }
  return false;
}

function readiness(companyId: string) {
  const company = companyState(companyId);
  const active = (resource: MasterResource) => company.masters[resource].filter((row) => row.status === 'ACTIVE');
  const checks = [
    ['nob', 'Enabled nature of business', company.nobs.some((row) => row.status === 'ACTIVE'), `/${companyId}/masters/nobs`],
    ['lob', 'Enabled line of business', company.lobs.some((row) => row.status === 'ACTIVE'), `/${companyId}/masters/lobs`],
    ['uoms', 'Required units of measure', active('uoms').length > 0, `/${companyId}/masters/uoms`],
    ['items', 'Items and categories', active('items').length > 0 && active('item-categories').length > 0, `/${companyId}/masters/items`],
    ['locations', 'Operating locations', active('locations').length > 0, `/${companyId}/masters/locations`],
    ['accounts', 'Chart of accounts', company.accounts.some((row) => row.status === 'ACTIVE'), `/${companyId}/accounting/chart-of-accounts`],
    ['glMappings', 'Required GL mappings', company.mappings.some((row) => row.status === 'ACTIVE'), `/${companyId}/accounting/gl-mappings`],
    ['costing', 'Costing configuration', company.costing.status === 'ACTIVE' && (company.costing.method !== 'STANDARD' || company.costing.standardCostReady), `/${companyId}/accounting/costing`],
    ['parameters', 'Essential operational parameters', active('operational-parameters').some((row) => row.essential), `/${companyId}/masters/operational-parameters`],
    ['qc', 'Essential QC configuration', !company.lobs.some((row) => row.status === 'ACTIVE' && row.qcRequired) || active('qc-parameters').some((row) => row.essential), `/${companyId}/masters/qc-parameters`],
  ] as const;
  const blockingRequirements = checks.filter((check) => !check[2]).map((check) => ({ code: check[0], label: check[1], href: check[3] }));
  const percentage = Math.round(((checks.length - blockingRequirements.length) / checks.length) * 100);
  return {
    companyId, workspaceReady: true, operationsReady: blockingRequirements.length === 0,
    setupComplete: blockingRequirements.length === 0, percentage, blockingRequirements,
    warnings: company.costing.method === 'BIO_ASSET' ? ['BIO_ASSET measurement policy must be supplied by the production backend.'] : [],
    affectedModules: blockingRequirements.length ? ['Batches', 'Inventory', 'QC', 'Finance'] : [],
  };
}

export function phase3ReadinessSnapshot(companyId: string) {
  return readiness(companyId);
}
export function resetPhase3Repository() {
  const fresh = initialState();
  state.companies = fresh.companies;
  state.sequence = fresh.sequence;
}

export async function handlePhase3Request(
  request: Request,
  path: string,
  requestId: string,
  actor: Phase3Actor,
): Promise<NextResponse | null> {
  const method = request.method.toUpperCase();
  if (path === '/platform/masters/nobs' && method === 'GET') {
    return actor.platformRole === 'SYSTEM_ADMIN' ? json(nobTemplates) : apiErrorResponse(403, 'System administrator access is required.', requestId);
  }
  if (path === '/platform/masters/lobs' && method === 'GET') {
    return actor.platformRole === 'SYSTEM_ADMIN' ? json(platformLobs) : apiErrorResponse(403, 'System administrator access is required.', requestId);
  }
  if (path === '/platform/masters/modules' && method === 'GET') {
    return actor.platformRole === 'SYSTEM_ADMIN' ? json(modules) : apiErrorResponse(403, 'System administrator access is required.', requestId);
  }
  if (path === '/platform/masters/reference-data' && method === 'GET') {
    return actor.platformRole === 'SYSTEM_ADMIN' ? json({
      languages: [{ id: 'lang-en', code: 'en', name: 'English', status: 'ACTIVE' }, { id: 'lang-hi', code: 'hi', name: 'Hindi', status: 'ACTIVE' }],
      currencies: [{ id: 'currency-inr', code: 'INR', name: 'Indian Rupee', symbol: '₹', status: 'ACTIVE' }, { id: 'currency-usd', code: 'USD', name: 'US Dollar', symbol: '$', status: 'ACTIVE' }],
      timezones: [{ id: 'timezone-kolkata', code: 'Asia/Kolkata', name: 'India Standard Time', status: 'ACTIVE' }, { id: 'timezone-utc', code: 'UTC', name: 'Coordinated Universal Time', status: 'ACTIVE' }],
    }) : apiErrorResponse(403, 'System administrator access is required.', requestId);
  }

  const match = path.match(/^\/companies\/([^/]+)\/(.+)$/);
  if (!match) return null;
  const [, companyId, suffix] = match;
  if (!canSeeCompany(actor, companyId)) return apiErrorResponse(403, 'Company access is required.', requestId);
  const company = companyState(companyId);
  const input = await inputBody(request);
  const structureMatch = suffix.match(/^(nobs|lobs)(?:\/([^/]+))?(?:\/(activate|deactivate))?$/);
  if (suffix === 'business-structure' && method === 'GET') {
    const issues = [
      ...(company.nobs.some((row) => row.status === 'ACTIVE') ? [] : ['Enable at least one NOB.']),
      ...(company.lobs.some((row) => row.status === 'ACTIVE') ? [] : ['Enable at least one LOB.']),
    ];
    return json({ companyId, completeness: issues.length ? (issues.length === 1 ? 50 : 0) : 100, blockingIssues: issues, nobs: company.nobs, lobs: company.lobs });
  }
  if (structureMatch) {
    const [, kind, id, action] = structureMatch;
    const rows = kind === 'nobs' ? company.nobs : company.lobs;
    const schema = kind === 'nobs' ? companyNobSchema : companyLobSchema;
    if (method === 'GET' && !id) return json(rows);
    if (!actor.companyManage) return apiErrorResponse(403, 'Company configuration permission is required.', requestId);
    if (method === 'POST' && !id) {
      const templateId = String(input[kind === 'nobs' ? 'nobTemplateId' : 'lobTemplateId'] ?? '');
      if (kind === 'nobs') {
        const template = nobTemplates.find((row) => row.nobTemplateId === templateId && row.status === 'ACTIVE');
        if (!template) return apiErrorResponse(422, 'Choose an active NOB template.', requestId);
        if (company.nobs.some((row) => row.nobTemplateId === templateId)) return apiErrorResponse(409, 'This NOB is already configured.', requestId);
        const created = companyNobSchema.parse({
          companyNobId: `company-nob-${++state.sequence}`, companyId, nobTemplateId: templateId,
          code: input.code || template.code, name: input.name || template.name, status: 'ACTIVE',
          referencedBy: [], audit: updatedAudit(actor),
        });
        company.nobs.push(created); return json(created, 201);
      }
      const template = platformLobs.find((row) => row.lobTemplateId === templateId && row.status === 'ACTIVE');
      const parent = company.nobs.find((row) => row.companyNobId === input.companyNobId && row.status === 'ACTIVE');
      if (!template || !parent || template.nobTemplateId !== parent.nobTemplateId) {
        return apiErrorResponse(422, 'LOB template must belong to the selected active NOB.', requestId);
      }
      if (company.lobs.some((row) => row.lobTemplateId === templateId)) return apiErrorResponse(409, 'This LOB is already configured.', requestId);
      const costingMethod = String(input.costingMethod || template.defaultCostingMethod);
      if (!template.allowedCostingMethods.includes(costingMethod as never)) return apiErrorResponse(422, 'The selected costing method is not allowed for this LOB.', requestId);
      const created = companyLobSchema.parse({
        companyLobId: `company-lob-${++state.sequence}`, companyId, companyNobId: parent.companyNobId,
        lobTemplateId: templateId, code: input.code || template.code, name: input.name || template.name,
        costingMethod, qcRequired: template.qcRequired, qrRequired: template.qrRequired,
        status: 'ACTIVE', referencedBy: [], audit: updatedAudit(actor),
      });
      company.lobs.push(created); return json(created, 201);
    }
    const current: CompanyNob | CompanyLob | undefined = kind === 'nobs'
      ? company.nobs.find((row) => row.companyNobId === id)
      : company.lobs.find((row) => row.companyLobId === id);
    if (!current) return apiErrorResponse(404, `${kind === 'nobs' ? 'NOB' : 'LOB'} configuration not found.`, requestId);
    if (method === 'PATCH' && id && !action) {
      const parsed = schema.safeParse({ ...current, ...input, audit: updatedAudit(actor, current.audit as unknown as Json) });
      if (!parsed.success) return apiErrorResponse(422, 'Review the business-structure fields.', requestId, parsed.error.flatten());
      Object.assign(current, parsed.data); return json(current);
    }
    if (method === 'POST' && action) {
      if (action === 'deactivate' && current.referencedBy.some((item) => item.count > 0)) {
        return conflict(requestId, 'This configuration is referenced and cannot be deactivated.', { references: current.referencedBy });
      }
      current.status = action === 'activate' ? 'ACTIVE' : 'INACTIVE';
      current.audit = updatedAudit(actor, current.audit as unknown as Json);
      return json(current);
    }
  }

  if (suffix === 'masters' && method === 'GET') {
    const labels: Record<MasterResource, string> = {
      uoms: 'Units of measure', 'uom-conversions': 'UOM conversions',
      'item-categories': 'Item categories', items: 'Items', attributes: 'Item attributes',
      breeds: 'Breeds', locations: 'Locations', resources: 'Resources',
      'operational-parameters': 'Operational parameters', 'qc-parameters': 'QC parameters',
    };
    return json({
      companyId,
      categories: masterResourceSchema.options.map((resource) => {
        const rows = company.masters[resource];
        const active = rows.filter((row) => row.status === 'ACTIVE').length;
        return {
          resource, label: labels[resource], total: rows.length, active,
          inactive: rows.length - active, configured: active > 0,
          blockingIssues: active ? [] : [`No active ${labels[resource].toLowerCase()} configured.`],
          lastUpdatedAt: rows[0] ? (rows[0].audit as Json).updatedAt : null,
          canManage: actor.companyManage, importAvailable: true,
        };
      }),
    });
  }

  const importStatus = suffix.match(/^masters\/imports\/([^/]+)$/);
  if (importStatus && method === 'GET') {
    const found = company.imports.find((item) => item.importId === importStatus[1]);
    return found ? json(found) : apiErrorResponse(404, 'Import not found.', requestId);
  }
  const importMatch = suffix.match(/^masters\/([^/]+)\/import\/(validate|confirm)$/);
  if (importMatch) {
    const parsedResource = masterResourceSchema.safeParse(importMatch[1]);
    if (!parsedResource.success) return apiErrorResponse(404, 'Master resource not found.', requestId);
    if (!actor.companyManage) return apiErrorResponse(403, 'Master-data management permission is required.', requestId);
    if (importMatch[2] === 'validate' && method === 'POST') {
      const scenario = String(input.scenario || 'VALID');
      const preview = {
        importId: `import-${++state.sequence}`, companyId, resource: parsedResource.data,
        status: 'VALIDATED', validRows: scenario === 'INVALID' ? 0 : scenario === 'PARTIAL' ? 2 : 3,
        invalidRows: scenario === 'INVALID' ? 3 : scenario === 'PARTIAL' ? 1 : 0,
        errors: scenario === 'VALID' ? [] : [{ row: 3, field: 'code', message: 'Duplicate or invalid code.' }],
        createdAt: new Date().toISOString(),
      };
      company.imports.push(preview); return json(preview);
    }
    if (importMatch[2] === 'confirm' && method === 'POST') {
      const preview = company.imports.find((item) => item.importId === input.importId);
      if (!preview) return apiErrorResponse(404, 'Validated import not found.', requestId);
      if (Number(preview.invalidRows) > 0) return apiErrorResponse(409, 'Resolve invalid rows before confirming the import.', requestId, { importId: preview.importId });
      preview.status = 'CONFIRMED'; return json(preview);
    }
  }
  const transferMatch = suffix.match(/^masters\/([^/]+)\/(import-template|export)$/);
  if (transferMatch && method === 'GET') {
    const parsedResource = masterResourceSchema.safeParse(transferMatch[1]);
    if (!parsedResource.success) return apiErrorResponse(404, 'Master resource not found.', requestId);
    const isTemplate = transferMatch[2] === 'import-template';
    const date = '2026-07-24';
    return json({
      filename: `${companyId}-${parsedResource.data}-${isTemplate ? 'template' : date}.csv`,
      format: 'CSV', contentType: 'text/csv',
      content: isTemplate ? 'code,name,status\\n' : 'code,name,status\\n' + company.masters[parsedResource.data].map((row) => `${row.code},${row.name},${row.status}`).join('\\n'),
    });
  }
  const masterMatch = suffix.match(/^masters\/([^/]+)(?:\/([^/]+))?(?:\/(activate|deactivate))?$/);
  if (masterMatch) {
    const parsedResource = masterResourceSchema.safeParse(masterMatch[1]);
    if (!parsedResource.success) return apiErrorResponse(404, 'Master resource not found.', requestId);
    const resource = parsedResource.data;
    const [, , id, action] = masterMatch;
    const rows = company.masters[resource];
    const schema = masterSchemas[resource];
    if (method === 'GET' && !id) {
      const url = new URL(request.url);
      const query = (url.searchParams.get('search') || '').toLowerCase();
      const status = url.searchParams.get('status');
      const sorted = rows.filter((row) =>
        (!query || String(row.code).toLowerCase().includes(query) || String(row.name).toLowerCase().includes(query)) &&
        (!status || row.status === status),
      ).sort((a, b) => String(a.code).localeCompare(String(b.code)));
      const page = Math.max(1, Number(url.searchParams.get('page') || 1));
      const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
      return json({ resource, records: sorted.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: sorted.length });
    }
    if (method === 'GET' && id && !action) {
      const found = rows.find((row) => row.id === id);
      return found ? json(found) : apiErrorResponse(404, 'Master record not found.', requestId);
    }
    if (!actor.companyManage) return apiErrorResponse(403, 'Master-data management permission is required.', requestId);
    const current = id ? rows.find((row) => row.id === id) : undefined;
    if (id && !current) return apiErrorResponse(404, 'Master record not found.', requestId);
    if (method === 'POST' && !id) {
      if (rows.some((row) => row.code === input.code)) return apiErrorResponse(409, 'A record with this code already exists.', requestId, { field: 'code' });
      const created: Json = {
        ...input, id: `${resource}-${++state.sequence}`, companyId, status: 'ACTIVE',
        referencedBy: [], audit: updatedAudit(actor),
      };
      const validation = validateMaster(company, resource, created);
      if (validation) return apiErrorResponse(422, validation, requestId);
      const parsed = schema.safeParse(created);
      if (!parsed.success) return apiErrorResponse(422, 'Review the master-data fields.', requestId, parsed.error.flatten());
      rows.push(parsed.data as Json); return json(parsed.data, 201);
    }
    if (method === 'PATCH' && current && !action) {
      if (rows.some((row) => row.id !== id && row.code === input.code)) return apiErrorResponse(409, 'A record with this code already exists.', requestId, { field: 'code' });
      const candidate = { ...current, ...input, id, companyId, audit: updatedAudit(actor, current.audit as Json) };
      const validation = validateMaster(company, resource, candidate);
      if (validation) return apiErrorResponse(422, validation, requestId);
      const parsed = schema.safeParse(candidate);
      if (!parsed.success) return apiErrorResponse(422, 'Review the master-data fields.', requestId, parsed.error.flatten());
      Object.assign(current, parsed.data); return json(current);
    }
    if (method === 'POST' && current && action) {
      if (action === 'deactivate' && (current.referencedBy as Json[]).some((item) => Number(item.count) > 0)) {
        return conflict(requestId, 'This master record is referenced and cannot be deactivated.', { references: current.referencedBy });
      }
      current.status = action === 'activate' ? 'ACTIVE' : 'INACTIVE';
      current.audit = updatedAudit(actor, current.audit as Json);
      return json(current);
    }
  }

  if (suffix === 'accounting/readiness' && method === 'GET') {
    return actor.financeView || actor.companyManage ? json(readiness(companyId)) : apiErrorResponse(403, 'Finance access is required.', requestId);
  }
  if (suffix === 'accounting/accounts' && method === 'GET') {
    return actor.financeView || actor.companyManage ? json(company.accounts) : apiErrorResponse(403, 'Finance access is required.', requestId);
  }
  const accountMatch = suffix.match(/^accounting\/accounts(?:\/([^/]+))?(?:\/(activate|deactivate))?$/);
  if (accountMatch) {
    const [, accountId, action] = accountMatch;
    if (!actor.financeManage && !actor.companyManage) return apiErrorResponse(403, 'Finance management permission is required.', requestId);
    const current = accountId ? company.accounts.find((row) => row.accountId === accountId) : undefined;
    if (method === 'POST' && !accountId) {
      if (company.accounts.some((row) => row.code === input.code)) return apiErrorResponse(409, 'An account with this code already exists.', requestId, { field: 'code' });
      const candidate: Json = { ...input, accountId: `account-${++state.sequence}`, companyId, status: 'ACTIVE', referencedBy: [], audit: updatedAudit(actor) };
      if (candidate.parentAccountId && !company.accounts.some((row) => row.accountId === candidate.parentAccountId && row.status === 'ACTIVE')) return apiErrorResponse(422, 'Choose an active parent account.', requestId);
      const parsed = accountSchema.safeParse(candidate);
      if (!parsed.success) return apiErrorResponse(422, 'Review the account fields.', requestId, parsed.error.flatten());
      company.accounts.push(parsed.data); return json(parsed.data, 201);
    }
    if (!current) return apiErrorResponse(404, 'Account not found.', requestId);
    if (method === 'GET' && accountId && !action) return json(current);
    if (method === 'PATCH' && !action) {
      const candidate = { ...current, ...input, audit: updatedAudit(actor, current.audit as unknown as Json) };
      if (createsAccountCycle(company.accounts, current.accountId, candidate.parentAccountId as string | null)) return apiErrorResponse(422, 'Account hierarchy cannot contain a cycle.', requestId);
      const parsed = accountSchema.safeParse(candidate);
      if (!parsed.success) return apiErrorResponse(422, 'Review the account fields.', requestId, parsed.error.flatten());
      Object.assign(current, parsed.data); return json(current);
    }
    if (method === 'POST' && action) {
      if (action === 'deactivate' && current.referencedBy.some((item) => item.count > 0)) return conflict(requestId, 'This account is referenced and cannot be deactivated.', { references: current.referencedBy });
      current.status = action === 'activate' ? 'ACTIVE' : 'INACTIVE'; current.audit = updatedAudit(actor, current.audit as unknown as Json); return json(current);
    }
  }
  if (suffix === 'accounting/gl-mappings' && method === 'GET') {
    return actor.financeView || actor.companyManage ? json(company.mappings) : apiErrorResponse(403, 'Finance access is required.', requestId);
  }
  const mappingMatch = suffix.match(/^accounting\/gl-mappings(?:\/([^/]+))?$/);
  if (mappingMatch && ['POST', 'PATCH'].includes(method)) {
    if (!actor.financeManage && !actor.companyManage) return apiErrorResponse(403, 'Finance management permission is required.', requestId);
    const mappingId = mappingMatch[1];
    const current = mappingId ? company.mappings.find((row) => row.mappingId === mappingId) : undefined;
    const candidate = {
      ...(current ?? {}), ...input, mappingId: current?.mappingId ?? `mapping-${++state.sequence}`,
      companyId, status: current?.status ?? 'ACTIVE', audit: updatedAudit(actor, current?.audit as unknown as Json),
    };
    if (company.mappings.some((row) => row.mappingId !== mappingId && row.eventType === candidate.eventType && row.companyLobId === candidate.companyLobId && row.status === 'ACTIVE')) {
      return apiErrorResponse(409, 'A conflicting active GL mapping already exists.', requestId);
    }
    const accountIds = ['inventoryAccountId', 'consumptionAccountId', 'outputAccountId', 'varianceAccountId', 'wastageMortalityAccountId'] as const;
    if (accountIds.some((key) => candidate[key] && !company.accounts.some((row) => row.accountId === candidate[key] && row.status === 'ACTIVE'))) return apiErrorResponse(422, 'GL mappings must reference active accounts.', requestId);
    const parsed = glMappingSchema.safeParse(candidate);
    if (!parsed.success) return apiErrorResponse(422, 'Review the GL mapping fields.', requestId, parsed.error.flatten());
    if (current) Object.assign(current, parsed.data); else company.mappings.push(parsed.data);
    return json(parsed.data, current ? 200 : 201);
  }
  if (suffix === 'accounting/costing' && method === 'GET') {
    return actor.financeView || actor.companyManage ? json(company.costing) : apiErrorResponse(403, 'Finance access is required.', requestId);
  }
  if (suffix === 'accounting/costing' && method === 'PATCH') {
    if (!actor.financeManage && !actor.companyManage) return apiErrorResponse(403, 'Finance management permission is required.', requestId);
    const candidate = { ...company.costing, ...input, audit: updatedAudit(actor, company.costing.audit as unknown as Json) };
    if (candidate.method === 'STANDARD' && !candidate.standardCostReady) {
      const parsed = costingConfigurationSchema.safeParse(candidate);
      if (parsed.success) company.costing = parsed.data;
      return apiErrorResponse(409, 'STANDARD costing requires standard costs and variance GL mappings.', requestId, { missing: ['standard costs', 'variance GL mappings'] });
    }
    const parsed = costingConfigurationSchema.safeParse(candidate);
    if (!parsed.success) return apiErrorResponse(422, 'Review the costing configuration.', requestId, parsed.error.flatten());
    company.costing = parsed.data; return json(company.costing);
  }
  return null;
}

function validateMaster(company: CompanyState, resource: MasterResource, row: Json): string | null {
  if (resource === 'uom-conversions') {
    if (row.fromUomId === row.toUomId) return 'Source and target UOM must be different.';
    if (!activeReference(company.masters.uoms, row.fromUomId) || !activeReference(company.masters.uoms, row.toUomId)) return 'UOM conversions must reference active UOMs.';
    const duplicate = company.masters['uom-conversions'].some((item) =>
      item.id !== row.id && item.fromUomId === row.fromUomId && item.toUomId === row.toUomId && item.itemId === row.itemId && item.effectiveFrom === row.effectiveFrom,
    );
    if (duplicate) return 'This UOM conversion pair already exists for the effective date.';
  }
  if (resource === 'items') {
    if (!activeReference(company.masters['item-categories'], row.categoryId)) return 'Item category must be active.';
    if (!activeReference(company.masters.uoms, row.primaryUomId)) return 'Primary UOM must be active.';
  }
  if (resource === 'locations' && createsLocationCycle(company.masters.locations, String(row.id), row.parentLocationId as string | null)) return 'Location hierarchy cannot contain a cycle.';
  if (resource === 'qc-parameters' && row.resultType === 'NUMERIC' && !activeReference(company.masters.uoms, row.uomId)) return 'Numeric QC parameters require an active UOM.';
  if (resource === 'operational-parameters') {
    if (!company.nobs.some((item) => item.companyNobId === row.companyNobId && item.status === 'ACTIVE')) return 'Operational parameter requires an active NOB.';
    if (!company.lobs.some((item) => item.companyLobId === row.companyLobId && item.status === 'ACTIVE')) return 'Operational parameter requires an active LOB.';
  }
  return null;
}
