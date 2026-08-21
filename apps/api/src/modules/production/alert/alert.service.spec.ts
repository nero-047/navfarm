import { Test, TestingModule } from '@nestjs/testing';
import { AlertService } from './alert.service';
import { ClsService } from 'nestjs-cls';

describe('AlertService', () => {
  let service: AlertService;

  const mockDbSelect = jest.fn();
  const mockDbUpdate = jest.fn();
  const mockDb = { select: mockDbSelect, update: mockDbUpdate };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbUpdate.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns filtered and enriched alerts', async () => {
      const mockAlerts = [
        {
          alert_id: 'alert-1',
          tenant_id: 'tenant-1',
          company_id: 'company-1',
          batch_id: 'batch-1',
          severity: 'CRITICAL',
          title: 'Feed Consumption Above KPI',
          message: 'Feed Consumption: actual 120, expected 100',
          is_read: false,
          batch_no: 'BAT-2026-001',
          batch_status: 'ACTIVE',
        },
      ];

      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockAlerts),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.findAll(
        { companyId: 'company-1', severity: 'CRITICAL', isRead: false },
        'tenant-1'
      );

      expect(result).toEqual(mockAlerts);
      expect(mockDbSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('markRead', () => {
    it('marks single alert as read and returns it', async () => {
      const alert = {
        alert_id: 'alert-1',
        company_id: 'company-1',
        title: 'Mortality Spike',
        is_read: false,
      };

      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([alert]),
          }),
        }),
      });

      mockDbUpdate.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      const result = await service.markRead('alert-1', 'company-1', { userId: 'user-1' });

      expect(result.is_read).toBe(true);
      expect(result.read_by).toBe('user-1');
    });
  });

  describe('markAllRead', () => {
    it('marks all matching alerts as read', async () => {
      mockDbUpdate.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      const result = await service.markAllRead(
        { companyId: 'company-1', batchId: 'batch-1' },
        'tenant-1',
        { userId: 'user-1' }
      );

      expect(result.success).toBe(true);
      expect(mockDbUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
