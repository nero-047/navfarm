import { Module } from '@nestjs/common';
import { ReportFrameworkController } from './controllers/report-framework.controller';
import { InventoryReportController } from './controllers/inventory-report.controller';
import { ProductionReportController } from './controllers/production-report.controller';
import { FinanceReportController } from './controllers/finance-report.controller';
import { PoultryReportController } from './controllers/poultry-report.controller';
import { VarianceAuditReportController } from './controllers/variance-audit-report.controller';
import { DashboardBiController } from './controllers/dashboard-bi.controller';
import { ReportExporterController } from './controllers/report-exporter.controller';
import { ReportFrameworkService } from './services/report-framework.service';
import { InventoryReportService } from './services/inventory-report.service';
import { ProductionReportService } from './services/production-report.service';
import { FinanceReportService } from './services/finance-report.service';
import { PoultryReportService } from './services/poultry-report.service';
import { VarianceAuditReportService } from './services/variance-audit-report.service';
import { DashboardBiService } from './services/dashboard-bi.service';
import { ReportExporterService } from './services/report-exporter.service';
// FIX-007: V2 Vertical Report Services (were dead code — now registered)
import { AgriV2ReportService } from './services/agri-v2-report.service';
import { AquaV2ReportService } from './services/aqua-v2-report.service';
import { LivestockV2ReportService } from './services/livestock-v2-report.service';
import { FeedProductionV2ReportService } from './services/feed-production-v2-report.service';
import { InventoryModule } from '../../inventory-logistics/inventory/inventory.module';
import { ProductionModule } from '../../production-costing/production/production.module';
import { PoultryModule } from '../../verticals/poultry/poultry.module';
import { CostingModule } from '../../production-costing/costing/costing.module';
import { QualityTraceabilityModule } from '../../quality-traceability/quality-traceability.module';
import { SchedulerKpiModule } from '../scheduler-kpi/scheduler-kpi.module';
// FIX-007: V2 Vertical Module imports for BI data access
import { LivestockV2Module } from '../../verticals/livestock-v2/livestock-v2.module';
import { AgriV2Module } from '../../verticals/agri-v2/agri-v2.module';
import { AquacultureV2Module } from '../../verticals/aquaculture-v2/aquaculture-v2.module';
import { FeedProductionV2Module } from '../../verticals/feed-production-v2/feed-production-v2.module';

@Module({
  imports: [
    InventoryModule,
    ProductionModule,
    PoultryModule,
    CostingModule,
    QualityTraceabilityModule,
    SchedulerKpiModule,
    // FIX-007 (GAP-010): V2 vertical modules now imported for BI reporting
    LivestockV2Module,
    AgriV2Module,
    AquacultureV2Module,
    FeedProductionV2Module,
  ],
  controllers: [
    ReportFrameworkController,
    InventoryReportController,
    ProductionReportController,
    FinanceReportController,
    PoultryReportController,
    VarianceAuditReportController,
    DashboardBiController,
    ReportExporterController,
  ],
  providers: [
    ReportFrameworkService,
    InventoryReportService,
    ProductionReportService,
    FinanceReportService,
    PoultryReportService,
    VarianceAuditReportService,
    DashboardBiService,
    ReportExporterService,
    // FIX-007 (GAP-052): V2 report services — previously dead code, now registered
    AgriV2ReportService,
    AquaV2ReportService,
    LivestockV2ReportService,
    FeedProductionV2ReportService,
  ],
  exports: [
    ReportFrameworkService,
    InventoryReportService,
    ProductionReportService,
    FinanceReportService,
    PoultryReportService,
    VarianceAuditReportService,
    DashboardBiService,
    ReportExporterService,
    AgriV2ReportService,
    AquaV2ReportService,
    LivestockV2ReportService,
    FeedProductionV2ReportService,
  ],
})
export class ReportingBiModule {}
