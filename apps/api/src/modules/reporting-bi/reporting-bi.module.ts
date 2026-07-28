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
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceModule } from '../finance/finance.module';
import { ProductionModule } from '../production/production.module';
import { PoultryModule } from '../poultry/poultry.module';
import { CostingModule } from '../costing/costing.module';
import { QualityTraceabilityModule } from '../quality-traceability/quality-traceability.module';
import { SchedulerKpiModule } from '../scheduler-kpi/scheduler-kpi.module';

@Module({
  imports: [
    InventoryModule,
    FinanceModule,
    ProductionModule,
    PoultryModule,
    CostingModule,
    QualityTraceabilityModule,
    SchedulerKpiModule,
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
  ],
})
export class ReportingBiModule {}
