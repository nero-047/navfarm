import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { ProductionBatchService } from '../src/modules/production-costing/production/services/production-batch.service';
import { BatchMaterialService } from '../src/modules/production-costing/production/services/batch-material.service';
import { BatchCostingService } from '../src/modules/production-costing/production/services/batch-costing.service';
import { QualityInspectionService } from '../src/modules/quality-traceability/services/quality-inspection.service';
import { QrBarcodeEngineService } from '../src/modules/quality-traceability/services/qr-barcode-engine.service';
import { SlaughterService } from '../src/modules/verticals/poultry/services/slaughter.service';
import { SlaughterCostSplitService } from '../src/modules/verticals/poultry/services/slaughter-cost-split.service';
import { FinanceReportService } from '../src/modules/intelligence-reporting/reporting-bi/services/finance-report.service';
import { PostingEngineService } from '../src/modules/finance-accounting/finance/services/posting-engine.service';
import { GoodsIssueService } from '../src/modules/inventory-logistics/inventory/services/goods-issue.service';
import { GoodsReceiptService } from '../src/modules/inventory-logistics/inventory/services/goods-receipt.service';
import { AuditLogService } from '../src/modules/platform-identity/audit-log/audit-log.service';
import { BarcodeTypeEnum, EntityTypeEnum } from '../src/modules/quality-traceability/dto/qr-barcode.dto';

