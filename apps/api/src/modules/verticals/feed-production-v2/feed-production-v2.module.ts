import { Module } from '@nestjs/common';
import { FeedProductionV2Controller } from './controllers/feed-production-v2.controller';
import { FeedProductionV2Service } from './services/feed-production-v2.service';
import { InventoryModule } from '../../inventory-logistics/inventory/inventory.module';
import { SchedulerKpiModule } from '../../intelligence-reporting/scheduler-kpi/scheduler-kpi.module';
import { AuditLogModule } from '../../platform-identity/audit-log/audit-log.module';

@Module({
  imports: [
    InventoryModule,        // Phase 2: GI for feed delivery dispatch, GR for feed returns
    SchedulerKpiModule,     // Phase 9: MO stage delay alerts, QC inspection due reminders
    AuditLogModule,         // Cross-cutting: Audit trail for MO creation/completion, QC decisions
  ],
  controllers: [FeedProductionV2Controller],
  providers: [FeedProductionV2Service],
  exports: [FeedProductionV2Service],
})
export class FeedProductionV2Module {}
