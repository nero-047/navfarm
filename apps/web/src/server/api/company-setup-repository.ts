import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  addressSchema,
  administratorSchema,
  businessStructureSchema,
  chartOfAccountsSchema,
  contactSchema,
  essentialMastersSchema,
  fiscalSchema,
  localizationSchema,
  moduleSelectionSchema,
  setupNotificationsSchema,
  setupProfileSchema,
  teamMemberSchema,
  type Address,
  type Administrator,
  type BusinessStructure,
  type ChartOfAccounts,
  type CompanySummary,
  type Contact,
  type EssentialMasters,
  type Fiscal,
  type Localization,
  type ModuleSelection,
  type SetupNotifications,
  type SetupProfile,
  type TeamMember,
} from '../../contracts/phase2';
import { COMPANY_SETUP_STEPS, evaluateReadiness, type ReadinessInput } from '../../lib/readiness-policy';
import { apiErrorResponse } from './errors';

export interface CompanySetupActor {
  userId: string;
  fullName: string;
  activeTenantId: string | null;
  activeCompanyId: string | null;
  tenantAdmin: boolean;
  companyManage: boolean;
}

interface SetupRecord {
  profile: SetupProfile;
  addresses: Address[];
  contacts: Contact[];
  localization: Localization;
  fiscal: Fiscal;
  modules: ModuleSelection;
  administrator: Administrator;
  team: TeamMember[];
  chartOfAccounts: ChartOfAccounts;
  businessStructure: BusinessStructure;
  essentialMasters: EssentialMasters;
  notifications: SetupNotifications;
  completed: string[];
  setupComplete: boolean;
}

const defaultAccounts: ChartOfAccounts['accounts'] = [
  { accountCode: '110100', accountName: 'Inventory - Feed & Consumables', accountType: 'ASSET' },
  { accountCode: '120100', accountName: 'Batch Work in Progress', accountType: 'ASSET' },
  { accountCode: '410100', accountName: 'Production Output Revenue', accountType: 'REVENUE' },
  { accountCode: '510100', accountName: 'Production Input Cost', accountType: 'EXPENSE' },
];

function newRecord(company: CompanySummary): SetupRecord {
  return {
    profile: {
      companyId: company.companyId, companyName: company.name, displayName: company.name,
      companyType: 'PRIVATE_LIMITED', registrationNumber: '', website: '', brandColor: '#101B52',
    },
    addresses: [],
    contacts: [],
    localization: {
      defaultLanguage: 'en', enabledLanguages: ['en'], baseCurrency: 'INR',
      reportingCurrencies: [], timezone: 'Asia/Kolkata', country: 'India',
    },
    fiscal: {
      fiscalStartMonth: 4, fiscalStartDay: 1, fiscalYearFormat: 'YYYY-YY',
      accountingStandard: 'IND_AS', inventoryValuation: 'STANDARD', periodType: 'MONTHLY',
    },
    modules: { enabledModules: ['Batches', 'Inventory'] },
    administrator: {
      userId: '', fullName: '', email: '', language: 'en',
      timezone: 'Asia/Kolkata', mfaRequired: true,
    },
    team: [],
    chartOfAccounts: { accountingStandard: 'IND_AS', confirmed: false, glMappingsReady: false, accounts: defaultAccounts },
    businessStructure: { configured: false, nobs: [] },
    essentialMasters: { uomReady: false, itemsReady: false, breedsReady: false, locationsReady: false, resourcesReady: false },
    notifications: { emailEnabled: false, smsEnabled: false, pushEnabled: false, kpiAlertsEnabled: false, scheduledReportsEnabled: false },
    completed: [],
    setupComplete: false,
  };
}

type SetupState = { records: Record<string, SetupRecord> };
declare global { var __navfarmCompanySetupState: SetupState | undefined; }
const setupState: SetupState = globalThis.__navfarmCompanySetupState ?? { records: {} };
globalThis.__navfarmCompanySetupState = setupState;

