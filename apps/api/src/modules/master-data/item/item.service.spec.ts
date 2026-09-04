import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { NumberSeriesService } from '../../system/number-series/number-series.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('ItemService', () => {
  let service: ItemService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();
  const mockDbDelete = jest.fn();

  // Annotated because `transaction` hands the callback this same object,
  // which makes the type circular and otherwise implicitly `any`.
  const mockDb: any = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
    transaction: jest.fn(async (cb) => cb(mockDb)),
  };

  const mockGenerateNext = jest.fn();

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockDbDelete.mockReset();
    mockDb.transaction.mockClear();
    mockGenerateNext.mockReset();
    mockGenerateNext.mockResolvedValue('ITM-0001');

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
        {
          provide: NumberSeriesService,
          useValue: {
            generateNext: mockGenerateNext,
          },
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    jest.spyOn(service as any, 'ensureCompanyItemSeries').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should auto-generate item_code from the ITEM number series and create within a transaction', async () => {
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
              limit: jest.fn().mockResolvedValue([{ item_id: 'item-1', item_code: 'ITM-0001' }]),
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
          item_name: 'Item 1',
          item_type: 'RAW_MATERIAL',
          nob_id: 'nob-1',
          category_id: 'cat-1',
          uom_primary: 'PCS',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockGenerateNext).toHaveBeenCalledWith('ITEM', 'tenant-123', 'comp-1');
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(result.item_code).toBe('ITM-0001');
    });

    it('should reject a MEDICINE item with no withdrawal_days', async () => {
      mockDbSelect
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]) }) }) })
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }) });

      await expect(
        service.create(
          {
            company_id: 'comp-1',
            item_name: 'Amoxicillin',
            item_type: 'MEDICINE',
            nob_id: 'nob-1',
            uom_primary: 'ML',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockGenerateNext).not.toHaveBeenCalled();
    });
  });

  it('does not allow the generated company-wide Item Code to be changed', async () => {
    mockDbSelect
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ item_id: 'item-1', item_code: 'ITM-0001' }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }),
        }),
      });

    await expect(service.update('item-1', { item_code: 'RAW-0001' }, 'tenant-123'))
      .rejects.toThrow(ConflictException);
  });

  it('initializes one company ITEM counter after the highest existing item code', async () => {
    (service as any).ensureCompanyItemSeries.mockRestore();
    mockDbSelect
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{
              series_name: 'Item Code', document_type: 'ITEM', prefix: 'ITM', date_format: null,
              separator: '-', seq_length: 4, reset_frequency: 'NEVER',
            }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ code: 'ITM-0002' }, { code: 'ITM-0009' }]),
        }),
      });
    const onDuplicateKeyUpdate = jest.fn().mockResolvedValue({});
    const values = jest.fn().mockReturnValue({ onDuplicateKeyUpdate });
    mockDbInsert.mockReturnValue({ values });

    await (service as any).ensureCompanyItemSeries('tenant-123', 'comp-1');

    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      company_id: 'comp-1', series_code: 'ITEM', current_seq: 9,
    }));
  });
});
