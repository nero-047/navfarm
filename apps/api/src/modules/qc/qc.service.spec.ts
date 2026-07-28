import { Test, TestingModule } from '@nestjs/testing';
import { QcService } from './qc.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ClsService } from 'nestjs-cls';

describe('Quality Control & Quarantine Engine Unit Tests', () => {
  let service: QcService;

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

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcService,
        { provide: ClsService, useValue: mockClsService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<QcService>(QcService);
    jest.clearAllMocks();
  });

  it('should create a QC parameter template', async () => {
    const dto = {
      company_id: 'comp-1',
      template_code: 'QC-EGG-WT',
      template_name: 'Egg Weight Quality Inspection',
      min_acceptable_value: 50.0,
      max_acceptable_value: 70.0,
    };

    const result = await service.createTemplate(dto, 'tenant-1', 'user-1');
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result.template_code).toBe('QC-EGG-WT');
  });

  it('should record QC inspection and trigger quarantine on out-of-bounds value', async () => {
    mockDb.select.mockReturnValueOnce(
      createQueryChain([
        {
          template_id: 'tpl-1',
          min_acceptable_value: '50.0000',
          max_acceptable_value: '70.0000',
        },
      ])
    );

    const dto = {
      company_id: 'comp-1',
      template_id: 'tpl-1',
      item_id: 'item-egg-1',
      measured_value: 42.0, // Failed min 50.0 limit
      warehouse_id: 'wh-quarantine',
      location_id: 'loc-01',
      hold_qty: 100,
      notes: 'Below acceptable egg weight',
    };

    const result = await service.recordInspection(dto, 'tenant-1', 'user-1');
    expect(result.inspection_status).toBe('QUARANTINE');
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // Inspection + Quarantine hold
  });

  it('should release quarantine hold', async () => {
    mockDb.select.mockReturnValueOnce(
      createQueryChain([
        {
          hold_id: 'hold-1',
          tenant_id: 'tenant-1',
          status: 'ON_HOLD',
        },
      ])
    );

    const result = await service.releaseQuarantine(
      { hold_id: 'hold-1', action: 'RELEASED' },
      'tenant-1',
      'user-1'
    );

    expect(result.status).toBe('RELEASED');
    expect(mockDb.update).toHaveBeenCalled();
  });
});
