import { Module } from '@nestjs/common';
import { CostingProfileController } from './controllers/costing-profile.controller';
import { InventoryValuationController } from './controllers/inventory-valuation.controller';
import { BatchCostingController } from './controllers/batch-costing.controller';
import { BiologicalAssetCostingController } from './controllers/biological-asset-costing.controller';
import { VarianceAnalysisController } from './controllers/variance-analysis.controller';
import { CostingReportController } from './controllers/costing-report.controller';
import { CostingProfileService } from './services/costing-profile.service';
import { InventoryValuationService } from './services/inventory-valuation.service';
import { BatchCostingEngineService } from './services/batch-costing-engine.service';
import { BiologicalAssetCostingService } from './services/biological-asset-costing.service';
import { VarianceAnalysisService } from './services/variance-analysis.service';
import { CostingReportService } from './services/costing-report.service';
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceModule } from '../finance/finance.module';
import { ProductionModule } from '../production/production.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    InventoryModule,
    FinanceModule,
    ProductionModule,
    AuditLogModule,
  ],
  controllers: [
    CostingProfileController,
    InventoryValuationController,
    BatchCostingController,
    BiologicalAssetCostingController,
    VarianceAnalysisController,
    CostingReportController,
  ],
  providers: [
    CostingProfileService,
    InventoryValuationService,
    BatchCostingEngineService,
    BiologicalAssetCostingService,
    VarianceAnalysisService,
    CostingReportService,
  ],
  exports: [
    CostingProfileService,
    InventoryValuationService,
    BatchCostingEngineService,
    BiologicalAssetCostingService,
    VarianceAnalysisService,
    CostingReportService,
  ],
})
export class CostingModule {}
