import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerEngineService } from './services/scheduler-engine.service';
import { OperationalScheduleService } from './services/operational-schedule.service';
import { GrowthTrackingService } from './services/growth-tracking.service';
import { AlertEngineService } from './services/alert-engine.service';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { KpiMonitoringService } from './services/kpi-monitoring.service';
import { DashboardEngineService } from './services/dashboard-engine.service';
import { ClsService } from 'nestjs-cls';
import { OperatorEnum, AlertSeverityEnum } from './dto/alert.dto';

describe('Enterprise Scheduler, Alerts & KPI Engine Unit Tests', () => {
  let schedulerService: SchedulerEngineService;
  let opService: OperationalScheduleService;
  let growthService: GrowthTrackingService;
  let alertService: AlertEngineService;
  let kpiService: KpiMonitoringService;

  const createQueryChain = (result: any) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    then: (resolve: any) => resolve(result),
  });

  const mockDb = {
    select: jest.fn(),
    insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue({}) }),
    update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) }),
  };

  const mockClsService = {
    get: jest.fn().mockReturnValue(mockDb),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerEngineService,
        OperationalScheduleService,
        GrowthTrackingService,
        AlertEngineService,
        NotificationDeliveryService,
        KpiMonitoringService,
        DashboardEngineService,
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    schedulerService = module.get<SchedulerEngineService>(SchedulerEngineService);
    opService = module.get<OperationalScheduleService>(OperationalScheduleService);
    growthService = module.get<GrowthTrackingService>(GrowthTrackingService);
    alertService = module.get<AlertEngineService>(AlertEngineService);
    kpiService = module.get<KpiMonitoringService>(KpiMonitoringService);

    jest.clearAllMocks();
  });

  it('should create and execute a scheduled recurrence job', async () => {
    mockDb.select.mockReturnValueOnce(createQueryChain([{ job_id: 'job-1', job_name: 'Test Job' }]));

    const dto = {
      company_id: 'comp-1',
      job_name: 'Daily Feed Reminder Trigger',
      cron_expression: '0 8 * * *',
      target_service: 'OperationalScheduleService',
      target_method: 'triggerDailyFeedDispatch',
    };

    const created = await schedulerService.createJob(dto, 'tenant-1');
    expect(created.job_name).toBe('Daily Feed Reminder Trigger');

    const executed = await schedulerService.executeJob('job-1', 'tenant-1');
    expect(executed.status).toBe('SUCCESS');
  });

  it('should create a vaccination calendar event and complete it', async () => {
    mockDb.select.mockReturnValueOnce(createQueryChain([{ schedule_id: 'sched-1', status: 'SCHEDULED' }]));

    const dto = {
      company_id: 'comp-1',
      batch_id: 'batch-1',
      due_date: '2026-08-15T08:00:00Z',
    };

    const created = await opService.createVaccinationSchedule(dto, 'tenant-1');
    expect(created.status).toBe('SCHEDULED');

    const completed = await opService.completeVaccination('sched-1', 'tenant-1');
    expect(completed.status).toBe('COMPLETED');
  });

  it('should record sample weight gain and daily mortality count', async () => {
    const weightDto = {
      company_id: 'comp-1',
      batch_id: 'batch-1',
      sample_count: 50,
      average_weight_grams: 1850.5,
    };

    const weightRes = await growthService.recordWeight(weightDto, 'tenant-1');
    expect(weightRes.average_weight_grams).toBe('1850.5000');

    const mortalityDto = {
      company_id: 'comp-1',
      batch_id: 'batch-1',
      mortality_count: 12,
    };

    const mortalityRes = await growthService.recordMortality(mortalityDto, 'tenant-1');
    expect(mortalityRes.mortality_count).toBe(12);
  });

  it('should evaluate metric against alert rule and trigger alert event when breached', async () => {
    mockDb.select.mockReturnValueOnce(
      createQueryChain([
        {
          rule_id: 'rule-1',
          rule_name: 'High Mortality Trigger',
          operator: OperatorEnum.GT,
          threshold_value: '1.5000',
          severity: AlertSeverityEnum.CRITICAL,
          is_enabled: true,
        },
      ])
    );

    const alertRes = await alertService.evaluateAndTriggerAlert('comp-1', 'rule-1', 2.5, 'tenant-1');
    expect(alertRes).not.toBeNull();
    expect(alertRes?.severity).toBe('CRITICAL');
  });

  it('should evaluate KPI metric against thresholds and assign RED zone', async () => {
    mockDb.select
      .mockReturnValueOnce(createQueryChain([{ kpi_id: 'kpi-1', kpi_code: 'KPI-FCR-01' }]))
      .mockReturnValueOnce(
        createQueryChain([
          {
            threshold_id: 't-1',
            green_max: '1.4000',
            yellow_max: '1.6000',
            red_min: '1.8000',
          },
        ])
      );

    const kpiRes = await kpiService.evaluateKpi('kpi-1', 1.95, 'tenant-1'); // 1.95 >= 1.8 Red
    expect(kpiRes.zone).toBe('RED');
  });
});
