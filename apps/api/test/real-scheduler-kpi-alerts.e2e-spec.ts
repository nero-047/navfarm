import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { SchedulerEngineService } from '../src/modules/intelligence-reporting/scheduler-kpi/services/scheduler-engine.service';
import { KpiMonitoringService } from '../src/modules/intelligence-reporting/scheduler-kpi/services/kpi-monitoring.service';
import { AlertEngineService } from '../src/modules/intelligence-reporting/scheduler-kpi/services/alert-engine.service';

describe('Phase 10: Real Scheduler Execution, KPI & Alert Suite', () => {
  let app: INestApplication;
  let schedulerService: SchedulerEngineService;
  let kpiService: KpiMonitoringService;
  let alertService: AlertEngineService;

  const mockJobsStore: Record<string, any> = {
    'job-001': {
      job_id: 'job-001',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      job_name: 'Nightly KPI Recalculation',
      job_group: 'KPI_RECALCULATION',
      cron_expression: '0 0 * * *',
      target_service: 'kpi-service',
      target_method: 'recalculate',
      is_enabled: true,
      last_run_at: null,
    },
  };

  const mockKpiDefinitions: Record<string, any> = {
    'kpi-001': {
      kpi_id: 'kpi-001',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      kpi_code: 'FCR_POULTRY',
      kpi_name: 'Feed Conversion Ratio (Poultry)',
      category: 'POULTRY',
      unit_of_measure: 'NUMERIC',
    },
  };

  const mockKpiThresholds: Record<string, any> = {
    'kpi-001': {
      threshold_id: 'thresh-001',
      kpi_id: 'kpi-001',
      green_max: '1.5000',
      yellow_max: '1.8000',
      red_min: '1.8100',
    },
  };

  const mockAlertRules: Record<string, any> = {
    'rule-001': {
      rule_id: 'rule-001',
      tenant_id: 'tenant-test',
      company_id: 'company-test',
      rule_name: 'High Mortality Rate Warning',
      event_type: 'MORTALITY_SPIKE',
      metric_name: 'mortality_rate_pct',
      operator: 'GT',
      threshold_value: '3.0000',
      severity: 'WARNING',
      is_enabled: true,
    },
  };

  const mockAlertEventsStore: Record<string, any> = {};
  const mockHistoryStore: any[] = [];

  const mockTenantDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation((cond: any) => ({
            limit: jest.fn().mockImplementation(() => {
              if (tableName.includes('scheduler_job') || tableName.includes('schedulerJob')) {
                return [mockJobsStore['job-001']];
              }
              if (tableName.includes('kpi_definition') || tableName.includes('kpiDefinition')) {
                return [mockKpiDefinitions['kpi-001']];
              }
              if (tableName.includes('kpi_threshold') || tableName.includes('kpiThreshold')) {
                return [mockKpiThresholds['kpi-001']];
              }
              if (tableName.includes('alert_rule') || tableName.includes('alertRule')) {
                return [mockAlertRules['rule-001']];
              }
              if (tableName.includes('alert_event') || tableName.includes('alertEvent')) {
                return Object.values(mockAlertEventsStore);
              }
              return [];
            }),
            then: (resolve: any) => resolve(Object.values(mockAlertEventsStore)),
          })),
        };
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockImplementation((val: any) => {
        if (val.history_id) mockHistoryStore.push(val);
        if (val.alert_id) mockAlertEventsStore[val.alert_id] = val;
        return Promise.resolve(val);
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation((cond: any) => Promise.resolve({ affectedRows: 1 })),
      }),
    }),
  };

  beforeEach(async () => {
    mockHistoryStore.length = 0;
    const clsStore = new Map<string, any>();
    clsStore.set('tenantDb', mockTenantDb);

    const mockClsService = {
      set: jest.fn((k, v) => clsStore.set(k, v)),
      get: jest.fn((k) => clsStore.get(k)),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerEngineService,
        KpiMonitoringService,
        AlertEngineService,
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    schedulerService = moduleRef.get<SchedulerEngineService>(SchedulerEngineService);
    kpiService = moduleRef.get<KpiMonitoringService>(KpiMonitoringService);
    alertService = moduleRef.get<AlertEngineService>(AlertEngineService);
  });

  describe('1. Real Scheduled Job Execution & History Tracking', () => {
    it('should execute a scheduled job and log history record', async () => {
      const res = await schedulerService.executeJob('job-001', 'tenant-test');
      expect(res.job_id).toBe('job-001');
      expect(res.status).toBe('SUCCESS');
      expect(mockHistoryStore.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. KPI Threshold Evaluation & Persistence', () => {
    it('should evaluate metric value against thresholds and assign correct zone', async () => {
      const res = await kpiService.evaluateKpi('kpi-001', 1.95, 'tenant-test');
      expect(res.kpi_id).toBe('kpi-001');
      expect(res.zone).toBe('RED');
    });
  });

  describe('3. Alert Rule Triggering and Lifecycle (Active -> Ack -> Resolved)', () => {
    it('should trigger alert event when metric breaches GT threshold', async () => {
      const alert = await alertService.evaluateAndTriggerAlert('company-test', 'rule-001', 4.5, 'tenant-test');
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('WARNING');
      expect(alert?.status).toBe('ACTIVE');
    });

    it('should acknowledge active alert', async () => {
      const directAlert = await alertService.fireDirectAlert({
        tenantId: 'tenant-test',
        companyId: 'company-test',
        alertType: 'CRITICAL',
        source: 'POULTRY_MORTALITY',
        sourceId: 'batch-001',
        message: 'Mortality spike detected in Shed 2',
      });

      const ackRes = await alertService.acknowledgeAlert(directAlert.alert_id, 'tenant-test', 'user-admin');
      expect(ackRes.status).toBe('ACKNOWLEDGED');
    });

    it('should resolve alert with resolution notes', async () => {
      const directAlert = await alertService.fireDirectAlert({
        tenantId: 'tenant-test',
        companyId: 'company-test',
        alertType: 'WARNING',
        source: 'WATER_QUALITY',
        sourceId: 'pond-001',
        message: 'pH out of range',
      });

      const resolved = await alertService.resolveAlert(directAlert.alert_id, 'tenant-test', 'Water aerated and pH balanced.', 'user-admin');
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolution_notes).toBe('Water aerated and pH balanced.');
    });
  });
});
