import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('ItemService', () => {
  let service: ItemService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();
  const mockDbDelete = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
    transaction: jest.fn(async (cb: any): Promise<any> => cb(mockDb)),
  };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockDbDelete.mockReset();
    mockDb.transaction.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
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

    service = module.get<ItemService>(ItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if item code already exists in this scope', async () => {
      // First select: check company exists (mock returns [{ company_id: 'comp-1' }])
      // Second select: check category exists (mock returns [{ category_id: 'cat-1' }])
      // Third select: check duplicate code (mock returns duplicate chick item)
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
              limit: jest.fn().mockResolvedValue([{ category_id: 'cat-1', category_name: 'Chicks' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ item_code: 'ITEM-001' }]),
            }),
          }),
        });

      await expect(
        service.create(
          {
            company_id: 'comp-1',
            item_code: 'ITEM-001',
            item_name: 'Item 1',
            item_type: 'RAW_MATERIAL',
            nob_id: 'nob-1',
            category_id: 'cat-1',
            uom_primary: 'PCS',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create item within a transaction', async () => {
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
              limit: jest.fn().mockResolvedValue([{ category_id: 'cat-1', category_name: 'Chicks' }]),
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
              limit: jest.fn().mockResolvedValue([{ item_id: 'item-1', item_code: 'ITEM-001' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Fetch attributes in findOne
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const result = await service.create(
        {
          company_id: 'comp-1',
          item_code: 'ITEM-001',
          item_name: 'Item 1',
          item_type: 'RAW_MATERIAL',
          nob_id: 'nob-1',
          category_id: 'cat-1',
          uom_primary: 'PCS',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(result.item_code).toBe('ITEM-001');
    });

    it('should reject a MEDICINE item with no withdrawal_days', async () => {
      mockDbSelect
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]) }) }) })
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }) });

      await expect(
        service.create(
          {
            company_id: 'comp-1',
            item_code: 'MED-001',
            item_name: 'Amoxicillin',
            item_type: 'MEDICINE',
            nob_id: 'nob-1',
            uom_primary: 'ML',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
