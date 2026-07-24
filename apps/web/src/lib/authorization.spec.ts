import type { AuthSession, CompanyRole } from '../contracts/api';
import {
  can, destinationForSession, filterNavigation, ROLE_PERMISSIONS,
} from './authorization';

function session(options: {
  role?: CompanyRole;
  companies?: number;
  activeCompany?: boolean;
  tenantStatus?: 'ACTIVE' | 'SUSPENDED';
  onboarding?: 'IN_PROGRESS' | 'COMPLETED';
  platform?: boolean;
} = {}): AuthSession {
  const count = options.companies ?? 1;
  const role = options.role ?? 'FARM_MANAGER';
  const companies = Array.from({ length: count }, (_, index) => ({
    companyId: `company-${index + 1}`,
    tenantId: 'tenant-1',
    companyName: `Company ${index + 1}`,
    companySlug: `company-${index + 1}`,
    status: 'ACTIVE' as const,
    onboardingStatus: options.onboarding ?? 'COMPLETED' as const,
    role,
    permissions: ROLE_PERMISSIONS[role],
    enabledModules: ['Batches', 'QC'],
  }));
  return {
    user: {
      userId: 'user-1', fullName: 'Test User', email: 'test@example.com',
      platformRole: options.platform ? 'SYSTEM_ADMIN' : null, language: 'en',
      timezone: 'UTC', emailVerified: true, mfaEnabled: false,
      userType: options.platform ? 'SYSTEM_ADMIN' : 'STANDARD_USER',
      companyId: options.activeCompany === false ? '' : companies[0]?.companyId ?? '',
      tenantId: 'tenant-1', companies: [], permissions: [],
    },
    tenants: [{ tenantId: 'tenant-1', tenantName: 'Tenant', status: options.tenantStatus ?? 'ACTIVE', role: 'TENANT_MEMBER' }],
    companies,
    activeTenantId: 'tenant-1',
    activeCompanyId: options.activeCompany === false ? null : companies[0]?.companyId ?? null,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe('authorization and context routing', () => {
  it('denies finance to a farm manager', () => {
    expect(can(session(), 'finance.view')).toBe(false);
  });
  it('automatically enters the sole active company', () => {
    expect(destinationForSession(session())).toBe('/company-1/dashboard');
  });
  it('requires selection for multiple companies without an active selection', () => {
    expect(destinationForSession(session({ companies: 2, activeCompany: false }))).toBe('/context-selection');
  });
  it('blocks suspended tenants', () => {
    expect(destinationForSession(session({ tenantStatus: 'SUSPENDED' }))).toContain('suspended-tenant');
  });
  it('continues incomplete onboarding', () => {
    expect(destinationForSession(session({ onboarding: 'IN_PROGRESS' }))).toBe('/onboarding');
  });
  it('filters navigation by permission and enabled module', () => {
    const visible = filterNavigation([
      { href: '/batches', permission: 'batches.view' as const, module: 'Batches' },
      { href: '/finance', permission: 'finance.view' as const },
      { href: '/qr', permission: 'traceability.view' as const, module: 'QR' },
    ], session());
    expect(visible.map((item) => item.href)).toEqual(['/batches']);
  });
});
