import { Module } from '@nestjs/common';
import { HerdController } from './controllers/herd.controller';
import { AnimalController } from './controllers/animal.controller';
import { LivestockCommercialController } from './controllers/livestock-commercial.controller';
import { HerdService } from './services/herd.service';
import { AnimalService } from './services/animal.service';
import { LivestockCommercialService } from './services/livestock-commercial.service';
import { InventoryModule } from '../inventory/inventory.module';
import { SchedulerKpiModule } from '../scheduler-kpi/scheduler-kpi.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CostingModule } from '../costing/costing.module';

@Module({
  imports: [
    InventoryModule,        // Phase 2: GR for animal purchase, GI for animal sale
    SchedulerKpiModule,     // Phase 9: Vaccination due date alerts, breeding reminders
    AuditLogModule,         // Cross-cutting: Audit trail for purchase/sale/mortality
    CostingModule,          // FIX-010 (GAP-005): Phase 7 Costing — IAS 41 bio asset, batch cost rollup
  ],
  controllers: [HerdController, AnimalController, LivestockCommercialController],
  providers: [HerdService, AnimalService, LivestockCommercialService],
  exports: [HerdService, AnimalService, LivestockCommercialService],
})
export class LivestockV2Module {}

