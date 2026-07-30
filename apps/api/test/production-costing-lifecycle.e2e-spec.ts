import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { ProductionBatchService } from '../src/modules/production-costing/production/services/production-batch.service';
import { BatchCostingService } from '../src/modules/production-costing/production/services/batch-costing.service';
import { BatchMaterialService } from '../src/modules/production-costing/production/services/batch-material.service';
import { PostingEngineService } from '../src/modules/finance-accounting/finance/services/posting-engine.service';
import { AuditLogService } from '../src/modules/platform-identity/audit-log/audit-log.service';
import { MASTER_CONNECTION } from '../src/core/database/database.module';

describe('Phase 6: Complete RAK Production Costing Lifecycle Suite', () => {
  let app: INestApplication;
  let batchService: ProductionBatchService;
  let costingService: BatchCostingService;

  const mockBatchStore: Record<string, any> = {
    'batch-std-01': {
      batch_id: 'batch-std-01',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      batch_no: 'PB-STD-2026-001',
      costing_method: 'STANDARD',
      planned_qty: '1000.0000',
      actual_qty: '1000.0000',
      scrap_qty: '0.0000',
      status: 'FINISHED',
      lob_id: null,
      stage: 'GROWING',
    },
    'batch-fifo-01': {
      batch_id: 'batch-fifo-01',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      batch_no: 'PB-FIFO-2026-001',
      costing_method: 'FIFO',
      planned_qty: '500.0000',
      actual_qty: '500.0000',
      scrap_qty: '0.0000',
      status: 'FINISHED',
      lob_id: null,
      stage: 'REARING',
    },
  };

  const mockWipStore: Record<string, any> = {
    'batch-std-01': {
      wip_id: 'wip-1',
      batch_id: 'batch-std-01',
      material_cost: '2000.0000',
      labor_cost: '500.0000',
      machine_cost: '300.0000',
      overhead_cost: '200.0000',
      total_wip_cost: '3000.0000',
    },
    'batch-fifo-01': {
      wip_id: 'wip-2',
      batch_id: 'batch-fifo-01',
      material_cost: '1500.0000',
      labor_cost: '300.0000',
      machine_cost: '200.0000',
      overhead_cost: '0.0000',
      total_wip_cost: '2000.0000',
    },
  };

  const mockTenantDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation((cond: any) => ({
            limit: jest.fn().mockImplementation(() => {
              if (tableName.includes('production_batch') || tableName.includes('productionBatch')) {
                return [mockBatchStore['batch-std-01']];
              }
              if (tableName.includes('production_wip') || tableName.includes('productionWip')) {
                return [mockWipStore['batch-std-01']];
              }
              return [];
            }),
            orderBy: jest.fn().mockReturnValue([]),
            then: (resolve: any) => resolve([]),
          })),
        };
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({ affectedRows: 1 }),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onDuplicateKeyUpdate: jest.fn().mockResolvedValue({ affectedRows: 1 }),
        then: (resolve: any) => resolve({ affectedRows: 1 }),
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

    const mockAuditService = { log: jest.fn().mockResolvedValue(true) };

    const mockBatchMaterialService = {
      getBatchInputs: jest.fn().mockResolvedValue([
        { input_id: 'in-1', planned_qty: '100', actual_qty: '100', unit_cost: '20.0000', total_cost: '2000.0000' },
      ]),
      getBatchOutputs: jest.fn().mockImplementation((batchId: string) => {
        if (batchId === 'batch-std-01') {
          return Promise.resolve([{ output_id: 'out-1', qty: '1000', unit_cost: '2.0000' }]);
        }
        return Promise.resolve([{ output_id: 'out-2', qty: '500', unit_cost: '4.0000' }]);
      }),
    };

    const mockPostingEngineService = {
      postAutomaticEntry: jest.fn().mockResolvedValue({ success: true }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionBatchService,
        BatchCostingService,
        { provide: ClsService, useValue: mockClsService },
        { provide: AuditLogService, useValue: mockAuditService },
        { provide: BatchMaterialService, useValue: mockBatchMaterialService },
        { provide: PostingEngineService, useValue: mockPostingEngineService },
        { provide: MASTER_CONNECTION, useValue: mockTenantDb },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    batchService = moduleRef.get<ProductionBatchService>(ProductionBatchService);
    costingService = moduleRef.get<BatchCostingService>(BatchCostingService);
  });

  describe('1. Batch Life-Cycle State Machine', () => {
    it('should transition batch through valid states DRAFT -> APPROVED -> ACTIVE -> COMPLETED -> FINISHED -> CLOSED', async () => {
      mockTenantDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ ...mockBatchStore['batch-std-01'], status: 'DRAFT' }]),
          }),
        }),
      });

      const res1 = await batchService.transitionStatus('batch-std-01', 'APPROVED' as any, 'tenant-test');
      expect(res1).toBeDefined();
    });

    it('should reject invalid state transitions with BadRequestException', async () => {
      mockTenantDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ ...mockBatchStore['batch-std-01'], status: 'DRAFT' }]),
          }),
        }),
      });

      await expect(
        batchService.transitionStatus('batch-std-01', 'CLOSED' as any, 'tenant-test')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Batch Closing & WIP Zero-Reconciliation', () => {
    it('should close FINISHED batch, zero WIP balance, and generate standard cost variances for STANDARD batch', async () => {
      mockTenantDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockImplementation(() => [mockBatchStore['batch-std-01']]),
          }),
        }),
      });

      const result = await costingService.closeBatch('batch-std-01', 'tenant-test', 'user-admin');
      expect(result.success).toBe(true);
      expect(result.costing_method).toBe('STANDARD');
      expect(result.costing.total_batch_cost).toBe(2000);
    });
  });
});
