import { Test, TestingModule } from '@nestjs/testing';
import { RearingService } from './services/rearing.service';
import { LayerService } from './services/layer.service';
import { HatcheryService } from './services/hatchery.service';
import { BroilerService } from './services/broiler.service';
import { SlaughterService } from './services/slaughter.service';
import { SlaughterCostSplitService } from './services/slaughter-cost-split.service';
import { PoultryKpiService } from './services/poultry-kpi.service';
import { ProductionBatchService } from '../../production-costing/production/services/production-batch.service';
import { BatchMaterialService } from '../../production-costing/production/services/batch-material.service';
import { AuditLogService } from '../../platform-identity/audit-log/audit-log.service';
import { ClsService } from 'nestjs-cls';

describe('Poultry Industry Vertical Unit Tests', () => {
  let rearingService: RearingService;
  let layerService: LayerService;
  let hatcheryService: HatcheryService;
  let broilerService: BroilerService;
  let slaughterService: SlaughterService;

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({}),
      }),
    }),
  };

  const mockClsService = {
    get: jest.fn().mockReturnValue(mockDb),
  };

  const mockProductionBatchService = {
    createBatch: jest.fn().mockResolvedValue({ batch_id: 'prod-b-123' }),
    findBatchById: jest.fn().mockResolvedValue({ batch_id: 'prod-b-123', warehouse_id: 'wh-1', location_id: 'loc-1' }),
  };

  const mockBatchMaterialService = {
    issueBatchMaterials: jest.fn().mockResolvedValue({ input: { input_id: 'in-123' } }),
    receiveBatchOutput: jest.fn().mockResolvedValue({ output: { goods_receipt_id: 'gr-999' } }),
  };

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(true),
  };

  const mockSlaughterCostSplitService = {
    getCostSplitConfigs: jest.fn().mockResolvedValue([
      { item_id: 'item-breast', cost_split_pct: '50.00' },
      { item_id: 'item-wings', cost_split_pct: '30.00' },
      { item_id: 'item-offal', cost_split_pct: '20.00' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RearingService,
        LayerService,
        HatcheryService,
        BroilerService,
        SlaughterService,
        PoultryKpiService,
        { provide: SlaughterCostSplitService, useValue: mockSlaughterCostSplitService },
        { provide: ClsService, useValue: mockClsService },
        { provide: ProductionBatchService, useValue: mockProductionBatchService },
        { provide: BatchMaterialService, useValue: mockBatchMaterialService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    rearingService = module.get<RearingService>(RearingService);
    layerService = module.get<LayerService>(LayerService);
    hatcheryService = module.get<HatcheryService>(HatcheryService);
    broilerService = module.get<BroilerService>(BroilerService);
    slaughterService = module.get<SlaughterService>(SlaughterService);

    jest.clearAllMocks();
  });

  it('should place day-old chicks (DOC) and auto-create Phase 5 Production Batch', async () => {
    const dto = {
      company_id: 'comp-1',
      farm_id: 'farm-1',
      shed_id: 'shed-1',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      batch_no: 'FLOCK-2026-01',
      placement_date: '2026-08-01',
      initial_bird_count: 10000,
    };

    const result = await rearingService.placeChickBatch(dto, 'tenant-1', 'user-1');
    expect(mockProductionBatchService.createBatch).toHaveBeenCalled();
    expect(result.initial_bird_count).toBe(10000);
    expect(result.status).toBe('ACTIVE');
  });

  it('should record egg production and trigger Phase 3 Goods Receipt for eggs', async () => {
    mockDb.limit.mockResolvedValue([{ poultry_batch_id: 'pb-1', current_bird_count: 10000, production_batch_id: 'prod-b-123' }]);

    const dto = {
      company_id: 'comp-1',
      poultry_batch_id: 'pb-1',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      egg_item_id: 'item-egg-1',
      uom_id: 'uom-pcs',
      log_date: '2026-08-05',
      good_eggs: 8500,
      cracked_eggs: 100,
    };

    const result = await layerService.recordEggProduction(dto, 'tenant-1', 'user-1');
    expect(mockBatchMaterialService.receiveBatchOutput).toHaveBeenCalled();
    expect(result.good_eggs).toBe(8500);
    expect(result.goods_receipt_id).toBe('gr-999');
  });

  it('should record egg setting and calculate hatchability %', async () => {
    mockDb.limit.mockResolvedValue([{ hatch_id: 'h-1', eggs_set_qty: 50000, poultry_batch_id: 'pb-1' }]);

    const dto = {
      poultry_batch_id: 'pb-1',
      hatch_date: '2026-08-22',
      candled_fertile_qty: 46000,
      chicks_hatched_qty: 43500,
    };

    const result = await hatcheryService.recordHatchResult(dto, 'tenant-1', 'user-1');
    expect(result.hatchability_pct).toBe(87);
  });

  it('should record slaughter yield and receive finished meat inventory', async () => {
    mockDb.limit.mockResolvedValue([{ poultry_batch_id: 'pb-1', production_batch_id: 'prod-b-123' }]);

    const dto = {
      company_id: 'comp-1',
      poultry_batch_id: 'pb-1',
      warehouse_id: 'wh-plant',
      location_id: 'loc-fg',
      meat_item_id: 'item-whole-bird',
      uom_id: 'uom-kg',
      slaughter_date: '2026-08-25',
      live_birds_received: 5000,
      total_live_weight_kg: 10000,
      dressed_weight_kg: 7500,
    };

    const result = await slaughterService.recordSlaughterYield(dto, 'tenant-1', 'user-1');
    expect(mockBatchMaterialService.receiveBatchOutput).toHaveBeenCalled();
    expect(result.yield_pct).toBe('75.00');
  });

  it('should record multi-output slaughter joint-cost allocation for carcass, wings, and offal', async () => {
    mockDb.limit.mockResolvedValue([{ poultry_batch_id: 'pb-1', production_batch_id: 'prod-b-123' }]);

    const dto = {
      company_id: 'comp-1',
      poultry_batch_id: 'pb-1',
      warehouse_id: 'wh-plant',
      location_id: 'loc-fg',
      slaughter_date: '2026-08-25',
      live_birds_received: 5000,
      total_live_weight_kg: 10000,
      outputs: [
        { item_id: 'item-breast', uom_id: 'uom-kg', output_type: 'FINISHED_GOOD' as const, qty_kg: 4000 },
        { item_id: 'item-wings', uom_id: 'uom-kg', output_type: 'FINISHED_GOOD' as const, qty_kg: 2000 },
        { item_id: 'item-offal', uom_id: 'uom-kg', output_type: 'OFFAL' as const, qty_kg: 1500 },
      ],
    };

    const result = await slaughterService.recordMultiOutputSlaughterYield(dto, 'tenant-1', 'user-1');
    expect(mockBatchMaterialService.receiveBatchOutput).toHaveBeenCalledTimes(3);
    expect(result.outputs.length).toBe(3);
    expect(result.slaughter.yield_pct).toBe('75.00');
  });
});
