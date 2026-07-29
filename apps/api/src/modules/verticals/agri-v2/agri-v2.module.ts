import { Module } from '@nestjs/common';
import { AgriV2Controller } from './controllers/agri.controller';
import { AgriV2Service } from './services/agri.service';
import { InventoryModule } from '../../inventory-logistics/inventory/inventory.module';
import { SchedulerKpiModule } from '../../intelligence-reporting/scheduler-kpi/scheduler-kpi.module';
import { AuditLogModule } from '../../platform-identity/audit-log/audit-log.module';

@Module({
  imports: [
    InventoryModule,        // Phase 2: GI for fertilizer/pesticide issue, GR for harvest receipt
    SchedulerKpiModule,     // Phase 9: Crop calendar overdue alerts, PHI breach alerts
    AuditLogModule,         // Cross-cutting: Audit trail for harvest, field operations
  ],
  controllers: [AgriV2Controller],
  providers: [AgriV2Service],
  exports: [AgriV2Service],
})
export class AgriV2Module {}
