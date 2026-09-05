import { ClsService } from 'nestjs-cls';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { and } from 'drizzle-orm';
import * as schema from '../core/database/schema';
import { enforceMasterRequest, MasterScope, masterScopeConditions } from './master-data-scope';

describe('master workspace scope', () => {
  const dialect = new MySqlDialect();
  const clsFor = (scope: Partial<MasterScope>) => ({ get: (key: string) => key === 'masterScope' ? scope : undefined }) as unknown as ClsService;
  it('selects only tenant templates even with a stale company query', () => {
    const query = dialect.sqlToQuery(and(...masterScopeConditions(clsFor({ kind: 'TENANT', tenantId: 'tenant', companyId: null }), schema.itemMaster, 'stale'))!);
    expect(query.sql).toContain('`company_id` is null');
    expect(query.params).toEqual(['tenant']);
  });
  it('does not union tenant templates into company rows', () => {
    const query = dialect.sqlToQuery(and(...masterScopeConditions(clsFor({ kind: 'COMPANY', tenantId: 'tenant', companyId: 'company' }), schema.itemMaster))!);
    expect(query.sql).not.toContain('is null');
    expect(query.params).toEqual(['tenant', 'company']);
  });
  it('uses company and real NOB/LOB IDs, including common company references', () => {
    const scope: MasterScope = { kind: 'OPERATIONAL', tenantId: 'tenant', companyId: 'company', nobId: 'livestock', lobId: 'piggery' };
    const query = dialect.sqlToQuery(and(...masterScopeConditions(clsFor(scope), schema.itemMaster))!);
    expect(query.params).toEqual(['tenant', 'company', 'livestock', 'piggery']);
    expect(query.sql).toContain('`lob_id` is null');
    expect(query.sql).not.toContain('item_name');
  });
  it('rejects changing the company through the request body', async () => {
    const store = new Map();
    const cls = { get: (k: string) => store.get(k), set: (k: string, v: unknown) => store.set(k, v) } as unknown as ClsService;
    await expect(enforceMasterRequest(cls, { user: { userType: 'COMPANY_ADMIN', tenantId: 'tenant' }, headers: { 'x-workspace-scope': 'COMPANY', 'x-active-company-id': 'company' }, body: { company_id: 'other' } }, 'item')).rejects.toThrow('must match');
  });
  it('rejects tenant scope for a company admin', async () => {
    await expect(enforceMasterRequest(clsFor({}), { user: { userType: 'COMPANY_ADMIN' }, headers: { 'x-workspace-scope': 'TENANT' } }, 'item')).rejects.toThrow('Tenant templates');
  });
});
