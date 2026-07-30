import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { SlaughterCostSplitService } from '../src/modules/verticals/poultry/services/slaughter-cost-split.service';
import { SlaughterService } from '../src/modules/verticals/poultry/services/slaughter.service';
import { ProductionBatchService } from '../src/modules/production-costing/production/services/production-batch.service';
import { BatchMaterialService } from '../src/modules/production-costing/production/services/batch-material.service';

describe('Phase 8: RAK Slaughter & Processing Workflows Suite', () => {
  let app: INestApplication;
  let costSplitService: SlaughterCostSplitService;
  let slaughterService: SlaughterService;

  const mockPoultryBatch = {
    poultry_batch_id: 'p-batch-001',
    tenant_id: 'tenant-test',
    company_id: 'company-test',
    production_batch_id: 'pb-001',
    status: 'ACTIVE',
  };

  const insertedSplitExecutions: any[] = [];

  const mockTenantDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation(() => ({
            limit: jest.fn().mockResolvedValue([mockPoultryBatch]),
            then: (resolve: any) => resolve([]),
          })),
        };
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockImplementation((val: any) => {
        insertedSplitExecutions.push(val);
        return Promise.resolve(val);
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({ affectedRows: 1 }),
      }),
    }),
  };

  beforeEach(async () => {
    insertedSplitExecutions.length = 0;
    const clsStore = new Map<string, any>();
    clsStore.set('tenantDb', mockTenantDb);

    const mockClsService = {
      set: jest.fn((k, v) => clsStore.set(k, v)),
      get: jest.fn((k) => clsStore.get(k)),
    };

    const mockProductionBatchService = {
      findBatchById: jest.fn().mockResolvedValue({ batch_id: 'pb-001' }),
    };

    const mockBatchMaterialService = {
      receiveBatchOutput: jest.fn().mockImplementation(async (dto: any) => ({
        output: { goods_receipt_id: `gr-${dto.item_id}`, unit_cost: '2.5000' },
      })),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SlaughterCostSplitService,
        SlaughterService,
        { provide: ClsService, useValue: mockClsService },
        { provide: ProductionBatchService, useValue: mockProductionBatchService },
        { provide: BatchMaterialService, useValue: mockBatchMaterialService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    costSplitService = moduleRef.get<SlaughterCostSplitService>(SlaughterCostSplitService);
    slaughterService = moduleRef.get<SlaughterService>(SlaughterService);
  });

  describe('1. Dynamic Cost Allocation Methods', () => {
    it('should calculate WEIGHT-based cost splits correctly', async () => {
      const outputs = [
        { item_id: 'item-breast', qty_kg: 600 },
        { item_id: 'item-thigh', qty_kg: 400 },
      ];

      const splits = await costSplitService.calculateDynamicCostSplits(
        'company-test',
        outputs,
        'WEIGHT',
        'tenant-test'
      );

      expect(splits).toEqual([
        { item_id: 'item-breast', calculated_split_pct: 60 },
        { item_id: 'item-thigh', calculated_split_pct: 40 },
      ]);
    });

    it('should calculate MARKET_VALUE-based cost splits correctly', async () => {
      const outputs = [
        { item_id: 'item-breast', qty_kg: 100, unit_price: 10 }, // Value 1000 (80%)
        { item_id: 'item-wings', qty_kg: 50, unit_price: 5 },    // Value 250 (20%)
      ];

      const splits = await costSplitService.calculateDynamicCostSplits(
        'company-test',
        outputs,
        'MARKET_VALUE',
        'tenant-test'
      );

      expect(splits).toEqual([
        { item_id: 'item-breast', calculated_split_pct: 80 },
        { item_id: 'item-wings', calculated_split_pct: 20 },
      ]);
    });
  });

  describe('2. Persistent Multi-Output Slaughter Execution', () => {
    it('should execute multi-output slaughter, generate receipts, and persist split history', async () => {
      const result = await slaughterService.recordMultiOutputSlaughterYield(
        {
          company_id: 'company-test',
          poultry_batch_id: 'p-batch-001',
          slaughter_date: '2026-07-30',
          live_birds_received: 1000,
          total_live_weight_kg: 2000,
          warehouse_id: 'wh-01',
          location_id: 'loc-01',
          allocation_method: 'WEIGHT' as any,
          outputs: [
            { item_id: 'item-breast', uom_id: 'uom-kg', output_type: 'MAIN_PRODUCT' as any, qty_kg: 1200 },
            { item_id: 'item-wings', uom_id: 'uom-kg', output_type: 'BY_PRODUCT' as any, qty_kg: 300 },
          ],
        },
        'tenant-test',
        'user-admin'
      );

      expect(result.slaughter).toBeDefined();
      expect(result.outputs.length).toBe(2);
      expect(result.outputs[0].cost_split_pct).toBe(80);
      expect(result.outputs[1].cost_split_pct).toBe(20);
      expect(insertedSplitExecutions.length).toBeGreaterThanOrEqual(2);
    });
  });
});
