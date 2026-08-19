import { Test, TestingModule } from '@nestjs/testing';
import { StageService } from './stage.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('StageService', () => {
  let service: StageService;

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
        StageService,
        {
          provide: ClsService,
          useValue: { get: jest.fn().mockReturnValue(mockDb) },
        },
        {
          provide: AuditLogService,
          useValue: { log: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<StageService>(StageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if nob_id does not exist', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.create(
          {
            nob_id: 'bogus-nob',
            lob_id: 'lob-1',
            stage_code: 'QUARANTINE',
            stage_name: 'Quarantine',
            stage_category: 'PRE_PRODUCTIVE',
            stage_sequence: 1,
            transition_trigger: 'MANUAL',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject AUTO_BY_DAY without auto_move_on_day', async () => {
      // Selects in order: nob found, lob found
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ nob_id: 'nob-1' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ lob_id: 'lob-1' }]) }) }),
        });

      await expect(
        service.create(
          {
            nob_id: 'nob-1',
            lob_id: 'lob-1',
            stage_code: 'QUARANTINE',
            stage_name: 'Quarantine',
            stage_category: 'PRE_PRODUCTIVE',
            stage_sequence: 1,
            transition_trigger: 'AUTO_BY_DAY',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject a duplicate stage_code within the same LOB', async () => {
      // Selects in order: nob found, lob found, duplicate stage_code found
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ nob_id: 'nob-1' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ lob_id: 'lob-1' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ stage_code: 'QUARANTINE' }]) }) }),
        });

      await expect(
        service.create(
          {
            nob_id: 'nob-1',
            lob_id: 'lob-1',
            stage_code: 'QUARANTINE',
            stage_name: 'Quarantine',
            stage_category: 'PRE_PRODUCTIVE',
            stage_sequence: 1,
            transition_trigger: 'MANUAL',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a valid stage with a resolvable next_stage_id', async () => {
      // Selects in order: nob found, lob found, next_stage_id resolves, no duplicate code, findOne() after insert
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ nob_id: 'nob-1' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ lob_id: 'lob-1' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ stage_id: 'stage-next' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ stage_code: 'QUARANTINE', stage_name: 'Quarantine' }]) }) }),
        });

      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.create(
        {
          nob_id: 'nob-1',
          lob_id: 'lob-1',
          stage_code: 'QUARANTINE',
          stage_name: 'Quarantine',
          stage_category: 'PRE_PRODUCTIVE',
          stage_sequence: 1,
          transition_trigger: 'AUTO_BY_DAY',
          auto_move_on_day: 30,
          next_stage_id: 'stage-next',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.stage_code).toBe('QUARANTINE');
    });
  });
});
