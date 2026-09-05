import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { NobLobResolutionService } from './nob-lob-resolution.service';

describe('NobLobResolutionService', () => {
  let service: NobLobResolutionService;

  const mockDbSelect = jest.fn();
  const mockDb = { select: mockDbSelect };

  const areasReturning = (rows: Array<{ nob_id: string | null; lob_id: string | null }>) => ({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(rows),
    }),
  });

  beforeEach(async () => {
    mockDbSelect.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NobLobResolutionService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
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
});
