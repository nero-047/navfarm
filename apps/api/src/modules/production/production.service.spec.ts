import { Test, TestingModule } from '@nestjs/testing';
import { ProductionOrderService } from './services/production-order.service';
import { ProductionBatchService } from './services/production-batch.service';
import { BatchMaterialService } from './services/batch-material.service';
import { BatchCostingService } from './services/batch-costing.service';
import { ProductionReportService } from './services/production-report.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../audit-log/audit-log.service';
import { GoodsIssueService } from '../inventory/services/goods-issue.service';
import { GoodsReceiptService } from '../inventory/services/goods-receipt.service';
import { PostingEngineService } from '../finance/services/posting-engine.service';
import { BatchStatusEnum } from './dto/production-batch.dto';

describe('Production Engine Unit Tests', () => {
  let batchService: ProductionBatchService;
  let materialService: BatchMaterialService;
  let costingService: BatchCostingService;

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
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

  it('should create a new Production Batch draft', async () => {
    mockDb.limit.mockResolvedValueOnce([]); // No existing batch

    const dto = {
      company_id: 'comp-1',
      batch_no: 'BATCH-2026-001',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      planned_qty: 500,
    };

    const result = await batchService.createBatch(dto, 'tenant-1', 'user-1');
    expect(result.batch_no).toBe('BATCH-2026-001');
    expect(result.status).toBe('DRAFT');
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // Batch + WIP init
  });

  it('should validate status transition state machine', async () => {
    mockDb.limit.mockResolvedValue([{ batch_id: 'b-1', status: 'DRAFT', company_id: 'comp-1' }]);

    const result = await batchService.transitionStatus('b-1', BatchStatusEnum.PLANNED, 'tenant-1', 'user-1');
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('should issue batch materials through Inventory Engine (Phase 3 Goods Issue)', async () => {
    mockDb.limit.mockResolvedValue([{ batch_id: 'b-1', status: 'RELEASED', batch_no: 'B1', company_id: 'comp-1' }]);

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
    expect(result.input.goods_issue_id).toBe('gi-123');
  });

  it('should receive batch finished goods through Inventory Engine (Phase 3 Goods Receipt)', async () => {
    mockDb.limit.mockResolvedValueOnce([{ batch_id: 'b-1', status: 'IN_PROGRESS', batch_no: 'B1' }]);

    const dto = {
      company_id: 'comp-1',
      batch_id: 'b-1',
      item_id: 'item-fg-1',
      uom_id: 'uom-kg',
      warehouse_id: 'wh-1',
      location_id: 'loc-1',
      output_type: 'FINISHED_GOOD' as any,
      qty: 480,
    };

    const result = await materialService.receiveBatchOutput(dto, 'tenant-1', 'user-1');
    expect(mockGoodsReceiptService.create).toHaveBeenCalled();
    expect(mockGoodsReceiptService.post).toHaveBeenCalledWith('gr-123', 'tenant-1', 'user-1');
    expect(result.output.goods_receipt_id).toBe('gr-123');
  });
});
