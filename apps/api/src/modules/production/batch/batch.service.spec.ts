import { Test, TestingModule } from '@nestjs/testing';
import { BatchService } from './batch.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { InventoryLedgerService } from '../../inventory/inventory-ledger/inventory-ledger.service';
import { GlPostingService } from '../../finance/journal/gl-posting.service';
import { NumberSeriesService } from '../../system/number-series/number-series.service';
import { BadRequestException } from '@nestjs/common';
import * as schema from '../../../core/database/schema';

describe('BatchService', () => {
  let service: BatchService;
  let numberSeriesService: NumberSeriesService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();
  const mockDbTransaction = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    transaction: mockDbTransaction,
  };

  const activeBatch = {
    batch_id: 'batch-1',
    tenant_id: 'tenant-123',
    company_id: 'comp-1',
    lob_id: 'lob-piggery',
    status: 'ACTIVE',
    current_stage_code: null,
    sub_location_id: null,
  };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockDbTransaction.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue({}) } },
        { provide: InventoryLedgerService, useValue: {} },
        { provide: GlPostingService, useValue: {} },
        { provide: NumberSeriesService, useValue: { generateNext: jest.fn().mockResolvedValue('BATCH-000001') } },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    numberSeriesService = module.get<NumberSeriesService>(NumberSeriesService);
  });

  describe('create', () => {
    it('delegates batch_no generation to NumberSeriesService and persists the result', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ nob_id: 'nob-1', costing_method_allowed: 'FIFO,STANDARD' }]),
          }),
        }),
      });

      mockDbTransaction.mockImplementation(async (cb: any) => cb(mockDb));
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ ...activeBatch, batch_no: 'BATCH-000001' } as any);

      const result = await service.create(
        {
          company_id: 'comp-1',
          lob_id: 'lob-piggery',
          costing_method: 'FIFO',
          start_date: '2026-01-01',
          opening_quantity: 100,
          uom: 'HEAD',
          input_lines: [],
        } as any,
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(numberSeriesService.generateNext).toHaveBeenCalledWith('BATCH', 'tenant-123', 'comp-1', mockDb);
      expect(result.batch_no).toBe('BATCH-000001');
    });
  });

  describe('transferStage', () => {
    it('sets stage_id when a matching stage_master row exists for the batch LOB', async () => {
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(activeBatch as any) // initial load
        .mockResolvedValueOnce({ ...activeBatch, current_stage_code: 'QUARANTINE', stage_id: 'stage-quarantine' } as any); // final return

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ stage_id: 'stage-quarantine' }]),
            }),
          }),
        }) // stage_master lookup
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }); // in-step animals (none on this bare fixture)
      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.transferStage('batch-1', { to_stage_code: 'QUARANTINE' }, 'tenant-123', { userId: 'user-1' });

      expect(mockDbUpdate).toHaveBeenCalled();
      const setArg = (mockDbUpdate.mock.results[0].value.set as jest.Mock).mock.calls[0][0];
      expect(setArg.stage_id).toBe('stage-quarantine');
      expect(result.stage_id).toBe('stage-quarantine');
    });

    it('leaves stage_id null when no stage_master row matches the code for this LOB', async () => {
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(activeBatch as any)
        .mockResolvedValueOnce({ ...activeBatch, current_stage_code: 'CUSTOM_STAGE', stage_id: null } as any);

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]), // no matching stage_master row
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }), // LOB has no stages configured
        });
      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.transferStage('batch-1', { to_stage_code: 'CUSTOM_STAGE' }, 'tenant-123', { userId: 'user-1' });

      const setArg = (mockDbUpdate.mock.results[0].value.set as jest.Mock).mock.calls[0][0];
      expect(setArg.stage_id).toBeNull();
      expect(result.stage_id).toBeNull();
    });

    const gestatingBatch = { ...activeBatch, current_stage_code: 'DRY_SOW_GESTATION', stage_id: 'stage-gestation' };

    it('cascades the new stage to the animals that were in step with the batch', async () => {
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(gestatingBatch as any)
        .mockResolvedValueOnce({ ...gestatingBatch, current_stage_code: 'LACTATION', stage_id: 'stage-lactation' } as any);

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ stage_id: 'stage-lactation' }]),
            }),
          }),
        }) // stage_master lookup
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ animal_id: 'a-1' }, { animal_id: 'a-2' }]),
          }),
        }); // animals still standing at the batch's previous stage

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      await service.transferStage('batch-1', { to_stage_code: 'LACTATION' }, 'tenant-123', { userId: 'user-1' });

      // First update is batch_header; the second repoints the in-step animals.
      // mockDbUpdate returns one shared object, so both payloads land on the same
      // set() mock — index 1 is the animal update.
      expect(mockDbUpdate).toHaveBeenCalledTimes(2);
      expect(mockDbUpdate.mock.calls[1][0]).toBe(schema.animalRegister);
      const setMock = mockDbUpdate.mock.results[0].value.set as jest.Mock;
      expect(setMock.mock.calls[1][0].current_stage_id).toBe('stage-lactation');
    });

    it('leaves animals that have diverged from the batch stage where they are', async () => {
      // A few head held back in a hospital pen at an earlier stage: they are in
      // this batch but not at its stage, so a batch-level move must not drag
      // them along.
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(gestatingBatch as any)
        .mockResolvedValueOnce({ ...gestatingBatch, current_stage_code: 'LACTATION', stage_id: 'stage-lactation' } as any);

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ stage_id: 'stage-lactation' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]), // nobody is in step
          }),
        });

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      await service.transferStage('batch-1', { to_stage_code: 'LACTATION' }, 'tenant-123', { userId: 'user-1' });

      // Only batch_header is updated — no animal write at all.
      expect(mockDbUpdate).toHaveBeenCalledTimes(1);
    });

    it('does not touch animals when no stage_master row matches the code', async () => {
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(activeBatch as any)
        .mockResolvedValueOnce({ ...activeBatch, current_stage_code: 'CUSTOM_STAGE', stage_id: null } as any);

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }), // LOB has no stages configured
        });
      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      await service.transferStage('batch-1', { to_stage_code: 'CUSTOM_STAGE' }, 'tenant-123', { userId: 'user-1' });

      expect(mockDbUpdate).toHaveBeenCalledTimes(1);
    });

    it('rejects a stage code that matches nothing for a LOB that has stages configured', async () => {
      // The batch-stages screen once posted its own display codes (ST-01..ST-08)
      // instead of domain codes, writing "ST-05" into current_stage_code and
      // leaving stage_id null. Accepting an unmatched code silently is what let
      // that corrupt a batch.
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(gestatingBatch as any);

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
          }),
        }) // no stage_master row matches 'ST-05'
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ stage_code: 'DRY_SOW_GESTATION' }]),
          }),
        }); // ...but this LOB does have stages configured

      await expect(
        service.transferStage('batch-1', { to_stage_code: 'ST-05' }, 'tenant-123', { userId: 'u' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('still allows a free-text stage for a LOB with no stage master data', async () => {
      // Stages are LOB-defined; a line of business that has configured none must
      // keep working with hand-entered codes.
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(activeBatch as any)
        .mockResolvedValueOnce({ ...activeBatch, current_stage_code: 'CUSTOM', stage_id: null } as any);

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }),
        }); // LOB has no stages at all
      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await service.transferStage('batch-1', { to_stage_code: 'CUSTOM' }, 'tenant-123', { userId: 'u' });

      expect(result.current_stage_code).toBe('CUSTOM');
    });

    it('rejects transferring a non-ACTIVE batch', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ ...activeBatch, status: 'DRAFT' } as any);

      await expect(
        service.transferStage('batch-1', { to_stage_code: 'QUARANTINE' }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('reports accumulated cost as wip_value so the dashboard tile is not structurally zero', async () => {
      // The console's WIP tile reads b.wip_value. Nothing in the API ever
      // returned that field, so Number(undefined) || 0 made the tile read
      // "₹ 0" no matter how much cost a batch had accumulated.
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([
                  { ...activeBatch, batch_id: 'b1', total_cost: null, closing_quantity: '20.0000' },
                ]),
              }),
            }),
          }),
        }) // batch rows
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { batch_id: 'b1', transaction_type: 'CONSUMPTION', amount: '1232.0000' },
              { batch_id: 'b1', transaction_type: 'OVERHEAD', amount: '3300.0000' },
              { batch_id: 'b1', transaction_type: 'MORTALITY', amount: '0.0000' },
            ]),
          }),
        }); // cost-bearing transactions

      const rows = await service.findAll({ limit: 50 } as any, 'tenant-123');

      expect(rows[0].wip_value).toBe(4532);
    });

    it('prefers the posted total_cost once a batch is closed', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([
                  { ...activeBatch, batch_id: 'b2', status: 'CLOSED', total_cost: '999999.0000' },
                ]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { batch_id: 'b2', transaction_type: 'CONSUMPTION', amount: '10.0000' },
            ]),
          }),
        });

      const rows = await service.findAll({ limit: 50 } as any, 'tenant-123');

      expect(rows[0].wip_value).toBe(999999);
    });
  });

  describe('getDataEntry', () => {
    const scheduledBatch = {
      ...activeBatch,
      scheduler_id: 'sched-1',
      start_date: '2026-07-01',
      opening_quantity: '20.0000',
      current_stage_code: 'DRY_SOW_GESTATION',
    };

    const feedParameter = {
      parameter_id: 'p-feed',
      parameter_type: 'CONSUMPTION',
      parameter_name: 'Mid Gestation Ration',
      item_id: 'item-feed',
      resource_id: null,
      default_uom: 'KG',
      qty_method: 'PER_UNIT',
      // kilograms per head per day — a quantity, emphatically not a price
      default_qty_per_unit: '2.2000',
      default_qty_per_batch: null,
    };

    const setup = (parameter: any, itemRow: any | null) => {
      jest.spyOn(service, 'findOne').mockResolvedValue(scheduledBatch as any);
      jest.spyOn(service as any, 'loadActiveScheduleLines').mockResolvedValue([
        {
          spl: { spl_id: 'spl-1', period_label: 'Mid Gestation', occurrence: 'DAILY', uom_override: null, expected_qty_override: null },
          parameter,
        },
      ]);
      mockDbSelect
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) }) // same-day transactions
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(itemRow ? [itemRow] : []) }) }) // item rows
        .mockReturnValueOnce({ from: jest.fn().mockResolvedValue([]) }); // uom conversions
    };

    it('reports the item standard cost as the line rate', async () => {
      setup(feedParameter, {
        item_id: 'item-feed',
        item_code: 'FEED-GEST-SOW',
        item_name: 'Dry Sow Gestation Mash',
        item_type: 'FEED',
        standard_cost: '28.000000',
      });

      const result = await service.getDataEntry('batch-1', '2026-09-01');

      // 28/kg, not 2.2 — the per-head quantity was being surfaced as a price,
      // so the data-entry screen costed 6 labour hours at ₹6.
      expect(result.lines[0].std_rate).toBe(28);
      expect(result.lines[0].expected_qty).toBe(44);
    });

    it('converts the item rate into the line unit when they differ', async () => {
      // Ivermectin is stocked and priced per 100 ml VIAL, but the schedule
      // doses in ML. Using the vial price per millilitre costed a 40 ml round
      // at Rs 11,200 instead of Rs 112.
      jest.spyOn(service, 'findOne').mockResolvedValue(scheduledBatch as any);
      jest.spyOn(service as any, 'loadActiveScheduleLines').mockResolvedValue([
        {
          spl: { spl_id: 'spl-m', period_label: 'Deworming', occurrence: 'DAILY', uom_override: 'ML', expected_qty_override: null },
          parameter: {
            parameter_id: 'p-med', parameter_type: 'CONSUMPTION', parameter_name: 'Deworming',
            item_id: 'item-med', resource_id: null, default_uom: 'ML',
            qty_method: 'PER_UNIT', default_qty_per_unit: '2.0000', default_qty_per_batch: null,
          },
        },
      ]);
      mockDbSelect
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) }) // same-day tx
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([
          { item_id: 'item-med', item_code: 'MED-IVERMECTIN', item_name: 'Ivermectin 1% 100ml', item_type: 'MEDICINE', standard_cost: '280.000000', uom_primary: 'VIAL' },
        ]) }) }) // items
        .mockReturnValueOnce({ from: jest.fn().mockResolvedValue([
          { from_uom: 'VIAL', to_uom: 'ML', conversion_factor: '100.000000' },
        ]) }); // uom conversions

      const result = await service.getDataEntry('batch-1', '2026-09-01');

      expect(result.lines[0].std_rate).toBe(2.8);
      expect(result.lines[0].expected_qty).toBe(40);
    });

    it('reports no rate rather than a quantity when the parameter has no item', async () => {
      setup(
        { ...feedParameter, parameter_id: 'p-labour', parameter_type: 'OVERHEAD', item_id: null, default_uom: 'HRS', qty_method: 'PER_BATCH', default_qty_per_unit: null, default_qty_per_batch: '6.0000' },
        null,
      );

      const result = await service.getDataEntry('batch-1', '2026-09-01');

      expect(result.lines[0].std_rate).toBeNull();
    });
  });

  describe('matureBioAsset', () => {
    const bioBatch = {
      ...activeBatch,
      batch_no: 'BATCH-000001',
      costing_method: 'BIO_ASSET',
      breed_id: 'breed-1',
      input_lines: [{ item_id: 'item-piglet' }],
    };

    it('transitions PREMATURE batch to MATURE, calculates amortization rate, and posts BIO_TRANSFORMATION', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(bioBatch as any);

      const mockGlService = { postBatchCostEntry: jest.fn().mockResolvedValue({ journal_id: 'j-1' }) };
      (service as any).glPostingService = mockGlService;

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  state_id: 'state-1',
                  batch_id: 'batch-1',
                  stage: 'PREMATURE',
                  current_quantity: '10.0000',
                  nca_book_value: '50000.0000',
                },
              ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ breed_id: 'breed-1', productive_life_months: 24 }]),
            }),
          }),
        });

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      await service.matureBioAsset(
        'batch-1',
        { residual_value_per_unit: 500, productive_life_months: 24 },
        'tenant-123',
        { userId: 'user-1' },
      );

      // ncaValue: 50000, residualTotal: 500 * 10 = 5000
      // monthlyRate: (50000 - 5000) / 24 / 10 = 187.5
      expect(mockGlService.postBatchCostEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'BIO_TRANSFORMATION',
          amount: 50000,
        }),
      );

      expect(mockDbUpdate).toHaveBeenCalled();
      const setCall = (mockDbUpdate.mock.results[0].value.set as jest.Mock).mock.calls[0][0];
      expect(setCall.stage).toBe('MATURE');
      expect(Number(setCall.monthly_amortization_rate)).toBeCloseTo(187.5);
    });

    it('rejects maturing a batch that is already MATURE', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(bioBatch as any);

      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                state_id: 'state-1',
                batch_id: 'batch-1',
                stage: 'MATURE',
                current_quantity: '10.0000',
                nca_book_value: '50000.0000',
              },
            ]),
          }),
        }),
      });

      await expect(
        service.matureBioAsset('batch-1', { residual_value_per_unit: 500 }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('amortizeBioAsset', () => {
    const matureBioBatch = {
      ...activeBatch,
      batch_no: 'BATCH-000001',
      costing_method: 'BIO_ASSET',
      input_lines: [{ item_id: 'item-piglet' }],
    };

    it('posts BIO_AMORTIZATION and reduces nca_book_value', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(matureBioBatch as any);

      const mockGlService = { postBatchCostEntry: jest.fn().mockResolvedValue({ journal_id: 'j-1' }) };
      (service as any).glPostingService = mockGlService;

      // 1. getBioAssetState
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                state_id: 'state-1',
                batch_id: 'batch-1',
                stage: 'MATURE',
                current_quantity: '10.0000',
                nca_book_value: '45000.0000',
                monthly_amortization_rate: '187.500000',
              },
            ]),
          }),
        }),
      });
      // 2. existingEntries check
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      await service.amortizeBioAsset('batch-1', { posting_date: '2026-02-15' }, 'tenant-123', { userId: 'user-1' });

      // 187.5 * 10 = 1875
      expect(mockGlService.postBatchCostEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'BIO_AMORTIZATION',
          amount: 1875,
          postingDate: '2026-02-15',
        }),
      );

      const setCall = (mockDbUpdate.mock.results[0].value.set as jest.Mock).mock.calls[0][0];
      expect(Number(setCall.nca_book_value)).toBeCloseTo(43125);
    });

    it('rejects duplicate amortization for the same month', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(matureBioBatch as any);

      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                state_id: 'state-1',
                batch_id: 'batch-1',
                stage: 'MATURE',
                current_quantity: '10.0000',
                nca_book_value: '45000.0000',
                monthly_amortization_rate: '187.500000',
              },
            ]),
          }),
        }),
      });
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ posting_date: '2026-02-01', entry_type: 'AMORTIZATION' }]),
        }),
      });

      await expect(
        service.amortizeBioAsset('batch-1', { posting_date: '2026-02-28' }, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordFairValue', () => {
    const matureBioBatch = {
      ...activeBatch,
      batch_no: 'BATCH-000001',
      costing_method: 'BIO_ASSET',
      input_lines: [{ item_id: 'item-piglet' }],
    };

    it('posts BIO_FAIR_VALUE with reverseDirection for fair value loss', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(matureBioBatch as any);

      const mockGlService = { postBatchCostEntry: jest.fn().mockResolvedValue({ journal_id: 'j-1' }) };
      (service as any).glPostingService = mockGlService;

      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                state_id: 'state-1',
                batch_id: 'batch-1',
                stage: 'MATURE',
                current_quantity: '10.0000',
                nca_book_value: '40000.0000', // 4000/unit
              },
            ]),
          }),
        }),
      });

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      // Fair value drops to 3500/unit -> loss of 500 * 10 = 5000
      await service.recordFairValue('batch-1', { fair_value_per_unit: 3500, posting_date: '2026-03-01' }, 'tenant-123', { userId: 'user-1' });

      expect(mockGlService.postBatchCostEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'BIO_FAIR_VALUE',
          amount: 5000,
          reverseDirection: true,
        }),
      );

      const setCall = (mockDbUpdate.mock.results[0].value.set as jest.Mock).mock.calls[0][0];
      expect(Number(setCall.nca_book_value)).toBeCloseTo(35000);
    });
  });

  describe('disposeBioAsset', () => {
    const matureBioBatch = {
      ...activeBatch,
      batch_no: 'BATCH-000001',
      costing_method: 'BIO_ASSET',
      input_lines: [{ item_id: 'item-piglet' }],
    };

    it('auto-closes the batch when the last animals are disposed', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(matureBioBatch as any);

      const mockLedgerService = { writePositiveEntry: jest.fn().mockResolvedValue({ ledger_id: 'l-1' }) };
      const mockGlService = { postInventoryLedgerEntry: jest.fn().mockResolvedValue({ journal_id: 'j-1' }) };
      (service as any).ledgerService = mockLedgerService;
      (service as any).glPostingService = mockGlService;

      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                state_id: 'state-1',
                batch_id: 'batch-1',
                stage: 'MATURE',
                current_quantity: '5.0000',
                nca_book_value: '20000.0000',
              },
            ]),
          }),
        }),
      });

      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });
      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      await service.disposeBioAsset(
        'batch-1',
        {
          disposal_type: 'HARVEST',
          quantity: 5,
          posting_date: '2026-04-01',
          output_item_id: 'item-dressed-pork',
          output_uom: 'KG',
          output_quantity: 400,
          warehouse_id: 'wh-1',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockLedgerService.writePositiveEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'BIO_HARVEST',
          quantity: 400,
          rate: 50, // 20000 / 400
        }),
      );

      // Verify that batchHeader was updated to CLOSED
      const setMock = mockDbUpdate.mock.results[0].value.set as jest.Mock;
      const allSetCalls = setMock.mock.calls.map((call) => call[0]);
      const batchHeaderCloseCall = allSetCalls.find((call) => call.status === 'CLOSED');
      expect(batchHeaderCloseCall).toBeDefined();
      expect(batchHeaderCloseCall.status).toBe('CLOSED');
    });
  });

  describe('bulkAddDailyTransactions', () => {
    it('iterates rows and dispatches addTransaction for feed, mortality, and temperature', async () => {
      const addTxSpy = jest.spyOn(service, 'addTransaction').mockResolvedValue({ transaction_id: 'tx-1' } as any);

      const res = await service.bulkAddDailyTransactions(
        {
          company_id: 'comp-1',
          entry_date: '2026-08-19',
          entries: [
            {
              batch_id: 'b-1',
              feed_item_id: 'item-feed',
              feed_qty: 450,
              mortality_count: 2,
              temperature: 24.5,
              water_qty: 1200,
              remarks: 'Normal routine',
            },
            {
              batch_id: 'b-2',
              feed_item_id: 'item-feed',
              feed_qty: 600,
              mortality_count: 0,
            },
          ],
        },
        'tenant-123',
        { userId: 'user-1' }
      );

      expect(res.totalEntries).toBe(2);
      expect(res.successCount).toBe(5); // 4 for b-1 (feed, mort, water, temp) + 1 for b-2 (feed)
      expect(res.errorCount).toBe(0);
      expect(addTxSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('generateSchedulerForBatch', () => {
    it('throws if batch has no breed assigned', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        batch_id: 'b-1',
        breed_id: null,
      } as any);

      await expect(service.generateSchedulerForBatch('b-1', 'tenant-123')).rejects.toThrow(BadRequestException);
    });

    it('generates scheduler and parameter lines from breed lifecycle standards', async () => {
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce({
          batch_id: 'b-1',
          batch_no: 'BATCH-2026-0001',
          breed_id: 'breed-1',
          nob_id: 'nob-1',
          lob_id: 'lob-1',
          company_id: 'comp-1',
          breed: { breed_name: 'Large White Yorkshire' },
        } as any)
        .mockResolvedValueOnce({
          batch_id: 'b-1',
          batch_no: 'BATCH-2026-0001',
          scheduler_id: 'sched-1',
          scheduler: { scheduler_code: 'SCHED-BATCH-2026-0001' },
        } as any);

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue([
                  {
                    lifecycle: {
                      period_from: 1,
                      period_to: 30,
                      calc_unit: 'DAY',
                      feed_qty_per_head_per_day_kg: '1.2000',
                      std_mortality_rate_pct: '1.500',
                      std_body_weight_kg: '25.000',
                    },
                    stage: { stage_name: 'Quarantine / Grower', stage_code: 'GROWER' },
                  },
                ]),
              }),
            }),
          }),
        }) // breedLifecycleStages
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }) // parameterMaster existing
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }); // existing scheduler check

      mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });
      mockDbUpdate.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) });

      const res = await service.generateSchedulerForBatch('b-1', 'tenant-123', { userId: 'user-1' });
      expect(res.scheduler_id).toBe('sched-1');
      expect(mockDbInsert).toHaveBeenCalled();
    });
  });

  describe('getBatchPerformanceCurves', () => {
    it('returns structured standard curves vs actual metrics', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        batch_id: 'b-1',
        batch_no: 'BATCH-2026-0001',
        start_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
        initial_quantity: 100,
        current_quantity: 98,
        scheduler_id: 'sched-1',
      } as any);

      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue([
                  {
                    tx: {
                      transaction_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
                      transaction_type: 'CONSUMPTION',
                      quantity: '120.00',
                    },
                    item: { item_type: 'FEED' },
                  },
                  {
                    tx: {
                      transaction_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
                      transaction_type: 'MORTALITY',
                      quantity: '2.00',
                    },
                    item: null,
                  },
                ]),
              }),
            }),
          }),
        }) // batch transactions
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                {
                  spl: { period_from: 1, period_to: 50, expected_qty_override: '1.2' },
                  param: { parameter_type: 'CONSUMPTION' },
                },
              ]),
            }),
          }),
        }); // scheduler lines

      const res = await service.getBatchPerformanceCurves('b-1', 'tenant-123');

      expect(res.batch.batch_no).toBe('BATCH-2026-0001');
      expect(res.curves.length).toBeGreaterThan(0);
      expect(res.summary.totalActFeedKg).toBe(120);
      expect(res.summary.totalMortality).toBe(2);
    });
  });
});




