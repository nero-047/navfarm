import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { RolesGuard } from './roles.guard';

describe('RolesGuard operational context', () => {
  const area = { area_id: 'area-1', company_id: 'company-1', nob_id: 'livestock', lob_id: 'piggery' };
  const select = jest.fn();
  const set = jest.fn();
  const rows = (value: unknown[]) => ({ from: () => ({ where: () => ({ limit: async () => value }) }) });
  let guard: RolesGuard;

  beforeEach(() => {
    select.mockReset();
    set.mockReset();
    guard = new RolesGuard(
      { getAllAndOverride: () => undefined } as unknown as Reflector,
      { get: () => ({ select }), set } as unknown as ClsService,
    );
  });

  const context = (headers: Record<string, string>, userType = 'COMPANY_ADMIN') => ({
    switchToHttp: () => ({ getRequest: () => ({ headers, user: { userType, tenantId: 'tenant-1', companyId: 'company-1' } }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

  it('publishes validated area context for downstream master services', async () => {
    select.mockReturnValueOnce(rows([area]));
    await expect(guard.canActivate(context({ 'x-active-company-id': 'company-1', 'x-active-operational-area-id': 'area-1' }))).resolves.toBe(true);
    expect(set).toHaveBeenCalledWith('activeOperationalArea', area);
  });

  it('rejects a mismatched company/area even for a company admin', async () => {
    select.mockReturnValueOnce(rows([{ ...area, company_id: 'company-2' }]));
    await expect(guard.canActivate(context({ 'x-active-company-id': 'company-1', 'x-active-operational-area-id': 'area-1' }))).rejects.toThrow('does not belong');
    expect(set).not.toHaveBeenCalled();
  });

  it('rejects a missing, deleted or inactive area', async () => {
    select.mockReturnValueOnce(rows([]));
    await expect(guard.canActivate(context({ 'x-active-company-id': 'company-1', 'x-active-operational-area-id': 'area-1' }))).rejects.toThrow('does not belong');
  });

  it('requires company context when an area is selected', async () => {
    select.mockReturnValueOnce(rows([area]));
    await expect(guard.canActivate(context({ 'x-active-operational-area-id': 'area-1' }))).rejects.toThrow('does not belong');
  });

  it('leaves requests without an area unchanged', async () => {
    await expect(guard.canActivate(context({ 'x-active-company-id': 'company-1' }))).resolves.toBe(true);
    expect(select).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
});
