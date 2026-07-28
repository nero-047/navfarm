import { Module } from '@nestjs/common';
import { ProductionOrderController } from './controllers/production-order.controller';
import { ProductionBatchController } from './controllers/production-batch.controller';
import { ProductionReportController } from './controllers/production-report.controller';
import { ProductionOrderService } from './services/production-order.service';
import { ProductionBatchService } from './services/production-batch.service';
import { BatchMaterialService } from './services/batch-material.service';
import { BatchCostingService } from './services/batch-costing.service';
import { ProductionReportService } from './services/production-report.service';
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceModule } from '../finance/finance.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    InventoryModule,
    FinanceModule,
    AuditLogModule,
  ],
  controllers: [
    ProductionOrderController,
    ProductionBatchController,
    ProductionReportController,
  ],
  providers: [
    ProductionOrderService,
    ProductionBatchService,
    BatchMaterialService,
    BatchCostingService,
    ProductionReportService,
  ],
  exports: [
    ProductionOrderService,
    ProductionBatchService,
    BatchMaterialService,
    BatchCostingService,
    ProductionReportService,
  ],
})
export class ProductionModule {}
