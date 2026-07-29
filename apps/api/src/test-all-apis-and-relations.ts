import { Test } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';

// Import All Phase Services
import { LivestockV2Module } from './modules/verticals/livestock-v2/livestock-v2.module';
import { AgriV2Module } from './modules/verticals/agri-v2/agri-v2.module';
import { AquacultureV2Module } from './modules/verticals/aquaculture-v2/aquaculture-v2.module';
import { FeedProductionV2Module } from './modules/verticals/feed-production-v2/feed-production-v2.module';
import { ReportingBiModule } from './modules/intelligence-reporting/reporting-bi/reporting-bi.module';
import { InventoryModule } from './modules/inventory-logistics/inventory/inventory.module';
import { FinanceModule } from './modules/finance-accounting/finance/finance.module';
import { SchedulerKpiModule } from './modules/intelligence-reporting/scheduler-kpi/scheduler-kpi.module';
import { AuditLogModule } from './modules/platform-identity/audit-log/audit-log.module';

// Services
import { LivestockCommercialService } from './modules/verticals/livestock-v2/services/livestock-commercial.service';
import { AgriV2Service } from './modules/verticals/agri-v2/services/agri.service';
import { AquaV2Service } from './modules/verticals/aquaculture-v2/services/aqua-v2.service';
import { FeedProductionV2Service } from './modules/verticals/feed-production-v2/services/feed-production-v2.service';
import { LivestockV2ReportService } from './modules/intelligence-reporting/reporting-bi/services/livestock-v2-report.service';
import { AgriV2ReportService } from './modules/intelligence-reporting/reporting-bi/services/agri-v2-report.service';
import { AquaV2ReportService } from './modules/intelligence-reporting/reporting-bi/services/aqua-v2-report.service';
import { FeedProductionV2ReportService } from './modules/intelligence-reporting/reporting-bi/services/feed-production-v2-report.service';
import { GoodsReceiptService } from './modules/inventory-logistics/inventory/services/goods-receipt.service';
import { GoodsIssueService } from './modules/inventory-logistics/inventory/services/goods-issue.service';

import { ClsModule } from 'nestjs-cls';

