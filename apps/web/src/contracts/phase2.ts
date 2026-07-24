import { z } from 'zod';
import type { RuntimeContract } from './api';

export const tenantStatusSchema = z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE']);
export const tenantTypeSchema = z.enum(['INDIVIDUAL', 'SME', 'ENTERPRISE', 'COOPERATIVE']);
export const billingCycleSchema = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM']);

export const planSchema = z.object({
  planId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  limits: z.object({
    companies: z.number().int().positive(),
    users: z.number().int().positive(),
    batchesPerMonth: z.number().int().positive().nullable(),
    apiRequestsPerMinute: z.number().int().positive(),
    storageGb: z.number().positive().nullable(),
  }),
  features: z.array(z.string()),
}).strict();

export const tenantUsageSchema = z.object({
  companies: z.object({ used: z.number().int().nonnegative(), limit: z.number().int().positive() }),
  users: z.object({ used: z.number().int().nonnegative(), limit: z.number().int().positive() }),
  batches: z.object({ used: z.number().int().nonnegative(), limit: z.number().int().positive().nullable() }),
  apiRequests: z.object({ used: z.number().int().nonnegative(), limit: z.number().int().positive() }),
  storageGb: z.object({ used: z.number().nonnegative().nullable(), limit: z.number().positive().nullable() }),
}).strict();

export const platformTenantSchema = z.object({
  tenantId: z.string(),
  code: z.string(),
  name: z.string(),
  type: tenantTypeSchema,
  status: tenantStatusSchema,
  planId: z.string(),
  planName: z.string(),
  billingEmail: z.string().email(),
  billingCurrency: z.string(),
  billingCycle: billingCycleSchema,
  subscriptionStart: z.string(),
  subscriptionEnd: z.string().nullable(),
  features: z.array(z.string()),
  usage: tenantUsageSchema,
  companyCount: z.number().int().nonnegative(),
  activeUserCount: z.number().int().nonnegative(),
  setupExceptionCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).strict();

export const platformTenantListSchema = z.object({
  items: z.array(platformTenantSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
}).strict();

export const activitySchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  actor: z.string(),
  action: z.string(),
  summary: z.string(),
}).strict();

export const platformDashboardSchema = z.object({
  totals: z.object({
    tenants: z.number().int().nonnegative(),
    activeTenants: z.number().int().nonnegative(),
    suspendedTenants: z.number().int().nonnegative(),
    trialOrExpiring: z.number().int().nonnegative(),
    companies: z.number().int().nonnegative(),
    activeUsers: z.number().int().nonnegative(),
    batchesThisMonth: z.number().int().nonnegative(),
  }),
  approachingLimits: z.array(z.object({
    tenantId: z.string(),
    tenantName: z.string(),
    resource: z.string(),
    used: z.number(),
    limit: z.number(),
  }).strict()),
  setupExceptions: z.array(z.object({
    tenantId: z.string(),
    tenantName: z.string(),
    count: z.number().int().positive(),
  }).strict()),
  recentActivity: z.array(activitySchema),
}).strict();

export const createTenantSchema = z.object({
  code: z.string().trim().min(3).max(30).regex(/^[A-Z0-9_]+$/),
  name: z.string().trim().min(2).max(120),
  type: tenantTypeSchema,
  planId: z.string().min(1),
  billingEmail: z.string().email(),
  billingCurrency: z.string().length(3),
  billingCycle: billingCycleSchema,
  subscriptionStart: z.string(),
  subscriptionEnd: z.string().nullable(),
  limits: planSchema.shape.limits,
  features: z.array(z.string()),
  administrator: z.object({
    fullName: z.string().trim().min(2),
    email: z.string().email(),
  }).strict(),
}).strict();

export const tenantPatchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  billingEmail: z.string().email().optional(),
  billingCurrency: z.string().length(3).optional(),
  billingCycle: billingCycleSchema.optional(),
  planId: z.string().optional(),
  subscriptionStart: z.string().optional(),
  subscriptionEnd: z.string().nullable().optional(),
  limits: planSchema.shape.limits.partial().optional(),
  features: z.array(z.string()).optional(),
}).strict();

export const platformAuditSchema = z.object({
  items: z.array(activitySchema),
}).strict();

export const companySummarySchema = z.object({
  companyId: z.string(),
  tenantId: z.string(),
  code: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
  setupPercentage: z.number().min(0).max(100),
  workspaceReady: z.boolean(),
  operationsReady: z.boolean(),
  enabledNobs: z.array(z.string()),
  enabledModules: z.array(z.string()),
  primaryAdministrator: z.string().nullable(),
  createdAt: z.string(),
}).strict();

