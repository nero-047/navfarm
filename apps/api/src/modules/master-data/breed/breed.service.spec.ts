import { Test, TestingModule } from '@nestjs/testing';
import { BreedService } from './breed.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('BreedService', () => {
  let service: BreedService;

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
        BreedService,
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockReturnValue(mockDb),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<BreedService>(BreedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSpecies', () => {
    it('should throw ConflictException if species code already exists', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ species_code: 'CHICKEN' }]),
          }),
        }),
      });

      await expect(
        service.createSpecies(
          {
            species_code: 'CHICKEN',
            species_name: 'Chicken',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create species', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ species_code: 'CHICKEN', species_name: 'Chicken' }]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const result = await service.createSpecies(
        {
          species_code: 'CHICKEN',
          species_name: 'Chicken',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.species_code).toBe('CHICKEN');
    });
  });

  describe('createBreed', () => {
    it('should throw ConflictException if breed code already exists', async () => {
      // First mock checkSpecies (finds one)
      // Second mock checkDuplicateBreed (finds duplicate breed)
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ species_id: 'spec-1', species_name: 'Chicken' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ breed_code: 'COBB500' }]),
            }),
          }),
        });

      await expect(
        service.createBreed(
          {
            nob_id: 'nob-1',
            breed_code: 'COBB500',
            breed_name: 'Cobb 500',
            species_id: 'spec-1',
            breed_type: 'BROILER',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create breed', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ species_id: 'spec-1', species_name: 'Chicken' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ breed_code: 'COBB500', breed_name: 'Cobb 500' }]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const result = await service.createBreed(
        {
          nob_id: 'nob-1',
          breed_code: 'COBB500',
          breed_name: 'Cobb 500',
          species_id: 'spec-1',
          breed_type: 'BROILER',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.breed_code).toBe('COBB500');
    });

    it('should persist piggery-specific fields', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ species_id: 'spec-pig', species_name: 'Pig' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ breed_code: 'YORKSHIRE', gestation_days: 114 }]) }) }),
        });

      let insertedValues: any;
      mockDbInsert.mockReturnValue({
        values: jest.fn().mockImplementation((v) => { insertedValues = v; return Promise.resolve({}); }),
      });

      await service.createBreed(
        {
          nob_id: 'nob-1',
          breed_code: 'YORKSHIRE',
          breed_name: 'Yorkshire',
          species_id: 'spec-pig',
          breed_type: 'MEAT',
          gestation_days: 114,
          lactation_days: 28,
          residual_value_pct: 10.0,
          productive_life_cycles: 7,
          avg_litter_size_born: 11.5,
          avg_litter_size_weaned: 10.0,
        },
        'tenant-123',
      );

      expect(insertedValues.gestation_days).toBe(114);
      expect(insertedValues.lactation_days).toBe(28);
      expect(insertedValues.residual_value_pct).toBe('10');
      expect(insertedValues.productive_life_cycles).toBe(7);
      expect(insertedValues.avg_litter_size_born).toBe('11.5');
    });
  });

  describe('lifecycle stages', () => {
    it('should reject an unknown breed_id', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
      });

      await expect(
        service.createLifecycleStage(
          { breed_id: 'bogus-breed', stage_id: 'stage-1', calc_unit: 'WEEK', period_from: 1, period_to: 4 },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject an unknown stage_id', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ breed_id: 'breed-1' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
        });

      await expect(
        service.createLifecycleStage(
          { breed_id: 'breed-1', stage_id: 'bogus-stage', calc_unit: 'WEEK', period_from: 1, period_to: 4 },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a valid lifecycle stage', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ breed_id: 'breed-1' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ stage_id: 'stage-lactation' }]) }) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ lifecycle_id: 'lc-1', breed_id: 'breed-1', stage_id: 'stage-lactation' }]) }) }),
        });

      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.createLifecycleStage(
        {
          breed_id: 'breed-1',
          stage_id: 'stage-lactation',
          calc_unit: 'WEEK',
          period_from: 1,
          period_to: 4,
          feed_qty_per_head_per_day_kg: 2.5,
          std_fcr: 2.4,
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.lifecycle_id).toBe('lc-1');
    });
  });
});
