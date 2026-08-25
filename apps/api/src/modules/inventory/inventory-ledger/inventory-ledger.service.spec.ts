import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLedgerService } from './inventory-ledger.service';
import { ClsService } from 'nestjs-cls';
import { BadRequestException } from '@nestjs/common';

describe('InventoryLedgerService', () => {
  let service: InventoryLedgerService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();
  const mockTxDb = {
    insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue({}) }),
    update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue({}) }) }),
  };
  const mockDbTransaction = jest.fn((cb: any) => cb(mockTxDb));

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    transaction: mockDbTransaction,
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
    mockDbTransaction.mockClear();
    mockTxDb.insert.mockClear();
    mockTxDb.update.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryLedgerService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
      ],
    }).compile();

    service = module.get<InventoryLedgerService>(InventoryLedgerService);
  });

  describe('reverseLedgerEntry', () => {
    const negativeEntry = {
      ledger_id: 'ledg-neg-1',
      tenant_id: 'tenant-1',
      company_id: 'comp-1',
      item_id: 'item-1',
      item_code: 'FEED-001',
      item_description: 'Grower Feed',
      document_type: 'BATCH',
      document_no: 'BATCH-001',
      document_line_id: 'tx-1',
      posting_date: '2026-06-01',
      entry_type: 'NEGATIVE',
      transaction_type: 'BATCH_CONSUMPTION',
      quantity: '-50.0000',
      remaining_quantity: null,
      uom: 'KG',
      uom_conversion_factor: null,
      rate: '12.5000',
      batch_no: null,
      location_id: null,
      warehouse_id: null,
      nob_id: 'nob-1',
      lob_id: 'lob-1',
      category_id: null,
      reversal_of_ledger_id: null,
    };

    it('reverses a NEGATIVE (consumption) entry by writing a new available POSITIVE layer', async () => {
      const valuesSpy = jest.fn().mockResolvedValue({});
      mockDbInsert.mockReturnValue({ values: valuesSpy });
      mockDbSelect
        .mockReturnValueOnce(found(negativeEntry)) // findOne(original)
        .mockReturnValueOnce(found({ ...negativeEntry, ledger_id: 'ledg-reversal-1', entry_type: 'POSITIVE', quantity: '50.0000', remaining_quantity: '50.0000', reversal_of_ledger_id: 'ledg-neg-1' })); // findOne(reversal)

      const result = await service.reverseLedgerEntry('ledg-neg-1', 'user-1');

      const inserted = valuesSpy.mock.calls[0][0];
      expect(inserted.entry_type).toBe('POSITIVE');
      expect(inserted.quantity).toBe('50');
      expect(inserted.remaining_quantity).toBe('50');
      expect(inserted.reversal_of_ledger_id).toBe('ledg-neg-1');
      expect(result?.ledger_id).toBe('ledg-reversal-1');
    });

    it('reverses a fully-unconsumed POSITIVE entry to a NEGATIVE entry and zeroes its remaining_quantity', async () => {
      const positiveEntry = {
        ...negativeEntry,
        ledger_id: 'ledg-pos-1',
        entry_type: 'POSITIVE',
        quantity: '100.0000',
        remaining_quantity: '100.0000',
        transaction_type: 'PURCHASE',
      };
      mockDbSelect
        .mockReturnValueOnce(found(positiveEntry))
        .mockReturnValueOnce(found({ ...positiveEntry, ledger_id: 'ledg-reversal-2', entry_type: 'NEGATIVE', quantity: '-100.0000', reversal_of_ledger_id: 'ledg-pos-1' }));

      const result = await service.reverseLedgerEntry('ledg-pos-1', 'user-1');

      expect(mockDbTransaction).toHaveBeenCalled();
      expect(mockTxDb.insert).toHaveBeenCalled();
      expect(mockTxDb.update).toHaveBeenCalled(); // zeroes remaining_quantity on the original
      expect(result?.ledger_id).toBe('ledg-reversal-2');
    });

    it('rejects reversing a POSITIVE entry that has already been partially consumed downstream', async () => {
      const partiallyConsumed = {
        ...negativeEntry,
        ledger_id: 'ledg-pos-2',
        entry_type: 'POSITIVE',
        quantity: '100.0000',
        remaining_quantity: '40.0000', // 60 already drawn by FIFO
      };
      mockDbSelect.mockReturnValueOnce(found(partiallyConsumed));

      await expect(service.reverseLedgerEntry('ledg-pos-2', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects reversing an entry that is itself already a reversal', async () => {
      mockDbSelect.mockReturnValueOnce(found({ ...negativeEntry, reversal_of_ledger_id: 'some-other-ledger' }));

      await expect(service.reverseLedgerEntry('ledg-neg-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
