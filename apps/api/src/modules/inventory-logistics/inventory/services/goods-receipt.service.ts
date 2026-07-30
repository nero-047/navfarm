import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { CreateGoodsReceiptDto, QueryGoodsReceiptDto } from '../dto/goods-receipt.dto';
import { InventoryLedgerService } from './inventory-ledger.service';
import { FifoEngineService } from './fifo-engine.service';
import { LotService } from './lot.service';
import { SerialService } from './serial.service';
import { AuditLogService } from '../../../platform-identity/audit-log/audit-log.service';
import { PostingEngineService } from '../../../finance-accounting/finance/services/posting-engine.service';

@Injectable()
export class GoodsReceiptService {
  constructor(
    private readonly cls: ClsService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly fifoService: FifoEngineService,
    private readonly lotService: LotService,
    private readonly serialService: SerialService,
    private readonly auditService: AuditLogService,
    private readonly postingEngine: PostingEngineService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async create(dto: CreateGoodsReceiptDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      // 1. Verify company exists
      const [company] = await trx
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);
      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }

      // 2. Verify warehouse exists
      const [warehouse] = await trx
        .select()
        .from(schema.warehouseMaster)
        .where(and(eq(schema.warehouseMaster.warehouse_id, dto.warehouse_id), eq(schema.warehouseMaster.tenant_id, tenantId)))
        .limit(1);
      if (!warehouse) {
        throw new NotFoundException(`Warehouse with ID '${dto.warehouse_id}' not found.`);
      }

      // 3. Resolve and validate Receipt Number
      const receiptNo = dto.receipt_no?.trim() || `GR-${randomUUID().substring(0, 8).toUpperCase()}`;
      const [existing] = await trx
        .select()
        .from(schema.goodsReceipt)
        .where(and(eq(schema.goodsReceipt.tenant_id, tenantId), eq(schema.goodsReceipt.receipt_no, receiptNo)))
        .limit(1);
      if (existing) {
        throw new ConflictException(`Goods Receipt with number '${receiptNo}' already exists.`);
      }

      const receiptId = randomUUID();
      const newReceipt = {
        receipt_id: receiptId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        receipt_no: receiptNo,
        receipt_type: dto.receipt_type,
        warehouse_id: dto.warehouse_id,
        posting_date: dto.posting_date,
        status: 'DRAFT',
        notes: dto.notes || null,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.goodsReceipt).values(newReceipt);

