import { Test, TestingModule } from '@nestjs/testing';
import { MedicineService } from './medicine.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('MedicineService', () => {
  let service: MedicineService;

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
        MedicineService,
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

    service = module.get<MedicineService>(MedicineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('reads withdrawal from the scoped Item, never a legacy profile zero', async () => {
    mockDbSelect.mockReturnValueOnce({ from: () => ({ where: () => ({ limit: async () => [{ medicine_id: 'med', tenant_id: 'tenant', company_id: 'company', item_id: 'item', withdrawal_period_days: 0 }] }) }) });
    mockDbSelect.mockReturnValueOnce({ from: () => ({ where: () => ({ limit: async () => [{ withdrawal_days: null }] }) }) });
    expect((await service.findOne('med')).bc_withdrawal_days).toBeNull();
  });

  describe('create', () => {
    it('should throw NotFoundException if company does not exist', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // company not found
          }),
        }),
      });

      await expect(
        service.create(
          {
            company_id: 'non-existent-comp',
            item_id: 'item-1',
            composition: 'Amoxicillin 10%',
            dosage_guideline: '1g per kg bodyweight',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      // First select: finds company
      // Second select: does not find item
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]), // item not found
            }),
          }),
        });

      await expect(
        service.create(
          {
            company_id: 'comp-1',
            item_id: 'non-existent-item',
            composition: 'Amoxicillin 10%',
            dosage_guideline: '1g per kg bodyweight',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if medicine profile already exists for this item', async () => {
      // First select: finds company
      // Second select: finds item
      // Third select: finds duplicate medicine profile
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ item_id: 'item-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ medicine_id: 'med-1' }]),
            }),
          }),
        });

      await expect(
        service.create(
          {
            company_id: 'comp-1',
            item_id: 'item-1',
            composition: 'Amoxicillin 10%',
            dosage_guideline: '1g per kg bodyweight',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create medicine profile', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ item_id: 'item-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]), // no duplicates
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ medicine_id: 'med-1', tenant_id: 'tenant-123', company_id: 'comp-1', item_id: 'item-1', composition: 'Amoxicillin 10%' }]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      mockDbSelect.mockReturnValueOnce({ from: () => ({ where: () => ({ limit: async () => [{ withdrawal_days: null }] }) }) });

      const result = await service.create(
        {
          company_id: 'comp-1',
          item_id: 'item-1',
          composition: 'Amoxicillin 10%',
          dosage_guideline: '1g per kg bodyweight',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.composition).toBe('Amoxicillin 10%');
    });
  });
});
