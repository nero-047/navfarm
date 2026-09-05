import { Test, TestingModule } from '@nestjs/testing';
import { ItemTypeService } from './item-type.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { NumberSeriesService } from '../../system/number-series/number-series.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('ItemTypeService', () => {
  let service: ItemTypeService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  };

  const numberSeries = {
    resolveSeriesFor: jest.fn(),
    generateNext: jest.fn(),
    lockSeries: jest.fn(),
  };

  const makeSelectResult = (rows: any[]) => ({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(rows),
      }),
    }),
  });

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    numberSeries.resolveSeriesFor.mockReset();
    numberSeries.generateNext.mockReset();
    numberSeries.lockSeries.mockReset();
    numberSeries.resolveSeriesFor.mockResolvedValue(null); // default: manual, as today

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemTypeService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue({}) } },
        { provide: NumberSeriesService, useValue: numberSeries },
      ],
    }).compile();

    service = module.get<ItemTypeService>(ItemTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create — manual entry (no series configured)', () => {
    it('throws ConflictException on a duplicate type code in scope', async () => {
      mockDbSelect.mockReturnValueOnce(makeSelectResult([{ type_code: 'RAW_MATERIAL' }])); // duplicate hit

      await expect(
        service.create({ type_code: 'RAW_MATERIAL', type_name: 'Raw Material' }, 'tenant-123'),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects when neither a series nor a manual type_code is supplied', async () => {
      await expect(service.create({ type_name: 'Raw Material' } as any, 'tenant-123'))
        .rejects.toThrow(BadRequestException);
    });

    it('creates using the user-supplied code and defaults code_prefix to it when not given', async () => {
      mockDbSelect
        .mockReturnValueOnce(makeSelectResult([])) // no duplicate
        .mockReturnValueOnce(makeSelectResult([{ type_code: 'RAW_MATERIAL', code_prefix: 'RAW_MATERIAL', type_name: 'Raw Material' }])); // findOne
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.create({ type_code: 'raw_material', type_name: 'Raw Material' }, 'tenant-123', { userId: 'user-1' });

      const inserted = (mockDbInsert.mock.results[0].value.values as jest.Mock).mock.calls[0][0];
      expect(inserted.type_code).toBe('RAW_MATERIAL');
      expect(inserted.code_prefix).toBe('RAW_MATERIAL');
      expect(result.type_code).toBe('RAW_MATERIAL');
    });

    it('uses the explicit code_prefix over the type_code default when supplied', async () => {
      mockDbSelect
        .mockReturnValueOnce(makeSelectResult([])) // no duplicate
        .mockReturnValueOnce(makeSelectResult([{ type_code: 'RAW_MATERIAL', code_prefix: 'RAW', type_name: 'Raw Material' }])); // findOne
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      await service.create({ type_code: 'RAW_MATERIAL', code_prefix: 'raw', type_name: 'Raw Material' }, 'tenant-123');

      const inserted = (mockDbInsert.mock.results[0].value.values as jest.Mock).mock.calls[0][0];
      expect(inserted.code_prefix).toBe('RAW');
    });
  });

  describe('create — auto-generated (a series is configured for ITEM_TYPE)', () => {
    it('generates the type_code via the resolved series', async () => {
      numberSeries.resolveSeriesFor.mockResolvedValue('ITEM_TYPE');
      numberSeries.lockSeries.mockResolvedValue({ allow_manual: false });
      numberSeries.generateNext.mockResolvedValue('ITYPE-001');
      mockDbSelect
        .mockReturnValueOnce(makeSelectResult([])) // no duplicate
        .mockReturnValueOnce(makeSelectResult([{ type_code: 'ITYPE-001', code_prefix: 'ITYPE-001', type_name: 'Raw Material' }])); // findOne
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.create({ type_name: 'Raw Material' }, 'tenant-123');

      expect(numberSeries.generateNext).toHaveBeenCalledWith('ITEM_TYPE', 'tenant-123', null);
      expect(result.type_code).toBe('ITYPE-001');
    });

    it('uses the user-supplied code without generating when the series has allow_manual set', async () => {
      numberSeries.resolveSeriesFor.mockResolvedValue('ITEM_TYPE');
      numberSeries.lockSeries.mockResolvedValue({ allow_manual: true });
      mockDbSelect
        .mockReturnValueOnce(makeSelectResult([])) // no duplicate
        .mockReturnValueOnce(makeSelectResult([{ type_code: 'CUSTOM', code_prefix: 'CUSTOM', type_name: 'Raw Material' }])); // findOne
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.create({ type_name: 'Raw Material', type_code: 'custom' }, 'tenant-123');

      expect(numberSeries.generateNext).not.toHaveBeenCalled();
      expect(result.type_code).toBe('CUSTOM');
    });
  });
});
