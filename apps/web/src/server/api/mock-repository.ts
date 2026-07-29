import { randomUUID } from 'node:crypto';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NextResponse } from 'next/server';
import {
  authContextRequestSchema,
  authLoginRequestSchema,
  mfaCompletionRequestSchema,
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
import { apiErrorResponse } from './errors';
import { handlePhase2Request, resetPhase2Repository } from './phase2-repository';
import { handlePhase3Request, resetPhase3Repository } from './phase3-repository';
import { handleOperationalRequest, resetOperationalRepository } from './operational-repository';

type JsonRecord = Record<string, unknown>;
type ExplicitTenantMembership = {
  tenantId: string;
  role: 'TENANT_ADMIN' | 'TENANT_MEMBER';
  permissions: Permission[];
};
type ExplicitCompanyMembership = {
  companyId: string;
  role: CompanyRole;
  permissions: Permission[];
};
type ExplicitWorkspaceMembership = {
  workspaceId: string;
  role: 'MANAGER' | 'OPERATOR' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE';
  permissions: Permission[];
};
export type DemoIdentityFixture = {
  userId: string;
  email: string;
  fullName: string;
  password: string;
  platformRole: 'SYSTEM_ADMIN' | 'PLATFORM_SUPPORT' | null;
  userType: 'SYSTEM_ADMIN' | 'TENANT_ADMIN' | 'COMPANY_ADMIN' | 'STANDARD_USER';
  authenticationState: 'AUTHENTICATED' | 'MFA_REQUIRED' | 'SUSPENDED';
  mfaEnabled: boolean;
  suspended: boolean;
  tenantMemberships: ExplicitTenantMembership[];
  companies: ExplicitCompanyMembership[];
  workspaces: ExplicitWorkspaceMembership[];
  allowedCapabilities: Permission[];
  initialContext: {
    tenantId: string | null;
    companyId: string | null;
    workspaceId: string | null;
  };
  expectedLandingRoute: string;
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
  { workspaceId: 'workspace-green-inactive', tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceCode: 'GV_ARCHIVE', workspaceSlug: 'archived-operations', workspaceName: 'Archived Operations', workspaceType: 'POULTRY', status: 'INACTIVE', primaryNobId: 'nob-poultry', enabledModules: ['Batches'], readiness: { percentage: 100, operationalReady: false, blockingRequirements: ['Workspace is inactive'] }, createdAt: fixtureDate, updatedAt: fixtureDate },
];
const PLATFORM_PERMISSIONS: Permission[] = ['platform.manage', 'tenant.view', 'tenant.manage'];
const TENANT_ADMIN_PERMISSIONS: Permission[] = [
  'tenant.view', 'tenant.manage', 'company.view', 'company.manage',
  'users.view', 'users.manage', 'roles.view', 'roles.manage',
  'workspaces.view', 'workspaces.manage', 'finance.view', 'finance.manage',
  'audit.view', 'notifications.manage',
];
const COMPANY_ADMIN_PERMISSIONS: Permission[] = [
  'company.view', 'company.manage', 'users.view', 'users.manage',
  'roles.view', 'roles.manage', 'workspaces.view', 'workspaces.manage',
  'finance.view', 'finance.manage', 'audit.view', 'notifications.manage',
];
const ACCOUNTANT_PERMISSIONS: Permission[] = [
  'company.view', 'costs.view', 'finance.view', 'finance.manage', 'audit.view',
];
const AUDITOR_PERMISSIONS: Permission[] = [
  'company.view', 'costs.view', 'finance.view', 'audit.view',
];
const WORKSPACE_MANAGER_PERMISSIONS: Permission[] = [
  'workspaces.view', 'batches.view', 'batches.create', 'batches.approve',
  'batches.close', 'operations.create', 'costs.view', 'quality.view',
  'quality.manage', 'traceability.view', 'traceability.manage',
  'resources.view', 'resources.manage', 'reports.export',
];
const WORKSPACE_VIEWER_PERMISSIONS: Permission[] = [
  'workspaces.view', 'batches.view', 'quality.view', 'traceability.view',
  'resources.view',
];

const fixtureUsers: DemoIdentityFixture[] = [
  {
    userId: 'user-system', email: 'system@navfarm.demo', fullName: 'System Administrator',
    password: 'Demo123!', platformRole: 'SYSTEM_ADMIN', userType: 'SYSTEM_ADMIN',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [], companies: [], workspaces: [],
    allowedCapabilities: [...PLATFORM_PERMISSIONS],
    initialContext: { tenantId: null, companyId: null, workspaceId: null },
    expectedLandingRoute: '/admin/dashboard',
  },
  {
    userId: 'user-tenant', email: 'tenant@navfarm.demo', fullName: 'Tenant Administrator',
    password: 'Demo123!', platformRole: null, userType: 'TENANT_ADMIN',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_ADMIN', permissions: [...TENANT_ADMIN_PERMISSIONS] }],
    companies: [{ companyId: 'company-green-valley', role: 'ADMIN', permissions: [...COMPANY_ADMIN_PERMISSIONS] }],
    workspaces: [],
    allowedCapabilities: [...new Set([...TENANT_ADMIN_PERMISSIONS, ...COMPANY_ADMIN_PERMISSIONS])],
    initialContext: { tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceId: null },
    expectedLandingRoute: '/console/dashboard',
  },
  {
    userId: 'user-company-admin', email: 'companyadmin@navfarm.demo', fullName: 'Company Administrator',
    password: 'Demo123!', platformRole: null, userType: 'COMPANY_ADMIN',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: ['tenant.view'] }],
    companies: [{ companyId: 'company-green-valley', role: 'ADMIN', permissions: [...COMPANY_ADMIN_PERMISSIONS] }],
    workspaces: [],
    allowedCapabilities: [...new Set<Permission>(['tenant.view', ...COMPANY_ADMIN_PERMISSIONS])],
    initialContext: { tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceId: null },
    expectedLandingRoute: '/green-valley-poultry/overview',
  },
  {
    userId: 'user-accountant', email: 'accountant@navfarm.demo', fullName: 'Company Accountant',
    password: 'Demo123!', platformRole: null, userType: 'STANDARD_USER',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: [] }],
    companies: [{ companyId: 'company-green-valley', role: 'ACCOUNTANT', permissions: [...ACCOUNTANT_PERMISSIONS] }],
    workspaces: [],
    allowedCapabilities: [...ACCOUNTANT_PERMISSIONS],
    initialContext: { tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceId: null },
    expectedLandingRoute: '/green-valley-poultry/accounting/readiness',
  },
  {
    userId: 'user-auditor', email: 'auditor@navfarm.demo', fullName: 'Read-only Auditor',
    password: 'Demo123!', platformRole: null, userType: 'STANDARD_USER',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: [] }],
    companies: [{ companyId: 'company-green-valley', role: 'AUDITOR', permissions: [...AUDITOR_PERMISSIONS] }],
    workspaces: [],
    allowedCapabilities: [...AUDITOR_PERMISSIONS],
    initialContext: { tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceId: null },
    expectedLandingRoute: '/green-valley-poultry/overview',
  },
  {
    userId: 'user-manager', email: 'manager@navfarm.demo', fullName: 'Workspace Manager',
    password: 'Demo123!', platformRole: null, userType: 'STANDARD_USER',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: [] }],
    companies: [{ companyId: 'company-green-valley', role: 'FARM_MANAGER', permissions: ['company.view'] }],
    workspaces: [{ workspaceId: 'workspace-green-poultry', role: 'MANAGER', status: 'ACTIVE', permissions: [...WORKSPACE_MANAGER_PERMISSIONS] }],
    allowedCapabilities: [...new Set<Permission>(['company.view', ...WORKSPACE_MANAGER_PERMISSIONS])],
    initialContext: { tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceId: 'workspace-green-poultry' },
    expectedLandingRoute: '/green-valley-poultry/workspaces/poultry-operations/dashboard',
  },
  {
    userId: 'user-viewer', email: 'viewer@navfarm.demo', fullName: 'Workspace Viewer',
    password: 'Demo123!', platformRole: null, userType: 'STANDARD_USER',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: [] }],
    companies: [{ companyId: 'company-green-valley', role: 'VIEWER', permissions: ['company.view'] }],
    workspaces: [{ workspaceId: 'workspace-green-poultry', role: 'VIEWER', status: 'ACTIVE', permissions: [...WORKSPACE_VIEWER_PERMISSIONS] }],
    allowedCapabilities: [...new Set<Permission>(['company.view', ...WORKSPACE_VIEWER_PERMISSIONS])],
    initialContext: { tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceId: 'workspace-green-poultry' },
    expectedLandingRoute: '/green-valley-poultry/workspaces/poultry-operations/dashboard',
  },
  {
    userId: 'user-multi', email: 'multi@navfarm.demo', fullName: 'Multi-company User',
    password: 'Demo123!', platformRole: null, userType: 'COMPANY_ADMIN',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [
      { tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: [] },
      { tenantId: 'tenant-second', role: 'TENANT_MEMBER', permissions: [] },
    ],
    companies: [
      { companyId: 'company-green-valley', role: 'ADMIN', permissions: [...COMPANY_ADMIN_PERMISSIONS] },
      { companyId: 'company-harvest-ridge', role: 'ADMIN', permissions: [...COMPANY_ADMIN_PERMISSIONS] },
      { companyId: 'company-bluewater', role: 'FARM_MANAGER', permissions: ['company.view'] },
      { companyId: 'company-inactive', role: 'ADMIN', permissions: [...COMPANY_ADMIN_PERMISSIONS] },
    ],
    workspaces: [
      { workspaceId: 'workspace-green-poultry', role: 'MANAGER', status: 'ACTIVE', permissions: [...WORKSPACE_MANAGER_PERMISSIONS] },
      { workspaceId: 'workspace-green-feed', role: 'VIEWER', status: 'ACTIVE', permissions: [...WORKSPACE_VIEWER_PERMISSIONS] },
      { workspaceId: 'workspace-harvest-crops', role: 'MANAGER', status: 'ACTIVE', permissions: [...WORKSPACE_MANAGER_PERMISSIONS] },
      { workspaceId: 'workspace-bluewater-aqua', role: 'MANAGER', status: 'ACTIVE', permissions: [...WORKSPACE_MANAGER_PERMISSIONS] },
      { workspaceId: 'workspace-green-inactive', role: 'VIEWER', status: 'ACTIVE', permissions: [...WORKSPACE_VIEWER_PERMISSIONS] },
    ],
    allowedCapabilities: [...new Set<Permission>([
      ...COMPANY_ADMIN_PERMISSIONS, ...WORKSPACE_MANAGER_PERMISSIONS,
    ])],
    initialContext: { tenantId: null, companyId: null, workspaceId: null },
    expectedLandingRoute: '/context-selection',
  },
  {
    userId: 'user-mfa', email: 'mfa@navfarm.demo', fullName: 'MFA Administrator',
    password: 'Demo123!', platformRole: null, userType: 'COMPANY_ADMIN',
    authenticationState: 'MFA_REQUIRED', mfaEnabled: true, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: [] }],
    companies: [{ companyId: 'company-green-valley', role: 'ADMIN', permissions: [...COMPANY_ADMIN_PERMISSIONS] }],
    workspaces: [{ workspaceId: 'workspace-green-poultry', role: 'MANAGER', status: 'ACTIVE', permissions: [...WORKSPACE_MANAGER_PERMISSIONS] }],
    allowedCapabilities: [...new Set<Permission>([
      ...COMPANY_ADMIN_PERMISSIONS, ...WORKSPACE_MANAGER_PERMISSIONS,
    ])],
    initialContext: { tenantId: null, companyId: null, workspaceId: null },
    expectedLandingRoute: '/context-selection',
  },
  {
    userId: 'user-onboarding', email: 'onboarding@navfarm.demo', fullName: 'Onboarding Administrator',
    password: 'Demo123!', platformRole: null, userType: 'COMPANY_ADMIN',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-second', role: 'TENANT_MEMBER', permissions: [] }],
    companies: [{ companyId: 'company-bluewater', role: 'SUPER_ADMIN', permissions: [...COMPANY_ADMIN_PERMISSIONS] }],
    workspaces: [{ workspaceId: 'workspace-bluewater-aqua', role: 'MANAGER', status: 'ACTIVE', permissions: [...WORKSPACE_MANAGER_PERMISSIONS] }],
    allowedCapabilities: [...new Set<Permission>([
      ...COMPANY_ADMIN_PERMISSIONS, ...WORKSPACE_MANAGER_PERMISSIONS,
    ])],
    initialContext: { tenantId: 'tenant-second', companyId: 'company-bluewater', workspaceId: null },
    expectedLandingRoute: '/bluewater-aqua/setup/profile',
  },
  {
    userId: 'user-suspended', email: 'suspended@navfarm.demo', fullName: 'Suspended User',
    password: 'Demo123!', platformRole: null, userType: 'STANDARD_USER',
    authenticationState: 'SUSPENDED', mfaEnabled: false, suspended: true,
    tenantMemberships: [{ tenantId: 'tenant-suspended', role: 'TENANT_MEMBER', permissions: [] }],
    companies: [], workspaces: [], allowedCapabilities: [],
    initialContext: { tenantId: 'tenant-suspended', companyId: null, workspaceId: null },
    expectedLandingRoute: '/access-denied?reason=account_suspended',
  },
  {
    userId: 'user-no-workspace', email: 'noworkspace@navfarm.demo', fullName: 'No-workspace User',
    password: 'Demo123!', platformRole: null, userType: 'STANDARD_USER',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: [] }],
    companies: [{ companyId: 'company-green-valley', role: 'VIEWER', permissions: ['company.view'] }],
    workspaces: [], allowedCapabilities: ['company.view'],
    initialContext: { tenantId: 'tenant-demo', companyId: 'company-green-valley', workspaceId: null },
    expectedLandingRoute: '/green-valley-poultry/workspaces',
  },
  {
    userId: 'user-no-company', email: 'nocompany@navfarm.demo', fullName: 'Tenant-only User',
    password: 'Demo123!', platformRole: null, userType: 'STANDARD_USER',
    authenticationState: 'AUTHENTICATED', mfaEnabled: false, suspended: false,
    tenantMemberships: [{ tenantId: 'tenant-demo', role: 'TENANT_MEMBER', permissions: ['tenant.view'] }],
    companies: [], workspaces: [], allowedCapabilities: ['tenant.view'],
    initialContext: { tenantId: 'tenant-demo', companyId: null, workspaceId: null },
    expectedLandingRoute: '/console/dashboard',
  },
];

