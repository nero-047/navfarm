import { Module } from '@nestjs/common';
import { RearingController } from './controllers/rearing.controller';
import { LayerController } from './controllers/layer.controller';
import { HatcheryController } from './controllers/hatchery.controller';
import { BroilerController } from './controllers/broiler.controller';
import { SlaughterController } from './controllers/slaughter.controller';
import { PoultryReportController } from './controllers/poultry-report.controller';
import { RearingService } from './services/rearing.service';
import { LayerService } from './services/layer.service';
import { HatcheryService } from './services/hatchery.service';
import { BroilerService } from './services/broiler.service';
import { SlaughterService } from './services/slaughter.service';
import { PoultryKpiService } from './services/poultry-kpi.service';
import { ProductionModule } from '../production/production.module';
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceModule } from '../finance/finance.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    ProductionModule,
    InventoryModule,
    FinanceModule,
    AuditLogModule,
  ],
  controllers: [
    RearingController,
    LayerController,
    HatcheryController,
    BroilerController,
    SlaughterController,
    PoultryReportController,
  ],
  providers: [
    RearingService,
    LayerService,
    HatcheryService,
    BroilerService,
    SlaughterService,
    PoultryKpiService,
  ],
  exports: [
    RearingService,
    LayerService,
    HatcheryService,
    BroilerService,
    SlaughterService,
    PoultryKpiService,
  ],
})
export class PoultryModule {}
