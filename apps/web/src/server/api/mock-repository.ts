import { randomUUID } from 'node:crypto';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NextResponse } from 'next/server';
import {
  workspaceCreateSchema,
  workspaceMemberCreateSchema,
  workspaceSchema,
  type AuthSession,
  type CompanyRole,
  type Permission,
  type Workspace,
  type WorkspaceMember,
} from '../../contracts/api';
import type { CompanySummary } from '../../contracts/phase2';
import { ROLE_PERMISSIONS } from '../../lib/authorization';
import { apiErrorResponse } from './errors';
import { handlePhase2Request, resetPhase2Repository } from './phase2-repository';
import { handlePhase3Request, resetPhase3Repository } from './phase3-repository';
import { handleOperationalRequest, resetOperationalRepository } from './operational-repository';

type JsonRecord = Record<string, unknown>;
type FixtureUser = {
  userId: string;
  email: string;
  fullName: string;
  password: string;
  platformRole: 'SYSTEM_ADMIN' | 'PLATFORM_SUPPORT' | null;
  tenantIds: string[];
  companies: Array<{
    companyId: string;
    role: CompanyRole;
    permissions?: Permission[];
  }>;
  workspaces?: Array<{ workspaceId: string; role: 'MANAGER' | 'OPERATOR' | 'VIEWER' }>;
  mfaEnabled?: boolean;
};
type SessionRecord = {
  userId: string;
  activeTenantId: string | null;
  activeCompanyId: string | null;
  activeWorkspaceId: string | null;
  expiresAt: string;
};

const SESSION_COOKIE = 'navfarm_session';
const SESSION_SECONDS = 60 * 60 * 8;

const seedTenants = [
  { tenant_id: 'tenant-demo', tenant_name: 'Green Valley Holdings', plan_id: 'PLAN_PRO', status: 'ACTIVE' },
  { tenant_id: 'tenant-second', tenant_name: 'BlueWater Group', plan_id: 'PLAN_PRO', status: 'ACTIVE' },
  { tenant_id: 'tenant-suspended', tenant_name: 'Suspended Farms Ltd', plan_id: 'PLAN_BASIC', status: 'SUSPENDED' },
];

const seedCompanies: JsonRecord[] = [
  {
    company_id: 'company-green-valley', tenant_id: 'tenant-demo',
    company_code: 'GREEN_VALLEY', company_name: 'Green Valley Poultry',
    company_display_name: 'Green Valley Poultry', industry_type: 'Poultry',
    onboarding_status: 'COMPLETED', is_active: true, slug: 'green-valley-poultry',
    enabled_modules: ['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics'],
  },
  {
    company_id: 'company-harvest-ridge', tenant_id: 'tenant-demo',
    company_code: 'HARVEST_RIDGE', company_name: 'Harvest Ridge Farms',
    company_display_name: 'Harvest Ridge Farms', industry_type: 'Agriculture',
    onboarding_status: 'COMPLETED', is_active: true, slug: 'harvest-ridge-farms',
    enabled_modules: ['Batches', 'Inventory', 'QC', 'Finance', 'Analytics'],
  },
  {
    company_id: 'company-bluewater', tenant_id: 'tenant-second',
    company_code: 'BLUEWATER', company_name: 'BlueWater Aqua',
    company_display_name: 'BlueWater Aqua', industry_type: 'Aquaculture',
    onboarding_status: 'IN_PROGRESS', is_active: true, slug: 'bluewater-aqua',
    enabled_modules: ['Batches', 'Inventory', 'QC', 'QR'],
  },
  {
    company_id: 'company-inactive', tenant_id: 'tenant-demo',
    company_code: 'INACTIVE', company_name: 'Inactive Farm',
    company_display_name: 'Inactive Farm', industry_type: 'Livestock',
    onboarding_status: 'COMPLETED', is_active: false, slug: 'inactive-farm',
    enabled_modules: ['Batches'],
  },
];

