import { Test, TestingModule } from '@nestjs/testing';
import { ProductionOrderService } from './services/production-order.service';
import { ProductionBatchService } from './services/production-batch.service';
import { BatchMaterialService } from './services/batch-material.service';
import { BatchCostingService } from './services/batch-costing.service';
import { ProductionReportService } from './services/production-report.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../platform-identity/audit-log/audit-log.service';
import { GoodsIssueService } from '../../inventory-logistics/inventory/services/goods-issue.service';
import { GoodsReceiptService } from '../../inventory-logistics/inventory/services/goods-receipt.service';
import { PostingEngineService } from '../../finance-accounting/finance/services/posting-engine.service';
import { BatchStatusEnum } from './dto/production-batch.dto';
import { MASTER_CONNECTION } from '../../../core/database/database.module';
import { BadRequestException } from '@nestjs/common';

describe('Production Engine Unit Tests (Phase 4)', () => {
  let batchService: ProductionBatchService;
  let materialService: BatchMaterialService;
  let costingService: BatchCostingService;

  const createQueryChain = (result: any) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    then: (resolve: any) => resolve(result),
  });

  const mockDb = {
    select: jest.fn(),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onDuplicateKeyUpdate: jest.fn().mockResolvedValue({}),
        then: (resolve: any) => resolve({}),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({}),
      }),
    }),
  };

  const mockMasterDb = {
    select: jest.fn(),
  };

  const mockClsService = {
    get: jest.fn().mockReturnValue(mockDb),
  };

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(true),
  };

  const mockGoodsIssueService = {
    create: jest.fn().mockResolvedValue({ issue_id: 'gi-123' }),
    post: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockGoodsReceiptService = {
    create: jest.fn().mockResolvedValue({ receipt_id: 'gr-123' }),
    post: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockPostingEngineService = {
    postAutomaticEntry: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionOrderService,
        ProductionBatchService,
        BatchMaterialService,
        BatchCostingService,
        ProductionReportService,
        { provide: MASTER_CONNECTION, useValue: mockMasterDb },
        { provide: ClsService, useValue: mockClsService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: GoodsIssueService, useValue: mockGoodsIssueService },
        { provide: GoodsReceiptService, useValue: mockGoodsReceiptService },
        { provide: PostingEngineService, useValue: mockPostingEngineService },
      ],
    }).compile();

    batchService = module.get<ProductionBatchService>(ProductionBatchService);
    materialService = module.get<BatchMaterialService>(BatchMaterialService);
    costingService = module.get<BatchCostingService>(BatchCostingService);

    jest.clearAllMocks();
  });

  it('should create a new Production Batch draft with costing_method snapshot', async () => {
    mockDb.select.mockReturnValueOnce(createQueryChain([])); // No existing batch

    const dto = {
      company_id: 'comp-1',
      batch_no: 'BATCH-2026-001',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      planned_qty: 500,
      costing_method: 'STANDARD',
    };

    const result = await batchService.createBatch(dto, 'tenant-1', 'user-1');
    expect(result.batch_no).toBe('BATCH-2026-001');
    expect(result.status).toBe('DRAFT');
    expect(result.costing_method).toBe('STANDARD');
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // Batch + WIP init
  });

  it('should validate NOB and LOB master records and allowed costing methods', async () => {
    // 1. NOB exists
    mockMasterDb.select.mockReturnValueOnce(createQueryChain([{ nob_id: 'nob-poultry' }]));
    // 2. LOB exists under NOB and allows STANDARD costing
    mockMasterDb.select.mockReturnValueOnce(createQueryChain([{ lob_id: 'lob-rearing', costing_method_allowed: 'STANDARD,FIFO' }]));
    // 3. Batch no uniqueness
    mockDb.select.mockReturnValueOnce(createQueryChain([]));

    const dto = {
      company_id: 'comp-1',
      batch_no: 'POULTRY-REAR-001',
      nob_id: 'nob-poultry',
      lob_id: 'lob-rearing',
      costing_method: 'STANDARD',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      planned_qty: 1000,
    };

    const result = await batchService.createBatch(dto, 'tenant-1', 'user-1');
    expect(result.batch_no).toBe('POULTRY-REAR-001');
    expect(result.costing_method).toBe('STANDARD');
  });

  it('should reject changing costing_method after operational postings begin', async () => {
    // Find batch
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'IN_PROGRESS', costing_method: 'STANDARD' }]));
    // Inputs check (postings exist)
    mockDb.select.mockReturnValueOnce(createQueryChain([{ input_id: 'inp-1' }]));

    await expect(
      batchService.updateBatch('b-1', { costing_method: 'FIFO' }, 'tenant-1', 'user-1')
    ).rejects.toThrow(BadRequestException);
  });

  it('should validate status transition state machine', async () => {
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'DRAFT', company_id: 'comp-1' }]));
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'PLANNED', company_id: 'comp-1' }]));

    const result = await batchService.transitionStatus('b-1', BatchStatusEnum.PLANNED, 'tenant-1', 'user-1');
    expect(mockDb.update).toHaveBeenCalled();
    expect(result.status).toBe('PLANNED');
  });

  it('should issue batch materials and capture actual valuation cost', async () => {
    // 1. Find batch in issueBatchMaterials
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'RELEASED', batch_no: 'B1', company_id: 'comp-1' }]));
    // 2. Read actual inventory ledger cost
    mockDb.select.mockReturnValueOnce(createQueryChain([{ unit_cost: '10.5000', total_value: '-1050.0000' }]));
    // 3. Find WIP record
    mockDb.select.mockReturnValueOnce(createQueryChain([{ material_cost: '0.0000', labor_cost: '0.0000', machine_cost: '0.0000', overhead_cost: '0.0000' }]));
    // 4. transitionStatus -> findBatchById check
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'RELEASED', batch_no: 'B1', company_id: 'comp-1' }]));
    // 5. transitionStatus -> findBatchById return lookup
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'MATERIAL_ISSUED', batch_no: 'B1', company_id: 'comp-1' }]));

    const dto = {
      company_id: 'comp-1',
      batch_id: 'b-1',
      item_id: 'item-raw-1',
      uom_id: 'uom-kg',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      planned_qty: 100,
      actual_qty: 100,
    };

    const result = await materialService.issueBatchMaterials(dto, 'tenant-1', 'user-1');
    expect(mockGoodsIssueService.create).toHaveBeenCalled();
    expect(mockGoodsIssueService.post).toHaveBeenCalledWith('gi-123', 'tenant-1', 'user-1');
    expect(result.input.unit_cost).toBe('10.5000');
    expect(result.input.total_cost).toBe('1050.0000');
  });

  it('should reject zero-cost material issues', async () => {
    // Find batch
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'RELEASED', batch_no: 'B1', company_id: 'comp-1' }]));
    // Read 0 ledger cost
    mockDb.select.mockReturnValueOnce(createQueryChain([{ unit_cost: '0.0000', total_value: '0.0000' }]));

    const dto = {
      company_id: 'comp-1',
      batch_id: 'b-1',
      item_id: 'item-raw-1',
      uom_id: 'uom-kg',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      planned_qty: 100,
      actual_qty: 100,
    };

    await expect(
      materialService.issueBatchMaterials(dto, 'tenant-1', 'user-1')
    ).rejects.toThrow(BadRequestException);
  });

  it('should receive batch finished goods with calculated output cost', async () => {
    // Find batch
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'IN_PROGRESS', batch_no: 'B1' }]));
    // Find WIP record
    mockDb.select.mockReturnValueOnce(createQueryChain([{ total_wip_cost: '5000.0000' }]));

    const dto = {
      company_id: 'comp-1',
      batch_id: 'b-1',
      item_id: 'item-fg-1',
      uom_id: 'uom-kg',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      output_type: 'FINISHED_GOOD' as any,
      qty: 500,
      cost_split_pct: 100.0,
    };

    const result = await materialService.receiveBatchOutput(dto, 'tenant-1', 'user-1');
    expect(mockGoodsReceiptService.create).toHaveBeenCalled();
    expect(mockGoodsReceiptService.post).toHaveBeenCalledWith('gr-123', 'tenant-1', 'user-1');
    expect(result.output.unit_cost).toBe('10.0000');
    expect(result.output.total_cost).toBe('5000.0000');
  });

  it('should successfully close a FINISHED poultry batch when WIP is reconciled', async () => {
    // 1. Find batch
    mockDb.select.mockReturnValueOnce(createQueryChain([{
      batch_id: 'b-close-1',
      batch_no: 'B-CLOSE-01',
      company_id: 'comp-1',
      status: 'FINISHED',
      costing_method: 'STANDARD',
      lob_id: 'lob-rearing',
      planned_qty: '1000.0000',
      actual_qty: '1000.0000',
    }]));

    // 2. LOB config check
    mockMasterDb.select.mockReturnValueOnce(createQueryChain([{ qc_required: 'NO', qr_required: 'NO' }]));

    // 3. calculateBatchCost queries
    // batch lookup
    mockDb.select.mockReturnValueOnce(createQueryChain([{
      batch_id: 'b-close-1',
      batch_no: 'B-CLOSE-01',
      company_id: 'comp-1',
      costing_method: 'STANDARD',
      actual_qty: '1000.0000',
    }]));
    // inputs
    mockDb.select.mockReturnValueOnce(createQueryChain([{ total_cost: '4000.0000', item_id: 'i-1', planned_qty: '1000.0000', actual_qty: '1000.0000', unit_cost: '4.0000' }]));
    // resources
    mockDb.select.mockReturnValueOnce(createQueryChain([{ total_cost: '1000.0000', usage_type: 'LABOR' }]));
    // productionCost lookup
    mockDb.select.mockReturnValueOnce(createQueryChain([]));

    // 4. getBatchOutputs check
    mockDb.select.mockReturnValueOnce(createQueryChain([{ unit_cost: '5.0000', qty: '1000.0000' }]));

    // 5. createStandardCostVariances queries
    // inputs for variance
    mockDb.select.mockReturnValueOnce(createQueryChain([{ item_id: 'i-1', planned_qty: '1000.0000', actual_qty: '1000.0000', unit_cost: '4.0000' }]));
    // item master standard cost
    mockDb.select.mockReturnValueOnce(createQueryChain([{ standard_cost: '4.0000' }]));
    // varianceAnalysis lookup
    mockDb.select.mockReturnValueOnce(createQueryChain([]));
    // productionVariance lookup
    mockDb.select.mockReturnValueOnce(createQueryChain([]));

    // 6. Transition status findBatchById check
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-close-1', status: 'FINISHED', batch_no: 'B-CLOSE-01' }]));
    // 7. Transition status return lookup
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-close-1', status: 'CLOSED', batch_no: 'B-CLOSE-01' }]));

    const result = await costingService.closeBatch('b-close-1', 'tenant-1', 'user-1');
    expect(result.success).toBe(true);
    expect(result.costing_method).toBe('STANDARD');
    expect(mockPostingEngineService.postAutomaticEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction_type: 'WIP_TRANSFER',
        amount: 5000,
      }),
      'tenant-1',
      'user-1'
    );
  });

  it('should reject batch close if status is not FINISHED', async () => {
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', status: 'IN_PROGRESS', batch_no: 'B1' }]));

    await expect(costingService.closeBatch('b-1', 'tenant-1', 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('should reject batch close if WIP does not reconcile to zero', async () => {
    // 1. Find batch
    mockDb.select.mockReturnValueOnce(createQueryChain([{
      batch_id: 'b-unreconciled',
      batch_no: 'B-UNREC',
      company_id: 'comp-1',
      status: 'FINISHED',
      costing_method: 'STANDARD',
      lob_id: null,
      planned_qty: '1000.0000',
      actual_qty: '1000.0000',
    }]));

    // 2. calculateBatchCost queries
    mockDb.select.mockReturnValueOnce(createQueryChain([{ batch_id: 'b-unreconciled', costing_method: 'STANDARD', actual_qty: '1000.0000' }]));
    mockDb.select.mockReturnValueOnce(createQueryChain([{ total_cost: '5000.0000', item_id: 'i-1', planned_qty: '1000.0000', actual_qty: '1000.0000', unit_cost: '5.0000' }]));
    mockDb.select.mockReturnValueOnce(createQueryChain([])); // resource usage
    mockDb.select.mockReturnValueOnce(createQueryChain([])); // productionCost

    // 3. getBatchOutputs check (output cost = 3000, WIP = 5000 -> 2000 unreconciled!)
    mockDb.select.mockReturnValueOnce(createQueryChain([{ unit_cost: '3.0000', qty: '1000.0000' }]));

    await expect(costingService.closeBatch('b-unreconciled', 'tenant-1', 'user-1')).rejects.toThrow(BadRequestException);
  });
});
