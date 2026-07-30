import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { ResourceService } from '../src/modules/master-data/resource/resource.service';
import { AuditLogService } from '../src/modules/platform-identity/audit-log/audit-log.service';

describe('Phase 9: Resource Management & Operational Scheduling Suite', () => {
  let app: INestApplication;
  let service: ResourceService;
  let clsService: ClsService;

  const mockResource = {
    resource_id: 'res-tractor-01',
    tenant_id: 'tenant-test',
    company_id: 'company-test',
    resource_code: 'TRAC-01',
    resource_name: 'John Deere Tractor 5050D',
    resource_type: 'EQUIPMENT',
    capacity: '50.00',
    unit: 'HP',
    cost_rate: '25.0000',
    is_active: true,
    status: 'ACTIVE',
    deleted_at: null,
  };

  const mockMaintenanceLogs: any[] = [];

  const mockTenantDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation((cond: any) => ({
            limit: jest.fn().mockImplementation(() => {
              if (tableName.includes('resource_master') || tableName.includes('resourceMaster')) {
                return [mockResource];
              }
              if (tableName.includes('resource_maintenance_log') || tableName.includes('resourceMaintenanceLog')) {
                return mockMaintenanceLogs;
              }
              return [];
            }),
          })),
        };
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockImplementation((val: any) => {
        if (val.log_id) mockMaintenanceLogs.push(val);
        return Promise.resolve(val);
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({ affectedRows: 1 }),
      }),
    }),
  };

  beforeEach(async () => {
    mockMaintenanceLogs.length = 0;
    const clsStore = new Map<string, any>();
    clsStore.set('tenantDb', mockTenantDb);

    clsService = {
      set: jest.fn((k, v) => clsStore.set(k, v)),
      get: jest.fn((k) => clsStore.get(k)),
    } as any;

    const mockAuditService = { log: jest.fn().mockResolvedValue(true) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        { provide: ClsService, useValue: clsService },
        { provide: AuditLogService, useValue: mockAuditService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    service = moduleRef.get<ResourceService>(ResourceService);
  });

  describe('1. Resource Availability & Maintenance Restrictions', () => {
    it('should validate availability as true for an active, unmaintained resource', async () => {
      const isAvailable = await service.validateResourceAvailability('res-tractor-01', 'tenant-test');
      expect(isAvailable).toBe(true);
    });

    it('should reject resource assignment when resource is UNDER_MAINTENANCE', async () => {
      mockMaintenanceLogs.push({
        log_id: 'maint-1',
        resource_id: 'res-tractor-01',
        status: 'UNDER_MAINTENANCE',
        deleted_at: null,
      });

      await expect(
        service.validateResourceAvailability('res-tractor-01', 'tenant-test')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Maintenance Log Recording', () => {
    it('should record maintenance log entry with type, description, cost, and status', async () => {
      const log = await service.createMaintenanceLog(
        'res-tractor-01',
        {
          maintenance_date: '2026-07-30',
          maintenance_type: 'PREVENTIVE',
          description: '500-hour engine oil change and hydraulic filter replacement',
          cost: 150,
          performed_by: 'Tech Team Alpha',
          status: 'COMPLETED',
        },
        'tenant-test'
      );

      expect(log).toBeDefined();
    });
  });
});
