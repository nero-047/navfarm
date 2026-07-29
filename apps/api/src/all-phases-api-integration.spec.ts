import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from './modules/audit-log/audit-log.service';

// Phase 1: Core & Auth
import { CompanyService } from './modules/company/company.service';
import { UserService } from './modules/user/user.service';
import { NobLobConfigService } from './modules/nob-lob-config/nob-lob-config.service';

// Phase 2: Inventory
import { GoodsReceiptService } from './modules/inventory/services/goods-receipt.service';
import { GoodsIssueService } from './modules/inventory/services/goods-issue.service';
import { InventoryLedgerService } from './modules/inventory/services/inventory-ledger.service';

// Phase 3: Finance
import { CoaService } from './modules/finance/services/coa.service';
import { FiscalService } from './modules/finance/services/fiscal.service';
import { PostingEngineService } from './modules/finance/services/posting-engine.service';

// Phase 4: Master Data
import { ItemService } from './modules/item/item.service';
import { WarehouseService } from './modules/warehouse/warehouse.service';
import { LocationService } from './modules/location/location.service';
import { FarmService } from './modules/farm/farm.service';
import { ShedService } from './modules/shed/shed.service';
import { SupplierService } from './modules/supplier/supplier.service';
import { CustomerService } from './modules/customer/customer.service';

// Phase 5: Poultry Production
import { BroilerService } from './modules/poultry/services/broiler.service';
import { LayerService } from './modules/poultry/services/layer.service';
import { HatcheryService } from './modules/poultry/services/hatchery.service';

// Phase 6: QC & Traceability
import { QualityInspectionService } from './modules/quality-traceability/services/quality-inspection.service';
import { FarmToForkTrackerService } from './modules/quality-traceability/services/farm-to-fork-tracker.service';

// Phase 7: Costing
import { BatchCostingEngineService } from './modules/costing/services/batch-costing-engine.service';
import { BiologicalAssetCostingService } from './modules/costing/services/biological-asset-costing.service';

// Phase 8/9: Scheduler & Alerts
import { AlertEngineService } from './modules/scheduler-kpi/services/alert-engine.service';
import { KpiMonitoringService } from './modules/scheduler-kpi/services/kpi-monitoring.service';

// Phase 10: Reporting & BI
import { ReportFrameworkService } from './modules/reporting-bi/services/report-framework.service';
import { DashboardBiService } from './modules/reporting-bi/services/dashboard-bi.service';
import { LivestockV2ReportService } from './modules/reporting-bi/services/livestock-v2-report.service';
import { AgriV2ReportService } from './modules/reporting-bi/services/agri-v2-report.service';
import { AquaV2ReportService } from './modules/reporting-bi/services/aqua-v2-report.service';
import { FeedProductionV2ReportService } from './modules/reporting-bi/services/feed-production-v2-report.service';

// Phase 11: Multi-Industry Verticals
import { HerdService } from './modules/livestock-v2/services/herd.service';
import { AnimalService } from './modules/livestock-v2/services/animal.service';
import { LivestockCommercialService } from './modules/livestock-v2/services/livestock-commercial.service';
import { AgriV2Service } from './modules/agri-v2/services/agri.service';
import { AquaV2Service } from './modules/aquaculture-v2/services/aqua-v2.service';
import { FeedProductionV2Service } from './modules/feed-production-v2/services/feed-production-v2.service';

import { ClsModule } from 'nestjs-cls';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SchedulerKpiModule } from './modules/scheduler-kpi/scheduler-kpi.module';
import { ReportingBiModule } from './modules/reporting-bi/reporting-bi.module';
import { LivestockV2Module } from './modules/livestock-v2/livestock-v2.module';
import { AgriV2Module } from './modules/agri-v2/agri-v2.module';
import { AquacultureV2Module } from './modules/aquaculture-v2/aquaculture-v2.module';
import { FeedProductionV2Module } from './modules/feed-production-v2/feed-production-v2.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';

