/** @jest-environment node */
import {
  handlePhase3Request, resetPhase3Repository, type Phase3Actor,
} from './phase3-repository';
import { masterResourceSchema } from '../../contracts/phase3';

const administrator: Phase3Actor = {
  userId: 'user-tenant', fullName: 'Tenant Administrator', platformRole: null,
  activeCompanyId: 'company-green-valley', companyView: true, companyManage: true,
  financeView: true, financeManage: true,
};
const system = { ...administrator, platformRole: 'SYSTEM_ADMIN' };

async function call(method: string, path: string, input?: unknown, actor = administrator) {
  const response = await handlePhase3Request(
    new Request(`http://localhost/api/v1${path}`, {
      method,
      headers: input ? { 'content-type': 'application/json' } : undefined,
      body: input ? JSON.stringify(input) : undefined,
    }),
    path,
    'phase3-test',
    actor,
  );
  if (!response) throw new Error(`No handler for ${method} ${path}`);
  return { response, payload: await response.json() };
}

describe('Phase 3 platform and company configuration', () => {
  beforeEach(() => resetPhase3Repository());

  it('separates platform NOB and LOB templates and restricts platform access', async () => {
    const nobs = await call('GET', '/platform/masters/nobs', undefined, system);
    const lobs = await call('GET', '/platform/masters/lobs', undefined, system);
    expect(nobs.payload.map((item: { code: string }) => item.code)).toEqual(
      expect.arrayContaining(['POULTRY', 'LIVESTOCK', 'AGRI', 'AQUA', 'INSECT', 'PRODUCTION']),
    );
    expect(lobs.payload[0]).toHaveProperty('nobTemplateId');
    expect(lobs.payload[0]).not.toHaveProperty('nobTemplateId', lobs.payload[0].lobTemplateId);
    expect((await call('GET', '/platform/masters/nobs')).response.status).toBe(403);
  });

  it('enables a valid LOB and rejects a LOB under the wrong NOB', async () => {
    const created = await call('POST', '/companies/company-green-valley/lobs', {
      lobTemplateId: 'lob-rearing',
      companyNobId: 'company-nob-poultry',
      costingMethod: 'STANDARD',
    });
    expect(created.response.status).toBe(201);
    expect(created.payload.lobTemplateId).toBe('lob-rearing');
    const invalid = await call('POST', '/companies/company-green-valley/lobs', {
      lobTemplateId: 'lob-piggery',
      companyNobId: 'company-nob-poultry',
      costingMethod: 'BIO_ASSET',
    });
    expect(invalid.response.status).toBe(422);
  });

  it.each(masterResourceSchema.options)('lists, reads and updates the %s lifecycle', async (resource) => {
    const list = await call('GET', `/companies/company-green-valley/masters/${resource}`);
    expect(list.response.status).toBe(200);
    expect(list.payload.resource).toBe(resource);
    expect(list.payload.records.length).toBeGreaterThan(0);
    const original = list.payload.records[0];
    const detail = await call('GET', `/companies/company-green-valley/masters/${resource}/${original.id}`);
    expect(detail.payload.id).toBe(original.id);
    const updated = await call('PATCH', `/companies/company-green-valley/masters/${resource}/${original.id}`, {
      name: `${original.name} updated`,
    });
    expect(updated.response.status).toBe(200);
    expect(updated.payload.name).toContain('updated');
    const activated = await call('POST', `/companies/company-green-valley/masters/${resource}/${original.id}/activate`);
    expect(activated.payload.status).toBe('ACTIVE');
  });

  it('rejects duplicate codes and referenced-record deactivation', async () => {
    const duplicate = await call('POST', '/companies/company-green-valley/masters/uoms', {
      code: 'KG', name: 'Duplicate kilogram', symbol: 'kg', decimalPlaces: 4,
    });
    expect(duplicate.response.status).toBe(409);
    const referenced = await call('POST', '/companies/company-green-valley/masters/uoms/uom-kg/deactivate');
    expect(referenced.response.status).toBe(409);
    expect(referenced.payload.error.code).toBe('resource_in_use');
    expect(referenced.payload.error.details.references[0].resource).toBe('items');
  });

  it('validates UOM conversion pairs and location hierarchy cycles', async () => {
    const conversion = await call('POST', '/companies/company-green-valley/masters/uom-conversions', {
      code: 'KG_TO_KG', name: 'Invalid conversion', fromUomId: 'uom-kg',
      toUomId: 'uom-kg', itemId: null, factor: '1.00000000', effectiveFrom: '2026-07-24',
    });
    expect(conversion.response.status).toBe(422);
    const cycle = await call('PATCH', '/companies/company-green-valley/masters/locations/location-farm', {
      parentLocationId: 'location-shed',
    });
    expect(cycle.response.status).toBe(422);
  });

  it('rejects duplicate accounts, account cycles and conflicting GL mappings', async () => {
    const duplicate = await call('POST', '/companies/company-green-valley/accounting/accounts', {
      code: '1100', name: 'Duplicate inventory', accountType: 'ASSET',
      category: 'CURRENT_ASSET', normalBalance: 'DEBIT', parentAccountId: null,
      posting: true, currency: 'INR',
    });
    expect(duplicate.response.status).toBe(409);
    await call('PATCH', '/companies/company-green-valley/accounting/accounts/account-wip', {
      parentAccountId: 'account-inventory',
    });
    const cycle = await call('PATCH', '/companies/company-green-valley/accounting/accounts/account-inventory', {
      parentAccountId: 'account-wip',
    });
    expect(cycle.response.status).toBe(422);
    const conflict = await call('POST', '/companies/company-green-valley/accounting/gl-mappings', {
      eventType: 'CONSUMPTION_OUT', companyNobId: 'company-nob-poultry',
      companyLobId: 'company-lob-broiler', inventoryAccountId: 'account-inventory',
      consumptionAccountId: 'account-consumption', outputAccountId: null,
      varianceAccountId: null, wastageMortalityAccountId: null,
      debitPreview: 'Consumption', creditPreview: 'Inventory',
    });
    expect(conflict.response.status).toBe(409);
  });

  it('validates costing, import preview/confirmation, export and readiness recalculation', async () => {
    const incomplete = await call('PATCH', '/companies/company-green-valley/accounting/costing', {
      method: 'STANDARD', standardCostReady: false,
    });
    expect(incomplete.response.status).toBe(409);
    const preview = await call('POST', '/companies/company-green-valley/masters/items/import/validate', { scenario: 'VALID' });
    expect(preview.payload).toMatchObject({ validRows: 3, invalidRows: 0, status: 'VALIDATED' });
    const confirmed = await call('POST', '/companies/company-green-valley/masters/items/import/confirm', { importId: preview.payload.importId });
    expect(confirmed.payload.status).toBe('CONFIRMED');
    const exported = await call('GET', '/companies/company-green-valley/masters/items/export');
    expect(exported.payload.filename).toMatch(/company-green-valley-items-2026-07-24\.csv/);
    const ready = await call('GET', '/companies/company-green-valley/accounting/readiness');
    expect(ready.payload.operationsReady).toBe(false);
    expect(ready.payload.blockingRequirements.map((item: { code: string }) => item.code)).toContain('costing');
  });

  it('enforces manager, accountant and auditor-style restrictions', async () => {
    const accountant = { ...administrator, companyManage: false, companyView: true };
    const auditor = { ...accountant, financeManage: false };
    expect((await call('GET', '/companies/company-green-valley/accounting/accounts', undefined, auditor)).response.status).toBe(200);
    expect((await call('POST', '/companies/company-green-valley/accounting/accounts', {
      code: '9999', name: 'Denied', accountType: 'EXPENSE', category: 'OTHER',
      normalBalance: 'DEBIT', parentAccountId: null, posting: true, currency: 'INR',
    }, auditor)).response.status).toBe(403);
    expect((await call('GET', '/companies/company-green-valley/masters/items', undefined, auditor)).response.status).toBe(200);
  });
});
