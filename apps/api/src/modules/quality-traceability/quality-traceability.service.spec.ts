import { Test, TestingModule } from '@nestjs/testing';
import { QualityPlanService } from './services/quality-plan.service';
import { QualityInspectionService } from './services/quality-inspection.service';
import { QrBarcodeEngineService } from './services/qr-barcode-engine.service';
import { BatchTraceabilityService } from './services/batch-traceability.service';
import { FarmToForkTrackerService } from './services/farm-to-fork-tracker.service';
import { RecallManagementService } from './services/recall-management.service';
import { CapaService } from './services/capa.service';
import { QualityReportService } from './services/quality-report.service';
import { ClsService } from 'nestjs-cls';
import { InspectionTypeEnum } from './dto/quality-plan.dto';
import { BarcodeTypeEnum, EntityTypeEnum } from './dto/qr-barcode.dto';
import { RecallSeverityEnum } from './dto/recall.dto';

describe('Enterprise Quality & Traceability Engine Unit Tests', () => {
  let planService: QualityPlanService;
  let inspectionService: QualityInspectionService;
  let qrService: QrBarcodeEngineService;
  let traceService: BatchTraceabilityService;
  let recallService: RecallManagementService;

  const createQueryChain = (result: any) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityPlanService,
        QualityInspectionService,
        QrBarcodeEngineService,
        BatchTraceabilityService,
        FarmToForkTrackerService,
        RecallManagementService,
        CapaService,
        QualityReportService,
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    planService = module.get<QualityPlanService>(QualityPlanService);
    inspectionService = module.get<QualityInspectionService>(QualityInspectionService);
    qrService = module.get<QrBarcodeEngineService>(QrBarcodeEngineService);
    traceService = module.get<BatchTraceabilityService>(BatchTraceabilityService);
    recallService = module.get<RecallManagementService>(RecallManagementService);

    jest.clearAllMocks();
  });

  it('should create a quality inspection plan with test parameters', async () => {
    const dto = {
      company_id: 'comp-1',
      plan_code: 'PLAN-EGG-01',
      plan_name: 'Egg Shell Integrity & Weight Inspection',
      inspection_type: InspectionTypeEnum.INCOMING,
      parameters: [
        { parameter_name: 'Weight', min_value: 50, max_value: 70, is_mandatory: true },
      ],
    };

    const result = await planService.createQualityPlan(dto, 'tenant-1');
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // Plan + Parameter
    expect(result.plan_code).toBe('PLAN-EGG-01');
  });

  it('should execute quality inspection and evaluate mandatory parameter failure as QUARANTINE', async () => {
    mockDb.select.mockReturnValueOnce(
      createQueryChain([
        {
          parameter_id: 'p-1',
          parameter_name: 'Weight',
          min_value: '50.0000',
          max_value: '70.0000',
          is_mandatory: true,
        },
      ])
    );

    const dto = {
      company_id: 'comp-1',
      plan_id: 'plan-1',
      sample_size: 10,
      results: [{ parameter_id: 'p-1', measured_value: 45 }], // Below 50
      warehouse_id: 'wh-quarantine',
      location_id: 'loc-01',
      hold_qty: 100,
    };

    const result = await inspectionService.executeInspection(dto, 'tenant-1', 'user-1');
    expect(result.overall_result).toBe('QUARANTINE');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should validate QC pass gate correctly for batch release', async () => {
    mockDb.select.mockReturnValueOnce(
      createQueryChain([{ inspection_id: 'i-1', overall_result: 'PASSED' }])
    );

    const isPassed = await inspectionService.validateQCPassed('batch-1', 'tenant-1');
    expect(isPassed).toBe(true);
  });

  it('should generate secure cryptographic QR / GS1 barcode hash', async () => {
    const dto = {
      company_id: 'comp-1',
      barcode_type: BarcodeTypeEnum.QR_CODE,
      entity_type: EntityTypeEnum.BATCH,
      entity_id: 'batch-uuid-1',
      payload_metadata: { farm: 'Green Valley' },
    };

    const result = await qrService.generateQrBarcode(dto, 'tenant-1');
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result.qr_code_hash).toContain('NAV-QR_CODE-');
  });

  it('should resolve public consumer traceability payload omitting sensitive internal IDs', async () => {
    mockDb.select
      .mockReturnValueOnce(createQueryChain([{ qr_id: 'qr-1', qr_code_hash: 'NAV-QR-123', entity_id: 'b-1', scanned_count: 0 }]))
      .mockReturnValueOnce(createQueryChain([{ batch_id: 'b-1', batch_no: 'B-2026-001', stage: 'HARVESTED' }]))
      .mockReturnValueOnce(createQueryChain([{ inspection_id: 'i-1', overall_result: 'PASSED' }]));

    const publicPayload = await qrService.getPublicTraceability('NAV-QR-123');
    expect(publicPayload.qr_code).toBe('NAV-QR-123');
    expect(publicPayload.batch_number).toBe('B-2026-001');
    expect(publicPayload.quality_verification).toBe('PASSED_AND_VERIFIED');
    expect((publicPayload as any).tenant_id).toBeUndefined();
    expect((publicPayload as any).company_id).toBeUndefined();
  });

  it('should log supply chain traceability movement event', async () => {
    mockDb.select.mockReturnValueOnce(createQueryChain([]));

    const dto = {
      company_id: 'comp-1',
      batch_id: 'batch-uuid-1',
      event_type: 'EGG_HARVEST',
      event_details: { count: 8500 },
    };

    const result = await traceService.recordTraceabilityEvent(dto, 'tenant-1');
    expect(result.event_type).toBe('EGG_HARVEST');
  });

  it('should initiate product recall and place affected inventory on quarantine hold', async () => {
    const dto = {
      company_id: 'comp-1',
      recall_number: 'RECALL-2026-001',
      reason: 'Pathogen risk in raw material lot',
      severity: RecallSeverityEnum.CLASS_1_HIGH,
      affected_batch_ids: ['batch-1', 'batch-2'],
    };

    const result = await recallService.initiateRecall(dto, 'tenant-1', 'user-1');
    expect(result.status).toBe('STOCK_BLOCKED');
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
