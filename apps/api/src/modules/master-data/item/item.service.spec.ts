import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { NumberSeriesService } from '../../system/number-series/number-series.service';
import { NobLobResolutionService } from '../../core/operational-area/nob-lob-resolution.service';
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

  const nobLobResolution = {
    resolve: jest.fn(async (_tenantId: string, _companyId: any, explicit: any) => ({
      nob_id: explicit?.nob_id ?? null,
      lob_id: explicit?.lob_id ?? null,
    })),
  };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockDbDelete.mockReset();
    mockDb.transaction.mockClear();
    mockGenerateNext.mockReset();
    mockGenerateNext.mockResolvedValue('ITM-0001');
    nobLobResolution.resolve.mockReset();
    nobLobResolution.resolve.mockImplementation(async (_tenantId: string, _companyId: any, explicit: any) => ({
      nob_id: explicit?.nob_id ?? null,
      lob_id: explicit?.lob_id ?? null,
    }));

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
        { provide: NobLobResolutionService, useValue: nobLobResolution },
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

    // D1: the console no longer asks for NOB/LOB on create — the server derives
    // them from the company's operational areas via NobLobResolutionService.
    describe('NOB/LOB derivation (D1)', () => {
      it('stores the single NOB/LOB the company resolves to when the payload omits both', async () => {
        nobLobResolution.resolve.mockResolvedValue({ nob_id: 'nob-livestock', lob_id: 'lob-piggery' });
        mockDbSelect
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]) }) }) })
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ item_id: 'item-1', item_code: 'ITM-0001' }]) }) }) })
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ leftJoin: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) }) });

        let insertedValues: any;
        mockDbInsert.mockReturnValue({
          values: jest.fn().mockImplementation((v) => { insertedValues = v; return Promise.resolve({}); }),
        });

        await service.create(
          { company_id: 'comp-1', item_name: 'Starter Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' } as any,
          'tenant-123',
        );

        expect(nobLobResolution.resolve).toHaveBeenCalledWith('tenant-123', 'comp-1', { nob_id: undefined, lob_id: undefined });
        expect(insertedValues.nob_id).toBe('nob-livestock');
        expect(insertedValues.lob_id).toBe('lob-piggery');
      });

      it('stores null and still succeeds when the company spans two LOBs', async () => {
        nobLobResolution.resolve.mockResolvedValue({ nob_id: 'nob-livestock', lob_id: null });
        mockDbSelect
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]) }) }) })
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ item_id: 'item-1', item_code: 'ITM-0001' }]) }) }) })
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ leftJoin: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) }) });

        let insertedValues: any;
        mockDbInsert.mockReturnValue({
          values: jest.fn().mockImplementation((v) => { insertedValues = v; return Promise.resolve({}); }),
        });

        const result = await service.create(
          { company_id: 'comp-1', item_name: 'Starter Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' } as any,
          'tenant-123',
        );

        expect(insertedValues.nob_id).toBe('nob-livestock');
        expect(insertedValues.lob_id).toBeNull();
        expect(result.item_code).toBe('ITM-0001');
      });

      it('honors an explicit nob_id on the DTO over derivation', async () => {
        mockDbSelect
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]) }) }) })
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ item_id: 'item-1', item_code: 'ITM-0001' }]) }) }) })
          .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ leftJoin: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) }) });

        let insertedValues: any;
        mockDbInsert.mockReturnValue({
          values: jest.fn().mockImplementation((v) => { insertedValues = v; return Promise.resolve({}); }),
        });

        await service.create(
          { company_id: 'comp-1', item_name: 'Starter Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG', nob_id: 'nob-explicit' } as any,
          'tenant-123',
        );

        expect(nobLobResolution.resolve).toHaveBeenCalledWith('tenant-123', 'comp-1', { nob_id: 'nob-explicit', lob_id: undefined });
        expect(insertedValues.nob_id).toBe('nob-explicit');
      });
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
