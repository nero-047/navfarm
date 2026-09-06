import { ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReasonAdministrationGuard, ReasonController } from './reason.controller';
import { CreateReasonDto, QueryReasonDto } from './reason.dto';
import { DOCUMENTED_REASONS, REASON_CATEGORIES } from '../../../core/database/reason-code-seed';
import { MASTER_TABLES } from '../../../common/master-data-scope';
import { companyTemplateTables, planTemplateCopies } from '../../core/company/copy-master-templates';
import { reasonMaster } from '../../../core/database/schema';
import { MASTER_CODE_COLUMNS } from '../../system/number-series/master-code-columns';

describe('Reason Master contract', () => {
  const guard = new ReasonAdministrationGuard();
  const context = (method: string, userType: string) => ({ switchToHttp: () => ({ getRequest: () => ({ method, user: { userType } }) }) }) as ExecutionContext;
  it.each(['OPERATIONAL_ADMIN', 'STANDARD_USER', 'SYSTEM_ADMIN'])('prevents %s from changing shared reasons', (role) => {
    for (const verb of ['POST', 'PUT', 'DELETE', 'PATCH']) expect(() => guard.canActivate(context(verb, role))).toThrow('Only a Tenant Admin or Company Admin');
    expect(guard.canActivate(context('GET', role))).toBe(true);
  });
  it.each(['TENANT_ADMIN', 'COMPANY_ADMIN'])('allows approved %s maintenance and mounts the restriction on all routes', (role) => {
    for (const verb of ['POST', 'PUT', 'DELETE', 'PATCH']) expect(guard.canActivate(context(verb, role))).toBe(true);
    expect(Reflect.getMetadata(GUARDS_METADATA, ReasonController)).toContain(ReasonAdministrationGuard);
  });
  it('seeds exactly the three approved examples, not an invented list of 47', () => {
    expect(DOCUMENTED_REASONS.map((r) => r.reason_code)).toEqual(['DOA', 'RATION_PIG', 'CULLED_PROC']);
    expect(DOCUMENTED_REASONS.find((r) => r.reason_code === 'RATION_PIG')?.mandatory_weight).toBe(true);
    expect(REASON_CATEGORIES).toHaveLength(6);
  });
  it('registers independent company templates and code generation', () => {
    expect(MASTER_TABLES.reason).toBe(reasonMaster);
    expect(companyTemplateTables).toContain(reasonMaster);
    expect(MASTER_CODE_COLUMNS.REASON).toBe('reason_code');
    const original = { reason_id: 'template', company_id: null, ...DOCUMENTED_REASONS[0] };
    const [copy] = planTemplateCopies([{ table: reasonMaster, rows: [original] }], 'company');
    expect(copy.row.company_id).toBe('company');
    expect(copy.row.reason_id).not.toBe(original.reason_id);
    expect(original.company_id).toBeNull();
  });
  it('validates categories, names and canonical stage codes', async () => {
    expect(await validate(plainToInstance(CreateReasonDto, DOCUMENTED_REASONS[0]))).toHaveLength(0);
    expect((await validate(plainToInstance(CreateReasonDto, { reason_name: '   ', category: 'MADE_UP', applicable_stages: ['bad code'] }))).length).toBeGreaterThan(0);
  });
  it('parses false correctly and rejects malformed boolean filters', async () => {
    const query = plainToInstance(QueryReasonDto, { isActive: 'false' });
    expect(query.isActive).toBe(false);
    expect(await validate(query)).toHaveLength(0);
    expect((await validate(plainToInstance(QueryReasonDto, { isActive: 'wrong' }))).length).toBeGreaterThan(0);
  });
});
