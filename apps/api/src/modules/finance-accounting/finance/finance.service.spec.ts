import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { BadRequestException, ConflictException } from '@nestjs/common';
import * as schema from '../../../core/database/schema';

// Import our services
import { CoaService } from './services/coa.service';
import { FiscalService } from './services/fiscal.service';
import { DimensionService } from './services/dimension.service';
import { LedgerService } from './services/ledger.service';
import { JournalService } from './services/journal.service';
import { PostingEngineService } from './services/posting-engine.service';
import { SubledgerService } from './services/subledger.service';
import { ReportService } from './services/report.service';
import { AuditLogService } from '../../platform-identity/audit-log/audit-log.service';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

describe('Finance & Accounting Engine Integration Tests', () => {
  let coaService: CoaService;
  let fiscalService: FiscalService;
  let dimensionService: DimensionService;
  let ledgerService: LedgerService;
  let journalService: JournalService;
  let postingEngineService: PostingEngineService;
  let subledgerService: SubledgerService;
  let reportService: ReportService;

  let connection: mysql.Connection;
  let db: any;

  // Use platform pre-seeded company and tenant
  const tenantId = '00000000-0000-0000-0000-000000000000';
  const companyId = '00000000-0000-0000-0000-000000000000';

  const cleanDatabase = async (databaseClient: any) => {
    if (!databaseClient) return;
    // Delete in child-to-parent order
    await databaseClient.delete(schema.supplierLedgerEntry).where(eq(schema.supplierLedgerEntry.tenant_id, tenantId));
    await databaseClient.delete(schema.customerLedgerEntry).where(eq(schema.customerLedgerEntry.tenant_id, tenantId));
    await databaseClient.delete(schema.generalLedgerEntry).where(eq(schema.generalLedgerEntry.tenant_id, tenantId));
    await databaseClient.delete(schema.financialJournalLine).where(eq(schema.financialJournalLine.line_id, schema.financialJournalLine.line_id));
    await databaseClient.delete(schema.financialJournalHeader).where(eq(schema.financialJournalHeader.tenant_id, tenantId));
    await databaseClient.delete(schema.glMappingMaster).where(eq(schema.glMappingMaster.tenant_id, tenantId));
    await databaseClient.delete(schema.glAccountMaster).where(eq(schema.glAccountMaster.tenant_id, tenantId));
    await databaseClient.delete(schema.costCenterMaster).where(eq(schema.costCenterMaster.tenant_id, tenantId));
    await databaseClient.delete(schema.accountingPeriod).where(eq(schema.accountingPeriod.tenant_id, tenantId));
    await databaseClient.delete(schema.fiscalYear).where(eq(schema.fiscalYear.tenant_id, tenantId));
    await databaseClient.delete(schema.customerMaster).where(eq(schema.customerMaster.tenant_id, tenantId));
    await databaseClient.delete(schema.supplierMaster).where(eq(schema.supplierMaster.tenant_id, tenantId));
  };

  beforeAll(async () => {
    try {
      connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number(process.env.DATABASE_PORT) || 3306,
        user: process.env.DATABASE_USERNAME || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.SYSTEM_TENANT_DATABASE || 'tenant_system',
      });

      db = drizzle(connection, { schema, mode: 'default' });
      await cleanDatabase(db);
    } catch (err) {
      console.warn('[Finance Integration Tests]: Local MySQL offline, skipping live DB integration calls.');
    }

    const mockDb: any = {
      transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockDb)),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
            orderBy: jest.fn().mockResolvedValue([]),
            then: (resolve: any) => resolve([]),
          }),
          then: (resolve: any) => resolve([]),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onDuplicateKeyUpdate: jest.fn().mockResolvedValue({}),
          then: (resolve: any) => resolve({}),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({}),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoaService,
        FiscalService,
        DimensionService,
        LedgerService,
        JournalService,
        PostingEngineService,
        SubledgerService,
        ReportService,
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'tenantId') return tenantId;
              return db || mockDb;
            }),
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

    coaService = module.get<CoaService>(CoaService);
    fiscalService = module.get<FiscalService>(FiscalService);
    dimensionService = module.get<DimensionService>(DimensionService);
    ledgerService = module.get<LedgerService>(LedgerService);
    journalService = module.get<JournalService>(JournalService);
    postingEngineService = module.get<PostingEngineService>(PostingEngineService);
    subledgerService = module.get<SubledgerService>(SubledgerService);
    reportService = module.get<ReportService>(ReportService);
  });

  afterAll(async () => {
    if (db) await cleanDatabase(db);
    if (connection) await connection.end();
  });

  describe('1. Chart of Accounts (COA) Tests', () => {
    let parentId: string;
    let childId: string;

    it('should create a parent GL account successfully', async () => {
      if (!db) return;
      const acc = await coaService.create(
        {
          company_id: companyId,
          account_code: '10000',
          account_name: 'Assets Header',
          account_type: 'ASSET' as any,
        },
        tenantId
      );

      expect(acc.account_code).toBe('10000');
      expect(acc.is_sub_account).toBe(false);
      parentId = acc.gl_account_id;
    });

    it('should create a child sub-account linking to the parent', async () => {
      if (!db) return;
      const acc = await coaService.create(
        {
          company_id: companyId,
          account_code: '11000',
          account_name: 'Cash in Hand',
          account_type: 'ASSET' as any,
          parent_account_id: parentId,
        },
        tenantId
      );

      expect(acc.account_code).toBe('11000');
      expect(acc.is_sub_account).toBe(true);
      expect(acc.parent_account_id).toBe(parentId);
      childId = acc.gl_account_id;
    });

    it('should reject creation of duplicate account code in the same company', async () => {
      if (!db) return;
      await expect(
        coaService.create(
          {
            company_id: companyId,
            account_code: '11000',
            account_name: 'Cash Duplicate',
            account_type: 'ASSET' as any,
          },
          tenantId
        )
      ).rejects.toThrow(ConflictException);
    });

    it('should retrieve hierarchical tree structure of the COA', async () => {
      if (!db) return;
      const tree = await coaService.getTree(companyId, tenantId);
      expect(tree.length).toBeGreaterThanOrEqual(1);
      const parentNode = tree.find((x: any) => x.gl_account_id === parentId);
      expect(parentNode).toBeDefined();
      expect(parentNode.children.length).toBe(1);
      expect(parentNode.children[0].gl_account_id).toBe(childId);
    });
  });

  describe('2. Fiscal Year & Accounting Periods Tests', () => {
    let fiscalYearId: string;
    let period1Id: string;
    let period2Id: string;

    it('should create a fiscal year and auto-generate 12 monthly accounting periods', async () => {
      if (!db) return;
      const fy = await fiscalService.createFiscalYear(
        {
          company_id: companyId,
          year_code: 'FY2026',
          start_date: '2026-04-01',
          end_date: '2027-03-31',
        },
        tenantId
      );

      expect(fy.year_code).toBe('FY2026');
      expect(fy.periods.length).toBe(12);
      expect(fy.periods[0].period_no).toBe(1);
      expect(fy.periods[11].period_no).toBe(12);

      fiscalYearId = fy.fiscal_year_id;
      period1Id = fy.periods[0].period_id;
      period2Id = fy.periods[1].period_id;
    });

    it('should validate active posting dates', async () => {
      if (!db) return;
      const result = await fiscalService.validatePostingDate(companyId, '2026-04-15', tenantId);
      expect(result.fiscalYearId).toBe(fiscalYearId);
      expect(result.periodId).toBe(period1Id);
    });

    it('should prevent posting to a locked accounting period', async () => {
      if (!db) return;
      // Lock period 1
      await fiscalService.closePeriod(period1Id, tenantId);

      // Validate should now throw
      await expect(
        fiscalService.validatePostingDate(companyId, '2026-04-15', tenantId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should permit posting to an unlocked period 2', async () => {
      if (!db) return;
      const result = await fiscalService.validatePostingDate(companyId, '2026-05-10', tenantId);
      expect(result.periodId).toBe(period2Id);
    });
  });

  describe('3. Cost Centers & Reporting Dimensions Tests', () => {
    let dimId: string;
    let costCenterId: string;

    it('should seed a cost center and validate it', async () => {
      if (!db) return;
      costCenterId = 'test-cc-uuid';
      await db.insert(schema.costCenterMaster).values({
        cost_center_id: costCenterId,
        tenant_id: tenantId,
        company_id: companyId,
        cost_center_code: 'CC-POULTRY',
        cost_center_name: 'Poultry Farm Cost Center',
        cost_center_type: 'FARM',
        is_active: true,
      });

      const valid = await dimensionService.validateCostCenter(costCenterId, companyId, tenantId);
      expect(valid).toBe(true);
    });

    it('should register a financial dimension and values', async () => {
      if (!db) return;
      const dim = await dimensionService.createDimension(
        {
          company_id: companyId,
          dimension_code: 'FARM',
          dimension_name: 'Farms Dimension',
        },
        tenantId
      );
      expect(dim.dimension_code).toBe('FARM');
      dimId = dim.dimension_id;

      const val = await dimensionService.createDimensionValue(
        {
          company_id: companyId,
          dimension_id: dimId,
          value_code: 'Farm01',
          value_name: 'Northern Farm Unit',
        },
        tenantId
      );
      expect(val.value_code).toBe('Farm01');
    });

    it('should validate dimension values successfully', async () => {
      if (!db) return;
      const valid = await dimensionService.validateDimensionValues(
        companyId,
        { FARM: 'Farm01' },
        tenantId
      );
      expect(valid).toBe(true);
    });

    it('should fail validation with invalid dimension code or value', async () => {
      if (!db) return;
      await expect(
        dimensionService.validateDimensionValues(companyId, { FARM: 'InvalidVal' }, tenantId)
      ).rejects.toThrow(BadRequestException);

      await expect(
        dimensionService.validateDimensionValues(companyId, { INVALID_DIM: 'Val' }, tenantId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. General Ledger Entry & Manual Journal Tests', () => {
    let cashAccountId: string;
    let capitalAccountId: string;
    let parentAccountId: string;

    beforeAll(async () => {
      if (!db) return;
      // Create Cash account (leaf)
      const cash = await coaService.create(
        {
          company_id: companyId,
          account_code: '11001',
          account_name: 'Petty Cash',
          account_type: 'ASSET' as any,
        },
        tenantId
      );
      cashAccountId = cash.gl_account_id;

      // Create Parent account to verify block-postings rule
      const parentAcc = await coaService.create(
        {
          company_id: companyId,
          account_code: '30000',
          account_name: 'Equity Summary',
          account_type: 'EQUITY' as any,
        },
        tenantId
      );
      parentAccountId = parentAcc.gl_account_id;

      // Create Capital account (leaf of parent)
      const capital = await coaService.create(
        {
          company_id: companyId,
          account_code: '31000',
          account_name: 'Shareholders Capital',
          account_type: 'EQUITY' as any,
          parent_account_id: parentAccountId,
        },
        tenantId
      );
      capitalAccountId = capital.gl_account_id;
    });

    it('should reject direct postings to parent/summary accounts', async () => {
      if (!db) return;
      await expect(
        ledgerService.postEntry(
          {
            company_id: companyId,
            gl_account_id: parentAccountId,
            debit: 1000,
            credit: 0,
            posting_date: '2026-05-01',
            ref_doc_type: 'Manual',
            ref_doc_id: 'test-doc-id',
          },
          tenantId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject out-of-balance journal entries', async () => {
      if (!db) return;
      await expect(
        journalService.create(
          {
            company_id: companyId,
            journal_type: 'GENERAL' as any,
            posting_date: '2026-05-15',
            lines: [
              { gl_account_id: cashAccountId, debit: 1000, credit: 0 },
              { gl_account_id: capitalAccountId, debit: 0, credit: 950 }, // out of balance
            ],
          },
          tenantId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully post a balanced manual journal', async () => {
      if (!db) return;
      const draft = await journalService.create(
        {
          company_id: companyId,
          journal_type: 'GENERAL' as any,
          posting_date: '2026-05-15',
          notes: 'Initial Capital Injection',
          lines: [
            { gl_account_id: cashAccountId, debit: 10000, credit: 0, description: 'Debit cash' },
            { gl_account_id: capitalAccountId, debit: 0, credit: 10000, description: 'Credit capital' },
          ],
        },
        tenantId
      );

      expect(draft.status).toBe('DRAFT');

      // Post the journal
      const res = await journalService.post(draft.journal_id, tenantId);
      expect(res.success).toBe(true);

      // Verify posted status
      const posted = await journalService.findOne(draft.journal_id, tenantId);
      expect(posted.status).toBe('POSTED');

      // Check cash ledger entries and running balance
      const [cashEntry] = await db
        .select()
        .from(schema.generalLedgerEntry)
        .where(eq(schema.generalLedgerEntry.gl_account_id, cashAccountId));
      expect(parseFloat(cashEntry.debit)).toBe(10000);
      expect(parseFloat(cashEntry.running_balance)).toBe(10000);
    });
  });

  describe('5. AP & AR Subledger Tests', () => {
    let customerId: string;
    let supplierId: string;

    beforeAll(async () => {
      if (!db) return;
      customerId = 'test-cust-uuid';
      supplierId = 'test-supp-uuid';

      await db.insert(schema.customerMaster).values({
        customer_id: customerId,
        tenant_id: tenantId,
        company_id: companyId,
        customer_code: 'CUST-01',
        customer_name: 'Test Customer',
        mobile: '1234567890',
      });

      await db.insert(schema.supplierMaster).values({
        supplier_id: supplierId,
        tenant_id: tenantId,
        company_id: companyId,
        supplier_code: 'SUPP-01',
        supplier_name: 'Test Supplier',
      });
    });

    it('should post a customer invoice and then apply a matching payment', async () => {
      if (!db) return;
      // Post customer invoice ($100 debit)
      const invId = await subledgerService.postCustomerEntry(
        {
          company_id: companyId,
          customer_id: customerId,
          posting_date: '2026-05-01',
          document_type: 'INVOICE',
          document_no: 'INV-1001',
          amount: 100,
          due_date: '2026-05-31',
        },
        tenantId
      );

      let balance = await subledgerService.getCustomerBalance(customerId, tenantId);
      expect(balance).toBe(100);

      // Post matching customer payment (-$65 credit)
      await subledgerService.postCustomerEntry(
        {
          company_id: companyId,
          customer_id: customerId,
          posting_date: '2026-05-05',
          document_type: 'PAYMENT',
          document_no: 'PAY-2001',
          amount: -65,
        },
        tenantId
      );

      // Net customer balance should now be $35
      balance = await subledgerService.getCustomerBalance(customerId, tenantId);
      expect(balance).toBe(35);

      // Verify matching deduction on invoice ledger row
      const [invoiceEntry] = await db
        .select()
        .from(schema.customerLedgerEntry)
        .where(eq(schema.customerLedgerEntry.entry_id, invId));
      expect(parseFloat(invoiceEntry.remaining_amount)).toBe(35);
    });

    it('should compile an accurate Customer aging report', async () => {
      if (!db) return;
      const aging = await subledgerService.getCustomerAging(companyId, '2026-06-15', tenantId);
      //INV due 2026-05-31. As of 2026-06-15 is 15 days past due (30-day bucket)
      expect(aging.days_30).toBe(35);
      expect(aging.total).toBe(35);
    });
  });

  describe('6. Automatic Inventory operational integration tests', () => {
    let inventoryAccountId: string;
    let accruedPayableAccountId: string;

    beforeAll(async () => {
      if (!db) return;
      // 1. Seed Inventory Account
      const invAcc = await coaService.create(
        {
          company_id: companyId,
          account_code: '12000',
          account_name: 'Inventory Assets',
          account_type: 'ASSET' as any,
        },
        tenantId
      );
      inventoryAccountId = invAcc.gl_account_id;

      // 2. Seed Accrued Payable Account
      const accPay = await coaService.create(
        {
          company_id: companyId,
          account_code: '21001',
          account_name: 'Accrued Accounts Payable',
          account_type: 'LIABILITY' as any,
        },
        tenantId
      );
      accruedPayableAccountId = accPay.gl_account_id;

      // 3. Seed Category & GL Mapping
      await db.insert(schema.glMappingMaster).values({
        mapping_id: 'test-map-uuid',
        tenant_id: tenantId,
        company_id: companyId,
        item_category_id: null, // Company-wide fallback mapping rule
        transaction_type: 'PURCHASE',
        debit_gl_account_id: inventoryAccountId,
        credit_gl_account_id: accruedPayableAccountId,
        is_active: true,
      });
    });

    it('should trigger double entry General Ledger lines when posting operational receipts', async () => {
      if (!db) return;
      // Trigger automatic engine posting directly to test rule matching
      await postingEngineService.postAutomaticEntry(
        {
          company_id: companyId,
          item_category_id: null,
          transaction_type: 'PURCHASE',
          amount: 750,
          posting_date: '2026-05-20',
          ref_doc_type: 'GoodsReceipt',
          ref_doc_id: 'goods-receipt-uuid',
        },
        tenantId
      );

      // Verify debit recorded to Inventory
      const [debitEntry] = await db
        .select()
        .from(schema.generalLedgerEntry)
        .where(
          and(
            eq(schema.generalLedgerEntry.gl_account_id, inventoryAccountId),
            eq(schema.generalLedgerEntry.posting_date, '2026-05-20')
          )
        );
      expect(parseFloat(debitEntry.debit)).toBe(750);
      expect(parseFloat(debitEntry.credit)).toBe(0);

      // Verify credit recorded to Accrued Payable
      const [creditEntry] = await db
        .select()
        .from(schema.generalLedgerEntry)
        .where(
          and(
            eq(schema.generalLedgerEntry.gl_account_id, accruedPayableAccountId),
            eq(schema.generalLedgerEntry.posting_date, '2026-05-20')
          )
        );
      expect(parseFloat(creditEntry.credit)).toBe(750);
      expect(parseFloat(creditEntry.debit)).toBe(0);
    });
  });

  describe('7. Compilation of Financial Statements (Trial Balance, P&L, Balance Sheet)', () => {
    it('should compile an accurate Trial Balance report', async () => {
      if (!db) return;
      const tb = await reportService.getTrialBalance(companyId, '2026-04-01', '2026-06-30', null, tenantId);
      expect(tb.length).toBeGreaterThanOrEqual(2);

      // Total Debits must equal Total Credits on the Trial Balance
      const totalDr = tb.reduce((sum: number, item: any) => sum + item.debit, 0);
      const totalCr = tb.reduce((sum: number, item: any) => sum + item.credit, 0);
      expect(totalDr).toBe(totalCr);
    });

    it('should compile a balanced Balance Sheet', async () => {
      if (!db) return;
      const bs = await reportService.getBalanceSheet(companyId, '2026-06-30', tenantId);
      expect(bs.isBalanced).toBe(true);
    });
  });
});
