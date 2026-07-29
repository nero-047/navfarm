import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  createCompanySchema,
  createInvitationSchema,
  createTenantSchema,
  tenantPatchSchema,
  type CompanySummary,
  type Invitation,
  type PlatformTenant,
  type Plan,
  type RoleSummary,
  type TenantDashboard,
} from '../../contracts/phase2';
import { apiErrorResponse } from './errors';
import {
  handleCompanySettingsRequest,
  handleCompanySetupRequest,
  resetCompanySetupRepository,
} from './company-setup-repository';

export interface Phase2Actor {
  userId: string;
  fullName: string;
  platformRole: 'SYSTEM_ADMIN' | 'PLATFORM_SUPPORT' | null;
  activeTenantId: string | null;
  activeCompanyId: string | null;
  tenantAdmin: boolean;
  companyView: boolean;
  companyManage: boolean;
  grantCompany?: (company: CompanySummary) => void;
}

const now = '2026-07-24T09:00:00.000Z';
const plans: Plan[] = [
  {
    planId: 'PLAN_STARTER', code: 'STARTER', name: 'Starter',
    description: 'Single-company configuration for smaller operations.',
    status: 'ACTIVE',
    limits: { companies: 1, users: 8, batchesPerMonth: 50, apiRequestsPerMinute: 60, storageGb: 10 },
    features: ['Batches', 'Inventory', 'QC'],
  },
  {
    planId: 'PLAN_PRO', code: 'PROFESSIONAL', name: 'Professional',
    description: 'Multi-company operations with finance, QR, and analytics.',
    status: 'ACTIVE',
    limits: { companies: 5, users: 50, batchesPerMonth: 500, apiRequestsPerMinute: 300, storageGb: 100 },
    features: ['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics', 'Multi-language'],
  },
  {
    planId: 'PLAN_ENTERPRISE', code: 'ENTERPRISE', name: 'Enterprise',
    description: 'Configurable enterprise limits and API access.',
    status: 'ACTIVE',
    limits: { companies: 20, users: 250, batchesPerMonth: null, apiRequestsPerMinute: 1200, storageGb: 500 },
    features: ['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics', 'Multi-language', 'API access'],
  },
];