describe('RAK Farm-to-Fork End-to-End Operational Lifecycle E2E Test', () => {
  let batchService: ProductionBatchService;
  let materialService: BatchMaterialService;
  let costingService: BatchCostingService;
  let qcService: QualityInspectionService;
  let qrService: QrBarcodeEngineService;
  let slaughterService: SlaughterService;
  let financeReportService: FinanceReportService;

  const mockGlAccounts = [
    { gl_account_id: 'gl-inv-wip', account_code: '1410', account_name: 'WIP Inventory', account_type: 'ASSET' },
    { gl_account_id: 'gl-inv-rm', account_code: '1420', account_name: 'Raw Material Feed', account_type: 'ASSET' },
    { gl_account_id: 'gl-inv-fg', account_code: '1430', account_name: 'Finished Meat Inventory', account_type: 'ASSET' },
    { gl_account_id: 'gl-cogs', account_code: '5110', account_name: 'Cost of Goods Sold', account_type: 'EXPENSE' },
    { gl_account_id: 'gl-sales', account_code: '4110', account_name: 'Poultry Sales Revenue', account_type: 'REVENUE' },
  ];

  const createQueryChain = (result: any) => {
    const chain: any = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(result),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      then: (resolve: any) => resolve(result),
    };
    chain.from.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.orderBy.mockReturnValue(chain);
    chain.innerJoin.mockReturnValue(chain);
    chain.leftJoin.mockReturnValue(chain);
    return chain;
  };

  const defaultMockResolver = () => {
    return createQueryChain([
      {
        nob_id: 'nob-1',
        lob_id: 'lob-1',
        is_active: true,
        costing_method_allowed: 'STANDARD,FIFO,BIO_ASSET',
        batch_id: 'b-e2e',
        batch_no: 'RAK-BATCH-2026-001',
        company_id: 'comp-rak',
        costing_method_snapshot: 'STANDARD',
        costing_method: 'STANDARD',
        status: 'IN_PROGRESS',
        stage: 'PACKAGED',
        item_id: 'item-feed',
        item_name: 'Broiler Starter Feed',
        standard_cost: '2.50',
        unit_cost: '2.50',
        total_value: '-5000.00',
        total_cost: '5000.00',
        actual_cost: '5000.00',
        material_cost: '5000.00',
        labor_cost: '0.00',
        machine_cost: '0.00',
        overhead_cost: '0.00',
        totalWip: '5000.00',
        totalOutput: '5000.00',
        qc_required: 'NO',
        qr_required: 'NO',
        parameter_id: 'p-weight',
        parameter_name: 'Average Weight',
        min_value: '1.80',
        max_value: '2.50',
        is_mandatory: true,
        qr_id: 'qr-1',
        qr_code_hash: 'NAV-QR-RAK-001',
        entity_id: 'b-e2e',
        scanned_count: 0,
        inspection_id: 'qc-1',
        overall_result: 'PASSED',
        total_material_cost: '5000.00',
        total_resource_cost: '0.00',
        totalDebits: '5000.00',
        totalCredits: '5000.00',
      },
    ]);
  };

  const mockDb: any = {
    select: jest.fn().mockImplementation(defaultMockResolver),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onDuplicateKeyUpdate: jest.fn().mockResolvedValue({}),
        then: (resolve: any) => resolve({}),
      }),
    }),
    update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) }),
  };

  const mockClsService = {
    get: jest.fn().mockReturnValue(mockDb),
  };

  const mockPostingEngineService = {
    postAutomaticEntry: jest.fn().mockResolvedValue({ entry_type_code: 'MAT_ISSUE', gl_entries_created: 2 }),
  };

  const mockGoodsIssueService = {
    create: jest.fn().mockResolvedValue({ issue_id: 'gi-101' }),
    post: jest.fn().mockResolvedValue({ issue_id: 'gi-101' }),
    postGoodsIssue: jest.fn().mockResolvedValue({ issue_id: 'gi-101' }),
  };

  const mockGoodsReceiptService = {
    create: jest.fn().mockResolvedValue({ goods_receipt_id: 'gr-999' }),
    post: jest.fn().mockResolvedValue({ goods_receipt_id: 'gr-999' }),
    postGoodsReceipt: jest.fn().mockResolvedValue({ goods_receipt_id: 'gr-999' }),
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
        ProductionBatchService,
        BatchMaterialService,
        BatchCostingService,
        QualityInspectionService,
        QrBarcodeEngineService,
        SlaughterService,
        FinanceReportService,
        { provide: PostingEngineService, useValue: mockPostingEngineService },
        { provide: GoodsIssueService, useValue: mockGoodsIssueService },
        { provide: GoodsReceiptService, useValue: mockGoodsReceiptService },
        { provide: SlaughterCostSplitService, useValue: mockSlaughterCostSplitService },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(true) } },
        { provide: 'MASTER_CONNECTION', useValue: mockDb },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    batchService = module.get<ProductionBatchService>(ProductionBatchService);
    materialService = module.get<BatchMaterialService>(BatchMaterialService);
    costingService = module.get<BatchCostingService>(BatchCostingService);
    qcService = module.get<QualityInspectionService>(QualityInspectionService);
    qrService = module.get<QrBarcodeEngineService>(QrBarcodeEngineService);
    slaughterService = module.get<SlaughterService>(SlaughterService);
    financeReportService = module.get<FinanceReportService>(FinanceReportService);

    mockDb.select.mockReset();
    mockDb.select.mockImplementation(defaultMockResolver);
  });

  it('1. Should create production batch with valid NOB/LOB and costing snapshot', async () => {
    mockDb.select.mockReset();
    mockDb.select
      .mockReturnValueOnce(createQueryChain([{ nob_id: 'nob-1', is_active: true }]))
      .mockReturnValueOnce(createQueryChain([{ lob_id: 'lob-1', is_active: true, costing_method_allowed: 'STANDARD,FIFO,BIO_ASSET' }]))
      .mockReturnValueOnce(createQueryChain([])); // existing check

    const batchDto: any = {
      company_id: 'comp-rak',
      nob_id: 'nob-1',
      lob_id: 'lob-1',
      farm_id: 'farm-1',
      location_id: 'loc-1',
      batch_no: 'RAK-BATCH-2026-001',
      costing_method: 'STANDARD',
      planned_qty: 10000,
    };

    const batch = await batchService.createBatch(batchDto, 't-e2e');
    expect(batch.batch_no).toBe('RAK-BATCH-2026-001');
    expect(batch.costing_method).toBe('STANDARD');
  });

  it('2. Should issue feed materials with actual valuation cost into production WIP', async () => {
    const issueDto = {
      company_id: 'comp-rak',
      batch_id: 'b-e2e',
      item_id: 'item-feed',
      uom_id: 'uom-kg',
      warehouse_id: 'wh-main',
      location_id: 'loc-rm',
      planned_qty: 2000,
      qty: 2000,
    };

    const result = await materialService.issueBatchMaterials(issueDto, 't-e2e', 'user-1');
    expect(result.input.total_cost).toBe('5000.0000');
    expect(mockGoodsIssueService.post).toHaveBeenCalled();
  });

  it('3. Should execute quality inspection, pass mandatory limits, and generate cryptographic QR code', async () => {
    const qcDto = {
      company_id: 'comp-rak',
      batch_id: 'b-e2e',
      sample_size: 50,
      results: [{ parameter_id: 'p-weight', measured_value: 2.10 }],
    };

    const qcResult = await qcService.executeInspection(qcDto, 't-e2e', 'user-1');
    expect(qcResult.overall_result).toBe('PASSED');

    const qrDto = {
      company_id: 'comp-rak',
      barcode_type: BarcodeTypeEnum.QR_CODE,
      entity_type: EntityTypeEnum.BATCH,
      entity_id: 'b-e2e',
      payload_metadata: { farm: 'RAK Main Farm', product: 'Dressed Broiler Meat' },
    };

    const qrResult = await qrService.generateQrBarcode(qrDto, 't-e2e');
    expect(qrResult.qr_code_hash).toContain('NAV-QR_CODE-');
  });

  it('4. Should process multi-output slaughter yield and allocate joint costs across products', async () => {
    const slaughterDto = {
      company_id: 'comp-rak',
      poultry_batch_id: 'pb-1',
      warehouse_id: 'wh-slaughter',
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

    const slaughterRes = await slaughterService.recordMultiOutputSlaughterYield(slaughterDto, 't-e2e', 'user-1');
    expect(slaughterRes.outputs.length).toBe(3);
    expect(slaughterRes.slaughter.yield_pct).toBe('75.00');
  });

  it('5. Should verify unauthenticated public consumer QR scan and return sanitized farm-to-fork lineage', async () => {
    const publicTrace = await qrService.getPublicTraceability('NAV-QR-RAK-001');
    expect(publicTrace.qr_code).toBe('NAV-QR-RAK-001');
    expect(publicTrace.batch_number).toBe('RAK-BATCH-2026-001');
    expect(publicTrace.quality_verification).toBe('PASSED_AND_VERIFIED');
    expect((publicTrace as any).tenant_id).toBeUndefined();
    expect((publicTrace as any).company_id).toBeUndefined();
  });

  it('6. Should close batch, reconcile WIP, and compile balanced Trial Balance & P&L reports', async () => {
    mockDb.select.mockReset();
    mockDb.select.mockImplementation(() =>
      createQueryChain([
        {
          batch_id: 'b-e2e',
          batch_no: 'RAK-BATCH-2026-001',
          lob_id: 'lob-1',
          status: 'FINISHED',
          costing_method: 'STANDARD',
          costing_method_snapshot: 'STANDARD',
          qc_required: 'NO',
          qr_required: 'NO',
          totalWip: '5000.00',
          totalOutput: '5000.00',
          total_material_cost: '5000.00',
          total_resource_cost: '0.00',
          actual_cost: '5000.00',
          total_cost: '5000.00',
          gl_account_id: 'gl-inv-wip',
          account_code: '1410',
          account_name: 'WIP Inventory',
          account_type: 'ASSET',
          totalDebits: '5000.00',
          totalCredits: '5000.00',
        },
      ]),
    );

    const closeRes = await costingService.closeBatch('b-e2e', 'comp-rak', 't-e2e', 'user-1');
    expect(closeRes.success).toBe(true);

    const tbReport = await financeReportService.getTrialBalanceReport('comp-rak', 't-e2e');
    expect(tbReport.is_balanced).toBe(true);
    expect(tbReport.total_debit).toBe(5000);
    expect(tbReport.total_credit).toBe(5000);
  });
});