      // Create lines
      for (const line of dto.lines) {
        // Validate item existence
        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(and(eq(schema.itemMaster.item_id, line.item_id), eq(schema.itemMaster.tenant_id, tenantId)))
          .limit(1);
        if (!item) {
          throw new NotFoundException(`Item with ID '${line.item_id}' not found.`);
        }

        // Validate location belongs to warehouse
        const [location] = await trx
          .select()
          .from(schema.locationMaster)
          .where(
            and(
              eq(schema.locationMaster.location_id, line.location_id),
              eq(schema.locationMaster.warehouse_id, dto.warehouse_id),
              eq(schema.locationMaster.tenant_id, tenantId)
            )
          )
          .limit(1);
        if (!location) {
          throw new BadRequestException(
            `Location ID '${line.location_id}' does not exist in Warehouse ID '${dto.warehouse_id}'.`
          );
        }

        // Lot tracking validation
        if (item.is_lot_tracked && !line.lot_no) {
          throw new BadRequestException(`Item '${item.item_code}' is lot-tracked. lot_no is required.`);
        }

        // Serial tracking validation
        if (item.is_serial_tracked) {
          if (!line.serial_no) {
            throw new BadRequestException(`Item '${item.item_code}' is serial-tracked. serial_no is required.`);
          }
          if (line.qty !== 1) {
            throw new BadRequestException(`Serialized line items must have a quantity of exactly 1.`);
          }
        }

        const lineId = randomUUID();
        await trx.insert(schema.goodsReceiptLine).values({
          line_id: lineId,
          receipt_id: receiptId,
          item_id: line.item_id,
          location_id: line.location_id,
          qty: line.qty.toFixed(4),
          uom_code: line.uom_code,
          unit_cost: line.unit_cost.toFixed(4),
          total_value: (line.qty * line.unit_cost).toFixed(4),
          lot_no: line.lot_no || null,
          serial_no: line.serial_no || null,
          mfg_date: line.mfg_date || null,
          expiry_date: line.expiry_date || null,
        });
      }

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'goods_receipt',
        entityId: receiptId,
        newValues: newReceipt,
      });

      return this.findOne(receiptId, tenantId, trx);
    });
  }

  async post(receiptId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const receipt = await this.findOne(receiptId, tenantId, trx);
      if (receipt.status !== 'DRAFT') {
        throw new ConflictException(`Goods Receipt with ID '${receiptId}' is already ${receipt.status}.`);
      }

      for (const line of receipt.lines) {
        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(eq(schema.itemMaster.item_id, line.item_id))
          .limit(1);

        // FIX-030 (GAP-041): Reject already-expired goods at receipt
        if (line.expiry_date && receipt.posting_date) {
          const expiryDate = new Date(line.expiry_date);
          const postingDate = new Date(receipt.posting_date);
          if (expiryDate < postingDate) {
            throw new BadRequestException(
              `Item '${item?.item_code || line.item_id}' lot '${line.lot_no || 'N/A'}' has expiry date ${line.expiry_date} which is before posting date ${receipt.posting_date}. Cannot receive expired goods.`
            );
          }
        }

        let lotId: string | null = null;
        let serialId: string | null = null;

        // 1. Process Lot Master if lot tracked
        if (item.is_lot_tracked && line.lot_no) {
          const lot = await this.lotService.getOrCreate(
            receipt.company_id,
            line.item_id,
            line.lot_no,
            tenantId,
            line.mfg_date || undefined,
            line.expiry_date || undefined,
            userId,
            trx
          );
          lotId = lot.lot_id;
          await this.lotService.updateStock(lotId!, line.qty, tenantId, trx);
        }

        // 2. Process Serial Master if serial tracked
        if (item.is_serial_tracked && line.serial_no) {
          const serial = await this.serialService.getOrCreate(
            receipt.company_id,
            line.item_id,
            lotId,
            line.serial_no,
            tenantId,
            userId,
            trx
          );
          serialId = serial.serial_id;
          await this.serialService.updateStatus(serialId!, 'IN_STOCK', tenantId, trx);
        }

        // 3. Post to Stock Ledger (which will also update the balance cache)
        const ledgerId = await this.ledgerService.postLedgerEntry(
          {
            tenant_id: tenantId,
            company_id: receipt.company_id,
            warehouse_id: receipt.warehouse_id,
            location_id: line.location_id,
            item_id: line.item_id,
            lot_id: lotId,
            serial_id: serialId,
            transaction_type: 'GOODS_RECEIPT',
            transaction_date: receipt.posting_date,
            posting_date: receipt.posting_date,
            qty: line.qty.toFixed(4),
            unit_cost: line.unit_cost.toFixed(4),
            total_value: line.total_value.toFixed(4),
            ref_doc_type: 'GoodsReceipt',
            ref_doc_id: receiptId,
            ref_doc_line_id: line.line_id,
          },
          tenantId,
          userId,
          trx
        );

        // 4. Create FIFO Cost Layer if valuation method is FIFO
        if (item.valuation_method === 'FIFO') {
          await this.fifoService.createLayer(
            {
              tenant_id: tenantId,
              company_id: receipt.company_id,
              warehouse_id: receipt.warehouse_id,
              location_id: line.location_id,
              item_id: line.item_id,
              lot_id: lotId,
              ledger_id: ledgerId,
              qty_initial: line.qty.toFixed(4),
              qty_remaining: line.qty.toFixed(4),
              unit_cost: line.unit_cost.toFixed(4),
              posting_date: receipt.posting_date,
              is_exhausted: false,
            },
            tenantId,
            trx
          );
        }

        const transactionType = receipt.receipt_type === 'PRODUCTION' ? 'OUTPUT' : 'PURCHASE';
        await this.postingEngine.postAutomaticEntry(
          {
            company_id: receipt.company_id,
            item_category_id: item.category_id,
            valuation_method: item.valuation_method || undefined,
            transaction_type: transactionType,
            amount: parseFloat(line.qty.toString()) * parseFloat(line.unit_cost.toString()),
            posting_date: receipt.posting_date,
            ref_doc_type: 'GoodsReceipt',
            ref_doc_id: receiptId,
            ref_doc_line_id: line.line_id,
          },
          tenantId,
          userId,
          trx
        );
      }

      // Update document status to POSTED
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.goodsReceipt)
        .set({
          status: 'POSTED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.goodsReceipt.receipt_id, receiptId));

      await this.auditService.log({
        tenantId,
        companyId: receipt.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'goods_receipt',
        entityId: receiptId,
        oldValues: receipt,
        newValues: { ...receipt, status: 'POSTED' },
      });

      return { success: true, message: 'Goods Receipt posted successfully.' };
    });
  }

  async findOne(receiptId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [receipt] = await dbClient
      .select()
      .from(schema.goodsReceipt)
      .where(and(eq(schema.goodsReceipt.receipt_id, receiptId), eq(schema.goodsReceipt.tenant_id, tenantId)))
      .limit(1);

    if (!receipt) {
      throw new NotFoundException(`Goods Receipt with ID '${receiptId}' not found.`);
    }

    const lines = await dbClient
      .select()
      .from(schema.goodsReceiptLine)
      .where(eq(schema.goodsReceiptLine.receipt_id, receiptId));

    return {
      ...receipt,
      lines: lines.map(l => ({
        ...l,
        qty: parseFloat(l.qty),
        unit_cost: parseFloat(l.unit_cost),
        total_value: parseFloat(l.total_value),
      })),
    };
  }

  async findAll(query: QueryGoodsReceiptDto, tenantId: string) {
    const conditions = [eq(schema.goodsReceipt.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.goodsReceipt.company_id, query.companyId));
    }
    if (query.warehouseId) {
      conditions.push(eq(schema.goodsReceipt.warehouse_id, query.warehouseId));
    }
    if (query.status) {
      conditions.push(eq(schema.goodsReceipt.status, query.status));
    }
    if (query.search) {
      conditions.push(like(schema.goodsReceipt.receipt_no, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.goodsReceipt)
      .where(and(...conditions));
  }
}
