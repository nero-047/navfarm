import { Test, TestingModule } from '@nestjs/testing';
import { ReportFrameworkService } from './services/report-framework.service';
import { InventoryReportService } from './services/inventory-report.service';
import { ProductionReportService } from './services/production-report.service';
import { FinanceReportService } from './services/finance-report.service';
import { PoultryReportService } from './services/poultry-report.service';
import { VarianceAuditReportService } from './services/variance-audit-report.service';
import { DashboardBiService } from './services/dashboard-bi.service';
import { ReportExporterService } from './services/report-exporter.service';
import { ClsService } from 'nestjs-cls';

describe('Enterprise Reporting & Business Intelligence Engine Unit Tests', () => {
  let frameworkService: ReportFrameworkService;
  let invReportService: InventoryReportService;
  let finReportService: FinanceReportService;
  let dashBiService: DashboardBiService;
  let exporterService: ReportExporterService;

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
        ReportFrameworkService,
        InventoryReportService,
        ProductionReportService,
        FinanceReportService,
        PoultryReportService,
        VarianceAuditReportService,
        DashboardBiService,
        ReportExporterService,
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    frameworkService = module.get<ReportFrameworkService>(ReportFrameworkService);
    invReportService = module.get<InventoryReportService>(InventoryReportService);
    finReportService = module.get<FinanceReportService>(FinanceReportService);
    dashBiService = module.get<DashboardBiService>(DashboardBiService);
    exporterService = module.get<ReportExporterService>(ReportExporterService);

    jest.clearAllMocks();
  });

  it('should create category and register analytical report definition', async () => {
    const catDto = {
      category_code: 'CAT-INV-01',
      category_name: 'Inventory Analytics',
    };

    const cat = await frameworkService.createCategory(catDto);
    expect(cat.category_code).toBe('CAT-INV-01');

    const repDto = {
      company_id: 'comp-1',
      category_id: 'cat-1',
      report_code: 'REP-INV-001',
      report_name: 'Stock Summary Report',
      data_source_service: 'InventoryReportService',
    };

    const rep = await frameworkService.registerReport(repDto, 'tenant-1');
    expect(rep.report_code).toBe('REP-INV-001');
  });

  it('should generate inventory valuation FIFO report', async () => {
    mockDb.select
      .mockReturnValueOnce(createQueryChain([{ item_id: 'i-1', item_code: 'FEED-01' }]))
      .mockReturnValueOnce(
        createQueryChain([
          {
            lot_number: 'LOT-100',
            item_id: 'i-1',
            remaining_qty: '100.0000',
            unit_cost: '25.5000',
          },
        ])
      );

    const report = await invReportService.getInventoryValuationFifoReport('comp-1', 'tenant-1');
    expect(report.total_inventory_valuation).toBe(2550.0);
  });

  it('should generate financial P&L statement report', async () => {
    mockDb.select.mockReturnValueOnce(
      createQueryChain([
        { account_id: 'a-1', account_type: 'REVENUE', balance_debit: '0.00', balance_credit: '10000.00' },
        { account_id: 'a-2', account_type: 'EXPENSE', balance_debit: '6000.00', balance_credit: '0.00' },
      ])
    );

    const report = await finReportService.getProfitAndLossReport('comp-1', 'tenant-1');
    expect(report.total_revenue).toBe(10000.0);
    expect(report.total_expenses).toBe(6000.0);
    expect(report.net_profit).toBe(4000.0);
  });

  it('should create interactive BI dashboard with widgets', async () => {
    const dto = {
      company_id: 'comp-1',
      dashboard_name: 'Executive Overview',
      dashboard_type: 'EXECUTIVE',
      widgets: [
        { widget_title: 'Revenue Trend', widget_type: 'LINE_CHART' },
      ],
    };

    const dash = await dashBiService.createDashboard(dto, 'tenant-1', 'user-1');
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // Dashboard + Widget
    expect(dash.dashboard_name).toBe('Executive Overview');
  });

  it('should export analytical report into PDF format', async () => {
    const exportResult = await exporterService.exportReport('comp-1', 'rep-1', 'PDF', 'tenant-1', 'user-1');
    expect(exportResult.export_format).toBe('PDF');
    expect(exportResult.download_url).toContain('/reporting/download/');
  });
});
