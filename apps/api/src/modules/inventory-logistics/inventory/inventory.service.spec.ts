import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { BadRequestException } from '@nestjs/common';

// Import our services
import { LotService } from './services/lot.service';
import { SerialService } from './services/serial.service';
import { InventoryLedgerService } from './services/inventory-ledger.service';
import { ReservationService } from './services/reservation.service';
import { FifoEngineService } from './services/fifo-engine.service';
import { GoodsReceiptService } from './services/goods-receipt.service';
import { GoodsIssueService } from './services/goods-issue.service';
import { TransferOrderService } from './services/transfer-order.service';
import { InventoryAdjustmentService } from './services/inventory-adjustment.service';
import { InventoryJournalService } from './services/inventory-journal.service';
import { PhysicalCountService } from './services/physical-count.service';

import { AuditLogService } from '../../platform-identity/audit-log/audit-log.service';
import { PostingEngineService } from '../../finance-accounting/finance/services/posting-engine.service';
import * as schema from '../../../core/database/schema';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

describe('Inventory Engine Integration Tests', () => {
  let lotService: LotService;
  let serialService: SerialService;
  let ledgerService: InventoryLedgerService;
  let reservationService: ReservationService;
  let fifoService: FifoEngineService;
  let receiptService: GoodsReceiptService;
  let issueService: GoodsIssueService;
  let transferService: TransferOrderService;
  let adjustmentService: InventoryAdjustmentService;
  let journalService: InventoryJournalService;
  let countService: PhysicalCountService;

  let connection: mysql.Connection;
  let db: any;

  // Reuse platform pre-seeded company and tenant
  const tenantId = '00000000-0000-0000-0000-000000000000';
  const companyId = '00000000-0000-0000-0000-000000000000';
  
  const warehouseId1 = 'test-wh-1-uuid';
  const warehouseId2 = 'test-wh-2-uuid';
  const locationId1 = 'test-loc-1-uuid';
  const locationId2 = 'test-loc-2-uuid';
  
  const itemFifoId = 'test-item-fifo-uuid';
  const itemStdId = 'test-item-std-uuid';

  const cleanDatabase = async (databaseClient: any) => {
    if (!databaseClient) return;
    // Delete in child-to-parent order to respect foreign key constraints
    await databaseClient.delete(schema.fifoConsumptionLog).where(eq(schema.fifoConsumptionLog.tenant_id, tenantId));
    await databaseClient.delete(schema.fifoLayer).where(eq(schema.fifoLayer.tenant_id, tenantId));
    await databaseClient.delete(schema.inventoryLedger).where(eq(schema.inventoryLedger.tenant_id, tenantId));
    await databaseClient.delete(schema.inventoryBalance).where(eq(schema.inventoryBalance.tenant_id, tenantId));
    await databaseClient.delete(schema.stockReservation).where(eq(schema.stockReservation.tenant_id, tenantId));
    await databaseClient.delete(schema.goodsReceiptLine).where(eq(schema.goodsReceiptLine.line_id, schema.goodsReceiptLine.line_id));
    await databaseClient.delete(schema.goodsReceipt).where(eq(schema.goodsReceipt.tenant_id, tenantId));
    await databaseClient.delete(schema.goodsIssueLine).where(eq(schema.goodsIssueLine.line_id, schema.goodsIssueLine.line_id));
    await databaseClient.delete(schema.goodsIssue).where(eq(schema.goodsIssue.tenant_id, tenantId));
    await databaseClient.delete(schema.transferOrderLine).where(eq(schema.transferOrderLine.line_id, schema.transferOrderLine.line_id));
    await databaseClient.delete(schema.transferOrder).where(eq(schema.transferOrder.tenant_id, tenantId));
    await databaseClient.delete(schema.inventoryAdjustment).where(eq(schema.inventoryAdjustment.tenant_id, tenantId));
    await databaseClient.delete(schema.inventoryJournalLine).where(eq(schema.inventoryJournalLine.line_id, schema.inventoryJournalLine.line_id));
    await databaseClient.delete(schema.inventoryJournal).where(eq(schema.inventoryJournal.tenant_id, tenantId));
    await databaseClient.delete(schema.inventoryCountLine).where(eq(schema.inventoryCountLine.line_id, schema.inventoryCountLine.line_id));
    await databaseClient.delete(schema.inventoryCount).where(eq(schema.inventoryCount.tenant_id, tenantId));
    await databaseClient.delete(schema.serialMaster).where(eq(schema.serialMaster.tenant_id, tenantId));
    await databaseClient.delete(schema.lotMaster).where(eq(schema.lotMaster.tenant_id, tenantId));

    // Cleanup seed masters
    await databaseClient.delete(schema.itemMaster).where(eq(schema.itemMaster.tenant_id, tenantId));
    await databaseClient.delete(schema.locationMaster).where(eq(schema.locationMaster.tenant_id, tenantId));
    await databaseClient.delete(schema.warehouseMaster).where(eq(schema.warehouseMaster.tenant_id, tenantId));
  };

  beforeAll(async () => {
    try {
      // Connect to real local MySQL database
      connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number(process.env.DATABASE_PORT) || 3306,
        user: process.env.DATABASE_USERNAME || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.SYSTEM_TENANT_DATABASE || 'tenant_system',
      });

      db = drizzle(connection, { schema, mode: 'default' });

      // Clean first to remove any remnants from previous failed test runs
      await cleanDatabase(db);
    } catch (err) {
      console.warn('[Inventory Integration Tests]: Local MySQL offline, skipping live DB integration calls.');
    }

    if (db) {
      // Seed master warehouses under the platform company
      await db.insert(schema.warehouseMaster).values([
        {
          warehouse_id: warehouseId1,
          tenant_id: tenantId,
          company_id: companyId,
          warehouse_code: 'TWH1',
          warehouse_name: 'Test Warehouse 1',
          warehouse_type: 'GENERAL',
          is_active: true,
        },
        {
          warehouse_id: warehouseId2,
          tenant_id: tenantId,
          company_id: companyId,
          warehouse_code: 'TWH2',
          warehouse_name: 'Test Warehouse 2',
          warehouse_type: 'GENERAL',
          is_active: true,
        }
      ]);

      // Seed storage locations
      await db.insert(schema.locationMaster).values([
        {
          location_id: locationId1,
          tenant_id: tenantId,
          company_id: companyId,
          warehouse_id: warehouseId1,
          location_code: 'TLOC1',
          location_name: 'Test Location 1',
          location_level: 1,
          location_type: 'SHELF',
          is_active: true,
        },
        {
          location_id: locationId2,
          tenant_id: tenantId,
          company_id: companyId,
          warehouse_id: warehouseId2,
          location_code: 'TLOC2',
          location_name: 'Test Location 2',
          location_level: 1,
          location_type: 'SHELF',
          is_active: true,
        }
      ]);

      // Seed test items
      await db.insert(schema.itemMaster).values([
        {
          item_id: itemFifoId,
          tenant_id: tenantId,
          company_id: companyId,
          item_code: 'IT-FIFO',
          item_name: 'FIFO Costed Item',
          item_type: 'RAW_MATERIAL',
          uom_primary: 'KG',
          valuation_method: 'FIFO',
          is_inventoriable: true,
        },
        {
          item_id: itemStdId,
          tenant_id: tenantId,
          company_id: companyId,
          item_code: 'IT-STD',
          item_name: 'Standard Costed Item',
          item_type: 'RAW_MATERIAL',
          uom_primary: 'PCS',
          valuation_method: 'STANDARD',
          standard_cost: '10.0000',
          is_inventoriable: true,
        }
      ]);
    }

    const mockDb = {
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
        LotService,
        SerialService,
        InventoryLedgerService,
        ReservationService,
        FifoEngineService,
        GoodsReceiptService,
        GoodsIssueService,
        TransferOrderService,
        InventoryAdjustmentService,
        InventoryJournalService,
        PhysicalCountService,
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
        {
          provide: PostingEngineService,
          useValue: {
            postAutomaticEntry: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    lotService = module.get<LotService>(LotService);
    serialService = module.get<SerialService>(SerialService);
    ledgerService = module.get<InventoryLedgerService>(InventoryLedgerService);
    reservationService = module.get<ReservationService>(ReservationService);
    fifoService = module.get<FifoEngineService>(FifoEngineService);
    receiptService = module.get<GoodsReceiptService>(GoodsReceiptService);
    issueService = module.get<GoodsIssueService>(GoodsIssueService);
    transferService = module.get<TransferOrderService>(TransferOrderService);
    adjustmentService = module.get<InventoryAdjustmentService>(InventoryAdjustmentService);
    journalService = module.get<InventoryJournalService>(InventoryJournalService);
    countService = module.get<PhysicalCountService>(PhysicalCountService);
  });

  afterAll(async () => {
    // Cleanup transaction records under test keys
    if (db) await cleanDatabase(db);
    if (connection) await connection.end();
  });

  describe('FIFO Inventory Lifecycle Flow', () => {
    it('1. Should post Goods Receipt layers with different costs', async () => {
      if (!db) return;
      // Receipt 1: 10 units @ $5.00
      const receipt1 = await receiptService.create(
        {
          company_id: companyId,
          receipt_type: 'PURCHASE',
          warehouse_id: warehouseId1,
          posting_date: '2026-07-01',
          lines: [
            {
              item_id: itemFifoId,
              location_id: locationId1,
              qty: 10,
              uom_code: 'KG',
              unit_cost: 5.0,
            },
          ],
        },
        tenantId
      );

      await receiptService.post(receipt1.receipt_id, tenantId);

      // Receipt 2: 10 units @ $8.00
      const receipt2 = await receiptService.create(
        {
          company_id: companyId,
          receipt_type: 'PURCHASE',
          warehouse_id: warehouseId1,
          posting_date: '2026-07-02',
          lines: [
            {
              item_id: itemFifoId,
              location_id: locationId1,
              qty: 10,
              uom_code: 'KG',
              unit_cost: 8.0,
            },
          ],
        },
        tenantId
      );

      await receiptService.post(receipt2.receipt_id, tenantId);

      const bal = await ledgerService.getBalance(itemFifoId, warehouseId1, locationId1, null, null, tenantId);
      expect(bal.qty_on_hand).toBe(20);
      expect(bal.qty_available).toBe(20);
    });

    it('2. Should draw down FIFO layers sequentially on issue and calculate correct cost', async () => {
      if (!db) return;
      // Issue 15 units.
      // Expected Cost: 10 units from layer 1 ($5.00) + 5 units from layer 2 ($8.00) = $50 + $40 = $90 total.
      // Weighted average cost of issue: $90 / 15 = $6.00 unit cost.
      const issue = await issueService.create(
        {
          company_id: companyId,
          issue_type: 'CONSUMPTION',
          warehouse_id: warehouseId1,
          posting_date: '2026-07-03',
          lines: [
            {
              item_id: itemFifoId,
              location_id: locationId1,
              qty: 15,
              uom_code: 'KG',
            },
          ],
        },
        tenantId
      );

      await issueService.post(issue.issue_id, tenantId);

      const bal = await ledgerService.getBalance(itemFifoId, warehouseId1, locationId1, null, null, tenantId);
      expect(bal.qty_on_hand).toBe(5); // 20 - 15 = 5 remaining

      // Find the issue ledger entry and verify calculated cost
      const ledgers = await db
        .select()
        .from(schema.inventoryLedger)
        .where(
          and(
            eq(schema.inventoryLedger.ref_doc_id, issue.issue_id),
            eq(schema.inventoryLedger.tenant_id, tenantId)
          )
        );

      expect(ledgers.length).toBe(1);
      expect(parseFloat(ledgers[0].unit_cost)).toBe(6.0000); // 90 / 15
      expect(parseFloat(ledgers[0].total_value)).toBe(-90.0000);
    });

    it('3. Should block issues that exceed available quantity', async () => {
      if (!db) return;
      const issue = await issueService.create(
        {
          company_id: companyId,
          issue_type: 'CONSUMPTION',
          warehouse_id: warehouseId1,
          posting_date: '2026-07-04',
          lines: [
            {
              item_id: itemFifoId,
              location_id: locationId1,
              qty: 10, // Only 5 available!
              uom_code: 'KG',
            },
          ],
        },
        tenantId
      );

      await expect(issueService.post(issue.issue_id, tenantId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Stock Reservations', () => {
    it('Should block reservations if quantity exceeds available stock', async () => {
      if (!db) return;
      await expect(
        reservationService.reserve(
          {
            company_id: companyId,
            warehouse_id: warehouseId1,
            location_id: locationId1,
            item_id: itemFifoId,
            qty_reserved: 6, // only 5 available
            reservation_type: 'MANUAL',
          },
          tenantId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('Should reserve stock successfully, reducing available and keeping on hand stable', async () => {
      if (!db) return;
      const resId = await reservationService.reserve(
        {
          company_id: companyId,
          warehouse_id: warehouseId1,
          location_id: locationId1,
          item_id: itemFifoId,
          qty_reserved: 3,
          reservation_type: 'MANUAL',
        },
        tenantId
      );

      expect(resId).toBeDefined();

      const bal = await ledgerService.getBalance(itemFifoId, warehouseId1, locationId1, null, null, tenantId);
      expect(bal.qty_on_hand).toBe(5); // Unchanged
      expect(bal.qty_reserved).toBe(3); // Reserved
      expect(bal.qty_available).toBe(2); // 5 - 3 = 2 available

      // Release it
      await reservationService.release(resId, tenantId);

      const balAfter = await ledgerService.getBalance(itemFifoId, warehouseId1, locationId1, null, null, tenantId);
      expect(balAfter.qty_on_hand).toBe(5);
      expect(balAfter.qty_reserved).toBe(0);
      expect(balAfter.qty_available).toBe(5);
    });
  });

  describe('Warehouse Transfer Order', () => {
    it('Should relocate stock and transfer value atomically', async () => {
      if (!db) return;
      // Transfer 2 units of FIFO item from WH1/LOC1 to WH2/LOC2
      const transfer = await transferService.create(
        {
          company_id: companyId,
          from_warehouse_id: warehouseId1,
          to_warehouse_id: warehouseId2,
          posting_date: '2026-07-05',
          lines: [
            {
              item_id: itemFifoId,
              from_location_id: locationId1,
              to_location_id: locationId2,
              qty: 2,
              uom_code: 'KG',
            },
          ],
        },
        tenantId
      );

      await transferService.post(transfer.transfer_id, tenantId);

      // Balances check
      const balSource = await ledgerService.getBalance(itemFifoId, warehouseId1, locationId1, null, null, tenantId);
      const balTarget = await ledgerService.getBalance(itemFifoId, warehouseId2, locationId2, null, null, tenantId);

      expect(balSource.qty_on_hand).toBe(3); // 5 - 2
      expect(balTarget.qty_on_hand).toBe(2); // 0 + 2

      // Check remaining FIFO cost layers in WH2
      const valuation = await fifoService.getValuationReport(companyId, itemFifoId, warehouseId2, tenantId);
      expect(valuation.totalValuation).toBe(16.0); // 2 units @ $8.00 (from remaining layer 2)
    });
  });

  describe('Physical Stock Audits (Count)', () => {
    it('Should record expected inventory and adjust variances', async () => {
      if (!db) return;
      // We currently have 3 units of itemFifoId in WH1/LOC1.
      // Let's execute a physical count that counts 5 units (positive variance of +2)
      const count = await countService.create(
        {
          company_id: companyId,
          warehouse_id: warehouseId1,
          count_date: '2026-07-06',
          lines: [
            {
              item_id: itemFifoId,
              location_id: locationId1,
              qty_counted: 5, // system expects 3
              unit_cost: 10.0, // cost to receive discrepancy
            },
          ],
        },
        tenantId
      );

      expect(count.lines[0].qty_expected).toBe(3);
      expect(count.lines[0].variance).toBe(2);

      await countService.post(count.count_id, tenantId);

      const bal = await ledgerService.getBalance(itemFifoId, warehouseId1, locationId1, null, null, tenantId);
      expect(bal.qty_on_hand).toBe(5); // 3 + 2 = 5
    });
  });
});