const seedPlatformTenants: PlatformTenant[] = [
  {
    tenantId: 'tenant-demo', code: 'GREEN_VALLEY', name: 'Green Valley Holdings',
    type: 'ENTERPRISE', status: 'ACTIVE', planId: 'PLAN_PRO', planName: 'Professional',
    billingEmail: 'billing@greenvalleyfarms.in', billingCurrency: 'INR',
    billingCycle: 'ANNUAL', subscriptionStart: '2026-01-01', subscriptionEnd: '2026-12-31',
    features: plans[1].features, usage: {
      companies: { used: 3, limit: 5 }, users: { used: 42, limit: 50 },
      batches: { used: 382, limit: 500 }, apiRequests: { used: 204, limit: 300 },
      storageGb: { used: 64, limit: 100 },
    },
    companyCount: 3, activeUserCount: 42, setupExceptionCount: 1,
    createdAt: '2025-10-12T08:00:00.000Z', updatedAt: now,
  },
  {
    tenantId: 'tenant-second', code: 'BLUEWATER', name: 'BlueWater Group',
    type: 'SME', status: 'TRIAL', planId: 'PLAN_PRO', planName: 'Professional',
    billingEmail: 'finance@bluewater.demo', billingCurrency: 'USD',
    billingCycle: 'MONTHLY', subscriptionStart: '2026-07-01', subscriptionEnd: '2026-08-01',
    features: plans[1].features, usage: {
      companies: { used: 1, limit: 5 }, users: { used: 7, limit: 50 },
      batches: { used: 18, limit: 500 }, apiRequests: { used: 42, limit: 300 },
      storageGb: { used: 4, limit: 100 },
    },
    companyCount: 1, activeUserCount: 7, setupExceptionCount: 1,
    createdAt: '2026-07-01T08:00:00.000Z', updatedAt: now,
  },
  {
    tenantId: 'tenant-suspended', code: 'SUSPENDED_FARMS', name: 'Suspended Farms Ltd',
    type: 'SME', status: 'SUSPENDED', planId: 'PLAN_STARTER', planName: 'Starter',
    billingEmail: 'accounts@suspended.demo', billingCurrency: 'INR',
    billingCycle: 'MONTHLY', subscriptionStart: '2026-02-01', subscriptionEnd: '2026-06-30',
    features: plans[0].features, usage: {
      companies: { used: 1, limit: 1 }, users: { used: 4, limit: 8 },
      batches: { used: 0, limit: 50 }, apiRequests: { used: 0, limit: 60 },
      storageGb: { used: 2, limit: 10 },
    },
    companyCount: 1, activeUserCount: 0, setupExceptionCount: 0,
    createdAt: '2026-02-01T08:00:00.000Z', updatedAt: now,
  },
  {
    tenantId: 'tenant-near-limit', code: 'SUNRISE_COOP', name: 'Sunrise Cooperative',
    type: 'COOPERATIVE', status: 'ACTIVE', planId: 'PLAN_STARTER', planName: 'Starter',
    billingEmail: 'office@sunrise.demo', billingCurrency: 'INR',
    billingCycle: 'ANNUAL', subscriptionStart: '2026-04-01', subscriptionEnd: '2027-03-31',
    features: plans[0].features, usage: {
      companies: { used: 1, limit: 1 }, users: { used: 8, limit: 8 },
      batches: { used: 47, limit: 50 }, apiRequests: { used: 52, limit: 60 },
      storageGb: { used: 9.1, limit: 10 },
    },
    companyCount: 1, activeUserCount: 8, setupExceptionCount: 0,
    createdAt: '2026-04-01T08:00:00.000Z', updatedAt: now,
  },
  {
    tenantId: 'tenant-inactive', code: 'OLD_MILL', name: 'Old Mill Processing',
    type: 'INDIVIDUAL', status: 'INACTIVE', planId: 'PLAN_STARTER', planName: 'Starter',
    billingEmail: 'owner@oldmill.demo', billingCurrency: 'INR',
    billingCycle: 'MONTHLY', subscriptionStart: '2025-01-01', subscriptionEnd: '2026-01-01',
    features: plans[0].features, usage: {
      companies: { used: 1, limit: 1 }, users: { used: 2, limit: 8 },
      batches: { used: 0, limit: 50 }, apiRequests: { used: 0, limit: 60 },
      storageGb: { used: 1, limit: 10 },
    },
    companyCount: 1, activeUserCount: 0, setupExceptionCount: 0,
    createdAt: '2025-01-01T08:00:00.000Z', updatedAt: now,
  },
];

const seedTenantCompanies: CompanySummary[] = [
  {
    companyId: 'company-green-valley', tenantId: 'tenant-demo', code: 'GREEN_VALLEY',
    name: 'Green Valley Poultry', slug: 'green-valley-poultry', status: 'ACTIVE',
    setupPercentage: 100, workspaceReady: true, operationsReady: true,
    enabledNobs: ['Poultry'], enabledModules: ['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics'],
    primaryAdministrator: 'Tenant Administrator', createdAt: '2025-10-12T08:00:00.000Z',
  },
  {
    companyId: 'company-harvest-ridge', tenantId: 'tenant-demo', code: 'HARVEST_RIDGE',
    name: 'Harvest Ridge Farms', slug: 'harvest-ridge-farms', status: 'ACTIVE',
    setupPercentage: 100, workspaceReady: true, operationsReady: true,
    enabledNobs: ['Agriculture'], enabledModules: ['Batches', 'Inventory', 'QC', 'Finance', 'Analytics'],
    primaryAdministrator: 'Tenant Administrator', createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    companyId: 'company-draft-demo', tenantId: 'tenant-demo', code: 'VALLEY_FEED',
    name: 'Valley Feed Processing', slug: 'valley-feed-processing', status: 'DRAFT',
    setupPercentage: 42, workspaceReady: false, operationsReady: false,
    enabledNobs: ['Feed & Processing'], enabledModules: ['Batches', 'Inventory'],
    primaryAdministrator: 'Tenant Administrator', createdAt: '2026-07-18T08:00:00.000Z',
  },
  {
    companyId: 'company-bluewater', tenantId: 'tenant-second', code: 'BLUEWATER',
    name: 'BlueWater Aqua', slug: 'bluewater-aqua', status: 'DRAFT',
    setupPercentage: 22, workspaceReady: false, operationsReady: false,
    enabledNobs: ['Aquaculture'], enabledModules: ['Batches', 'Inventory', 'QC', 'QR'],
    primaryAdministrator: 'Onboarding Administrator', createdAt: '2026-07-01T08:00:00.000Z',
  },
  {
    companyId: 'company-sunrise', tenantId: 'tenant-near-limit', code: 'SUNRISE_FARM',
    name: 'Sunrise Cooperative Farm', slug: 'sunrise-cooperative-farm', status: 'ACTIVE',
    setupPercentage: 100, workspaceReady: true, operationsReady: false,
    enabledNobs: ['Livestock'], enabledModules: ['Batches', 'Inventory', 'QC'],
    primaryAdministrator: 'Sunrise Admin', createdAt: '2026-04-01T08:00:00.000Z',
  },
];