const fixtureDate = '2026-07-01T00:00:00.000Z';
const seedWorkspaces: Workspace[] = [
  { workspaceId: 'workspace-green-poultry', tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceCode: 'GV_POULTRY', workspaceSlug: 'poultry-operations', workspaceName: 'Poultry Operations', workspaceType: 'POULTRY', status: 'ACTIVE', primaryNobId: 'nob-poultry', enabledModules: ['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics'], readiness: { percentage: 100, operationalReady: true, blockingRequirements: [] }, createdAt: fixtureDate, updatedAt: fixtureDate },
  { workspaceId: 'workspace-green-feed', tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceCode: 'GV_FEED', workspaceSlug: 'feed-mill', workspaceName: 'Feed Mill', workspaceType: 'FEED_PROCESSING', status: 'ACTIVE', primaryNobId: 'nob-processing', enabledModules: ['Batches', 'Inventory', 'QC', 'Finance'], readiness: { percentage: 82, operationalReady: false, blockingRequirements: ['Complete resource-rate setup'] }, createdAt: fixtureDate, updatedAt: fixtureDate },
  { workspaceId: 'workspace-harvest-crops', tenantId: 'tenant-demo', companyId: 'company-harvest-ridge', workspaceCode: 'HR_CROPS', workspaceSlug: 'crop-production', workspaceName: 'Crop Production', workspaceType: 'AGRICULTURE', status: 'ACTIVE', primaryNobId: 'nob-agriculture', enabledModules: ['Batches', 'Inventory', 'QC', 'Finance', 'Analytics'], readiness: { percentage: 100, operationalReady: true, blockingRequirements: [] }, createdAt: fixtureDate, updatedAt: fixtureDate },
  { workspaceId: 'workspace-bluewater-aqua', tenantId: 'tenant-second', companyId: 'company-bluewater', workspaceCode: 'BW_AQUA', workspaceSlug: 'aquaculture', workspaceName: 'Aquaculture', workspaceType: 'AQUACULTURE', status: 'DRAFT', primaryNobId: 'nob-aquaculture', enabledModules: ['Batches', 'Inventory', 'QC', 'QR'], readiness: { percentage: 42, operationalReady: false, blockingRequirements: ['Complete company onboarding', 'Configure QC parameters'] }, createdAt: fixtureDate, updatedAt: fixtureDate },
];
const seedWorkspaceMembers: WorkspaceMember[] = [
  { membershipId: 'membership-manager-poultry', workspaceId: 'workspace-green-poultry', userId: 'user-manager', fullName: 'Farm Manager', email: 'manager@navfarm.demo', role: 'MANAGER', status: 'ACTIVE' },
  { membershipId: 'membership-viewer-poultry', workspaceId: 'workspace-green-poultry', userId: 'user-viewer', fullName: 'Company Viewer', email: 'viewer@navfarm.demo', role: 'VIEWER', status: 'ACTIVE' },
  { membershipId: 'membership-multi-feed', workspaceId: 'workspace-green-feed', userId: 'user-multi', fullName: 'Multi-company Manager', email: 'multi@navfarm.demo', role: 'VIEWER', status: 'ACTIVE' },
];