export const tenantUserSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED']),
  tenantRole: z.enum(['TENANT_ADMIN', 'TENANT_MEMBER']),
  companyMemberships: z.array(z.string()),
  createdAt: z.string(),
}).strict();

export const invitationSchema = z.object({
  invitationId: z.string(),
  tenantId: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  tenantRole: z.enum(['TENANT_ADMIN', 'TENANT_MEMBER']),
  companyMemberships: z.array(z.string()),
  status: z.enum(['PENDING', 'EXPIRED', 'REVOKED', 'ACCEPTED']),
  invitedAt: z.string(),
  expiresAt: z.string(),
}).strict();

export const roleSummarySchema = z.object({
  roleId: z.string(),
  name: z.string(),
  scope: z.enum(['TENANT', 'COMPANY']),
  description: z.string(),
  permissions: z.array(z.string()),
  assignedUsers: z.number().int().nonnegative(),
}).strict();

export const tenantDashboardSchema = z.object({
  tenant: platformTenantSchema,
  companies: z.array(companySummarySchema),
  pendingInvitations: z.array(invitationSchema),
  recentActivity: z.array(activitySchema),
  limitWarnings: z.array(z.object({
    resource: z.string(),
    state: z.enum(['NORMAL', 'NEAR_LIMIT', 'LIMIT_REACHED', 'FEATURE_UNAVAILABLE', 'SUBSCRIPTION_INACTIVE', 'TENANT_SUSPENDED']),
    message: z.string(),
  }).strict()),
}).strict();

export const createInvitationSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(2),
  tenantRole: z.enum(['TENANT_ADMIN', 'TENANT_MEMBER']),
  companyMemberships: z.array(z.string()),
}).strict();

export const createCompanySchema = z.object({
  code: z.string().trim().min(3).max(30).regex(/^[A-Z0-9_]+$/),
  name: z.string().trim().min(2).max(120),
  type: z.enum(['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'COOPERATIVE']),
}).strict();

export const setupProfileSchema = z.object({
  companyId: z.string(),
  companyName: z.string().trim().min(2),
  displayName: z.string().trim().min(2),
  companyType: createCompanySchema.shape.type,
  registrationNumber: z.string(),
  website: z.string(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
}).strict();

export const addressSchema = z.object({
  addressId: z.string(),
  addressType: z.enum(['REGISTERED', 'CORPORATE', 'BILLING', 'FARM', 'WAREHOUSE', 'BRANCH']),
  label: z.string().min(2),
  line1: z.string().min(2),
  line2: z.string(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isPrimary: z.boolean(),
}).strict();

export const contactSchema = z.object({
  contactId: z.string(),
  contactType: z.enum(['OWNER', 'CEO', 'CFO', 'FARM_MANAGER', 'ACCOUNTANT', 'OPERATIONS', 'LEGAL', 'IT_ADMIN', 'OTHER']),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  receivesAlerts: z.boolean(),
  receivesReports: z.boolean(),
  isPrimary: z.boolean(),
}).strict();

export const localizationSchema = z.object({
  defaultLanguage: z.string().min(2),
  enabledLanguages: z.array(z.string()),
  baseCurrency: z.string().length(3),
  reportingCurrencies: z.array(z.string()),
  timezone: z.string().min(3),
  country: z.string().min(2),
}).strict();

export const fiscalSchema = z.object({
  fiscalStartMonth: z.number().int().min(1).max(12),
  fiscalStartDay: z.number().int().min(1).max(28),
  fiscalYearFormat: z.string().min(2),
  accountingStandard: z.enum(['IND_AS', 'IFRS', 'LOCAL_GAAP']),
  inventoryValuation: z.enum(['STANDARD', 'FIFO', 'WAVG']),
  periodType: z.enum(['MONTHLY', 'FOUR_WEEK', 'CUSTOM']),
}).strict();

export const moduleSelectionSchema = z.object({
  enabledModules: z.array(z.enum(['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics', 'Resources', 'Scheduling'])).min(1),
}).strict();

export const administratorSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  email: z.union([z.literal(''), z.string().email()]),
  language: z.string(),
  timezone: z.string(),
  mfaRequired: z.boolean(),
}).strict();

export const teamMemberSchema = z.object({
  memberId: z.string(),
  fullName: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(2),
  status: z.enum(['ACTIVE', 'INVITED']),
}).strict();

export const chartOfAccountsSchema = z.object({
  accountingStandard: z.string(),
  confirmed: z.boolean(),
  glMappingsReady: z.boolean(),
  accounts: z.array(z.object({
    accountCode: z.string(),
    accountName: z.string(),
    accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  }).strict()),
}).strict();

export const businessStructureSchema = z.object({
  configured: z.boolean(),
  nobs: z.array(z.object({
    nobCode: z.enum(['POULTRY', 'LIVESTOCK', 'AGRICULTURE', 'AQUACULTURE', 'INSECT', 'PROCESSING']),
    nobName: z.string(),
    lobs: z.array(z.object({
      lobCode: z.string(),
      lobName: z.string(),
      costingMethod: z.enum(['STANDARD', 'FIFO', 'BIO_ASSET', 'WAVG']),
      qcRequired: z.boolean(),
      qrRequired: z.boolean(),
    }).strict()),
  }).strict()),
}).strict();

export const essentialMastersSchema = z.object({
  uomReady: z.boolean(),
  itemsReady: z.boolean(),
  breedsReady: z.boolean(),
  locationsReady: z.boolean(),
  resourcesReady: z.boolean(),
}).strict();

export const setupNotificationsSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  kpiAlertsEnabled: z.boolean(),
  scheduledReportsEnabled: z.boolean(),
}).strict();

