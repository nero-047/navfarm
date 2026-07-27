import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateInventoryAdjustmentDto, QueryInventoryAdjustmentDto } from '../dto/inventory-adjustment.dto';
import { InventoryLedgerService } from './inventory-ledger.service';
import { FifoEngineService } from './fifo-engine.service';
import { LotService } from './lot.service';
import { SerialService } from './serial.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { PostingEngineService } from '../../finance/services/posting-engine.service';

@Injectable()
export class InventoryAdjustmentService {
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

  async create(dto: CreateInventoryAdjustmentDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      // 1. Verify company
      const [company] = await trx
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);
      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }

      // 2. Verify warehouse
      const [warehouse] = await trx
        .select()
        .from(schema.warehouseMaster)
        .where(and(eq(schema.warehouseMaster.warehouse_id, dto.warehouse_id), eq(schema.warehouseMaster.tenant_id, tenantId)))
        .limit(1);
      if (!warehouse) {
        throw new NotFoundException(`Warehouse with ID '${dto.warehouse_id}' not found.`);
      }

      // 3. Verify location
      const [location] = await trx
        .select()
        .from(schema.locationMaster)
        .where(
          and(
            eq(schema.locationMaster.location_id, dto.location_id),
            eq(schema.locationMaster.warehouse_id, dto.warehouse_id),
            eq(schema.locationMaster.tenant_id, tenantId)
          )
        )
        .limit(1);
      if (!location) {
        throw new BadRequestException(
          `Location ID '${dto.location_id}' does not exist in Warehouse ID '${dto.warehouse_id}'.`
        );
      }

      // 4. Verify item
      const [item] = await trx
        .select()
        .from(schema.itemMaster)
        .where(and(eq(schema.itemMaster.item_id, dto.item_id), eq(schema.itemMaster.tenant_id, tenantId)))
        .limit(1);
      if (!item) {
        throw new NotFoundException(`Item with ID '${dto.item_id}' not found.`);
      }

      // 5. Duplicate check
      const adjustmentNo = dto.adjustment_no?.trim() || `ADJ-${randomUUID().substring(0, 8).toUpperCase()}`;
      const [existing] = await trx
        .select()
        .from(schema.inventoryAdjustment)
        .where(and(eq(schema.inventoryAdjustment.tenant_id, tenantId), eq(schema.inventoryAdjustment.adjustment_no, adjustmentNo)))
        .limit(1);
      if (existing) {
        throw new ConflictException(`Inventory Adjustment with number '${adjustmentNo}' already exists.`);
      }

      // 6. Validation depending on Adjustment Type
      if (dto.adjustment_type === 'POSITIVE') {
        if (item.is_lot_tracked && !dto.lot_no) {
          throw new BadRequestException(`Item is lot-tracked. lot_no is required for POSITIVE adjustments.`);
        }
        if (item.is_serial_tracked) {
          if (!dto.serial_no) {
            throw new BadRequestException(`Item is serial-tracked. serial_no is required for POSITIVE adjustments.`);
          }
          if (dto.qty !== 1) {
            throw new BadRequestException(`Serialized adjustments must have a quantity of exactly 1.`);
          }
        }
        if (dto.unit_cost === undefined || dto.unit_cost === null) {
          throw new BadRequestException(`unit_cost is required for POSITIVE adjustments.`);
        }
      } else if (dto.adjustment_type === 'NEGATIVE') {
        if (item.is_lot_tracked && !dto.lot_id) {
          throw new BadRequestException(`Item is lot-tracked. lot_id is required for NEGATIVE adjustments.`);
        }
        if (item.is_serial_tracked) {
          if (!dto.serial_id) {
            throw new BadRequestException(`Item is serial-tracked. serial_id is required for NEGATIVE adjustments.`);
          }
          if (dto.qty !== 1) {
            throw new BadRequestException(`Serialized adjustments must have a quantity of exactly 1.`);
          }
        }
      } else {
        throw new BadRequestException(`Invalid adjustment_type: ${dto.adjustment_type}`);
      }

      const adjustmentId = randomUUID();
      const newAdjustment = {
        adjustment_id: adjustmentId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        adjustment_no: adjustmentNo,
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        posting_date: dto.posting_date,
        adjustment_type: dto.adjustment_type,
        status: 'DRAFT',
        reason_code: dto.reason_code,
        item_id: dto.item_id,
        qty: dto.qty.toFixed(4),
        uom_code: dto.uom_code,
        unit_cost: dto.unit_cost !== undefined ? dto.unit_cost.toFixed(4) : '0.0000',
        lot_id: dto.lot_id || null,
        serial_id: dto.serial_id || null,
        lot_no: dto.lot_no || null,
        serial_no: dto.serial_no || null,
        mfg_date: dto.mfg_date || null,
        expiry_date: dto.expiry_date || null,
        notes: dto.notes || null,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.inventoryAdjustment).values(newAdjustment);

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'inventory_adjustment',
        entityId: adjustmentId,
        newValues: newAdjustment,
      });

      return this.findOne(adjustmentId, tenantId, trx);
    });
  }

  async post(adjustmentId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const adjustment = await this.findOne(adjustmentId, tenantId, trx);
      if (adjustment.status !== 'DRAFT') {
        throw new ConflictException(`Inventory Adjustment with ID '${adjustmentId}' is already ${adjustment.status}.`);
      }

      const [item] = await trx
        .select()
        .from(schema.itemMaster)
        .where(eq(schema.itemMaster.item_id, adjustment.item_id))
        .limit(1);

      let lotId = adjustment.lot_id;
      let serialId = adjustment.serial_id;

      if (adjustment.adjustment_type === 'POSITIVE') {
        // Lot processing
        if (item.is_lot_tracked && adjustment.lot_no) {
          const lot = await this.lotService.getOrCreate(
            adjustment.company_id,
            adjustment.item_id,
            adjustment.lot_no,
            adjustment.mfg_date || undefined,
            adjustment.expiry_date || undefined,
            tenantId,
            userId,
            trx
          );
          lotId = lot.lot_id;
          await this.lotService.updateStock(lotId, adjustment.qty, tenantId, trx);
        }

        // Serial processing
        if (item.is_serial_tracked && adjustment.serial_no) {
          const serial = await this.serialService.getOrCreate(
            adjustment.company_id,
            adjustment.item_id,
            lotId,
            adjustment.serial_no,
            tenantId,
            userId,
            trx
          );
          serialId = serial.serial_id;
          await this.serialService.updateStatus(serialId, 'IN_STOCK', tenantId, trx);
        }

        const totalValue = adjustment.qty * adjustment.unit_cost;

        // Post LEDGER Receipt
        const ledgerId = await this.ledgerService.postLedgerEntry(
          {
            tenant_id: tenantId,
            company_id: adjustment.company_id,
            warehouse_id: adjustment.warehouse_id,
            location_id: adjustment.location_id,
            item_id: adjustment.item_id,
            lot_id: lotId,
            serial_id: serialId,
            transaction_type: 'ADJUSTMENT',
            transaction_date: adjustment.posting_date,
            posting_date: adjustment.posting_date,
            qty: adjustment.qty.toFixed(4),
            unit_cost: adjustment.unit_cost.toFixed(4),
            total_value: totalValue.toFixed(4),
            ref_doc_type: 'InventoryAdjustment',
            ref_doc_id: adjustmentId,
            ref_doc_line_id: null,
          },
          tenantId,
          userId,
          trx
        );

        // FIFO Layer creation
        if (item.valuation_method === 'FIFO') {
          await this.fifoService.createLayer(
            {
              tenant_id: tenantId,
              company_id: adjustment.company_id,
              warehouse_id: adjustment.warehouse_id,
              location_id: adjustment.location_id,
              item_id: adjustment.item_id,
              lot_id: lotId,
              ledger_id: ledgerId,
              qty_initial: adjustment.qty.toFixed(4),
              qty_remaining: adjustment.qty.toFixed(4),
              unit_cost: adjustment.unit_cost.toFixed(4),
              posting_date: adjustment.posting_date,
              is_exhausted: false,
            },
            tenantId,
            trx
          );
        }

        // Save lot_id / serial_id reference to adjustment header if we generated them
        await trx
          .update(schema.inventoryAdjustment)
          .set({
            lot_id: lotId,
            serial_id: serialId,
          })
          .where(eq(schema.inventoryAdjustment.adjustment_id, adjustmentId));

        try {
          await this.postingEngine.postAutomaticEntry(
            {
              company_id: adjustment.company_id,
              item_category_id: item.category_id,
              transaction_type: 'ADJUSTMENT',
              amount: parseFloat(adjustment.qty.toString()) * parseFloat(adjustment.unit_cost.toString()),
              posting_date: adjustment.posting_date,
              ref_doc_type: 'InventoryAdjustment',
              ref_doc_id: adjustmentId,
            },
            tenantId,
            userId,
            trx
          );
        } catch (err) {
          if (err.message && (err.message.includes('GL Mapping') || err.message.includes('No active Accounting Period'))) {
            console.warn(`[Finance Integration Warning]: ${err.message}`);
          } else {
            throw err;
          }
        }

      } else {
        // NEGATIVE
        // Verify available stock
        const available = await this.ledgerService.getAvailableStock(
          adjustment.item_id,
          adjustment.warehouse_id,
          adjustment.location_id,
          lotId || null,
          serialId || null,
          tenantId,
          trx
        );

        if (available < adjustment.qty) {
          throw new BadRequestException(
            `Insufficient stock to adjust item. Available: ${available}, Requested reduction: ${adjustment.qty}`
          );
        }

        // Lot processing
        if (item.is_lot_tracked && lotId) {
          await this.lotService.validateExpiry(lotId, tenantId, trx);
          await this.lotService.updateStock(lotId, -adjustment.qty, tenantId, trx);
        }

        // Serial processing
        if (item.is_serial_tracked && serialId) {
          await this.serialService.validateAvailability(serialId, tenantId, trx);
          await this.serialService.updateStatus(serialId, 'CONSUMED', tenantId, trx);
        }

        // Post LEDGER Issue
        const ledgerId = await this.ledgerService.postLedgerEntry(
          {
            tenant_id: tenantId,
            company_id: adjustment.company_id,
            warehouse_id: adjustment.warehouse_id,
            location_id: adjustment.location_id,
            item_id: adjustment.item_id,
            lot_id: lotId,
            serial_id: serialId,
            transaction_type: 'ADJUSTMENT',
            transaction_date: adjustment.posting_date,
            posting_date: adjustment.posting_date,
            qty: (-adjustment.qty).toFixed(4),
            unit_cost: '0.0000', // resolved next
            total_value: '0.0000',
            ref_doc_type: 'InventoryAdjustment',
            ref_doc_id: adjustmentId,
            ref_doc_line_id: null,
          },
          tenantId,
          userId,
          trx
        );

        // FIFO layer depletion
        let unitCost = 0;
        let totalValue = 0;

        if (item.valuation_method === 'FIFO') {
          totalValue = await this.fifoService.consumeLayers(
            adjustment.company_id,
            adjustment.warehouse_id,
            adjustment.location_id,
            adjustment.item_id,
            lotId || null,
            adjustment.qty,
            ledgerId,
            tenantId,
            trx
          );
          unitCost = totalValue / adjustment.qty;
        } else {
          unitCost = parseFloat(item.standard_cost || '0.0000');
          totalValue = adjustment.qty * unitCost;
        }

        // Update ledger entry and adjustment header cost info
        await trx
          .update(schema.inventoryLedger)
          .set({
            unit_cost: unitCost.toFixed(4),
            total_value: (-totalValue).toFixed(4),
          })
          .where(eq(schema.inventoryLedger.ledger_id, ledgerId));

        await trx
          .update(schema.inventoryAdjustment)
          .set({
            unit_cost: unitCost.toFixed(4),
          })
          .where(eq(schema.inventoryAdjustment.adjustment_id, adjustmentId));

        try {
          await this.postingEngine.postAutomaticEntry(
            {
              company_id: adjustment.company_id,
              item_category_id: item.category_id,
              transaction_type: 'ADJUSTMENT',
              amount: totalValue,
              posting_date: adjustment.posting_date,
              ref_doc_type: 'InventoryAdjustment',
              ref_doc_id: adjustmentId,
            },
            tenantId,
            userId,
            trx
          );
        } catch (err) {
          if (err.message && (err.message.includes('GL Mapping') || err.message.includes('No active Accounting Period'))) {
            console.warn(`[Finance Integration Warning]: ${err.message}`);
          } else {
            throw err;
          }
        }
      }

      // Update document status to POSTED
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.inventoryAdjustment)
        .set({
          status: 'POSTED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.inventoryAdjustment.adjustment_id, adjustmentId));

      await this.auditService.log({
        tenantId,
        companyId: adjustment.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'inventory_adjustment',
        entityId: adjustmentId,
        oldValues: adjustment,
        newValues: { ...adjustment, status: 'POSTED' },
      });

      return { success: true, message: 'Inventory Adjustment posted successfully.' };
    });
  }

  async findOne(adjustmentId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [adjustment] = await dbClient
      .select()
      .from(schema.inventoryAdjustment)
      .where(and(eq(schema.inventoryAdjustment.adjustment_id, adjustmentId), eq(schema.inventoryAdjustment.tenant_id, tenantId)))
      .limit(1);

    if (!adjustment) {
      throw new NotFoundException(`Inventory Adjustment with ID '${adjustmentId}' not found.`);
    }

    return {
      ...adjustment,
      qty: parseFloat(adjustment.qty),
      unit_cost: parseFloat(adjustment.unit_cost),
      lot_id: adjustment.lot_id || null,
      serial_id: adjustment.serial_id || null,
      lot_no: adjustment.lot_no || null,
      serial_no: adjustment.serial_no || null,
    };
  }

  async findAll(query: QueryInventoryAdjustmentDto, tenantId: string) {
    const conditions = [eq(schema.inventoryAdjustment.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.inventoryAdjustment.company_id, query.companyId));
    }
    if (query.warehouseId) {
      conditions.push(eq(schema.inventoryAdjustment.warehouse_id, query.warehouseId));
    }
    if (query.status) {
      conditions.push(eq(schema.inventoryAdjustment.status, query.status));
    }
    if (query.search) {
      conditions.push(like(schema.inventoryAdjustment.adjustment_no, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.inventoryAdjustment)
      .where(and(...conditions));
  }
}