function seedRecord(company: CompanySummary, completed: string[], setupComplete = false) {
  const record = newRecord(company);
  record.completed = completed;
  record.setupComplete = setupComplete;
  if (completed.includes('address')) record.addresses = [{
    addressId: `address-${company.companyId}`, addressType: 'REGISTERED', label: 'Registered office',
    line1: '12 Farm Road', line2: '', city: 'Pune', state: 'Maharashtra', country: 'India',
    postalCode: '411001', latitude: null, longitude: null, isPrimary: true,
  }];
  if (completed.includes('contacts')) record.contacts = [{
    contactId: `contact-${company.companyId}`, contactType: 'OWNER', fullName: company.primaryAdministrator ?? 'Company Owner',
    email: `owner@${company.code.toLowerCase()}.demo`, phone: '+91 98765 43210',
    receivesAlerts: true, receivesReports: true, isPrimary: true,
  }];
  if (completed.includes('administrator')) record.administrator = {
    userId: `admin-${company.companyId}`, fullName: company.primaryAdministrator ?? 'Company Administrator',
    email: `admin@${company.code.toLowerCase()}.demo`, language: 'en', timezone: 'Asia/Kolkata', mfaRequired: true,
  };
  if (completed.includes('chartOfAccounts')) record.chartOfAccounts = { ...record.chartOfAccounts, confirmed: true, glMappingsReady: true };
  if (completed.includes('businessStructure')) record.businessStructure = {
    configured: true, nobs: [{ nobCode: 'POULTRY', nobName: 'Poultry', lobs: [{ lobCode: 'REARING', lobName: 'Rearing & Breeding', costingMethod: 'STANDARD', qcRequired: true, qrRequired: true }] }],
  };
  if (completed.includes('essentialMasters')) record.essentialMasters = { uomReady: true, itemsReady: true, breedsReady: true, locationsReady: true, resourcesReady: true };
  if (completed.includes('team')) record.team = [{ memberId: `member-${company.companyId}`, fullName: 'Farm Manager', email: `manager@${company.code.toLowerCase()}.demo`, role: 'FARM_MANAGER', status: 'ACTIVE' }];
  if (completed.includes('notifications')) record.notifications = { ...record.notifications, emailEnabled: true, kpiAlertsEnabled: true, scheduledReportsEnabled: true };
  return record;
}

export function ensureCompanySetupRecord(company: CompanySummary) {
  if (!setupState.records[company.companyId]) {
    const required = COMPANY_SETUP_STEPS.filter((step) => step.workspace || step.operations).map((step) => step.id);
    const completed =
      company.setupPercentage >= 100 ? [...required, 'team', 'notifications'] :
        company.companyId === 'company-bluewater' ? ['profile', 'address', 'contacts'] :
          company.companyId === 'company-sunrise' ? COMPANY_SETUP_STEPS.filter((step) => step.workspace).map((step) => step.id) :
            company.setupPercentage > 0 ? ['profile', 'address', 'contacts', 'language', 'currency', 'timezone', 'accounting', 'modules'] :
              [];
    setupState.records[company.companyId] = seedRecord(company, completed, company.setupPercentage >= 100);
  }
  return setupState.records[company.companyId];
}

function completedMap(record: SetupRecord): ReadinessInput['completed'] {
  return Object.fromEntries(COMPANY_SETUP_STEPS.map((step) => [
    step.id,
    step.id === 'review' ? record.setupComplete : record.completed.includes(step.id),
  ])) as ReadinessInput['completed'];
}

function statusFor(companyId: string, record: SetupRecord) {
  return evaluateReadiness({ companyId, completed: completedMap(record), setupComplete: record.setupComplete });
}

function mark(record: SetupRecord, ...ids: string[]) {
  record.completed = Array.from(new Set([...record.completed, ...ids]));
  record.setupComplete = false;
}

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status });
}

export function resetCompanySetupRepository() {
  setupState.records = {};
}

