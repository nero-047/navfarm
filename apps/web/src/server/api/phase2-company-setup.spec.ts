/** @jest-environment node */
import {
  handlePhase2Request,
  resetPhase2Repository,
  type Phase2Actor,
} from './phase2-repository';

const actor: Phase2Actor = {
  userId: 'user-tenant', fullName: 'Tenant Administrator', platformRole: null,
  activeTenantId: 'tenant-demo', activeCompanyId: null,
  tenantAdmin: true, companyManage: true,
};

async function call(activeActor: Phase2Actor, method: string, path: string, input?: unknown) {
  const response = await handlePhase2Request(
    new Request(`http://localhost/api/v1${path}`, {
      method,
      headers: input ? { 'content-type': 'application/json' } : undefined,
      body: input ? JSON.stringify(input) : undefined,
    }),
    path,
    'phase2-setup-test',
    activeActor,
  );
  if (!response) throw new Error(`No handler for ${method} ${path}`);
  return { response, payload: await response.json() };
}

describe('Phase 2 company creation and setup', () => {
  beforeEach(() => resetPhase2Repository());

  it('creates a draft company and restores saved setup progress', async () => {
    const created = await call(actor, 'POST', '/tenants/tenant-demo/companies', {
      code: 'RESTORE_TEST', name: 'Restore Test Farm', type: 'PRIVATE_LIMITED',
    });
    expect(created.response.status).toBe(201);
    expect(created.payload.status).toBe('DRAFT');
    const companyId = created.payload.companyId;
    const setupActor = { ...actor, activeCompanyId: companyId };
    await call(setupActor, 'PATCH', `/companies/${companyId}/setup/profile`, {
      companyId, companyName: 'Restore Test Farm', displayName: 'Restore Farm',
      companyType: 'PRIVATE_LIMITED', registrationNumber: 'REG-001',
      website: 'https://restore.demo', brandColor: '#101B52',
    });
    const restored = await call(setupActor, 'GET', `/companies/${companyId}/setup/status`);
    expect(restored.payload.steps.find((step: { id: string }) => step.id === 'profile').status).toBe('COMPLETED');
    expect(restored.payload.setupPercentage).toBeGreaterThan(0);
  });

  it('validates mandatory fields and invalid fiscal configuration', async () => {
    const invalidProfile = await call(
      { ...actor, activeCompanyId: 'company-bluewater', activeTenantId: 'tenant-second' },
      'PATCH',
      '/companies/company-bluewater/setup/profile',
      { companyId: 'company-bluewater', companyName: '', displayName: '', companyType: 'PRIVATE_LIMITED', registrationNumber: '', website: '', brandColor: 'navy' },
    );
    expect(invalidProfile.response.status).toBe(422);
    const invalidFiscal = await call(
      { ...actor, activeCompanyId: 'company-bluewater', activeTenantId: 'tenant-second' },
      'PATCH',
      '/companies/company-bluewater/setup/fiscal',
      { fiscalStartMonth: 4, fiscalStartDay: 31, fiscalYearFormat: 'YYYY-YY', accountingStandard: 'IND_AS', inventoryValuation: 'STANDARD', periodType: 'MONTHLY' },
    );
    expect(invalidFiscal.response.status).toBe(422);
  });

  it('separates workspace readiness from operations readiness and completes setup', async () => {
    const created = await call(actor, 'POST', '/tenants/tenant-demo/companies', {
      code: 'READY_TEST', name: 'Ready Test Farm', type: 'PRIVATE_LIMITED',
    });
    const companyId = created.payload.companyId;
    const setupActor = { ...actor, activeCompanyId: companyId };
    const root = `/companies/${companyId}/setup`;
    await call(setupActor, 'PATCH', `${root}/profile`, { companyId, companyName: 'Ready Test Farm', displayName: 'Ready Farm', companyType: 'PRIVATE_LIMITED', registrationNumber: 'REG-2', website: '', brandColor: '#101B52' });
    await call(setupActor, 'POST', `${root}/addresses`, { addressType: 'REGISTERED', label: 'Registered office', line1: '1 Farm Road', line2: '', city: 'Pune', state: 'Maharashtra', country: 'India', postalCode: '411001', latitude: null, longitude: null, isPrimary: true });
    await call(setupActor, 'POST', `${root}/contacts`, { contactType: 'OWNER', fullName: 'Farm Owner', email: 'owner@ready.demo', phone: '+919876543210', receivesAlerts: true, receivesReports: true, isPrimary: true });
    await call(setupActor, 'PATCH', `${root}/localization`, { defaultLanguage: 'en', enabledLanguages: ['en'], baseCurrency: 'INR', reportingCurrencies: [], timezone: 'Asia/Kolkata', country: 'India' });
    await call(setupActor, 'PATCH', `${root}/fiscal`, { fiscalStartMonth: 4, fiscalStartDay: 1, fiscalYearFormat: 'YYYY-YY', accountingStandard: 'IND_AS', inventoryValuation: 'STANDARD', periodType: 'MONTHLY' });
    await call(setupActor, 'PATCH', `${root}/modules`, { enabledModules: ['Batches', 'Inventory', 'QC'] });
    await call(setupActor, 'PATCH', `${root}/administrator`, { userId: 'user-tenant', fullName: 'Tenant Administrator', email: 'tenant@navfarm.demo', language: 'en', timezone: 'Asia/Kolkata', mfaRequired: true });
    const workspace = await call(setupActor, 'GET', `${root}/status`);
    expect(workspace.payload.workspaceReady).toBe(true);
    expect(workspace.payload.operationsReady).toBe(false);
    const premature = await call(setupActor, 'POST', `${root}/complete`);
    expect(premature.response.status).toBe(409);
    await call(setupActor, 'PATCH', `${root}/chart-of-accounts`, { accountingStandard: 'IND_AS', confirmed: true, glMappingsReady: true, accounts: [{ accountCode: '110100', accountName: 'Inventory', accountType: 'ASSET' }] });
    await call(setupActor, 'PATCH', `${root}/business-structure`, { configured: true, nobs: [{ nobCode: 'POULTRY', nobName: 'Poultry', lobs: [{ lobCode: 'REARING', lobName: 'Rearing', costingMethod: 'STANDARD', qcRequired: true, qrRequired: true }] }] });
    await call(setupActor, 'PATCH', `${root}/essential-masters`, { uomReady: true, itemsReady: true, breedsReady: true, locationsReady: true, resourcesReady: true });
    const legacySummaryDoesNotUnlock = await call(setupActor, 'POST', `${root}/complete`);
    expect(legacySummaryDoesNotUnlock.response.status).toBe(409);
    expect(legacySummaryDoesNotUnlock.payload.error.message).toContain('operations blockers');
  });

  it('denies setup editing without tenant or company administration permission', async () => {
    const denied = await call(
      { ...actor, tenantAdmin: false, companyManage: false, activeCompanyId: 'company-green-valley' },
      'PATCH',
      '/companies/company-green-valley/setup/modules',
      { enabledModules: ['Batches'] },
    );
    expect(denied.response.status).toBe(403);
  });
});
