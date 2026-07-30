import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { ReportExporterService } from '../src/modules/intelligence-reporting/reporting-bi/services/report-exporter.service';
import { FinanceReportService } from '../src/modules/intelligence-reporting/reporting-bi/services/finance-report.service';
import { InventoryReportService } from '../src/modules/intelligence-reporting/reporting-bi/services/inventory-report.service';

describe('Phase 11: RAK Reporting & Analytics Engine Suite', () => {
  let app: INestApplication;
  let exporterService: ReportExporterService;
  let financeReportService: FinanceReportService;
  let inventoryReportService: InventoryReportService;

  const mockGlAccounts = [
    { gl_account_id: 'gl-101', account_code: '1010', account_name: 'Cash in Hand', account_type: 'ASSET' },
    { gl_account_id: 'gl-401', account_code: '4010', account_name: 'Poultry Meat Sales', account_type: 'REVENUE' },
  ];

  const mockTenantDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation((cond: any) => ({
            limit: jest.fn().mockImplementation(() => {
              if (tableName.includes('gl_account_master') || tableName.includes('glAccountMaster')) {
                return mockGlAccounts;
              }
              return [];
            }),
            then: (resolve: any) => {
              if (tableName.includes('gl_account_master') || tableName.includes('glAccountMaster')) {
                return resolve(mockGlAccounts);
              }
              return resolve([]);
            },
          })),
        };
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue({ affectedRows: 1 }),
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
        ReportExporterService,
        FinanceReportService,
        InventoryReportService,
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    exporterService = moduleRef.get<ReportExporterService>(ReportExporterService);
    financeReportService = moduleRef.get<FinanceReportService>(FinanceReportService);
    inventoryReportService = moduleRef.get<InventoryReportService>(InventoryReportService);
  });

  describe('1. Real File Exporter & Byte Size Calculation', () => {
    it('should generate real CSV export with exact byte length and relative download link', async () => {
      const res = await exporterService.exportReport('company-test', 'REP-TB-001', 'CSV', 'tenant-test', 'user-admin');

      expect(res.export_id).toBeDefined();
      expect(res.file_size_bytes).toBeGreaterThan(0);
      expect(res.file_size_bytes).not.toBe(1024 * 45); // Must not be hardcoded 45KB dummy value
      expect(res.download_url).toContain('/api/v1/reporting/download/');
      expect(res.content).toContain('NAVFarm Operational & Financial Report');
    });
  });

  describe('2. Financial Reporting Reconciliation', () => {
    it('should calculate trial balance report for company', async () => {
      const tb = await financeReportService.getTrialBalanceReport('company-test', 'tenant-test');
      expect(tb.company_id).toBe('company-test');
      expect(tb.accounts.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate P&L report for company', async () => {
      const pnl = await financeReportService.getProfitAndLossReport('company-test', 'tenant-test');
      expect(pnl.company_id).toBe('company-test');
      expect(pnl.total_revenue).toBeDefined();
    });
  });
});