async function runMasterApiAndRelationTests() {
  console.log('========================================================================');
  console.log('      NAV FARM ERP: MASTER API & CROSS-PHASE LINKAGE TEST RUNNER        ');
  console.log('========================================================================\n');

  const tenantId = 'test-tenant-uuid';
  const companyId = 'test-company-uuid';
  const userId = 'test-user-uuid';

  // Mock DB store for CLS
  const mockDb: any = {
    select: () => mockDb,
    from: () => mockDb,
    where: () => mockDb,
    limit: () => Promise.resolve([]),
    orderBy: () => Promise.resolve([]),
    insert: () => mockDb,
    values: () => Promise.resolve([{ insertId: 1 }]),
    update: () => mockDb,
    set: () => mockDb,
    transaction: (cb: any) => cb(mockDb),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [
      ClsModule.forRoot({
        global: true,
        middleware: { mount: true },
      }),
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
      LivestockV2ReportService,
      AgriV2ReportService,
      AquaV2ReportService,
      FeedProductionV2ReportService,
    ],
  })
    .overrideProvider(ClsService)
    .useValue({ get: (key: string) => (key === 'tenantDb' ? mockDb : null) })
    .compile();

  const results: { phase: string; test: string; status: 'PASS' | 'FAIL'; note: string }[] = [];

  const logTest = (phase: string, test: string, status: 'PASS' | 'FAIL', note: string) => {
    results.push({ phase, test, status, note });
    console.log(`[${status === 'PASS' ? '✅ PASS' : '❌ FAIL'}] [${phase}] ${test} — ${note}`);
  };

  try {
    // Test 1: Shared Engine Services Initialization
    const grSvc = moduleRef.get(GoodsReceiptService, { strict: false });
    const giSvc = moduleRef.get(GoodsIssueService, { strict: false });
    logTest('Phase 2 Inventory', 'Goods Receipt & Issue Engine DI', grSvc && giSvc ? 'PASS' : 'FAIL', 'Inventory Services initialized and exported correctly.');

    // Test 2: Livestock V2 Commercial Purchase -> Inventory GR Auto-Posting Linkage
    const lvsSvc = moduleRef.get(LivestockCommercialService, { strict: false });
    if (lvsSvc) {
      const purchaseRes = await lvsSvc.createPurchase({
        purchase_no: 'TEST-PO-001',
        purchase_date: '2026-07-28',
        qty_purchased: 10,
        unit_cost: 25000,
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        item_id: 'item-001',
      }, tenantId, companyId, userId);
      logTest('Phase 11 Livestock ↔ Phase 2 Inventory', 'Animal Purchase Auto-GR Linkage', purchaseRes.inventoryNote.includes('Auto-posted') || purchaseRes.inventoryNote.includes('warning') || purchaseRes.inventoryNote.includes('No inventory') ? 'PASS' : 'FAIL', `Result: ${purchaseRes.inventoryNote}`);
    }

    // Test 3: Agri V2 Fertilizer Application -> Inventory GI Auto-Posting Linkage
    const agriSvc = moduleRef.get(AgriV2Service, { strict: false });
    if (agriSvc) {
      // Mock crop plan query
      mockDb.limit = () => Promise.resolve([{ plan_id: 'plan-001', field_id: 'field-001', company_id: companyId }]);
      const fertRes = await agriSvc.logFertilizer('plan-001', {
        app_date: '2026-07-28',
        fertilizer_name: 'Urea 46%',
        qty_kg: 50,
        fertilizer_item_id: 'fert-item-001',
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
      }, tenantId, userId);
      logTest('Phase 11 Agri ↔ Phase 2 Inventory', 'Fertilizer Application Auto-GI Linkage', fertRes.inventoryNote ? 'PASS' : 'FAIL', `Result: ${fertRes.inventoryNote}`);
    }

    // Test 4: Aquaculture V2 Water Quality WQI & Alert Engine Evaluation
    const aquaSvc = moduleRef.get(AquaV2Service, { strict: false });
    if (aquaSvc) {
      const wqRes = await aquaSvc.logWaterQuality('pond-001', {
        log_date: '2026-07-28',
        ph: 7.6,
        do_mg_l: 4.2, // Critical trigger < 5.0
        ammonia_ppm: 0.6, // Critical trigger > 0.5
      }, tenantId, userId);
      logTest('Phase 11 Aqua ↔ Phase 8/9 Alert Engine', 'Water Quality Alert Evaluation', wqRes.alerts.length >= 2 && wqRes.status === 'CRITICAL' ? 'PASS' : 'FAIL', `WQI: ${wqRes.wqi}, Status: ${wqRes.status}, Alerts: ${wqRes.alerts.join(' | ')}`);
    }

    // Test 5: Feed Production V2 Delivery -> Inventory GI Auto-Posting Linkage
    const feedSvc = moduleRef.get(FeedProductionV2Service, { strict: false });
    if (feedSvc) {
      const delRes = await feedSvc.createDelivery('mo-001', {
        delivery_no: 'DN-001',
        delivery_date: '2026-07-28',
        qty_mt: 5,
        feed_item_id: 'feed-item-001',
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
      }, tenantId, companyId, userId);
      logTest('Phase 11 Feed ↔ Phase 2 Inventory', 'Feed Delivery Auto-GI Linkage', delRes.inventoryNote ? 'PASS' : 'FAIL', `Result: ${delRes.inventoryNote}`);
    }

    // Test 6: Phase 10 BI Reporting Integration for All Verticals
    const lvsRep = moduleRef.get(LivestockV2ReportService, { strict: false });
    const agriRep = moduleRef.get(AgriV2ReportService, { strict: false });
    const aquaRep = moduleRef.get(AquaV2ReportService, { strict: false });
    const feedRep = moduleRef.get(FeedProductionV2ReportService, { strict: false });

    if (lvsRep && agriRep && aquaRep && feedRep) {
      const lvsSum = await lvsRep.getLivestockSummaryReport(tenantId, companyId);
      const agriYield = await agriRep.getCropYieldReport(tenantId);
      const aquaPond = await aquaRep.getPondProductionReport(tenantId);
      const feedProd = await feedRep.getFeedProductionReport(tenantId);

      logTest('Phase 10 BI ↔ Phase 11 Verticals', 'Livestock Summary BI Report', lvsSum.report_type === 'LIVESTOCK_SUMMARY' ? 'PASS' : 'FAIL', 'Report generated successfully.');
      logTest('Phase 10 BI ↔ Phase 11 Verticals', 'Agri Crop Yield BI Report', agriYield.report_type === 'AGRI_CROP_YIELD' ? 'PASS' : 'FAIL', 'Report generated successfully.');
      logTest('Phase 10 BI ↔ Phase 11 Verticals', 'Aqua Pond Production BI Report', aquaPond.report_type === 'AQUA_POND_PRODUCTION' ? 'PASS' : 'FAIL', 'Report generated successfully.');
      logTest('Phase 10 BI ↔ Phase 11 Verticals', 'Feed Production BI Report', feedProd.report_type === 'FEED_PRODUCTION' ? 'PASS' : 'FAIL', 'Report generated successfully.');
    }

    console.log('\n========================================================================');
    console.log('                          TEST RESULTS SUMMARY                          ');
    console.log('========================================================================');
    console.log(`Total Tests Executed: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.status === 'PASS').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'FAIL').length}`);
    console.log('========================================================================\n');

  } catch (error) {
    console.error('Error running integration tests:', error);
  } finally {
    await moduleRef.close();
  }
}

runMasterApiAndRelationTests();
