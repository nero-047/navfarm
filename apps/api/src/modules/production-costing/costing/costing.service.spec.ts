import { Test, TestingModule } from '@nestjs/testing';
import { CostingProfileService } from './services/costing-profile.service';
import { InventoryValuationService } from './services/inventory-valuation.service';
import { BatchCostingEngineService } from './services/batch-costing-engine.service';
import { BiologicalAssetCostingService } from './services/biological-asset-costing.service';
import { VarianceAnalysisService } from './services/variance-analysis.service';
import { CostingReportService } from './services/costing-report.service';
import { PostingEngineService } from '../../finance-accounting/finance/services/posting-engine.service';
import { AuditLogService } from '../../platform-identity/audit-log/audit-log.service';
import { ClsService } from 'nestjs-cls';
import { CostingMethodEnum } from './dto/costing-profile.dto';

describe('Enterprise Costing Engine Unit Tests', () => {
  let profileService: CostingProfileService;
  let valuationService: InventoryValuationService;
  let bioCostingService: BiologicalAssetCostingService;
  let varianceService: VarianceAnalysisService;

  const createQueryChain = (result: any) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    then: (resolve: any) => resolve(result),
  });

  const mockDb = {
    select: jest.fn(),
    insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue({}) }),
    update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) }),
  };

  const mockClsService = {
    get: jest.fn().mockReturnValue(mockDb),
  };

  const mockPostingEngineService = {
    postAutomaticEntry: jest.fn().mockResolvedValue({ entry_id: 'journal-rev-123', success: true }),
  };

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostingProfileService,
        InventoryValuationService,
        BatchCostingEngineService,
        BiologicalAssetCostingService,
        VarianceAnalysisService,
        CostingReportService,
        { provide: ClsService, useValue: mockClsService },
        { provide: PostingEngineService, useValue: mockPostingEngineService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    profileService = module.get<CostingProfileService>(CostingProfileService);
    valuationService = module.get<InventoryValuationService>(InventoryValuationService);
    bioCostingService = module.get<BiologicalAssetCostingService>(BiologicalAssetCostingService);
    varianceService = module.get<VarianceAnalysisService>(VarianceAnalysisService);

    jest.clearAllMocks();
  });

  it('should create a new Costing Method Profile', async () => {
    const dto = {
      company_id: 'comp-1',
      item_id: 'item-1',
      costing_method: CostingMethodEnum.STANDARD,
      standard_cost: 15.5,
      effective_from: '2026-08-01',
    };

    const result = await profileService.createCostingProfile(dto, 'tenant-1', 'user-1');
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result.costing_method).toBe('STANDARD');
    expect(result.standard_cost).toBe('15.5000');
  });

  it('should revaluate item standard cost and post GL journal adjustment', async () => {
    mockDb.select
      .mockReturnValueOnce(createQueryChain([{ item_id: 'item-1', item_code: 'ITM-01', standard_cost: '10.0000' }]))
      .mockReturnValueOnce(createQueryChain([{ qty_on_hand: '100.0000' }]));

    const dto = {
      company_id: 'comp-1',
      item_id: 'item-1',
      new_cost: 12.0,
      change_reason: 'Market adjustment Q3',
    };

    const result = await valuationService.revaluateItemCost(dto, 'tenant-1', 'user-1');
    expect(mockPostingEngineService.postAutomaticEntry).toHaveBeenCalled();
    expect(result.total_stock_qty).toBe(100);
    expect(result.revaluation_amount).toBe(200); // 100 * (12 - 10)
  });

  it('should calculate IAS 41 Biological Asset valuation for living poultry flock', async () => {
    mockDb.select
      .mockReturnValueOnce(createQueryChain([{ poultry_batch_id: 'pb-1', company_id: 'comp-1', initial_bird_count: 1000, current_bird_count: 950, total_mortality: 50, production_batch_id: 'prod-b-1' }]))
      .mockReturnValueOnce(createQueryChain([{ total_cost: '5000.0000' }])) // inputs
      .mockReturnValueOnce(createQueryChain([{ total_cost: '1000.0000', usage_type: 'LABOR' }])) // resources
      .mockReturnValueOnce(createQueryChain([])); // existing asset cost record check

    const result = await bioCostingService.calculateBiologicalAssetValuation('pb-1', 'tenant-1');
    expect(result.current_bird_count).toBe(950);
    expect(result.acquisition_cost).toBe(1500); // 1000 * 1.5
    expect(result.cost_per_bird).toBeGreaterThan(0);
  });

  it('should calculate 7-dimension variance analysis for production batch', async () => {
    mockDb.select
      .mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', company_id: 'comp-1', batch_no: 'B01', planned_qty: '100.0000', actual_qty: '110.0000' }]))
      .mockReturnValueOnce(createQueryChain([{ planned_qty: '10.0000', actual_qty: '12.0000', unit_cost: '5.0000' }]));

    const result = await varianceService.calculateVarianceAnalysis('b-1', 'tenant-1', 'user-1');
    expect(mockPostingEngineService.postAutomaticEntry).toHaveBeenCalled();
    expect(result.batch_id).toBe('b-1');
    expect(parseFloat(result.total_variance)).toBeGreaterThan(0);
  });
});
