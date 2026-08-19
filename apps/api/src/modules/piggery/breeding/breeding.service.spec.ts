import { Test, TestingModule } from '@nestjs/testing';
import { BreedingService } from './breeding.service';
import { ClsService } from 'nestjs-cls';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MatingType, PregCheckMethod, ConceptionResult } from './dto/breeding.dto';

describe('BreedingService', () => {
  let service: BreedingService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  };

  const found = (row: any) => ({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(row ? [row] : []),
      }),
    }),
  });

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BreedingService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
      ],
    }).compile();

    service = module.get<BreedingService>(BreedingService);
  });

  describe('recordMating', () => {
    it('throws NotFoundException if sow is not found', async () => {
      mockDbSelect.mockReturnValueOnce(found(null));

      await expect(
        service.recordMating(
          {
            sow_animal_id: 'non-existent',
            mating_type: MatingType.AI,
            mating_date: '2026-03-01',
          },
          'tenant-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if NATURAL_MATING is missing boar_animal_id', async () => {
      mockDbSelect.mockReturnValueOnce(found({ animal_id: 'sow-1', company_id: 'comp-1', parity_count: 2 }));

      await expect(
        service.recordMating(
          {
            sow_animal_id: 'sow-1',
            mating_type: MatingType.NATURAL_MATING,
            mating_date: '2026-03-01',
          },
          'tenant-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('auto-computes 114 days expected farrowing date and 28 days preg check date', async () => {
      mockDbSelect.mockReturnValueOnce(found({ animal_id: 'sow-1', company_id: 'comp-1', parity_count: 1 }));
      mockDbInsert.mockReturnValueOnce({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.recordMating(
        {
          sow_animal_id: 'sow-1',
          mating_type: MatingType.AI,
          mating_date: '2026-03-01',
          semen_lot_id: 'SEM-LOT-01',
        },
        'tenant-1',
      );

      expect(result.expected_farrowing_date).toBe('2026-06-23'); // 2026-03-01 + 114 days
      expect(result.preg_check_date).toBe('2026-03-29'); // 2026-03-01 + 28 days
      expect(result.parity_number).toBe(2);
      expect(result.conception_result).toBe(ConceptionResult.PENDING);
    });
  });

  describe('recordPregnancyCheck', () => {
    it('updates sow status to PREGNANT on pregnancy confirmation', async () => {
      mockDbSelect.mockReturnValueOnce(found({
        breeding_id: 'breed-1',
        sow_animal_id: 'sow-1',
        preg_check_date: '2026-03-29',
        preg_check_method: 'ULTRASOUND',
      }));
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      const result = await service.recordPregnancyCheck(
        'breed-1',
        {
          pregnancy_confirmed: true,
          preg_check_method: PregCheckMethod.ULTRASOUND,
        },
        'tenant-1',
      );

      expect(result.pregnancy_confirmed).toBe(true);
      expect(result.conception_result).toBe(ConceptionResult.CONFIRMED);
    });
  });

  describe('recordFarrowing', () => {
    it('records live piglets, computes total litter born, and sets sow to LACTATING', async () => {
      mockDbSelect.mockReturnValueOnce(found({
        animal_id: 'sow-1',
        company_id: 'comp-1',
        parity_count: 2,
        total_piglets_born_live: 24,
      }));
      mockDbInsert.mockReturnValueOnce({ values: jest.fn().mockResolvedValue({}) });
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      const result = await service.recordFarrowing(
        {
          sow_animal_id: 'sow-1',
          farrowing_date: '2026-06-23',
          piglets_born_live: 12,
          piglets_stillborn: 1,
          piglets_mummified: 0,
          avg_birth_weight_kg: 1.45,
        },
        'tenant-1',
      );

      expect(result.piglets_born_total).toBe(13);
      expect(result.piglets_born_live).toBe(12);
      expect(result.total_litter_weight_kg).toBe('17.4'); // 12 * 1.45
      expect(result.parity_number).toBe(3);
    });
  });

  describe('recordSemenCollection', () => {
    it('calculates unit cost per dose from period running costs', async () => {
      mockDbSelect.mockReturnValueOnce(found({
        animal_id: 'boar-1',
        company_id: 'comp-1',
      }));
      mockDbInsert.mockReturnValueOnce({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.recordSemenCollection(
        {
          boar_animal_id: 'boar-1',
          collection_date: '2026-04-01',
          amortisation_period: 100,
          feed_cost_period: 250,
          drug_cost_period: 50,
          overhead_cost_period: 100,
          doses_collected: 50,
        },
        'tenant-1',
      );

      // Running cost = 100 + 250 + 50 + 100 = 500
      // Unit cost = 500 / 50 = 10
      expect(result.running_cost_period).toBe('500.0000');
      expect(result.unit_cost_per_dose).toBe('10.000000');
    });
  });
});