export const readinessBlockerSchema = z.object({
  code: z.string(),
  label: z.string(),
  route: z.string(),
  kind: z.enum(['WORKSPACE', 'OPERATIONS']),
}).strict();

export const setupStepSchema = z.object({
  id: z.string(),
  number: z.number().int().min(1).max(15),
  label: z.string(),
  route: z.string(),
  status: z.enum(['COMPLETED', 'CURRENT', 'PENDING', 'BLOCKED']),
  requiredForWorkspace: z.boolean(),
  requiredForOperations: z.boolean(),
}).strict();

export const setupStatusSchema = z.object({
  companyId: z.string(),
  setupPercentage: z.number().min(0).max(100),
  workspaceReady: z.boolean(),
  operationsReady: z.boolean(),
  setupComplete: z.boolean(),
  blockingRequirements: z.array(readinessBlockerSchema),
  recommendedRequirements: z.array(readinessBlockerSchema),
  steps: z.array(setupStepSchema),
}).strict();

export type Plan = z.infer<typeof planSchema>;
export type TenantUsage = z.infer<typeof tenantUsageSchema>;
export type PlatformTenant = z.infer<typeof platformTenantSchema>;
export type PlatformTenantList = z.infer<typeof platformTenantListSchema>;
export type PlatformDashboard = z.infer<typeof platformDashboardSchema>;
export type CreateTenant = z.infer<typeof createTenantSchema>;
export type CompanySummary = z.infer<typeof companySummarySchema>;
export type TenantUser = z.infer<typeof tenantUserSchema>;
export type ActivityEntry = z.infer<typeof activitySchema>;
export type Invitation = z.infer<typeof invitationSchema>;
export type RoleSummary = z.infer<typeof roleSummarySchema>;
export type TenantDashboard = z.infer<typeof tenantDashboardSchema>;
export type SetupProfile = z.infer<typeof setupProfileSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Localization = z.infer<typeof localizationSchema>;
export type Fiscal = z.infer<typeof fiscalSchema>;
export type ModuleSelection = z.infer<typeof moduleSelectionSchema>;
export type Administrator = z.infer<typeof administratorSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type ChartOfAccounts = z.infer<typeof chartOfAccountsSchema>;
export type BusinessStructure = z.infer<typeof businessStructureSchema>;
export type EssentialMasters = z.infer<typeof essentialMastersSchema>;
export type SetupNotifications = z.infer<typeof setupNotificationsSchema>;
export type SetupStatus = z.infer<typeof setupStatusSchema>;

