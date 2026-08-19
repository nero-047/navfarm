import { Test, TestingModule } from '@nestjs/testing';
import { AnimalService } from './animal.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { NumberSeriesService } from '../../system/number-series/number-series.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('AnimalService', () => {
  let service: AnimalService;
  let numberSeriesService: NumberSeriesService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  };

  const found = (row: any) => ({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(row ? [row] : []) }) }) });

  const baseDto = {
    company_id: 'comp-1',
    nob_id: 'nob-1',
    lob_id: 'lob-1',
    animal_type: 'GILT',
    breed_id: 'breed-1',
    gender: 'F',
    entry_type: 'TRANSFERRED_IN',
    entry_date: '2026-01-01',
    item_id: 'item-1',
    acquisition_cost: 2857.57,
    landing_cost: 200,
  };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue({}) } },
        { provide: NumberSeriesService, useValue: { generateNext: jest.fn().mockResolvedValue('PIG-2026-0001') } },
      ],
    }).compile();

    service = module.get<AnimalService>(AnimalService);
    numberSeriesService = module.get<NumberSeriesService>(NumberSeriesService);
  });

  describe('create', () => {
    it('rejects a PURCHASED_LOCAL entry missing source_receipt_id', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ company_id: 'comp-1' }))
        .mockReturnValueOnce(found({ nob_id: 'nob-1' }))
        .mockReturnValueOnce(found({ lob_id: 'lob-1' }))
        .mockReturnValueOnce(found({ breed_id: 'breed-1' }))
        .mockReturnValueOnce(found({ item_id: 'item-1' }));

      await expect(
        service.create({ ...baseDto, entry_type: 'PURCHASED_LOCAL' }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a BORN_ON_FARM entry missing source_batch_id', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ company_id: 'comp-1' }))
        .mockReturnValueOnce(found({ nob_id: 'nob-1' }))
        .mockReturnValueOnce(found({ lob_id: 'lob-1' }))
        .mockReturnValueOnce(found({ breed_id: 'breed-1' }))
        .mockReturnValueOnce(found({ item_id: 'item-1' }));

      await expect(
        service.create({ ...baseDto, entry_type: 'BORN_ON_FARM' }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes total_opening_asset_value and generates animal_code via NumberSeriesService', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ company_id: 'comp-1' }))
        .mockReturnValueOnce(found({ nob_id: 'nob-1' }))
        .mockReturnValueOnce(found({ lob_id: 'lob-1' }))
        .mockReturnValueOnce(found({ breed_id: 'breed-1' }))
        .mockReturnValueOnce(found({ item_id: 'item-1' }))
        .mockReturnValueOnce(found({ animal_id: 'a-1', animal_code: 'PIG-2026-0001', total_opening_asset_value: '3057.57' }));

      const insertedRecords: any[] = [];
      mockDbInsert.mockReturnValue({ values: jest.fn().mockImplementation((v) => { insertedRecords.push(v); return Promise.resolve({}); }) });

      const result = await service.create(baseDto as any, 'tenant-123', { userId: 'user-1' });

      expect(numberSeriesService.generateNext).toHaveBeenCalledWith('ANIMAL_PIGGERY', 'tenant-123', 'comp-1');
      const animalInsert = insertedRecords[0];
      expect(animalInsert.total_opening_asset_value).toBe('3057.57');
      expect(animalInsert.animal_code).toBe('PIG-2026-0001');
      expect(result.animal_code).toBe('PIG-2026-0001');
      const ledgerInsert = insertedRecords[1];
      expect(ledgerInsert.entry_type).toBe('ACQUISITION');
      expect(ledgerInsert.cost_amount).toBe('3057.57');
    });

    it('rejects a duplicate rfid_tag within the tenant', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ company_id: 'comp-1' }))
        .mockReturnValueOnce(found({ nob_id: 'nob-1' }))
        .mockReturnValueOnce(found({ lob_id: 'lob-1' }))
        .mockReturnValueOnce(found({ breed_id: 'breed-1' }))
        .mockReturnValueOnce(found({ item_id: 'item-1' }))
        .mockReturnValueOnce(found({ animal_id: 'existing-animal' }));

      await expect(
        service.create({ ...baseDto, rfid_tag: 'RFID-001' }, 'tenant-123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('rejects sire_animal_id equal to the animal itself', async () => {
      mockDbSelect.mockReturnValueOnce(found({ animal_id: 'a-1', company_id: 'comp-1' }));

      await expect(
        service.update('a-1', { sire_animal_id: 'a-1' }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects dam_animal_id equal to the animal itself', async () => {
      mockDbSelect.mockReturnValueOnce(found({ animal_id: 'a-1', company_id: 'comp-1' }));

      await expect(
        service.update('a-1', { dam_animal_id: 'a-1' }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('dispose', () => {
    it('computes gain_loss_on_disposal when book_value is set', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ animal_id: 'a-1', company_id: 'comp-1', is_active: true, book_value: '3000.00', animal_code: 'PIG-2026-0001' }))
        .mockReturnValueOnce(found({ animal_id: 'a-1', is_active: false, disposal_type: 'SOLD', status: 'SOLD', gain_loss_on_disposal: '200.00' }));

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.dispose(
        'a-1',
        { disposal_type: 'SOLD', disposal_date: '2026-06-01', disposal_value: 3200 },
        'tenant-123',
        { userId: 'user-1' },
      );


      const setArg = (mockDbUpdate.mock.results[0].value.set as jest.Mock).mock.calls[0][0];
      expect(setArg.gain_loss_on_disposal).toBe('200');
      expect(setArg.is_active).toBe(false);
      expect(setArg.status).toBe('SOLD');
      expect(result.is_active).toBe(false);
    });

    it('leaves gain_loss_on_disposal null when book_value is not set', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ animal_id: 'a-1', company_id: 'comp-1', is_active: true, book_value: null, animal_code: 'PIG-2026-0002' }))
        .mockReturnValueOnce(found({ animal_id: 'a-1', is_active: false }));

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });

      await service.dispose('a-1', { disposal_type: 'DIED', disposal_date: '2026-06-01' }, 'tenant-123');

      const setArg = (mockDbUpdate.mock.results[0].value.set as jest.Mock).mock.calls[0][0];
      expect(setArg.gain_loss_on_disposal).toBeNull();
      expect(setArg.status).toBe('DEAD');
    });

    it('rejects disposing an already-disposed animal', async () => {
      mockDbSelect.mockReturnValueOnce(found({ animal_id: 'a-1', is_active: false, animal_code: 'PIG-2026-0003' }));

      await expect(
        service.dispose('a-1', { disposal_type: 'SOLD', disposal_date: '2026-06-01' }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });

    const joinedMedicationRows = (rows: any[]) => ({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(rows) }),
      }),
    });

    it('blocks SLAUGHTERED disposal when a medicine withdrawal period has not elapsed', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ animal_id: 'a-1', company_id: 'comp-1', is_active: true, book_value: null, animal_code: 'PIG-2026-0004' }))
        .mockReturnValueOnce(joinedMedicationRows([
          { item_id: 'item-med', item_name: 'Amoxicillin', item_type: 'MEDICINE', withdrawal_days: 10, administered_date: '2026-06-05' },
        ]));

      await expect(
        service.dispose('a-1', { disposal_type: 'SLAUGHTERED', disposal_date: '2026-06-10' }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows SLAUGHTERED disposal once the withdrawal period has elapsed', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ animal_id: 'a-1', company_id: 'comp-1', is_active: true, book_value: null, animal_code: 'PIG-2026-0005' }))
        .mockReturnValueOnce(joinedMedicationRows([
          { item_id: 'item-med', item_name: 'Amoxicillin', item_type: 'MEDICINE', withdrawal_days: 10, administered_date: '2026-05-01' },
        ]))
        .mockReturnValueOnce(found({ animal_id: 'a-1', is_active: false, status: 'SLAUGHTERED' }));

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });

      const result = await service.dispose('a-1', { disposal_type: 'SLAUGHTERED', disposal_date: '2026-06-10' }, 'tenant-123');

      expect(result.status).toBe('SLAUGHTERED');
    });

    it('allows SLAUGHTERED disposal when no medication has ever been logged', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ animal_id: 'a-1', company_id: 'comp-1', is_active: true, book_value: null, animal_code: 'PIG-2026-0006' }))
        .mockReturnValueOnce(joinedMedicationRows([]))
        .mockReturnValueOnce(found({ animal_id: 'a-1', is_active: false, status: 'SLAUGHTERED' }));

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });

      const result = await service.dispose('a-1', { disposal_type: 'SLAUGHTERED', disposal_date: '2026-06-10' }, 'tenant-123');

      expect(result.status).toBe('SLAUGHTERED');
    });
  });

  describe('getBioAssetLedger', () => {
    it('returns ledger entries ordered by posting_date', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ animal_id: 'a-1', animal_code: 'PIG-2026-0001' })) // findOne check
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([
                { entry_id: 'e-1', entry_type: 'ACQUISITION', cost_amount: '3000.0000', posting_date: '2026-01-01' },
                { entry_id: 'e-2', entry_type: 'DISPOSAL', cost_amount: '-3000.0000', posting_date: '2026-06-01' },
              ]),
            }),
          }),
        });

      const entries = await service.getBioAssetLedger('a-1');
      expect(entries).toHaveLength(2);
      expect(entries[0].entry_type).toBe('ACQUISITION');
      expect(entries[1].entry_type).toBe('DISPOSAL');
    });
  });

  describe('lookupByTag', () => {
    it('resolves an animal matching RFID tag and returns active withdrawal checks', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                leftJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([
                      {
                        animal: {
                          animal_id: 'a-1',
                          rfid_tag: 'RFID-12345',
                          animal_code: 'PIG-2026-0001',
                        },
                        breed: { breed_name: 'Yorkshire' },
                        stage: { stage_name: 'Gilt' },
                        batch: { batch_code: 'BATCH-01' },
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      const res = await service.lookupByTag('RFID-12345', 'tenant-123');

      expect(res.animal_id).toBe('a-1');
      expect(res.breed_name).toBe('Yorkshire');
      expect(res.stage_name).toBe('Gilt');
      expect(res.hasActiveWithdrawal).toBe(false);
    });

    it('rejects an empty tag string', async () => {
      await expect(service.lookupByTag('   ', 'tenant-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('transitionStage', () => {
    it('advances animal stage and updates destination pen/location', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({
          animal_id: 'a-1',
          company_id: 'comp-1',
          animal_code: 'PIG-2026-0001',
          is_active: true,
          gender: 'F',
          current_stage_id: 'st-gilt',
          current_stage: 'Gilt Grower',
          current_location_id: 'loc-1',
          parity_count: 0,
          entry_date: '2026-01-01',
        })) // findOne
        .mockReturnValueOnce(found({
          stage_id: 'st-flush',
          stage_code: 'FLUSH_SERVICE',
          stage_name: 'Flush and Service',
        })) // destStage check
        .mockReturnValueOnce(found({
          stage_id: 'st-gilt',
          min_days_before_move: 10,
          stage_name: 'Gilt Grower',
        })) // currentStage check
        .mockReturnValueOnce(found({
          location_id: 'loc-2',
          location_name: 'Pen 2B',
        })) // destLocation check
        .mockReturnValueOnce(found({
          animal_id: 'a-1',
          current_stage_id: 'st-flush',
          current_stage: 'Flush and Service',
          current_location_id: 'loc-2',
        })); // findOne return

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });

      const res = await service.transitionStage(
        'a-1',
        {
          to_stage_id: 'st-flush',
          to_location_id: 'loc-2',
          transition_date: '2026-03-01',
          reason: 'Service ready',
        },
        'tenant-123',
        { userId: 'user-1' }
      );

      expect(res.current_stage).toBe('Flush and Service');
      expect(res.current_location_id).toBe('loc-2');
    });

    it('rejects transition of disposed animals', async () => {
      mockDbSelect.mockReturnValueOnce(found({
        animal_id: 'a-1',
        animal_code: 'PIG-2026-0001',
        is_active: false,
        status: 'SOLD',
      }));

      await expect(
        service.transitionStage('a-1', { to_stage_id: 'st-2', transition_date: '2026-03-01' }, 'tenant-123')
      ).rejects.toThrow(BadRequestException);
    });
  });
});



