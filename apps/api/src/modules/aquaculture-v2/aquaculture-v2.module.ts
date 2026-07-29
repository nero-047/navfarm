import { Module } from '@nestjs/common';
import { AquaV2Controller } from './controllers/aqua-v2.controller';
import { AquaV2Service } from './services/aqua-v2.service';
import { InventoryModule } from '../inventory/inventory.module';
import { SchedulerKpiModule } from '../scheduler-kpi/scheduler-kpi.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CostingModule } from '../costing/costing.module';

@Module({
  imports: [
    InventoryModule,        // Phase 2: Feed GI when feed issued to pond, harvest GR for fish output
    SchedulerKpiModule,     // Phase 9: Critical water quality alerts (DO/ammonia), daily sampling reminders
    AuditLogModule,         // Cross-cutting: Audit trail for stocking, disease, mortality events
    CostingModule,          // Phase 7: Batch cost rollup for aqua batches (FIX-011)
    // Note: FinanceModule is @Global() so PostingEngineService is available without explicit import
  ],
  controllers: [AquaV2Controller],
  providers: [AquaV2Service],
  exports: [AquaV2Service],
})
export class AquacultureV2Module {}