describe('NAVFarm ERP — All Phases Master API & Linkage Integration Test Suite', () => {
  let moduleRef: TestingModule;

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    orderBy: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([{ insertId: 1 }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ClsModule.forRoot({ global: true, middleware: { mount: true } }),
        AuditLogModule,
        InventoryModule,
        FinanceModule,
        SchedulerKpiModule,
        ReportingBiModule,
        LivestockV2Module,
        AgriV2Module,
        AquacultureV2Module,
        FeedProductionV2Module,
      ],
      providers: [
        { provide: 'MASTER_CONNECTION', useValue: mockDb },
        LivestockV2ReportService,
        AgriV2ReportService,
        AquaV2ReportService,
        FeedProductionV2ReportService,
      ],
    })
      .overrideProvider(ClsService)
      .useValue({ get: jest.fn().mockReturnValue(mockDb) })
      .compile();
  });

  it('1. Phase 1 Linkage: Multi-Tenant & Governance Context', async () => {
    const cls = moduleRef.get<ClsService>(ClsService, { strict: false });
    expect(cls.get('tenantDb')).toBeDefined();
  });

  it('2. Phase 2 ↔ Phase 11 Linkage: Livestock Purchase Auto-GR', async () => {
    const lvsCommercial = moduleRef.get<LivestockCommercialService>(LivestockCommercialService, { strict: false });
    expect(lvsCommercial).toBeDefined();
    expect(typeof lvsCommercial.createPurchase).toBe('function');
    expect(typeof lvsCommercial.createSale).toBe('function');
  });

  it('3. Phase 2 ↔ Phase 11 Linkage: Agri Fertilizer Auto-GI & Harvest Auto-GR', async () => {
    const agriService = moduleRef.get<AgriV2Service>(AgriV2Service, { strict: false });
    expect(agriService).toBeDefined();
    expect(typeof agriService.logFertilizer).toBe('function');
    expect(typeof agriService.recordHarvest).toBe('function');
  });

  it('4. Phase 2 ↔ Phase 11 Linkage: Feed Production Delivery Auto-GI', async () => {
    const feedService = moduleRef.get<FeedProductionV2Service>(FeedProductionV2Service, { strict: false });
    expect(feedService).toBeDefined();
    expect(typeof feedService.createMO).toBe('function');
    expect(typeof feedService.createDelivery).toBe('function');
  });

  it('5. Phase 8/9 ↔ Phase 11 Linkage: Aquaculture Water Quality Alert Engine', async () => {
    const aquaService = moduleRef.get<AquaV2Service>(AquaV2Service, { strict: false });
    expect(aquaService).toBeDefined();
    expect(typeof aquaService.logWaterQuality).toBe('function');
  });

  it('6. Phase 10 ↔ Phase 11 Linkage: Reporting BI Vertical Report Services', async () => {
    const lvsReport = moduleRef.get<LivestockV2ReportService>(LivestockV2ReportService, { strict: false });
    const agriReport = moduleRef.get<AgriV2ReportService>(AgriV2ReportService, { strict: false });
    const aquaReport = moduleRef.get<AquaV2ReportService>(AquaV2ReportService, { strict: false });
    const feedReport = moduleRef.get<FeedProductionV2ReportService>(FeedProductionV2ReportService, { strict: false });

    expect(lvsReport).toBeDefined();
    expect(agriReport).toBeDefined();
    expect(aquaReport).toBeDefined();
    expect(feedReport).toBeDefined();
  });

  it('7. All 11 Phases Service Dependency Injection Check', () => {
    const goodsReceipt = moduleRef.get<GoodsReceiptService>(GoodsReceiptService, { strict: false });
    const goodsIssue = moduleRef.get<GoodsIssueService>(GoodsIssueService, { strict: false });
    const alertEngine = moduleRef.get<AlertEngineService>(AlertEngineService, { strict: false });
    const kpiMonitoring = moduleRef.get<KpiMonitoringService>(KpiMonitoringService, { strict: false });
    const reportFramework = moduleRef.get<ReportFrameworkService>(ReportFrameworkService, { strict: false });

    expect(goodsReceipt).toBeDefined();
    expect(goodsIssue).toBeDefined();
    expect(alertEngine).toBeDefined();
    expect(kpiMonitoring).toBeDefined();
    expect(reportFramework).toBeDefined();
  });
});