const seedInvitations: Invitation[] = [
  {
    invitationId: 'invitation-pending', tenantId: 'tenant-demo',
    email: 'accountant@greenvalley.demo', fullName: 'Future Accountant',
    tenantRole: 'TENANT_MEMBER', companyMemberships: ['company-green-valley'],
    status: 'PENDING', invitedAt: '2026-07-22T08:00:00.000Z', expiresAt: '2026-07-29T08:00:00.000Z',
  },
  {
    invitationId: 'invitation-expired', tenantId: 'tenant-demo',
    email: 'expired@greenvalley.demo', fullName: 'Expired Invitee',
    tenantRole: 'TENANT_MEMBER', companyMemberships: [],
    status: 'EXPIRED', invitedAt: '2026-06-01T08:00:00.000Z', expiresAt: '2026-06-08T08:00:00.000Z',
  },
];

const roles: RoleSummary[] = [
  { roleId: 'tenant-admin', name: 'Tenant administrator', scope: 'TENANT', description: 'Manage tenant profile, companies, users, roles, limits, and audit.', permissions: ['tenant.view', 'tenant.manage', 'company.manage', 'users.manage', 'roles.manage', 'audit.view'], assignedUsers: 1 },
  { roleId: 'tenant-member', name: 'Tenant member', scope: 'TENANT', description: 'Access assigned company workspaces only.', permissions: ['company.view'], assignedUsers: 41 },
  { roleId: 'company-admin', name: 'Company administrator', scope: 'COMPANY', description: 'Configure and operate an assigned company workspace.', permissions: ['company.manage', 'users.manage', 'roles.manage'], assignedUsers: 3 },
];

type Activity = { id: string; occurredAt: string; actor: string; action: string; summary: string };
type Phase2State = {
  tenants: PlatformTenant[];
  companies: CompanySummary[];
  invitations: Invitation[];
  activities: Activity[];
};
declare global { var __navfarmPhase2State: Phase2State | undefined; }
const initialActivities: Activity[] = [
  { id: 'audit-1', occurredAt: now, actor: 'System Administrator', action: 'TENANT_REVIEWED', summary: 'Reviewed Green Valley Holdings limits.' },
  { id: 'audit-2', occurredAt: '2026-07-23T11:30:00.000Z', actor: 'System Administrator', action: 'TENANT_SUSPENDED', summary: 'Suspended Farms Ltd remains suspended.' },
  { id: 'audit-3', occurredAt: '2026-07-22T07:15:00.000Z', actor: 'Tenant Administrator', action: 'SETUP_UPDATED', summary: 'BlueWater Aqua completed localization.' },
];
const phase2State: Phase2State = globalThis.__navfarmPhase2State ?? {
  tenants: structuredClone(seedPlatformTenants),
  companies: structuredClone(seedTenantCompanies),
  invitations: structuredClone(seedInvitations),
  activities: structuredClone(initialActivities),
};
phase2State.companies ??= structuredClone(seedTenantCompanies);
phase2State.invitations ??= structuredClone(seedInvitations);
globalThis.__navfarmPhase2State = phase2State;

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status });
}