export async function handleCompanySetupRequest(
  request: Request,
  path: string,
  requestId: string,
  actor: CompanySetupActor,
  company: CompanySummary,
  updateCompany: (changes: Partial<CompanySummary>) => void,
): Promise<NextResponse> {
  if (company.tenantId !== actor.activeTenantId) return apiErrorResponse(403, 'Active tenant context does not match this company.', requestId);
  const canEdit = actor.tenantAdmin || (actor.activeCompanyId === company.companyId && actor.companyManage);
  if (!canEdit) return apiErrorResponse(403, 'Company setup permission is required.', requestId);
  const record = ensureCompanySetupRecord(company);
  const match = path.match(/^\/companies\/[^/]+\/setup\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return apiErrorResponse(404, 'Company setup resource not found.', requestId);
  const resource = match[1];
  const itemId = match[2];
  const method = request.method;
  const input = request.headers.get('content-type')?.includes('application/json')
    ? await request.json().catch(() => ({}))
    : {};

  const sync = () => {
    const status = statusFor(company.companyId, record);
    updateCompany({
      setupPercentage: status.setupPercentage,
      workspaceReady: status.workspaceReady,
      operationsReady: status.operationsReady,
      status: status.setupComplete ? 'ACTIVE' : 'DRAFT',
    });
    return status;
  };

  if (method === 'GET' && resource === 'status') return json(sync());
  if (method === 'GET' && resource === 'profile') return json(record.profile);
  if (method === 'PATCH' && resource === 'profile') {
    const parsed = setupProfileSchema.safeParse(input);
    if (!parsed.success) return apiErrorResponse(422, 'Complete the required company profile fields.', requestId, parsed.error.flatten());
    record.profile = parsed.data; mark(record, 'profile'); sync(); return json(record.profile);
  }
  if (method === 'GET' && resource === 'addresses') return json(record.addresses);
  if (method === 'POST' && resource === 'addresses') {
    const parsed = addressSchema.omit({ addressId: true }).safeParse(input);
    if (!parsed.success) return apiErrorResponse(422, 'Complete the required address fields.', requestId, parsed.error.flatten());
    const address = { ...parsed.data, addressId: `address-${randomUUID()}` };
    if (address.isPrimary) record.addresses.forEach((item) => { item.isPrimary = false; });
    record.addresses.push(address); mark(record, 'address'); sync(); return json(address, 201);
  }
  if (method === 'PATCH' && resource === 'addresses' && itemId) {
    const current = record.addresses.find((item) => item.addressId === itemId);
    if (!current) return apiErrorResponse(404, 'Address not found.', requestId);
    const parsed = addressSchema.safeParse({ ...current, ...input, addressId: itemId });
    if (!parsed.success) return apiErrorResponse(422, 'Review the address fields.', requestId, parsed.error.flatten());
    Object.assign(current, parsed.data); mark(record, 'address'); sync(); return json(current);
  }
  if (method === 'DELETE' && resource === 'addresses' && itemId) {
    const index = record.addresses.findIndex((item) => item.addressId === itemId);
    if (index < 0) return apiErrorResponse(404, 'Address not found.', requestId);
    const [removed] = record.addresses.splice(index, 1);
    if (!record.addresses.length) record.completed = record.completed.filter((id) => id !== 'address');
    sync(); return json(removed);
  }
  if (method === 'GET' && resource === 'contacts') return json(record.contacts);
  if (method === 'POST' && resource === 'contacts') {
    const parsed = contactSchema.omit({ contactId: true }).safeParse(input);
    if (!parsed.success) return apiErrorResponse(422, 'Complete the required contact fields.', requestId, parsed.error.flatten());
    const contact = { ...parsed.data, contactId: `contact-${randomUUID()}` };
    if (contact.isPrimary) record.contacts.forEach((item) => { item.isPrimary = false; });
    record.contacts.push(contact); mark(record, 'contacts'); sync(); return json(contact, 201);
  }
  if (method === 'PATCH' && resource === 'contacts' && itemId) {
    const current = record.contacts.find((item) => item.contactId === itemId);
    if (!current) return apiErrorResponse(404, 'Contact not found.', requestId);
    const parsed = contactSchema.safeParse({ ...current, ...input, contactId: itemId });
    if (!parsed.success) return apiErrorResponse(422, 'Review the contact fields.', requestId, parsed.error.flatten());
    Object.assign(current, parsed.data); mark(record, 'contacts'); sync(); return json(current);
  }
  if (method === 'DELETE' && resource === 'contacts' && itemId) {
    const index = record.contacts.findIndex((item) => item.contactId === itemId);
    if (index < 0) return apiErrorResponse(404, 'Contact not found.', requestId);
    const [removed] = record.contacts.splice(index, 1);
    if (!record.contacts.length) record.completed = record.completed.filter((id) => id !== 'contacts');
    sync(); return json(removed);
  }
  const singletonResources = {
    localization: { schema: localizationSchema, value: 'localization' as const, ids: ['language', 'currency', 'timezone'] },
    fiscal: { schema: fiscalSchema, value: 'fiscal' as const, ids: ['accounting'] },
    modules: { schema: moduleSelectionSchema, value: 'modules' as const, ids: ['modules'] },
    administrator: { schema: administratorSchema, value: 'administrator' as const, ids: ['administrator'] },
    'chart-of-accounts': { schema: chartOfAccountsSchema, value: 'chartOfAccounts' as const, ids: ['chartOfAccounts'] },
    'business-structure': { schema: businessStructureSchema, value: 'businessStructure' as const, ids: ['businessStructure'] },
    'essential-masters': { schema: essentialMastersSchema, value: 'essentialMasters' as const, ids: ['essentialMasters'] },
    notifications: { schema: setupNotificationsSchema, value: 'notifications' as const, ids: ['notifications'] },
  };
  const singleton = singletonResources[resource as keyof typeof singletonResources];
  if (singleton && method === 'GET') return json(record[singleton.value]);
  if (singleton && method === 'PATCH') {
    const parsed = singleton.schema.safeParse(input);
    if (!parsed.success) return apiErrorResponse(422, `Review the ${resource.replaceAll('-', ' ')} fields.`, requestId, parsed.error.flatten());
    if (resource === 'administrator') {
      const administrator = parsed.data as Administrator;
      if (administrator.fullName.trim().length < 2 || !administrator.email.includes('@')) {
        return apiErrorResponse(422, 'Administrator name and a valid email are required.', requestId);
      }
    }
    if (resource === 'business-structure') {
      const structure = parsed.data as BusinessStructure;
      if (!structure.configured || !structure.nobs.length || structure.nobs.some((nob) => !nob.lobs.length)) {
        return apiErrorResponse(422, 'Configure at least one NOB and LOB.', requestId);
      }
    }
    Object.assign(record[singleton.value], parsed.data);
    mark(record, ...singleton.ids); sync();
    return json(record[singleton.value]);
  }
  if (method === 'GET' && resource === 'team') return json(record.team);
  if (method === 'POST' && resource === 'team') {
    const parsed = teamMemberSchema.omit({ memberId: true, status: true }).safeParse(input);
    if (!parsed.success) return apiErrorResponse(422, 'Review the team member fields.', requestId, parsed.error.flatten());
    const member: TeamMember = { ...parsed.data, memberId: `member-${randomUUID()}`, status: 'INVITED' };
    record.team.push(member); mark(record, 'team'); sync(); return json(member, 201);
  }
  if (method === 'PATCH' && resource === 'team' && itemId) {
    const member = record.team.find((item) => item.memberId === itemId);
    if (!member) return apiErrorResponse(404, 'Team member not found.', requestId);
    const parsed = teamMemberSchema.safeParse({ ...member, ...input, memberId: itemId });
    if (!parsed.success) return apiErrorResponse(422, 'Review the team member fields.', requestId, parsed.error.flatten());
    Object.assign(member, parsed.data); return json(member);
  }
  if (method === 'DELETE' && resource === 'team' && itemId) {
    const index = record.team.findIndex((item) => item.memberId === itemId);
    if (index < 0) return apiErrorResponse(404, 'Team member not found.', requestId);
    const [removed] = record.team.splice(index, 1);
    if (!record.team.length) record.completed = record.completed.filter((id) => id !== 'team');
    sync(); return json(removed);
  }
  if (method === 'POST' && resource === 'complete') {
    const status = sync();
    if (!status.workspaceReady || !status.operationsReady) {
      return apiErrorResponse(409, 'Setup cannot be completed until all workspace and operations blockers are resolved.', requestId, status.blockingRequirements);
    }
    record.setupComplete = true;
    mark(record, 'review');
    record.setupComplete = true;
    return json(sync());
  }
  return apiErrorResponse(404, `No company setup handler for ${method} ${path}.`, requestId);
}
