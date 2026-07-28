import { Module } from '@nestjs/common';
import { AquaV2Controller } from './controllers/aqua-v2.controller';
import { AquaV2Service } from './services/aqua-v2.service';
import { InventoryModule } from '../inventory/inventory.module';
import { SchedulerKpiModule } from '../scheduler-kpi/scheduler-kpi.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    InventoryModule,        // Phase 2: Feed GI when feed issued to pond, harvest GR for fish output
    SchedulerKpiModule,     // Phase 9: Critical water quality alerts (DO/ammonia), daily sampling reminders
    AuditLogModule,         // Cross-cutting: Audit trail for stocking, disease, mortality events
  ],
  controllers: [AquaV2Controller],
  providers: [AquaV2Service],
  exports: [AquaV2Service],
})
export class AquacultureV2Module {}
