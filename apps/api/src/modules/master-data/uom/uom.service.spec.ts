import { Test, TestingModule } from '@nestjs/testing';
import { UomService } from './uom.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('UomService', () => {
  let service: UomService;
  let clsService: ClsService;
  let auditLogService: AuditLogService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();

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
      ],
    }).compile();

    service = module.get<UomService>(UomService);
    clsService = module.get<ClsService>(ClsService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

