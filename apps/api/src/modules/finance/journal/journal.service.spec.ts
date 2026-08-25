import { Test, TestingModule } from '@nestjs/testing';
import { JournalService } from './journal.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { BadRequestException } from '@nestjs/common';

describe('JournalService', () => {
  let service: JournalService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();
  const mockDbTransaction = jest.fn((cb: any) => cb(mockTxDb));

  const mockTxDb = {
    select: jest.fn().mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ for: jest.fn().mockResolvedValue([{ total: 4 }]) }) }) }),
    insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue({}) }),
  };

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

  const foundList = (rows: any[]) => ({
    from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(rows) }),
  });

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockDbTransaction.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    service = module.get<JournalService>(JournalService);
  });

  describe('reverseJournalEntry', () => {
    const postedJournal = {
      journal_id: 'j-original-1',
      tenant_id: 'tenant-1',
      company_id: 'comp-1',
      journal_no: 'JE-000001',
      posting_date: '2026-06-01',
      source: 'SYSTEM',
      source_document_type: 'BATCH',
      source_document_no: 'BATCH-001',
      source_ledger_id: null,
      description: 'Mortality — BATCH-001',
      status: 'POSTED',
      total_debit: '500.0000',
      total_credit: '500.0000',
      reversal_of_journal_id: null,
    };
    const lines = [
      { line_id: 'l-1', journal_id: 'j-original-1', gl_account_id: 'gl-dr', cost_center_id: null, debit_amount: '500.0000', credit_amount: '0.0000', description: 'Mortality', nob_id: 'nob-1', lob_id: 'lob-1' },
      { line_id: 'l-2', journal_id: 'j-original-1', gl_account_id: 'gl-cr', cost_center_id: null, debit_amount: '0.0000', credit_amount: '500.0000', description: 'Mortality', nob_id: 'nob-1', lob_id: 'lob-1' },
    ];

    it('posts a new journal with every line debit/credit swapped, referencing the original', async () => {
      const lineValuesSpy = jest.fn().mockResolvedValue({});
      mockDbInsert.mockReturnValue({ values: lineValuesSpy });

      mockDbSelect
        .mockReturnValueOnce(found(postedJournal)) // findOne(original) header
        .mockReturnValueOnce(foundList(lines)) // findOne(original) lines
        .mockReturnValueOnce(found({ ...postedJournal, journal_id: 'j-reversal-1', reversal_of_journal_id: 'j-original-1' })) // findOne(new) header
        .mockReturnValueOnce(foundList([])); // findOne(new) lines

      const result = await service.reverseJournalEntry('j-original-1', 'user-1');

      expect(mockDbTransaction).toHaveBeenCalled();
      expect(mockTxDb.insert).toHaveBeenCalled(); // journal_header, inside the transaction

      // journal_line insert (outside the tx) carries the swapped debit/credit values.
      const insertedLines = lineValuesSpy.mock.calls[0][0];
      expect(insertedLines).toHaveLength(2);
      expect(insertedLines[0]).toMatchObject({ gl_account_id: 'gl-dr', debit_amount: '0.0000', credit_amount: '500.0000' });
      expect(insertedLines[1]).toMatchObject({ gl_account_id: 'gl-cr', debit_amount: '500.0000', credit_amount: '0.0000' });

      expect(result.journal_id).toBe('j-reversal-1');
      expect(result.reversal_of_journal_id).toBe('j-original-1');
    });

    it('throws if the original journal is not POSTED', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ ...postedJournal, status: 'DRAFT' }))
        .mockReturnValueOnce(foundList(lines));

      await expect(service.reverseJournalEntry('j-original-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws if attempting to reverse a reversal journal', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ ...postedJournal, reversal_of_journal_id: 'j-some-other' }))
        .mockReturnValueOnce(foundList(lines));

      await expect(service.reverseJournalEntry('j-original-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