function tenantById(tenantId: string) {
  return phase2State.tenants.find((tenant) => tenant.tenantId === tenantId);
}

function addActivity(actor: Phase2Actor, action: string, summary: string) {
  phase2State.activities.unshift({
    id: randomUUID(), occurredAt: new Date().toISOString(),
    actor: actor.fullName, action, summary,
  });
}

function requirePlatform(actor: Phase2Actor, requestId: string) {
  return actor.platformRole === 'SYSTEM_ADMIN'
    ? null
    : apiErrorResponse(403, 'Platform administrator permission is required.', requestId);
}

function statusAction(status: PlatformTenant['status'], action: string): PlatformTenant['status'] | null {
  if (action === 'activate' && (status === 'TRIAL' || status === 'INACTIVE')) return 'ACTIVE';
  if (action === 'suspend' && (status === 'ACTIVE' || status === 'TRIAL')) return 'SUSPENDED';
  if (action === 'reactivate' && status === 'SUSPENDED') return 'ACTIVE';
  return null;
}

export function resetPhase2Repository() {
  phase2State.tenants = structuredClone(seedPlatformTenants);
  phase2State.companies = structuredClone(seedTenantCompanies);
  phase2State.invitations = structuredClone(seedInvitations);
  phase2State.activities = structuredClone(initialActivities);
  resetCompanySetupRepository();
}