const seedWorkspaceMembers: WorkspaceMember[] = fixtureUsers.flatMap((user) =>
  user.workspaces.map((membership) => ({
    membershipId: `membership-${user.userId}-${membership.workspaceId}`,
    workspaceId: membership.workspaceId,
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    role: membership.role,
    status: membership.status,
  })),
);

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
  users: DemoIdentityFixture[];
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
function sessionPayload(record: SessionRecord): AuthSession {
  const user = state.users.find((item) => item.userId === record.userId)!;
  const companies = user.companies.map((membership) => {
    const company = companyById(membership.companyId)!;
    return {
      companyId: membership.companyId,
      tenantId: String(company.tenant_id),
      companyName: String(company.company_display_name || company.company_name),
      companySlug: String(company.slug),
      status: company.is_active ? 'ACTIVE' as const : 'INACTIVE' as const,
      onboardingStatus: String(company.onboarding_status) as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
      role: membership.role,
      permissions: membership.permissions,
      enabledModules: company.enabled_modules as string[],
    };
  });
  const tenants = user.tenantMemberships.map((membership) => {
    const tenant = seedTenants.find((item) => item.tenant_id === membership.tenantId)!;
    return {
      tenantId: membership.tenantId,
      tenantName: tenant.tenant_name,
      status: tenant.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
      role: membership.role,
      permissions: membership.permissions,
    };
  });
  const workspaces = user.workspaces.flatMap((membership) => {
    const workspace = state.workspaces.find((item) => item.workspaceId === membership.workspaceId);
    return workspace ? [{ ...workspace, role: membership.role, permissions: membership.permissions }] : [];
  });
  return {
    state: user.suspended ? 'SUSPENDED' : 'AUTHENTICATED',
    user: {
      userId: user.userId, fullName: user.fullName, name: user.fullName,
      email: user.email, platformRole: user.platformRole, language: 'en',
      timezone: 'Asia/Kolkata', emailVerified: true, mfaEnabled: user.mfaEnabled,
      userType: user.userType,
      companyId: record.activeCompanyId ?? '', tenantId: record.activeTenantId ?? '',
      companies: companies.map((company) => ({ company_id: company.companyId, company_name: company.companyName, is_primary: false })),
      permissions: user.platformRole ? user.allowedCapabilities : [],
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
  if (session.user.permissions.includes('platform.manage')) return true;
  const company = session.companies.find((item) => item.companyId === session.activeCompanyId);
  const tenant = session.tenants.find((item) => item.tenantId === session.activeTenantId);
  const workspace = session.workspaces.find((item) => item.workspaceId === session.activeWorkspaceId);
  if (/^\/(plan|tenant)/.test(path)) return Boolean(tenant?.permissions.includes('tenant.manage'));
  if (/^\/(role|user|company|notification|setup)/.test(path)) {
    return Boolean(company?.permissions.some((permission) => ['company.manage', 'users.manage', 'roles.manage', 'notifications.manage'].includes(permission)));
  }
  if (/^\/demo\//.test(path)) return Boolean(workspace?.permissions.includes('operations.create'));
  return true;
}

type ContextTuple = {
  tenantId: string | null;
  companyId: string | null;
  workspaceId: string | null;
};

function validateContextTuple(user: DemoIdentityFixture, tuple: ContextTuple) {
  if (user.suspended) {
    return {
      status: 403, code: 'ACCOUNT_SUSPENDED' as const,
      message: 'This account is suspended.',
    };
  }
  if (!tuple.tenantId) {
    if (tuple.companyId || tuple.workspaceId) {
      return {
        status: 409, code: 'STALE_CONTEXT' as const,
        message: 'Company or workspace context cannot exist without a tenant.',
      };
    }
    return null;
  }
  const tenantMembership = user.tenantMemberships.find(
    (membership) => membership.tenantId === tuple.tenantId,
  );
  if (!tenantMembership) {
    return {
      status: 403, code: 'TENANT_MEMBERSHIP_REQUIRED' as const,
      message: 'Tenant membership is required.',
    };
  }
  const tenant = seedTenants.find((item) => item.tenant_id === tuple.tenantId);
  if (!tenant || tenant.status === 'INACTIVE') {
    return {
      status: 403, code: 'TENANT_INACTIVE' as const,
      message: 'The selected tenant is inactive.',
    };
  }
  if (tenant.status === 'SUSPENDED') {
    return {
      status: 403, code: 'TENANT_SUSPENDED' as const,
      message: 'The selected tenant is suspended.',
    };
  }
  if (!tuple.companyId) {
    if (tuple.workspaceId) {
      return {
        status: 409, code: 'STALE_CONTEXT' as const,
        message: 'Workspace context cannot exist without a company.',
      };
    }
    return null;
  }
  const company = companyById(tuple.companyId);
  if (!company || String(company.tenant_id) !== tuple.tenantId) {
    return {
      status: 403, code: 'COMPANY_NOT_IN_TENANT' as const,
      message: 'The selected company does not belong to the active tenant.',
    };
  }
  if (!user.companies.some((membership) => membership.companyId === tuple.companyId)) {
    return {
      status: 403, code: 'COMPANY_MEMBERSHIP_REQUIRED' as const,
      message: 'Company membership is required.',
    };
  }
  if (!company.is_active) {
    return {
      status: 403, code: 'COMPANY_INACTIVE' as const,
      message: 'The selected company is inactive.',
    };
  }
  if (!tuple.workspaceId) return null;
  const workspace = state.workspaces.find((item) => item.workspaceId === tuple.workspaceId);
  if (
    !workspace ||
    workspace.tenantId !== tuple.tenantId ||
    workspace.companyId !== tuple.companyId
  ) {
    return {
      status: 403, code: 'WORKSPACE_NOT_IN_COMPANY' as const,
      message: 'The selected workspace does not belong to the active company.',
    };
  }
  const workspaceMembership = user.workspaces.find(
    (membership) => membership.workspaceId === tuple.workspaceId,
  );
  if (!workspaceMembership || workspaceMembership.status !== 'ACTIVE') {
    return {
      status: 403, code: 'WORKSPACE_MEMBERSHIP_REQUIRED' as const,
      message: 'Active workspace membership is required.',
    };
  }
  if (workspace.status !== 'ACTIVE') {
    return {
      status: 403, code: 'WORKSPACE_INACTIVE' as const,
      message: 'The selected workspace is inactive or not operationally active.',
    };
  }
  return null;
}

export async function handleMockRequest(request: Request, path: string, requestId: string): Promise<NextResponse> {
  const method = request.method;
  const phase2Request = request.clone();
  const input = await body(request);

  if (method === 'POST' && path === '/auth/login') {
    const parsed = authLoginRequestSchema.safeParse(input);
    if (!parsed.success) {
      return apiErrorResponse(422, 'Login details are invalid.', requestId, parsed.error.flatten());
    }
    const user = state.users.find((item) => item.email === parsed.data.email.toLowerCase());
    if (!user || user.password !== parsed.data.password) {
      return apiErrorResponse(401, 'Invalid email or password.', requestId);
    }
    if (user.authenticationState === 'MFA_REQUIRED') {
      return json({
        state: 'MFA_PENDING',
        challengeId: `challenge-${user.userId}`,
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        user: {
          userId: user.userId, fullName: user.fullName, name: user.fullName,
          email: user.email, platformRole: user.platformRole, language: 'en',
          timezone: 'Asia/Kolkata', emailVerified: true, mfaEnabled: true,
          userType: user.userType, companyId: '', tenantId: '',
          companies: [], permissions: [],
        },
      });
    }
    const id = randomUUID();
    const record = {
      userId: user.userId,
      activeTenantId: user.initialContext.tenantId,
      activeCompanyId: user.initialContext.companyId,
      activeWorkspaceId: user.initialContext.workspaceId,
      expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(),
    };
    state.sessions.set(id, record);
    return setSessionCookie(json(sessionPayload(record)), id);
  }
  if (method === 'POST' && (path === '/auth/mfa/verify' || path === '/auth/mfa/recovery')) {
    const parsed = mfaCompletionRequestSchema.safeParse(input);
    if (!parsed.success) {
      return apiErrorResponse(422, 'MFA completion details are invalid.', requestId, parsed.error.flatten());
    }
    if (parsed.data.code !== '123456' && parsed.data.recoveryCode !== 'NAVFARM-RECOVERY') {
      return apiErrorResponse(401, 'Invalid verification code.', requestId);
    }
    const userId = parsed.data.challengeId.replace('challenge-', '');
    const user = state.users.find((item) => item.userId === userId);
    if (!user || user.authenticationState !== 'MFA_REQUIRED') {
      return apiErrorResponse(401, 'MFA challenge expired.', requestId);
    }
    const id = randomUUID();
    const record = {
      userId,
      activeTenantId: user.initialContext.tenantId,
      activeCompanyId: user.initialContext.companyId,
      activeWorkspaceId: user.initialContext.workspaceId,
      expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(),
    };
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
    const user = state.users.find((item) => item.userId === found.record.userId)!;
    if (!user.suspended) {
      const failure = validateContextTuple(user, {
        tenantId: found.record.activeTenantId,
        companyId: found.record.activeCompanyId,
        workspaceId: found.record.activeWorkspaceId,
      });
      if (failure) {
        state.sessions.delete(found.id);
        return apiErrorResponse(
          failure.status, failure.message, requestId, undefined, failure.code,
        );
      }
    }
    return json(sessionPayload(found.record));
  }
  if (method === 'PUT' && path === '/auth/context') {
    const found = requireSession(request, requestId);
    if (found instanceof NextResponse) return found;
    const user = state.users.find((item) => item.userId === found.record.userId)!;
    const parsed = authContextRequestSchema.safeParse(input);
    if (!parsed.success) {
      return apiErrorResponse(422, 'Context tuple is invalid.', requestId, parsed.error.flatten());
    }
    const failure = validateContextTuple(user, parsed.data);
    if (failure) {
      return apiErrorResponse(
        failure.status, failure.message, requestId, undefined, failure.code,
      );
    }
    found.record.activeTenantId = parsed.data.tenantId;
    found.record.activeCompanyId = parsed.data.companyId;
    found.record.activeWorkspaceId = parsed.data.workspaceId;
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
  if (session.state === 'SUSPENDED') {
    return apiErrorResponse(
      403,
      'This account is suspended and cannot access protected application data.',
      requestId,
      undefined,
      'ACCOUNT_SUSPENDED',
    );
  }
  const activeCompany = session.companies.find((company) => company.companyId === session.activeCompanyId);
  const tenantAdmin = session.tenants.some(
    (tenant) =>
      tenant.tenantId === session.activeTenantId &&
      tenant.permissions.includes('tenant.manage'),
  );
  const workspaceAdmin = Boolean(
    activeCompany?.permissions.includes('workspaces.manage') ||
    session.tenants.find((tenant) => tenant.tenantId === session.activeTenantId)
      ?.permissions.includes('workspaces.manage'),
  );
  const workspaceCollectionMatch = path.match(/^\/tenants\/([^/]+)\/companies\/([^/]+)\/workspaces$/);
  if (workspaceCollectionMatch) {
    const [, tenantId, companyId] = workspaceCollectionMatch;
    if (tenantId !== session.activeTenantId || !session.companies.some((company) => company.companyId === companyId && company.tenantId === tenantId)) {
      return apiErrorResponse(403, 'Active tenant and company scope is required.', requestId);
    }
    if (method === 'GET') {
      const allowed = new Set(
        state.users.find((user) => user.userId === session.user.userId)!.workspaces
          .filter((membership) => membership.status === 'ACTIVE')
          .map((membership) => membership.workspaceId),
      );
      return json(state.workspaces.filter((workspace) => workspace.companyId === companyId && (workspaceAdmin || allowed.has(workspace.workspaceId))));
    }
    if (method === 'POST' && workspaceAdmin) {
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
    const assigned = state.users.find((user) => user.userId === session.user.userId)!.workspaces
      .some((item) => item.workspaceId === workspaceId && item.status === 'ACTIVE');
    if (!workspace || (!workspaceAdmin && !assigned)) return apiErrorResponse(404, 'Workspace not found.', requestId);
    if (child === 'members') {
      if (method === 'GET') return json(state.workspaceMembers.filter((member) => member.workspaceId === workspaceId));
      if (method === 'POST' && workspaceAdmin) {
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
    if (method === 'PATCH' && workspaceAdmin) {
      const parsed = workspaceSchema.partial().omit({ workspaceId: true, tenantId: true, companyId: true, createdAt: true }).safeParse(input);
      if (!parsed.success) return apiErrorResponse(422, 'Workspace changes are invalid.', requestId, parsed.error.flatten());
      Object.assign(workspace, parsed.data, { updatedAt: new Date().toISOString() });
      return json(workspace);
    }
  }
  const activeWorkspace = session.workspaces.find(
    (workspace) => workspace.workspaceId === session.activeWorkspaceId,
  );
  const operationalResponse = await handleOperationalRequest(phase2Request, path, requestId, {
    activeTenantId: session.activeTenantId,
    activeCompanyId: session.activeCompanyId,
    activeWorkspaceId: session.activeWorkspaceId,
    accessibleWorkspaceIds: session.workspaces
      .filter((workspace) => workspace.status === 'ACTIVE')
      .map((workspace) => workspace.workspaceId),
    workspacePermissions: activeWorkspace?.permissions ?? [],
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
        user.companies.push({
          companyId: company.companyId,
          role: 'SUPER_ADMIN',
          permissions: [...COMPANY_ADMIN_PERMISSIONS],
        });
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
