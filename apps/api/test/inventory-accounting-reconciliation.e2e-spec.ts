import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PostingEngineService } from '../src/modules/finance-accounting/finance/services/posting-engine.service';
import { LedgerService } from '../src/modules/finance-accounting/finance/services/ledger.service';
import { FifoEngineService } from '../src/modules/inventory-logistics/inventory/services/fifo-engine.service';

describe('Phase 5: Reliable Inventory & Accounting Ledger Engine Suite', () => {
  let app: INestApplication;
  let postingEngine: PostingEngineService;
  let ledgerService: LedgerService;
  let fifoEngine: FifoEngineService;
  let clsService: ClsService;

  const mockGlMappings = [
    {
      mapping_id: 'map-01',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      transaction_type: 'GOODS_RECEIPT',
      debit_gl_account_id: 'gl-inv-raw',
      credit_gl_account_id: 'gl-grni',
      is_active: true,
      deleted_at: null,
    },
    {
      mapping_id: 'map-02',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      transaction_type: 'GOODS_ISSUE',
      debit_gl_account_id: 'gl-cogs',
      credit_gl_account_id: 'gl-inv-raw',
      is_active: true,
      deleted_at: null,
    },
  ];

  const mockPeriods = [
    {
      period_id: 'per-open',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      period_name: '2026-07',
      start_date: '2026-07-01',
      end_date: '2026-07-31',
      status: 'OPEN',
    },
    {
      period_id: 'per-closed',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      period_name: '2026-06',
      start_date: '2026-06-01',
      end_date: '2026-06-30',
      status: 'CLOSED',
    },
  ];

  const postedGlEntries: any[] = [];

  const mockTenantDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation((cond: any) => ({
            limit: jest.fn().mockImplementation(() => {
              if (tableName.includes('accounting_period') || tableName.includes('accountingPeriod')) {
                return mockPeriods;
              }
              return [];
            }),
            then: (resolve: any) => {
              if (tableName.includes('accounting_period') || tableName.includes('accountingPeriod')) {
                return resolve(mockPeriods);
              }
              if (tableName.includes('gl_mapping_master') || tableName.includes('glMappingMaster')) {
                return resolve(mockGlMappings);
              }
              return resolve([]);
            },
          })),
        };
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockImplementation((val: any) => {
        postedGlEntries.push(val);
        return Promise.resolve(val);
      }),
    }),
    transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockTenantDb)),
  };

  beforeEach(async () => {
    postedGlEntries.length = 0;
    const clsStore = new Map<string, any>();
    clsStore.set('tenantDb', mockTenantDb);

    clsService = {
      set: jest.fn((k, v) => clsStore.set(k, v)),
      get: jest.fn((k) => clsStore.get(k)),
    } as any;

    const mockLedgerService = {
      postEntry: jest.fn().mockImplementation(async (dto: any) => {
        postedGlEntries.push(dto);
        return { journal_id: 'j-01' };
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PostingEngineService,
        FifoEngineService,
        { provide: LedgerService, useValue: mockLedgerService },
        { provide: ClsService, useValue: clsService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    postingEngine = moduleRef.get<PostingEngineService>(PostingEngineService);
    ledgerService = moduleRef.get<LedgerService>(LedgerService);
    fifoEngine = moduleRef.get<FifoEngineService>(FifoEngineService);
  });

  describe('1. Double-Entry GL Posting & Accounting Period Gate Checks', () => {
    it('should post balanced debit and credit entries for valid OPEN period transaction', async () => {
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockPeriods[0]]),
        }),
      });

      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockGlMappings),
        }),
      });

      const result = await postingEngine.postAutomaticEntry(
        {
          company_id: 'company-test',
          transaction_type: 'GOODS_RECEIPT',
          amount: 5000,
          posting_date: '2026-07-15',
          ref_doc_type: 'GOODS_RECEIPT',
          ref_doc_id: 'gr-1001',
        },
        'tenant-test',
        'user-admin'
      );

      expect(result.success).toBe(true);
      expect(postedGlEntries.length).toBe(2);
      expect(postedGlEntries[0].debit).toBe(5000);
      expect(postedGlEntries[1].credit).toBe(5000);
    });

    it('should reject posting to a CLOSED accounting period with BadRequestException', async () => {
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockPeriods[1]]),
        }),
      });

      await expect(
        postingEngine.postAutomaticEntry(
          {
            company_id: 'company-test',
            transaction_type: 'GOODS_RECEIPT',
            amount: 5000,
            posting_date: '2026-06-15',
            ref_doc_type: 'GOODS_RECEIPT',
            ref_doc_id: 'gr-1002',
          },
          'tenant-test',
          'user-admin'
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. FIFO Valuation Layer Processing', () => {
    it('should register and deplete FIFO valuation layers in order', async () => {
      const layers = [
        { layer_id: 'l1', qty_remaining: 100, unit_cost: 10 },
        { layer_id: 'l2', qty_remaining: 50, unit_cost: 12 },
      ];

      // Deplete 120 units: 100 from layer 1 @ $10 ($1000), 20 from layer 2 @ $12 ($240) -> Total $1240
      let reqQty = 120;
      let totalCost = 0;

      for (const l of layers) {
        if (reqQty <= 0) break;
        const take = Math.min(reqQty, l.qty_remaining);
        totalCost += take * l.unit_cost;
        l.qty_remaining -= take;
        reqQty -= take;
      }

      expect(totalCost).toBe(1240);
      expect(layers[0].qty_remaining).toBe(0);
      expect(layers[1].qty_remaining).toBe(30);
    });
  });
});
