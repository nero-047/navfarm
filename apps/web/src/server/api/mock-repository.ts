import { randomUUID } from 'node:crypto';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NextResponse } from 'next/server';
import type { AuthSession, CompanyRole, Permission } from '../../contracts/api';
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
  mfaEnabled?: boolean;
};
type SessionRecord = {
  userId: string;
  activeTenantId: string | null;
  activeCompanyId: string | null;
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

const fixtureUsers: FixtureUser[] = [
  { userId: 'user-system', email: 'system@navfarm.demo', fullName: 'System Administrator', password: 'Demo123!', platformRole: 'SYSTEM_ADMIN', tenantIds: [], companies: [] },
  { userId: 'user-tenant', email: 'tenant@navfarm.demo', fullName: 'Tenant Administrator', password: 'Demo123!', platformRole: null, tenantIds: ['tenant-demo'], companies: [{ companyId: 'company-green-valley', role: 'SUPER_ADMIN' }] },
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
};
declare global { var __navfarmMockState: MockState | undefined; }
const state: MockState = globalThis.__navfarmMockState ?? {
  companies: structuredClone(seedCompanies),
  demoStates: new Map(),
  sessions: new Map(),
  users: structuredClone(fixtureUsers),
};
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
      role: user.email.startsWith('tenant@') || user.email.startsWith('onboarding@')
        ? 'TENANT_ADMIN' as const
        : 'TENANT_MEMBER' as const,
    };
  });
  const activeCompany = companies.find((company) => company.companyId === record.activeCompanyId);
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
    activeTenantId: record.activeTenantId,
    activeCompanyId: record.activeCompanyId,
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
        tenants: [], companies: [], activeTenantId: null, activeCompanyId: null,
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        mfaRequired: true, challengeId: `challenge-${user.userId}`,
      });
    }
    const tenantId = user.tenantIds.length === 1 ? user.tenantIds[0] : null;
    const eligibleCompanies = user.companies.filter((membership) => String(companyById(membership.companyId)?.tenant_id) === tenantId);
    const companyId = eligibleCompanies.length === 1 ? eligibleCompanies[0].companyId : null;
    const id = randomUUID();
    const record = { userId: user.userId, activeTenantId: tenantId, activeCompanyId: companyId, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() };
    state.sessions.set(id, record);
    return setSessionCookie(json(sessionPayload(record)), id);
  }
  if (method === 'POST' && (path === '/auth/mfa/verify' || path === '/auth/mfa/recovery')) {
    if (input.code !== '123456' && input.recoveryCode !== 'NAVFARM-RECOVERY') return apiErrorResponse(401, 'Invalid verification code.', requestId);
    const userId = String(input.challengeId || '').replace('challenge-', '');
    const user = state.users.find((item) => item.userId === userId);
    if (!user) return apiErrorResponse(401, 'MFA challenge expired.', requestId);
    const id = randomUUID();
    const record = { userId, activeTenantId: user.tenantIds[0] ?? null, activeCompanyId: user.companies[0]?.companyId ?? null, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() };
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
    if (tenantId && !user.tenantIds.includes(tenantId)) return apiErrorResponse(403, 'Tenant membership is required.', requestId);
    if (companyId && !user.companies.some((item) => item.companyId === companyId)) return apiErrorResponse(403, 'Company membership is required.', requestId);
    found.record.activeTenantId = tenantId || null;
    found.record.activeCompanyId = companyId || null;
    return json(sessionPayload(found.record));
  }

  if (method === 'POST' && path === '/__mock/reset') {
    if (process.env.NODE_ENV === 'production' || process.env.NAVFARM_ENABLE_MOCK_RESET !== 'true') {
      return apiErrorResponse(404, 'Not found.', requestId);
    }
    state.companies = structuredClone(seedCompanies);
    state.users = structuredClone(fixtureUsers);
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
  if (
    path.startsWith('/companies/') &&
    !path.endsWith('/operational-bootstrap') &&
    !['GET', 'HEAD'].includes(method) &&
    !session.companies.find((company) => company.companyId === session.activeCompanyId)
      ?.permissions.includes('operations.create') &&
    !session.companies.find((company) => company.companyId === session.activeCompanyId)
      ?.permissions.includes('company.manage')
  ) {
    return apiErrorResponse(403, 'You do not have permission to change operational data.', requestId);
  }
  const operationalResponse = await handleOperationalRequest(phase2Request, path, requestId);
  if (operationalResponse) return operationalResponse;
  const phase2Response = await handlePhase2Request(phase2Request, path, requestId, {
    userId: session.user.userId,
    fullName: session.user.fullName,
    platformRole: session.user.platformRole,
    activeTenantId: session.activeTenantId,
    activeCompanyId: session.activeCompanyId,
    tenantAdmin: session.tenants.some(
      (tenant) => tenant.tenantId === session.activeTenantId && tenant.role === 'TENANT_ADMIN',
    ),
    companyManage: Boolean(
      session.companies.find((company) => company.companyId === session.activeCompanyId)
        ?.permissions.includes('company.manage'),
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
    companyManage: Boolean(activeMembership?.permissions.includes('company.manage')),
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