export const phase2RuntimeContracts: RuntimeContract[] = [
  { method: 'GET', pattern: /^\/platform\/dashboard$/, response: platformDashboardSchema },
  { method: 'GET', pattern: /^\/platform\/tenants$/, response: platformTenantListSchema },
  { method: 'POST', pattern: /^\/platform\/tenants$/, response: platformTenantSchema },
  { method: 'GET', pattern: /^\/platform\/tenants\/[^/]+$/, response: platformTenantSchema },
  { method: 'PATCH', pattern: /^\/platform\/tenants\/[^/]+$/, response: platformTenantSchema },
  { method: 'POST', pattern: /^\/platform\/tenants\/[^/]+\/(activate|suspend|reactivate)$/, response: platformTenantSchema },
  { method: 'GET', pattern: /^\/platform\/tenants\/[^/]+\/usage$/, response: tenantUsageSchema },
  { method: 'GET', pattern: /^\/platform\/tenants\/[^/]+\/audit$/, response: platformAuditSchema },
  { method: 'GET', pattern: /^\/platform\/tenants\/[^/]+\/companies$/, response: z.array(companySummarySchema) },
  { method: 'GET', pattern: /^\/platform\/tenants\/[^/]+\/users$/, response: z.array(tenantUserSchema) },
  { method: 'GET', pattern: /^\/platform\/plans$/, response: z.array(planSchema) },
  { method: 'GET', pattern: /^\/platform\/plans\/[^/]+$/, response: planSchema },
  { method: 'GET', pattern: /^\/tenants\/[^/]+$/, response: platformTenantSchema },
  { method: 'PATCH', pattern: /^\/tenants\/[^/]+$/, response: platformTenantSchema },
  { method: 'GET', pattern: /^\/tenants\/[^/]+\/dashboard$/, response: tenantDashboardSchema },
  { method: 'GET', pattern: /^\/tenants\/[^/]+\/usage$/, response: tenantUsageSchema },
  { method: 'GET', pattern: /^\/tenants\/[^/]+\/subscription$/, response: platformTenantSchema },
  { method: 'GET', pattern: /^\/tenants\/[^/]+\/companies$/, response: z.array(companySummarySchema) },
  { method: 'POST', pattern: /^\/tenants\/[^/]+\/companies$/, response: companySummarySchema },
  { method: 'GET', pattern: /^\/tenants\/[^/]+\/users$/, response: z.array(tenantUserSchema) },
  { method: 'GET', pattern: /^\/tenants\/[^/]+\/invitations$/, response: z.array(invitationSchema) },
  { method: 'POST', pattern: /^\/tenants\/[^/]+\/invitations$/, response: invitationSchema },
  { method: 'POST', pattern: /^\/tenants\/[^/]+\/invitations\/[^/]+\/resend$/, response: invitationSchema },
  { method: 'DELETE', pattern: /^\/tenants\/[^/]+\/invitations\/[^/]+$/, response: invitationSchema },
  { method: 'GET', pattern: /^\/tenants\/[^/]+\/roles$/, response: z.array(roleSummarySchema) },
  { method: 'GET', pattern: /^\/tenants\/[^/]+\/audit$/, response: platformAuditSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/status$/, response: setupStatusSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/profile$/, response: setupProfileSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/profile$/, response: setupProfileSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/addresses$/, response: z.array(addressSchema) },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/setup\/addresses$/, response: addressSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/addresses\/[^/]+$/, response: addressSchema },
  { method: 'DELETE', pattern: /^\/companies\/[^/]+\/setup\/addresses\/[^/]+$/, response: addressSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/contacts$/, response: z.array(contactSchema) },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/setup\/contacts$/, response: contactSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/contacts\/[^/]+$/, response: contactSchema },
  { method: 'DELETE', pattern: /^\/companies\/[^/]+\/setup\/contacts\/[^/]+$/, response: contactSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/localization$/, response: localizationSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/localization$/, response: localizationSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/fiscal$/, response: fiscalSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/fiscal$/, response: fiscalSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/modules$/, response: moduleSelectionSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/modules$/, response: moduleSelectionSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/administrator$/, response: administratorSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/administrator$/, response: administratorSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/team$/, response: z.array(teamMemberSchema) },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/setup\/team$/, response: teamMemberSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/team\/[^/]+$/, response: teamMemberSchema },
  { method: 'DELETE', pattern: /^\/companies\/[^/]+\/setup\/team\/[^/]+$/, response: teamMemberSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/chart-of-accounts$/, response: chartOfAccountsSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/chart-of-accounts$/, response: chartOfAccountsSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/business-structure$/, response: businessStructureSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/business-structure$/, response: businessStructureSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/essential-masters$/, response: essentialMastersSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/essential-masters$/, response: essentialMastersSchema },
  { method: 'GET', pattern: /^\/companies\/[^/]+\/setup\/notifications$/, response: setupNotificationsSchema },
  { method: 'PATCH', pattern: /^\/companies\/[^/]+\/setup\/notifications$/, response: setupNotificationsSchema },
  { method: 'POST', pattern: /^\/companies\/[^/]+\/setup\/complete$/, response: setupStatusSchema },
];
