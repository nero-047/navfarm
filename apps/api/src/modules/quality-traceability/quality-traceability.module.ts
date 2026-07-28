import { QualityPlanController } from './controllers/quality-plan.controller';
import { QualityInspectionController } from './controllers/quality-inspection.controller';
import { QrBarcodeController } from './controllers/qr-barcode.controller';
import { BatchTraceabilityController } from './controllers/batch-traceability.controller';
import { FarmToForkController } from './controllers/farm-to-fork.controller';
import { RecallManagementController } from './controllers/recall-management.controller';
import { CapaController } from './controllers/capa.controller';
import { QualityReportController } from './controllers/quality-report.controller';
import { QualityPlanService } from './services/quality-plan.service';
import { QualityInspectionService } from './services/quality-inspection.service';
import { QrBarcodeEngineService } from './services/qr-barcode-engine.service';
import { BatchTraceabilityService } from './services/batch-traceability.service';
import { FarmToForkTrackerService } from './services/farm-to-fork-tracker.service';
import { RecallManagementService } from './services/recall-management.service';
import { CapaService } from './services/capa.service';
import { QualityReportService } from './services/quality-report.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductionModule } from '../production/production.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    InventoryModule,
    ProductionModule,
    AuditLogModule,
  ],
  controllers: [
    QualityPlanController,
    QualityInspectionController,
    QrBarcodeController,
    BatchTraceabilityController,
    FarmToForkController,
    RecallManagementController,
    CapaController,
    QualityReportController,
  ],
  providers: [
    QualityPlanService,
    QualityInspectionService,
    QrBarcodeEngineService,
    BatchTraceabilityService,
    FarmToForkTrackerService,
    RecallManagementService,
    CapaService,
    QualityReportService,
  ],
  exports: [
    QualityPlanService,
    QualityInspectionService,
    QrBarcodeEngineService,
    BatchTraceabilityService,
    FarmToForkTrackerService,
    RecallManagementService,
    CapaService,
    QualityReportService,
  ],
})
export class QualityTraceabilityModule {}
