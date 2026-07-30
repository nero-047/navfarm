import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { QualityInspectionService } from '../src/modules/quality-traceability/services/quality-inspection.service';
import { QrBarcodeEngineService } from '../src/modules/quality-traceability/services/qr-barcode-engine.service';

describe('Phase 7: Quality & Farm-to-Fork Traceability Suite', () => {
  let app: INestApplication;
  let qcService: QualityInspectionService;
  let qrEngine: QrBarcodeEngineService;

  const mockQrStore: Record<string, any> = {
    'NAV-QR-1001': {
      qr_id: 'qr-1',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      qr_code_hash: 'NAV-QR-1001',
      barcode_type: 'QR',
      entity_type: 'BATCH',
      entity_id: 'batch-001',
      payload_json: { item_name: 'Fresh Farm Whole Chicken', batch_no: 'PB-2026-001' },
      scanned_count: 0,
      created_at: '2026-07-30T10:00:00.000Z',
    },
  };

  const mockBatchStore: Record<string, any> = {
    'batch-001': {
      batch_id: 'batch-001',
      batch_no: 'PB-2026-001',
      stage: 'PACKAGED',
      farm_id: 'farm-001',
      created_at: '2026-07-30T08:00:00.000Z',
    },
  };

  const mockFarmStore: Record<string, any> = {
    'farm-001': {
      farm_id: 'farm-001',
      farm_name: 'Green Valley Poultry Farm',
    },
  };

  const mockInspectionsStore: any[] = [
    { inspection_id: 'qc-1', batch_id: 'batch-001', overall_result: 'PASSED' },
  ];

  const mockTenantDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation((cond: any) => {
            const data = (tableName.includes('quality_inspection') || tableName.includes('qualityInspection'))
              ? mockInspectionsStore
              : [];
            const p = Promise.resolve(data) as any;
            p.limit = jest.fn().mockImplementation(() => {
              if (tableName.includes('qr_barcode_master') || tableName.includes('qrBarcodeMaster')) {
                return Promise.resolve([mockQrStore['NAV-QR-1001']]);
              }
              if (tableName.includes('production_batch') || tableName.includes('productionBatch')) {
                return Promise.resolve([mockBatchStore['batch-001']]);
              }
              if (tableName.includes('farm_master') || tableName.includes('farmMaster')) {
                return Promise.resolve([mockFarmStore['farm-001']]);
              }
              return Promise.resolve([]);
            });
            return p;
          }),
        };
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue({ affectedRows: 1 }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({ affectedRows: 1 }),
      }),
    }),
  };

  beforeEach(async () => {
    const clsStore = new Map<string, any>();
    clsStore.set('tenantDb', mockTenantDb);

    const mockClsService = {
      set: jest.fn((k, v) => clsStore.set(k, v)),
      get: jest.fn((k) => clsStore.get(k)),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        QualityInspectionService,
        QrBarcodeEngineService,
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    qcService = moduleRef.get<QualityInspectionService>(QualityInspectionService);
    qrEngine = moduleRef.get<QrBarcodeEngineService>(QrBarcodeEngineService);
  });

  describe('1. Public Consumer QR Scan & Lineage Resolution', () => {
    it('should return real consumer-safe lineage without hardcoded sample fallbacks', async () => {
      mockTenantDb.select.mockImplementation(() => ({
        from: jest.fn().mockImplementation((table: any) => {
          const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
          const data = (tableName.includes('quality_inspection') || tableName.includes('qualityInspection'))
            ? mockInspectionsStore
            : [];
          const p = Promise.resolve(data) as any;
          p.limit = jest.fn().mockImplementation(() => {
            if (tableName.includes('qr_barcode_master') || tableName.includes('qrBarcodeMaster')) {
              return Promise.resolve([mockQrStore['NAV-QR-1001']]);
            }
            if (tableName.includes('production_batch') || tableName.includes('productionBatch')) {
              return Promise.resolve([mockBatchStore['batch-001']]);
            }
            if (tableName.includes('farm_master') || tableName.includes('farmMaster')) {
              return Promise.resolve([mockFarmStore['farm-001']]);
            }
            return Promise.resolve([]);
          });
          return {
            where: jest.fn().mockReturnValue(p),
          };
        }),
      }));

      const result = await qrEngine.getPublicTraceability('NAV-QR-1001');

      expect(result.qr_code).toBe('NAV-QR-1001');
      expect(result.product_name).toBe('Fresh Farm Whole Chicken');
      expect(result.batch_number).toBe('PB-2026-001');
      expect(result.quality_verification).toBe('PASSED_AND_VERIFIED');
      expect(result.scanned_count).toBe(1);
    });

    it('should throw NotFoundException for unregistered or invalid QR hashes', async () => {
      mockTenantDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(() => {
            const p = Promise.resolve([]) as any;
            p.limit = jest.fn().mockResolvedValue([]);
            return p;
          }),
        }),
      }));

      await expect(qrEngine.getPublicTraceability('INVALID-HASH')).rejects.toThrow(NotFoundException);
    });
  });

  describe('2. QC Gate Validation', () => {
    it('should confirm QC passed for a batch with PASSED quality inspection', async () => {
      mockTenantDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockInspectionsStore),
        }),
      });

      const passed = await qcService.validateQCPassed('batch-001', 'tenant-test');
      expect(passed).toBe(true);
    });
  });
});
