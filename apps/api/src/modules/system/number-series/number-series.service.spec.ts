import { Test, TestingModule } from '@nestjs/testing';
import { NumberSeriesService } from './number-series.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('NumberSeriesService', () => {
  let service: NumberSeriesService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NumberSeriesService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    service = module.get<NumberSeriesService>(NumberSeriesService);
  });

  describe('generateNext', () => {
    const mockLockedSelect = (row: any) => {
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                for: jest.fn().mockResolvedValue(row ? [row] : []),
              }),
            }),
          }),
        }),
      });
    };

    it('formats prefix + zero-padded sequence and increments current_seq', async () => {
      mockLockedSelect({
        series_id: 'series-1',
        current_seq: 4,
        seq_length: 6,
        prefix: 'BATCH',
        date_format: null,
        separator: '-',
        reset_frequency: 'NEVER',
        is_active: true,
        updated_at: new Date().toISOString(),
      });
      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });

      const code = await service.generateNext('BATCH', 'tenant-123', 'comp-1');

      expect(code).toBe('BATCH-000005');
      const setArg = (mockDbUpdate.mock.results[0].value.set as jest.Mock).mock.calls[0][0];
      expect(setArg.current_seq).toBe(5);
      expect(setArg.last_generated_code).toBe('BATCH-000005');
    });

    it('resets current_seq to 0 before incrementing when the YEARLY period has rolled over', async () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);

      mockLockedSelect({
        series_id: 'series-1',
        current_seq: 42,
        seq_length: 4,
        prefix: 'ITEM',
        date_format: null,
        separator: '-',
        reset_frequency: 'YEARLY',
        is_active: true,
        updated_at: lastYear.toISOString(),
      });
      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });

      const code = await service.generateNext('ITEM', 'tenant-123', null);

      expect(code).toBe('ITEM-0001');
    });

    it('throws NotFoundException when the series does not exist in scope', async () => {
      mockLockedSelect(null);

      await expect(service.generateNext('BOGUS', 'tenant-123', null)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the series is inactive', async () => {
      mockLockedSelect({
        series_id: 'series-1',
        current_seq: 0,
        seq_length: 4,
        prefix: 'X',
        separator: '-',
        reset_frequency: 'NEVER',
        is_active: false,
        updated_at: new Date().toISOString(),
      });

      await expect(service.generateNext('X', 'tenant-123', null)).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('rejects a duplicate series_code in the same scope', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ series_code: 'BATCH' }]),
          }),
        }),
      });

      await expect(
        service.create(
          { series_code: 'BATCH', series_name: 'Batch Number', document_type: 'BATCH', seq_length: 6 },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