export async function handlePhase2Request(
  request: Request,
  path: string,
  requestId: string,
  actor: Phase2Actor,
): Promise<NextResponse | null> {
  // Platform reference masters are owned by Phase 3. Explicitly decline this
  // namespace so the top-level router can delegate it without turning every
  // unknown Phase 2 URL into a permissive fall-through.
  if (path.startsWith('/platform/masters/')) return null;
  const platformPath = path.startsWith('/platform/');
  const tenantPath = path.startsWith('/tenants/');
  const companySetupPath = /^\/companies\/[^/]+\/setup\//.test(path);
  const companySettingsPath = /^\/companies\/[^/]+\/settings$/.test(path);
  if (!platformPath && !tenantPath && !companySetupPath && !companySettingsPath) return null;
  if (platformPath) {
    const forbidden = requirePlatform(actor, requestId);
    if (forbidden) return forbidden;
  }

  const method = request.method;
  const url = new URL(request.url);

  if (companySetupPath || companySettingsPath) {
    const companyId = path.split('/')[2];
    const company = phase2State.companies.find((item) => item.companyId === companyId);
    if (!company) return apiErrorResponse(404, 'Company not found.', requestId);
    const setupActor = {
      userId: actor.userId,
      fullName: actor.fullName,
      activeTenantId: actor.activeTenantId,
      activeCompanyId: actor.activeCompanyId,
      tenantAdmin: actor.tenantAdmin,
      companyView: actor.companyView,
      companyManage: actor.companyManage,
    };
    if (companySettingsPath) {
      return handleCompanySettingsRequest(
        request,
        requestId,
        setupActor,
        company,
        (changes) => Object.assign(company, changes),
      );
    }
    return handleCompanySetupRequest(
      request,
      path,
      requestId,
      setupActor,
      company,
      (changes) => Object.assign(company, changes),
    );
  }
  const input = request.headers.get('content-type')?.includes('application/json')
    ? await request.json().catch(() => ({}))
    : {};

  if (tenantPath) {
    const tenantMatch = path.match(/^\/tenants\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?$/);
    if (!tenantMatch) return apiErrorResponse(404, 'Tenant resource not found.', requestId);
    const tenant = tenantById(tenantMatch[1]);
    if (!tenant) return apiErrorResponse(404, 'Tenant not found.', requestId);
    const isPlatformAdministrator = actor.platformRole === 'SYSTEM_ADMIN';
    if (!isPlatformAdministrator && (actor.activeTenantId !== tenant.tenantId || !actor.tenantAdmin)) {
      return apiErrorResponse(403, 'Tenant administrator permission is required.', requestId);
    }
    if (!isPlatformAdministrator && tenant.status === 'SUSPENDED') {
      return apiErrorResponse(403, 'This tenant is suspended. Contact NAVFarm platform support.', requestId);
    }
    const resource = tenantMatch[2];
    const resourceId = tenantMatch[3];
    const action = tenantMatch[4];
    const tenantCompanies = phase2State.companies.filter((company) => company.tenantId === tenant.tenantId);
    const tenantInvitations = phase2State.invitations.filter((invitation) => invitation.tenantId === tenant.tenantId);
    const tenantUsers = Array.from({ length: Math.min(tenant.activeUserCount, 10) }, (_, index) => ({
      userId: `${tenant.tenantId}-user-${index + 1}`,
      fullName: index === 0 ? 'Tenant Administrator' : `Team Member ${index + 1}`,
      email: index === 0 ? `admin@${tenant.code.toLowerCase()}.demo` : `member${index + 1}@${tenant.code.toLowerCase()}.demo`,
      status: 'ACTIVE' as const,
      tenantRole: index === 0 ? 'TENANT_ADMIN' as const : 'TENANT_MEMBER' as const,
      companyMemberships: index === 0 ? tenantCompanies.map((company) => company.companyId) : tenantCompanies.slice(0, 1).map((company) => company.companyId),
      createdAt: tenant.createdAt,
    }));

    if (method === 'GET' && !resource) return json(tenant);
    if (method === 'PATCH' && !resource) {
      if (!actor.tenantAdmin && !isPlatformAdministrator) return apiErrorResponse(403, 'Tenant editing permission is required.', requestId);
      const parsed = tenantPatchSchema.pick({ name: true, billingEmail: true }).safeParse(input);
      if (!parsed.success) return apiErrorResponse(422, 'Review the tenant profile.', requestId, parsed.error.flatten());
      Object.assign(tenant, parsed.data, { updatedAt: new Date().toISOString() });
      addActivity(actor, 'TENANT_PROFILE_UPDATED', `Updated ${tenant.name} profile.`);
      return json(tenant);
    }
    if (method === 'GET' && resource === 'dashboard') {
      const usageEntries = [
        ['Companies', tenant.usage.companies],
        ['Users', tenant.usage.users],
        ['Monthly batches', tenant.usage.batches],
        ['API usage', tenant.usage.apiRequests],
      ] as const;
      const limitWarnings: TenantDashboard['limitWarnings'] = usageEntries.flatMap(([name, usage]) => {
        if (usage.limit === null) return [];
        const ratio = usage.used / usage.limit;
        const state = ratio >= 1 ? 'LIMIT_REACHED' as const : ratio >= 0.8 ? 'NEAR_LIMIT' as const : 'NORMAL' as const;
        return state === 'NORMAL' ? [] : [{ resource: name, state, message: `${name} usage is ${usage.used} of ${usage.limit}.` }];
      });
      if (tenant.status === 'INACTIVE') limitWarnings.push({ resource: 'Subscription', state: 'SUBSCRIPTION_INACTIVE', message: 'The subscription is inactive.' });
      return json({
        tenant,
        companies: tenantCompanies,
        pendingInvitations: tenantInvitations.filter((invitation) => invitation.status === 'PENDING'),
        recentActivity: phase2State.activities.slice(0, 8),
        limitWarnings,
      });
    }
    if (method === 'GET' && resource === 'usage') return json(tenant.usage);
    if (method === 'GET' && resource === 'subscription') return json(tenant);
    if (method === 'GET' && resource === 'companies') return json(tenantCompanies);
    if (method === 'POST' && resource === 'companies') {
      if (tenant.usage.companies.used >= tenant.usage.companies.limit) {
        return apiErrorResponse(409, 'Company limit reached. Upgrade the tenant allocation before creating another company.', requestId, { resource: 'companies', used: tenant.usage.companies.used, limit: tenant.usage.companies.limit });
      }
      const parsed = createCompanySchema.safeParse(input);
      if (!parsed.success) return apiErrorResponse(422, 'Review the company identity fields.', requestId, parsed.error.flatten());
      if (phase2State.companies.some((company) => company.code === parsed.data.code)) {
        return apiErrorResponse(409, 'Company code already exists.', requestId, { field: 'code' });
      }
      const company: CompanySummary = {
        companyId: `company-${randomUUID()}`, tenantId: tenant.tenantId,
        code: parsed.data.code, name: parsed.data.name,
        slug: parsed.data.code.toLowerCase().replaceAll('_', '-'),
        status: 'DRAFT', setupPercentage: 0, workspaceReady: false, operationsReady: false,
        enabledNobs: [], enabledModules: [], primaryAdministrator: actor.fullName,
        createdAt: new Date().toISOString(),
      };
      phase2State.companies.push(company);
      tenant.companyCount += 1;
      tenant.usage.companies.used += 1;
      tenant.setupExceptionCount += 1;
      actor.grantCompany?.(company);
      addActivity(actor, 'COMPANY_CREATED', `Created draft company ${company.name}.`);
      return json(company, 201);
    }
    if (method === 'GET' && resource === 'users') return json(tenantUsers);
    if (method === 'GET' && resource === 'invitations' && !resourceId) return json(tenantInvitations);
    if (method === 'POST' && resource === 'invitations' && !resourceId) {
      if (tenant.usage.users.used >= tenant.usage.users.limit) {
        return apiErrorResponse(409, 'User limit reached. Increase the tenant allocation before inviting another user.', requestId, { resource: 'users', used: tenant.usage.users.used, limit: tenant.usage.users.limit });
      }
      const parsed = createInvitationSchema.safeParse(input);
      if (!parsed.success) return apiErrorResponse(422, 'Review the invitation fields.', requestId, parsed.error.flatten());
      const invitation: Invitation = {
        invitationId: `invitation-${randomUUID()}`, tenantId: tenant.tenantId,
        ...parsed.data, status: 'PENDING', invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      phase2State.invitations.push(invitation);
      tenant.usage.users.used += 1;
      addActivity(actor, 'USER_INVITED', `Invited ${invitation.email} to ${tenant.name}.`);
      return json(invitation, 201);
    }
    if (method === 'POST' && resource === 'invitations' && resourceId && action === 'resend') {
      const invitation = phase2State.invitations.find((item) => item.invitationId === resourceId && item.tenantId === tenant.tenantId);
      if (!invitation || invitation.status === 'REVOKED' || invitation.status === 'ACCEPTED') return apiErrorResponse(409, 'Invitation cannot be resent.', requestId);
      invitation.status = 'PENDING';
      invitation.invitedAt = new Date().toISOString();
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      addActivity(actor, 'INVITATION_RESENT', `Resent invitation to ${invitation.email}.`);
      return json(invitation);
    }
    if (method === 'DELETE' && resource === 'invitations' && resourceId) {
      const invitation = phase2State.invitations.find((item) => item.invitationId === resourceId && item.tenantId === tenant.tenantId);
      if (!invitation || invitation.status !== 'PENDING') return apiErrorResponse(409, 'Only pending invitations can be revoked.', requestId);
      invitation.status = 'REVOKED';
      tenant.usage.users.used = Math.max(0, tenant.usage.users.used - 1);
      addActivity(actor, 'INVITATION_REVOKED', `Revoked invitation for ${invitation.email}.`);
      return json(invitation);
    }
    if (method === 'GET' && resource === 'roles') return json(roles);
    if (method === 'GET' && resource === 'audit') return json({ items: phase2State.activities.slice(0, 50) });
    return apiErrorResponse(404, `No tenant handler for ${method} ${path}.`, requestId);
  }

  if (method === 'GET' && path === '/platform/dashboard') {
    const tenants = phase2State.tenants;
    const approachingLimits = tenants.flatMap((tenant) => {
      const resources = [
        ['Companies', tenant.usage.companies],
        ['Users', tenant.usage.users],
        ['Batches', tenant.usage.batches],
      ] as const;
      return resources.flatMap(([resource, usage]) =>
        usage.limit !== null && usage.used / usage.limit >= 0.8
          ? [{ tenantId: tenant.tenantId, tenantName: tenant.name, resource, used: usage.used, limit: usage.limit }]
          : [],
      );
    });
    return json({
      totals: {
        tenants: tenants.length,
        activeTenants: tenants.filter((tenant) => tenant.status === 'ACTIVE').length,
        suspendedTenants: tenants.filter((tenant) => tenant.status === 'SUSPENDED').length,
        trialOrExpiring: tenants.filter((tenant) => tenant.status === 'TRIAL' || (
          tenant.subscriptionEnd && Date.parse(tenant.subscriptionEnd) <= Date.parse('2026-08-31')
        )).length,
        companies: tenants.reduce((sum, tenant) => sum + tenant.companyCount, 0),
        activeUsers: tenants.reduce((sum, tenant) => sum + tenant.activeUserCount, 0),
        batchesThisMonth: tenants.reduce((sum, tenant) => sum + tenant.usage.batches.used, 0),
      },
      approachingLimits,
      setupExceptions: tenants
        .filter((tenant) => tenant.setupExceptionCount > 0)
        .map((tenant) => ({ tenantId: tenant.tenantId, tenantName: tenant.name, count: tenant.setupExceptionCount })),
      recentActivity: phase2State.activities.slice(0, 8),
    });
  }

  if (method === 'GET' && path === '/platform/tenants') {
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const status = url.searchParams.get('status') || '';
    const planId = url.searchParams.get('planId') || '';
    const type = url.searchParams.get('type') || '';
    const sort = url.searchParams.get('sort') || 'name';
    const direction = url.searchParams.get('direction') === 'desc' ? -1 : 1;
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 10)));
    const filtered = phase2State.tenants
      .filter((tenant) => !search || [tenant.code, tenant.name, tenant.billingEmail].some((value) => value.toLowerCase().includes(search)))
      .filter((tenant) => !status || tenant.status === status)
      .filter((tenant) => !planId || tenant.planId === planId)
      .filter((tenant) => !type || tenant.type === type)
      .sort((left, right) => String(left[sort as keyof PlatformTenant] ?? '').localeCompare(String(right[sort as keyof PlatformTenant] ?? '')) * direction);
    const start = (page - 1) * pageSize;
    return json({
      items: filtered.slice(start, start + pageSize),
      page, pageSize, total: filtered.length, totalPages: Math.ceil(filtered.length / pageSize),
    });
  }

  if (method === 'POST' && path === '/platform/tenants') {
    const parsed = createTenantSchema.safeParse(input);
    if (!parsed.success) return apiErrorResponse(422, 'Review the highlighted tenant fields.', requestId, parsed.error.flatten());
    if (phase2State.tenants.some((tenant) => tenant.code === parsed.data.code)) {
      return apiErrorResponse(409, 'Tenant code already exists.', requestId, { field: 'code' });
    }
    const plan = plans.find((item) => item.planId === parsed.data.planId);
    if (!plan) return apiErrorResponse(422, 'Selected plan is unavailable.', requestId, { field: 'planId' });
    const created: PlatformTenant = {
      tenantId: `tenant-${randomUUID()}`,
      code: parsed.data.code, name: parsed.data.name, type: parsed.data.type,
      status: 'ACTIVE', planId: plan.planId, planName: plan.name,
      billingEmail: parsed.data.billingEmail, billingCurrency: parsed.data.billingCurrency,
      billingCycle: parsed.data.billingCycle, subscriptionStart: parsed.data.subscriptionStart,
      subscriptionEnd: parsed.data.subscriptionEnd, features: parsed.data.features,
      usage: {
        companies: { used: 0, limit: parsed.data.limits.companies },
        users: { used: 1, limit: parsed.data.limits.users },
        batches: { used: 0, limit: parsed.data.limits.batchesPerMonth },
        apiRequests: { used: 0, limit: parsed.data.limits.apiRequestsPerMinute },
        storageGb: { used: 0, limit: parsed.data.limits.storageGb },
      },
      companyCount: 0, activeUserCount: 1, setupExceptionCount: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    phase2State.tenants.push(created);
    addActivity(actor, 'TENANT_CREATED', `Created ${created.name} with administrator ${parsed.data.administrator.email}.`);
    return json(created, 201);
  }

  if (method === 'GET' && path === '/platform/plans') return json(plans);
  const planMatch = path.match(/^\/platform\/plans\/([^/]+)$/);
  if (method === 'GET' && planMatch) {
    const plan = plans.find((item) => item.planId === planMatch[1]);
    return plan ? json(plan) : apiErrorResponse(404, 'Plan not found.', requestId);
  }

  const tenantMatch = path.match(/^\/platform\/tenants\/([^/]+)(?:\/([^/]+))?$/);
  if (!tenantMatch) return apiErrorResponse(404, `No Phase 2 handler for ${method} ${path}.`, requestId);
  const tenant = tenantById(tenantMatch[1]);
  if (!tenant) return apiErrorResponse(404, 'Tenant not found.', requestId);
  const resource = tenantMatch[2];

  if (method === 'GET' && !resource) return json(tenant);
  if (method === 'PATCH' && !resource) {
    const parsed = tenantPatchSchema.safeParse(input);
    if (!parsed.success) return apiErrorResponse(422, 'Review the tenant changes.', requestId, parsed.error.flatten());
    const selectedPlan = parsed.data.planId ? plans.find((item) => item.planId === parsed.data.planId) : null;
    const { limits, ...tenantChanges } = parsed.data;
    Object.assign(tenant, tenantChanges, selectedPlan ? { planName: selectedPlan.name } : {}, { updatedAt: new Date().toISOString() });
    if (limits) {
      tenant.usage = {
        companies: { ...tenant.usage.companies, limit: limits.companies ?? tenant.usage.companies.limit },
        users: { ...tenant.usage.users, limit: limits.users ?? tenant.usage.users.limit },
        batches: { ...tenant.usage.batches, limit: limits.batchesPerMonth === undefined ? tenant.usage.batches.limit : limits.batchesPerMonth },
        apiRequests: { ...tenant.usage.apiRequests, limit: limits.apiRequestsPerMinute ?? tenant.usage.apiRequests.limit },
        storageGb: { ...tenant.usage.storageGb, limit: limits.storageGb === undefined ? tenant.usage.storageGb.limit : limits.storageGb },
      };
    }
    addActivity(actor, 'TENANT_UPDATED', `Updated ${tenant.name}.`);
    return json(tenant);
  }
  if (method === 'POST' && resource && ['activate', 'suspend', 'reactivate'].includes(resource)) {
    const next = statusAction(tenant.status, resource);
    if (!next) return apiErrorResponse(409, `Tenant cannot be ${resource}d from ${tenant.status}.`, requestId);
    tenant.status = next;
    tenant.updatedAt = new Date().toISOString();
    addActivity(actor, `TENANT_${resource.toUpperCase()}D`, `${resource}d ${tenant.name}.`);
    return json(tenant);
  }
  if (method === 'GET' && resource === 'usage') return json(tenant.usage);
  if (method === 'GET' && resource === 'audit') {
    return json({ items: phase2State.activities.filter((activity) => activity.summary.includes(tenant.name)).slice(0, 30) });
  }
  if (method === 'GET' && resource === 'companies') {
    return json(phase2State.companies.filter((company) => company.tenantId === tenant.tenantId));
  }
  if (method === 'GET' && resource === 'users') {
    return json(Array.from({ length: Math.min(tenant.activeUserCount, 8) }, (_, index) => ({
      userId: `${tenant.tenantId}-user-${index + 1}`,
      fullName: index === 0 ? 'Tenant Administrator' : `Team Member ${index + 1}`,
      email: index === 0 ? `admin@${tenant.code.toLowerCase()}.demo` : `member${index + 1}@${tenant.code.toLowerCase()}.demo`,
      status: 'ACTIVE',
      tenantRole: index === 0 ? 'TENANT_ADMIN' : 'TENANT_MEMBER',
      companyMemberships: [],
      createdAt: tenant.createdAt,
    })));
  }
  return apiErrorResponse(404, `No Phase 2 handler for ${method} ${path}.`, requestId);
}

export const phase2Fixtures = { plans, seedPlatformTenants };
