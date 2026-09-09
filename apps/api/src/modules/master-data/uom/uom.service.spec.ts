import { Test, TestingModule } from '@nestjs/testing';
import { UomService } from './uom.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { NumberSeriesService } from '../../system/number-series/number-series.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('UomService', () => {
  let service: UomService;
  let auditLogService: AuditLogService;

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
        UomService,
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockReturnValue(mockDb),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue({}),
          },
        },
        { provide: NumberSeriesService, useValue: numberSeries },
      ],
    }).compile();

    service = module.get<UomService>(UomService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rechecks base uniqueness when an existing base changes type', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({ uom_id: 'id', tenant_id: 'tenant', company_id: null, uom_code: 'KG', uom_type: 'WEIGHT', is_base_uom: true } as any);
    mockDbSelect.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{ uom_code: 'LITER' }] }) }) });
    await expect(service.update('id', { uom_type: 'VOLUME' }, 'tenant')).rejects.toThrow('A base UOM');
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  describe('create', () => {
    it('should throw ConflictException if UOM code already exists', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ uom_code: 'KG' }]),
          }),
        }),
      });

      await expect(
        service.create(
          {
            uom_code: 'KG',
            uom_name: 'Kilogram',
            uom_type: 'WEIGHT',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if base UOM of this type already exists', async () => {
      // First select (check duplicate code) returns empty
      // Second select (check base UOM) returns existing base UOM
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ uom_code: 'KILOGRAM', is_base_uom: true }]),
            }),
          }),
        });

      await expect(
        service.create(
          {
            uom_code: 'KG',
            uom_name: 'Kilogram',
            uom_type: 'WEIGHT',
            is_base_uom: true,
          },
          'tenant-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully insert UOM and log audit trail', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ uom_code: 'KG', uom_name: 'Kilogram' }]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const result = await service.create(
        {
          uom_code: 'KG',
          uom_name: 'Kilogram',
          uom_type: 'WEIGHT',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalled();
      expect(result.uom_code).toBe('KG');
    });

    it('generates the code via a uom_type series when one is configured', async () => {
      numberSeries.resolveSeriesFor.mockResolvedValue('UOM_WEIGHT');
      numberSeries.lockSeries.mockResolvedValue({ allow_manual: false });
      numberSeries.generateNext.mockResolvedValue('WGT-001');
      mockDbSelect
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }) }) // no duplicate
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ uom_code: 'WGT-001', uom_name: 'Weight unit' }]) }) }) }); // findOne
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.create({ uom_name: 'Weight unit', uom_type: 'WEIGHT' }, 'tenant-123');

      expect(numberSeries.resolveSeriesFor).toHaveBeenCalledWith('UOM', 'WEIGHT', 'tenant-123', null);
      expect(numberSeries.generateNext).toHaveBeenCalledWith('UOM_WEIGHT', 'tenant-123', null, undefined, expect.any(Object));
      expect(result.uom_code).toBe('WGT-001');
    });

    it('rejects when neither a series nor a manual code is supplied', async () => {
      await expect(service.create({ uom_name: 'Weight unit', uom_type: 'WEIGHT' } as any, 'tenant-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if UOM not found', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveConversionFactor & convertQuantity', () => {
    it('returns 1.0 when fromUom equals toUom', async () => {
      const res = await service.convertQuantity('KG', 'KG', 10);
      expect(res.conversionFactor).toBe(1.0);
      expect(res.convertedQuantity).toBe(10);
    });

    it('resolves item-specific conversion factor', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              { conversion_factor: '50.00000000', from_uom: 'BAG', to_uom: 'KG', item_id: 'item-feed' },
            ]),
          }),
        }),
      });

      const res = await service.convertQuantity('BAG', 'KG', 3, 'item-feed');
      expect(res.conversionFactor).toBe(50);
      expect(res.convertedQuantity).toBe(150);
    });
  });
});