const fixtureUsers: FixtureUser[] = [
  { userId: 'user-system', email: 'system@navfarm.demo', fullName: 'System Administrator', password: 'Demo123!', platformRole: 'SYSTEM_ADMIN', tenantIds: [], companies: [] },
  { userId: 'user-tenant', email: 'tenant@navfarm.demo', fullName: 'Tenant Administrator', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo'], companies: [{ companyId: 'company-green-valley', role: 'ACCOUNTANT' }] },
  { userId: 'user-manager', email: 'manager@navfarm.demo', fullName: 'Farm Manager', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo'], companies: [{ companyId: 'company-green-valley', role: 'FARM_MANAGER' }] },
  { userId: 'user-accountant', email: 'accountant@navfarm.demo', fullName: 'Company Accountant', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo'], companies: [{ companyId: 'company-green-valley', role: 'ACCOUNTANT' }] },
  { userId: 'user-auditor', email: 'auditor@navfarm.demo', fullName: 'Read-only Auditor', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo'], companies: [{ companyId: 'company-green-valley', role: 'AUDITOR' }] },
  { userId: 'user-viewer', email: 'viewer@navfarm.demo', fullName: 'Company Viewer', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo'], companies: [{ companyId: 'company-green-valley', role: 'VIEWER' }] },
  { userId: 'user-multi', email: 'multi@navfarm.demo', fullName: 'Multi-company Manager', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo', 'tenant-second'], companies: [{ companyId: 'company-green-valley', role: 'ADMIN' }, { companyId: 'company-harvest-ridge', role: 'ADMIN' }, { companyId: 'company-bluewater', role: 'FARM_MANAGER' }] },
  { userId: 'user-suspended', email: 'suspended@navfarm.demo', fullName: 'Suspended Tenant User', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-suspended'], companies: [] },
  { userId: 'user-onboarding', email: 'onboarding@navfarm.demo', fullName: 'Onboarding Administrator', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-second'], companies: [{ companyId: 'company-bluewater', role: 'SUPER_ADMIN' }] },
  { userId: 'user-no-company', email: 'nocompany@navfarm.demo', fullName: 'Tenant-only User', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo'], companies: [] },
  { userId: 'user-mfa', email: 'mfa@navfarm.demo', fullName: 'MFA Administrator', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo'], companies: [{ companyId: 'company-green-valley', role: 'ADMIN' }], mfaEnabled: true },
];

const languages = [
  { lang_id: 'lang-en', lang_code: 'en', lang_name: 'English' },
  { lang_id: 'lang-hi', lang_code: 'hi', lang_name: 'Hindi' },
];
const currencies = [
  { currency_id: 'cur-inr', currency_code: 'INR', currency_name: 'Indian Rupee', symbol: '₹' },
  { currency_id: 'cur-usd', currency_code: 'USD', currency_name: 'US Dollar', symbol: '$' },
];
const nobs = [
  ['nob-poultry', 'POULTRY', 'Poultry'], ['nob-livestock', 'LIVESTOCK', 'Livestock'],
  ['nob-agriculture', 'AGRICULTURE', 'Agriculture'], ['nob-aquaculture', 'AQUACULTURE', 'Aquaculture'],
  ['nob-insect', 'INSECT', 'Insect Farming'], ['nob-processing', 'PROCESSING', 'Feed & Processing'],
].map(([nob_id, nob_code, nob_name]) => ({ nob_id, nob_code, nob_name, is_active: true }));

type MockState = {
  companies: JsonRecord[];
  demoStates: Map<string, unknown>;
  sessions: Map<string, SessionRecord>;
  users: FixtureUser[];
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
};
declare global { var __navfarmMockState: MockState | undefined; }
const state: MockState = globalThis.__navfarmMockState ?? {
  companies: structuredClone(seedCompanies),
  demoStates: new Map(),
  sessions: new Map(),
  users: structuredClone(fixtureUsers),
  workspaces: structuredClone(seedWorkspaces),
  workspaceMembers: structuredClone(seedWorkspaceMembers),
};
state.workspaceMembers ??= structuredClone(seedWorkspaceMembers);
globalThis.__navfarmMockState = state;

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status });
}
async function body(request: Request): Promise<JsonRecord> {
  if (!request.headers.get('content-type')?.includes('application/json')) return {};
  return (await request.json().catch(() => ({}))) as JsonRecord;
}
function cookieValue(request: Request, name: string): string | null {
  const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function sessionRecord(request: Request) {
  const id = cookieValue(request, SESSION_COOKIE);
  const record = id ? state.sessions.get(id) : undefined;
  if (!id || !record || Date.parse(record.expiresAt) <= Date.now()) return null;
  return { id, record };
}
function companyById(id: string) {
  return state.companies.find((company) => company.company_id === id);
}
function workspaceAssignments(user: FixtureUser) {
  if (user.workspaces) return user.workspaces;
  if (user.email === 'tenant@navfarm.demo' || user.email === 'system@navfarm.demo' || user.email === 'suspended@navfarm.demo' || user.email === 'nocompany@navfarm.demo') return [];
  if (user.email === 'multi@navfarm.demo') return [
    { workspaceId: 'workspace-green-poultry', role: 'MANAGER' as const },
    { workspaceId: 'workspace-green-feed', role: 'VIEWER' as const },
    { workspaceId: 'workspace-harvest-crops', role: 'MANAGER' as const },
    { workspaceId: 'workspace-bluewater-aqua', role: 'MANAGER' as const },
  ];
  if (user.email === 'onboarding@navfarm.demo') return [{ workspaceId: 'workspace-bluewater-aqua', role: 'MANAGER' as const }];
  return [{ workspaceId: 'workspace-green-poultry', role: user.email === 'viewer@navfarm.demo' ? 'VIEWER' as const : 'MANAGER' as const }];
}
function sessionPayload(record: SessionRecord): AuthSession {
  const user = state.users.find((item) => item.userId === record.userId)!;
  const companies = user.companies.map((membership) => {
    const company = companyById(membership.companyId)!;
    const rolePermissions = ROLE_PERMISSIONS[membership.role];
    return {
      companyId: membership.companyId,
      tenantId: String(company.tenant_id),
      companyName: String(company.company_display_name || company.company_name),
      companySlug: String(company.slug),
      status: company.is_active ? 'ACTIVE' as const : 'INACTIVE' as const,
      onboardingStatus: String(company.onboarding_status) as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
      role: membership.role,
      permissions: membership.role === 'CUSTOM' ? membership.permissions ?? [] : rolePermissions,
      enabledModules: company.enabled_modules as string[],
    };
  });
  const tenants = user.tenantIds.map((tenantId) => {
    const tenant = seedTenants.find((item) => item.tenant_id === tenantId)!;
    return {
      tenantId,
      tenantName: tenant.tenant_name,
      status: tenant.status as 'ACTIVE' | 'SUSPENDED',
      role: user.email === 'tenant@navfarm.demo'
        ? 'TENANT_ADMIN' as const
        : 'TENANT_MEMBER' as const,
    };
  });
  const activeCompany = companies.find((company) => company.companyId === record.activeCompanyId);
  const workspaces = workspaceAssignments(user).map((membership) => {
    const workspace = state.workspaces.find((item) => item.workspaceId === membership.workspaceId)!;
    const permissions: Permission[] = membership.role === 'MANAGER'
      ? ['workspaces.view', 'batches.view', 'batches.create', 'batches.approve', 'batches.close', 'operations.create', 'quality.view', 'quality.manage', 'traceability.view', 'resources.view', 'resources.manage', 'reports.export']
      : ['workspaces.view', 'batches.view', 'quality.view', 'traceability.view', 'resources.view'];
    return { ...workspace, role: membership.role, permissions };
  });
  return {
    user: {
      userId: user.userId, fullName: user.fullName, name: user.fullName,
      email: user.email, platformRole: user.platformRole, language: 'en',
      timezone: 'Asia/Kolkata', emailVerified: true, mfaEnabled: Boolean(user.mfaEnabled),
      userType: user.platformRole === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : tenants.some((tenant) => tenant.role === 'TENANT_ADMIN') ? 'TENANT_ADMIN' : activeCompany?.role === 'ADMIN' || activeCompany?.role === 'SUPER_ADMIN' ? 'COMPANY_ADMIN' : 'STANDARD_USER',
      companyId: record.activeCompanyId ?? '', tenantId: record.activeTenantId ?? '',
      companies: companies.map((company) => ({ company_id: company.companyId, company_name: company.companyName, is_primary: false })),
      permissions: activeCompany?.permissions ?? [],
    },
    tenants,
    companies,
    workspaces,
    activeTenantId: record.activeTenantId,
    activeCompanyId: record.activeCompanyId,
    activeWorkspaceId: record.activeWorkspaceId,
    expiresAt: record.expiresAt,
  };
}
function setSessionCookie(response: NextResponse, id: string) {
  response.cookies.set(SESSION_COOKIE, id, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', maxAge: SESSION_SECONDS,
  });
  return response;
}
function requireSession(request: Request, requestId: string) {
  const found = sessionRecord(request);
  return found ?? apiErrorResponse(401, 'Your session has expired. Sign in again.', requestId);
}
function hasMockMutationAccess(session: AuthSession, path: string) {
  if (session.user.platformRole === 'SYSTEM_ADMIN') return true;
  const company = session.companies.find((item) => item.companyId === session.activeCompanyId);
  if (/^\/(plan|tenant)/.test(path)) return session.tenants.some((tenant) => tenant.role === 'TENANT_ADMIN');
  if (/^\/(role|user|company|notification|setup)/.test(path)) {
    return Boolean(company?.permissions.some((permission) => ['company.manage', 'users.manage', 'roles.manage', 'notifications.manage'].includes(permission)));
  }
  if (/^\/demo\//.test(path)) return Boolean(company?.permissions.includes('operations.create') || company?.permissions.includes('company.manage'));
  return true;
}

export async function handleMockRequest(request: Request, path: string, requestId: string): Promise<NextResponse> {
  const method = request.method;
  const phase2Request = request.clone();
  const input = await body(request);

  if (method === 'POST' && path === '/auth/login') {
    const user = state.users.find((item) => item.email === String(input.email).toLowerCase());
    if (!user || user.password !== input.password) return apiErrorResponse(401, 'Invalid email or password.', requestId);
    if (user.mfaEnabled) {
      return json({
        user: {
          userId: user.userId, fullName: user.fullName, name: user.fullName,
          email: user.email, platformRole: user.platformRole, language: 'en',
          timezone: 'Asia/Kolkata', emailVerified: true, mfaEnabled: true,
          userType: 'STANDARD_USER', companyId: '', tenantId: '',
          companies: [], permissions: [],
        },
        tenants: [], companies: [], workspaces: [], activeTenantId: null, activeCompanyId: null, activeWorkspaceId: null,
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        mfaRequired: true, challengeId: `challenge-${user.userId}`,
      });
    }
    const tenantId = user.tenantIds.length === 1 ? user.tenantIds[0] : null;
    const eligibleCompanies = user.companies.filter((membership) => String(companyById(membership.companyId)?.tenant_id) === tenantId);
    const companyId = eligibleCompanies.length === 1 ? eligibleCompanies[0].companyId : null;
    const id = randomUUID();
    const eligibleWorkspaces = workspaceAssignments(user).filter((membership) => state.workspaces.find((workspace) => workspace.workspaceId === membership.workspaceId)?.companyId === companyId);
    const record = { userId: user.userId, activeTenantId: tenantId, activeCompanyId: companyId, activeWorkspaceId: eligibleWorkspaces.length === 1 ? eligibleWorkspaces[0].workspaceId : null, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() };
    state.sessions.set(id, record);
    return setSessionCookie(json(sessionPayload(record)), id);
  }
  if (method === 'POST' && (path === '/auth/mfa/verify' || path === '/auth/mfa/recovery')) {
    if (input.code !== '123456' && input.recoveryCode !== 'NAVFARM-RECOVERY') return apiErrorResponse(401, 'Invalid verification code.', requestId);
    const userId = String(input.challengeId || '').replace('challenge-', '');
    const user = state.users.find((item) => item.userId === userId);
    if (!user) return apiErrorResponse(401, 'MFA challenge expired.', requestId);
    const id = randomUUID();
    const companyId = user.companies[0]?.companyId ?? null;
    const eligibleWorkspaces = workspaceAssignments(user).filter((membership) => state.workspaces.find((workspace) => workspace.workspaceId === membership.workspaceId)?.companyId === companyId);
    const record = { userId, activeTenantId: user.tenantIds[0] ?? null, activeCompanyId: companyId, activeWorkspaceId: eligibleWorkspaces.length === 1 ? eligibleWorkspaces[0].workspaceId : null, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() };
    state.sessions.set(id, record);
    return setSessionCookie(json(sessionPayload(record)), id);
  }
  if (method === 'POST' && path === '/auth/logout') {
    const found = sessionRecord(request);
    if (found) state.sessions.delete(found.id);
    const response = json({ success: true });
    response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
    return response;
  }
  if (method === 'POST' && ['/auth/forgot-password', '/auth/reset-password', '/auth/accept-invitation', '/auth/verify-email', '/auth/mfa/setup'].includes(path)) {
    return json({ success: true });
  }
  if (method === 'GET' && path === '/auth/session') {
    const found = requireSession(request, requestId);
    if (found instanceof NextResponse) return found;
    return json(sessionPayload(found.record));
  }
  if (method === 'PUT' && path === '/auth/context') {
    const found = requireSession(request, requestId);
    if (found instanceof NextResponse) return found;
    const user = state.users.find((item) => item.userId === found.record.userId)!;
    const tenantId = input.tenantId === null ? null : String(input.tenantId || found.record.activeTenantId || '');
    const companyId = input.companyId === null ? null : String(input.companyId || '');
    const workspaceId = input.workspaceId === null ? null : String(input.workspaceId || '');
    if (tenantId && !user.tenantIds.includes(tenantId)) return apiErrorResponse(403, 'Tenant membership is required.', requestId);
    if (companyId && !user.companies.some((item) => item.companyId === companyId)) return apiErrorResponse(403, 'Company membership is required.', requestId);
    const workspace = workspaceId ? state.workspaces.find((item) => item.workspaceId === workspaceId) : null;
    if (workspaceId && (!workspace || workspace.companyId !== companyId || !workspaceAssignments(user).some((item) => item.workspaceId === workspaceId))) {
      return apiErrorResponse(403, 'Workspace membership is required.', requestId);
    }
    found.record.activeTenantId = tenantId || null;
    found.record.activeCompanyId = companyId || null;
    found.record.activeWorkspaceId = workspaceId || null;
    return json(sessionPayload(found.record));
  }

  if (method === 'POST' && path === '/__mock/reset') {
    if (process.env.NODE_ENV === 'production' || process.env.NAVFARM_ENABLE_MOCK_RESET !== 'true') {
      return apiErrorResponse(404, 'Not found.', requestId);
    }
    state.companies = structuredClone(seedCompanies);
    state.users = structuredClone(fixtureUsers);
    state.workspaces = structuredClone(seedWorkspaces);
    state.workspaceMembers = structuredClone(seedWorkspaceMembers);
    state.demoStates.clear();
    state.sessions.clear();
    resetPhase2Repository();
    resetPhase3Repository();
    resetOperationalRepository();
    return json({ success: true });
  }

  const found = requireSession(request, requestId);
  if (found instanceof NextResponse) return found;
  const session = sessionPayload(found.record);
  const activeCompany = session.companies.find((company) => company.companyId === session.activeCompanyId);
  const tenantAdmin = session.tenants.some(
    (tenant) => tenant.tenantId === session.activeTenantId && tenant.role === 'TENANT_ADMIN',
  );
  const workspaceCollectionMatch = path.match(/^\/tenants\/([^/]+)\/companies\/([^/]+)\/workspaces$/);
  if (workspaceCollectionMatch) {
    const [, tenantId, companyId] = workspaceCollectionMatch;
    if (tenantId !== session.activeTenantId || !session.companies.some((company) => company.companyId === companyId && company.tenantId === tenantId)) {
      return apiErrorResponse(403, 'Active tenant and company scope is required.', requestId);
    }
    if (method === 'GET') {
      const allowed = new Set(workspaceAssignments(state.users.find((user) => user.userId === session.user.userId)!).map((item) => item.workspaceId));
      return json(state.workspaces.filter((workspace) => workspace.companyId === companyId && (tenantAdmin || allowed.has(workspace.workspaceId))));
    }
    if (method === 'POST' && tenantAdmin) {
      const parsed = workspaceCreateSchema.safeParse(input);
      if (!parsed.success) return apiErrorResponse(422, 'Workspace details are invalid.', requestId, parsed.error.flatten());
      const now = new Date().toISOString();
      const created = workspaceSchema.parse({
        ...parsed.data,
        workspaceId: `workspace-${randomUUID()}`,
        tenantId,
        companyId,
        status: 'DRAFT',
        readiness: { percentage: 0, operationalReady: false, blockingRequirements: ['Configure NOB/LOB and operational parameters'] },
        createdAt: now,
        updatedAt: now,
      });
      state.workspaces.push(created);
      return json(created, 201);
    }
  }
  const workspaceItemMatch = path.match(/^\/companies\/([^/]+)\/workspaces\/([^/]+)(?:\/(readiness|members))?$/);
  if (workspaceItemMatch) {
    const [, companyId, workspaceId, child] = workspaceItemMatch;
    const workspace = state.workspaces.find((item) => item.companyId === companyId && item.workspaceId === workspaceId);
    const assigned = workspaceAssignments(state.users.find((user) => user.userId === session.user.userId)!).some((item) => item.workspaceId === workspaceId);
    if (!workspace || (!tenantAdmin && !assigned)) return apiErrorResponse(404, 'Workspace not found.', requestId);
    if (child === 'members') {
      if (method === 'GET') return json(state.workspaceMembers.filter((member) => member.workspaceId === workspaceId));
      if (method === 'POST' && tenantAdmin) {
        const parsed = workspaceMemberCreateSchema.safeParse(input);
        if (!parsed.success) return apiErrorResponse(422, 'Workspace membership is invalid.', requestId, parsed.error.flatten());
        const fixtureUser = state.users.find((user) => user.email === parsed.data.email);
        const created: WorkspaceMember = {
          membershipId: `membership-${randomUUID()}`,
          workspaceId,
          userId: fixtureUser?.userId ?? `invited-${randomUUID()}`,
          fullName: fixtureUser?.fullName ?? parsed.data.email.split('@')[0],
          email: parsed.data.email,
          role: parsed.data.role,
          status: 'ACTIVE',
        };
        state.workspaceMembers.push(created);
        return json(created, 201);
      }
      return apiErrorResponse(403, 'Tenant workspace administration is required.', requestId);
    }
    if (method === 'GET') return json(child === 'readiness' ? workspace.readiness : workspace);
    if (method === 'PATCH' && tenantAdmin) {
      const parsed = workspaceSchema.partial().omit({ workspaceId: true, tenantId: true, companyId: true, createdAt: true }).safeParse(input);
      if (!parsed.success) return apiErrorResponse(422, 'Workspace changes are invalid.', requestId, parsed.error.flatten());
      Object.assign(workspace, parsed.data, { updatedAt: new Date().toISOString() });
      return json(workspace);
    }
  }
  if (
    /^\/tenants\/[^/]+\/companies\/[^/]+\/workspaces\/[^/]+\//.test(path) &&
    !path.endsWith('/operational-bootstrap') &&
    !['GET', 'HEAD'].includes(method) &&
    !activeCompany?.permissions.includes('operations.create') &&
    !activeCompany?.permissions.includes('company.manage') &&
    !tenantAdmin
  ) {
    return apiErrorResponse(403, 'You do not have permission to change operational data.', requestId);
  }
  const operationalResponse = await handleOperationalRequest(phase2Request, path, requestId, {
    activeTenantId: session.activeTenantId,
    activeCompanyId: session.activeCompanyId,
    activeWorkspaceId: session.activeWorkspaceId,
    accessibleWorkspaceIds: session.workspaces.map((workspace) => workspace.workspaceId),
  });
  if (operationalResponse) return operationalResponse;
  const phase2Response = await handlePhase2Request(phase2Request, path, requestId, {
    userId: session.user.userId,
    fullName: session.user.fullName,
    platformRole: session.user.platformRole,
    activeTenantId: session.activeTenantId,
    activeCompanyId: session.activeCompanyId,
    tenantAdmin,
    companyManage: Boolean(
      activeCompany?.permissions.includes('company.manage') || tenantAdmin,
    ),
    grantCompany: (company: CompanySummary) => {
      if (!state.companies.some((item) => item.company_id === company.companyId)) {
        state.companies.push({
          company_id: company.companyId,
          tenant_id: company.tenantId,
          company_code: company.code,
          company_name: company.name,
          company_display_name: company.name,
          industry_type: 'Unconfigured',
          onboarding_status: 'NOT_STARTED',
          is_active: true,
          slug: company.slug,
          enabled_modules: [],
        });
      }
      const user = state.users.find((item) => item.userId === found.record.userId);
      if (user && !user.companies.some((membership) => membership.companyId === company.companyId)) {
        user.companies.push({ companyId: company.companyId, role: 'SUPER_ADMIN' });
      }
    },
  });
  if (phase2Response) return phase2Response;
  const activeMembership = session.companies.find(
    (company) => company.companyId === session.activeCompanyId,
  );
  const phase3Response = await handlePhase3Request(phase2Request, path, requestId, {
    userId: session.user.userId,
    fullName: session.user.fullName,
    platformRole: session.user.platformRole,
    activeCompanyId: session.activeCompanyId,
    companyView: Boolean(activeMembership?.permissions.includes('company.view')),
    companyManage: Boolean(activeMembership?.permissions.includes('company.manage') || tenantAdmin),
    financeView: Boolean(activeMembership?.permissions.includes('finance.view')),
    financeManage: Boolean(activeMembership?.permissions.includes('finance.manage')),
  });
  if (phase3Response) return phase3Response;
  if (!['GET', 'HEAD'].includes(method) && !hasMockMutationAccess(session, path)) {
    return apiErrorResponse(403, 'You do not have permission to perform this operation.', requestId);
  }

  if (method === 'PATCH' && path === '/users/me') {
    const user = state.users.find((item) => item.userId === found.record.userId)!;
    if (typeof input.fullName === 'string') user.fullName = input.fullName;
    return json(sessionPayload(found.record));
  }
  if (method === 'GET' && path === '/language') return json(languages);
  if (method === 'GET' && path === '/currency') return json(currencies);
  if (method === 'GET' && path === '/setup/wizard/nobs') return json(nobs);
  if (method === 'GET' && /^\/setup\/wizard\/lobs\/[^/]+$/.test(path)) return json([{ lob_id: 'lob-primary', lob_code: 'PRIMARY', lob_name: 'Primary Production', is_active: true }]);
  if (method === 'GET' && /^\/company\/tenant\/[^/]+$/.test(path)) return json(state.companies.filter((company) => company.tenant_id === path.split('/')[3]));
  if (method === 'POST' && path === '/company') {
    const id = randomUUID();
    const created = { company_id: id, tenant_id: found.record.activeTenantId || 'tenant-demo', company_code: String(input.company_code || `COMPANY_${state.companies.length + 1}`), company_name: String(input.company_name || 'New Company'), company_display_name: String(input.company_display_name || input.company_name || 'New Company'), industry_type: String(input.industry_type || 'Poultry'), onboarding_status: 'IN_PROGRESS', is_active: true, slug: String(input.company_code || id).toLowerCase().replaceAll('_', '-'), enabled_modules: ['Batches'] };
    state.companies.push(created);
    return json(created, 201);
  }
  const demoMatch = path.match(/^\/demo\/companies\/([^/]+)\/state$/);
  if (demoMatch && method === 'GET') return json({ state: state.demoStates.get(demoMatch[1]) ?? null });
  if (demoMatch && method === 'PUT') { state.demoStates.set(demoMatch[1], input.state); return json({ success: true }); }
  if (method === 'GET' && path === '/tenant') return json(seedTenants);
  if (method === 'GET' && /^\/tenant\/[^/]+$/.test(path)) return json(seedTenants.find((tenant) => tenant.tenant_id === path.split('/')[2]) ?? null);
  if (method === 'GET' && path === '/plan') return json([{ plan_id: 'PLAN_PRO', plan_name: 'Pro', is_active: true, max_companies: 10, max_users: 100 }]);
  if (method === 'GET' && path === '/audit-log') return json([]);
  if (method === 'GET' && (path === '/auth/users' || /\/users$/.test(path))) return json([]);
  if (method === 'GET' && (/^\/notification\//.test(path) || /^\/role\//.test(path) || /^\/user-company\//.test(path))) return json([]);
  if (method === 'GET' && /^\/setup\/wizard\/status\//.test(path)) {
    const onboarding = path.endsWith('company-bluewater');
    return json(Array.from({ length: 15 }, (_, index) => ({ stepOrder: index + 1, status: index < (onboarding ? 3 : 9) ? 'COMPLETED' : 'PENDING', isMandatory: index < 9 })));
  }
  if (method === 'GET' && /^\/setup\/wizard\/company-details\//.test(path)) return json({ company: state.companies[0], addresses: [], contacts: [], modules: [] });
  if (method === 'POST' && path === '/setup/wizard/upload-logo') return json({ logoUrl: '/api/v1/mock-assets/company-logo' });
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return json({ success: true });
  return apiErrorResponse(404, `No seeded mock handler for ${method} ${path}.`, requestId);
}

export const mockFixtures = { seedTenants, seedCompanies, fixtureUsers };
