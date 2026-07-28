import { Module } from '@nestjs/common';
import { SchedulerController } from './controllers/scheduler.controller';
import { OperationalScheduleController } from './controllers/operational-schedule.controller';
import { GrowthTrackingController } from './controllers/growth-tracking.controller';
import { AlertController } from './controllers/alert.controller';
import { NotificationController } from './controllers/notification.controller';
import { KpiController } from './controllers/kpi.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { SchedulerEngineService } from './services/scheduler-engine.service';
import { OperationalScheduleService } from './services/operational-schedule.service';
import { GrowthTrackingService } from './services/growth-tracking.service';
import { AlertEngineService } from './services/alert-engine.service';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { KpiMonitoringService } from './services/kpi-monitoring.service';
import { DashboardEngineService } from './services/dashboard-engine.service';

@Module({
  controllers: [
    SchedulerController,
    OperationalScheduleController,
    GrowthTrackingController,
    AlertController,
    NotificationController,
    KpiController,
    DashboardController,
  ],
  providers: [
    SchedulerEngineService,
    OperationalScheduleService,
    GrowthTrackingService,
    AlertEngineService,
    NotificationDeliveryService,
    KpiMonitoringService,
    DashboardEngineService,
  ],
  exports: [
    SchedulerEngineService,
    OperationalScheduleService,
    GrowthTrackingService,
    AlertEngineService,
    NotificationDeliveryService,
    KpiMonitoringService,
    DashboardEngineService,
  ],
})
export class SchedulerKpiModule {}
