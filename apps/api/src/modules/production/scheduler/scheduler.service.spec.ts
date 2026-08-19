import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

describe('SchedulerService', () => {
  let service: SchedulerService;

  const mockDbSelect = jest.fn();
  const mockDb = { select: mockDbSelect };

  beforeEach(async () => {
    mockDbSelect.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  describe('suggestParameterLines', () => {
    it('returns [] without querying parameter_master when the breed has no lifecycle-stage data', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ orderBy: jest.fn().mockResolvedValue([]) }),
          }),
        }),
      });

      const result = await service.suggestParameterLines('breed-1', 'nob-1', 'lob-1', 'tenant-1');

      expect(result).toEqual([]);
      expect(mockDbSelect).toHaveBeenCalledTimes(1);
    });

    it('generates feed/mortality/output lines, converting WEEK periods to day-of-batch', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue([
                  {
                    lifecycle: {
                      calc_unit: 'WEEK',
                      period_from: 1,
                      period_to: 3,
                      feed_item_id: 'item-feed',
                      feed_qty_per_head_per_day_kg: '2.200',
                      std_mortality_rate_pct: '1.500',
                      output_item_id: null,
                      output_uom: null,
                      std_output_qty: null,
                      std_body_weight_kg: '25.000',
                    },
                    stage: { stage_code: 'GROWER', stage_name: 'Grower' },
                  },
                ]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { parameter_id: 'p-feed', parameter_type: 'CONSUMPTION', item_id: 'item-feed', default_uom: 'KG' },
              { parameter_id: 'p-mort', parameter_type: 'MORTALITY', item_id: null, default_uom: 'PCS' },
              { parameter_id: 'p-out', parameter_type: 'OUTPUT', item_id: null, default_uom: 'KG' },
            ]),
          }),
        });

      const result = await service.suggestParameterLines('breed-1', 'nob-1', 'lob-1', 'tenant-1');

      expect(result).toHaveLength(3);

      const feedLine = result.find((l: any) => l.parameter_id === 'p-feed');
      expect(feedLine.period_from).toBe(7); // 1 week -> day 7
      expect(feedLine.period_to).toBe(21); // 3 weeks -> day 21
      expect(feedLine.expected_qty_override).toBe(2.2);
      expect(feedLine.stage_code).toBe('GROWER');

      const mortLine = result.find((l: any) => l.parameter_id === 'p-mort');
      expect(mortLine.kpi_target_value).toBe(1.5);
      expect(mortLine.kpi_enabled).toBe(true);

      const outputLine = result.find((l: any) => l.parameter_id === 'p-out');
      expect(outputLine.expected_qty_override).toBe(25); // falls back to std_body_weight_kg
    });
  });
});
