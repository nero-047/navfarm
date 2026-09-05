import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { NobLobResolutionService } from './nob-lob-resolution.service';

describe('NobLobResolutionService', () => {
  let service: NobLobResolutionService;

  const mockDbSelect = jest.fn();
  const mockDb = { select: mockDbSelect };
  let activeArea: { company_id: string; nob_id: string; lob_id: string } | undefined;

  const areasReturning = (rows: Array<{ nob_id: string | null; lob_id: string | null }>) => ({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(rows),
    }),
  });

  beforeEach(async () => {
    mockDbSelect.mockReset();
    activeArea = undefined;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NobLobResolutionService,
        { provide: ClsService, useValue: { get: jest.fn((key: string) => key === 'tenantDb' ? mockDb : activeArea) } },
      ],
    }).compile();

    service = module.get<NobLobResolutionService>(NobLobResolutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('honors an explicit nob_id/lob_id without touching the database', async () => {
    const result = await service.resolve('tenant-1', 'comp-1', { nob_id: 'nob-1', lob_id: 'lob-1' });
    expect(result).toEqual({ nob_id: 'nob-1', lob_id: 'lob-1' });
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('leaves a partially-supplied DTO exactly as given, without deriving the other half', async () => {
    const result = await service.resolve('tenant-1', 'comp-1', { nob_id: 'nob-1' });
    expect(result).toEqual({ nob_id: 'nob-1', lob_id: null });
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('derives a single company-wide NOB/LOB when every active operational area agrees', async () => {
    mockDbSelect.mockReturnValue(
      areasReturning([
        { nob_id: 'nob-livestock', lob_id: 'lob-piggery' },
        { nob_id: 'nob-livestock', lob_id: 'lob-piggery' },
      ]),
    );

    const result = await service.resolve('tenant-1', 'comp-1', {});
    expect(result).toEqual({ nob_id: 'nob-livestock', lob_id: 'lob-piggery' });
  });

  it('resolves to null (not an error) when the company has no active operational areas', async () => {
    mockDbSelect.mockReturnValue(areasReturning([]));

    const result = await service.resolve('tenant-1', 'comp-1', {});
    expect(result).toEqual({ nob_id: null, lob_id: null });
  });

  it('resolves LOB to null when the company spans two LOBs, without throwing', async () => {
    mockDbSelect.mockReturnValue(
      areasReturning([
        { nob_id: 'nob-livestock', lob_id: 'lob-piggery' },
        { nob_id: 'nob-livestock', lob_id: 'lob-poultry' },
      ]),
    );

    const result = await service.resolve('tenant-1', 'comp-1', {});
    expect(result).toEqual({ nob_id: 'nob-livestock', lob_id: null });
  });

  it('resolves to null without any company in context', async () => {
    const result = await service.resolve('tenant-1', null, {});
    expect(result).toEqual({ nob_id: null, lob_id: null });
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('uses the validated active area without inferring from other company areas', async () => {
    activeArea = { company_id: 'comp-1', nob_id: 'livestock', lob_id: 'piggery' };
    expect(await service.resolve('tenant-1', 'comp-1')).toEqual({ nob_id: 'livestock', lob_id: 'piggery' });
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('fills missing context from the area when an explicit selection agrees', async () => {
    activeArea = { company_id: 'comp-1', nob_id: 'livestock', lob_id: 'piggery' };
    expect(await service.resolve('tenant-1', 'comp-1', { nob_id: 'livestock' }))
      .toEqual({ nob_id: 'livestock', lob_id: 'piggery' });
  });

  it('rejects a different LOB in an operational-area request', async () => {
    activeArea = { company_id: 'comp-1', nob_id: 'livestock', lob_id: 'piggery' };
    await expect(service.resolve('tenant-1', 'comp-1', { lob_id: 'dairy' })).rejects.toThrow('NOB/LOB must match');
  });

  it.each([null, 'comp-2'])('rejects master company %s when an area is active', async (company) => {
    activeArea = { company_id: 'comp-1', nob_id: 'livestock', lob_id: 'piggery' };
    await expect(service.resolve('tenant-1', company)).rejects.toThrow('Master company must match');
  });
});
