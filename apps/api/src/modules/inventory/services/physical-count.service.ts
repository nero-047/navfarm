import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateInventoryCountDto, QueryInventoryCountDto } from '../dto/journal-count.dto';
import { InventoryLedgerService } from './inventory-ledger.service';
import { FifoEngineService } from './fifo-engine.service';
import { LotService } from './lot.service';
import { SerialService } from './serial.service';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class PhysicalCountService {
  constructor(
    private readonly cls: ClsService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly fifoService: FifoEngineService,
    private readonly lotService: LotService,
    private readonly serialService: SerialService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async create(dto: CreateInventoryCountDto, tenantId: string, userId?: string) {
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

      // 3. Duplicate check
      const countNo = dto.count_no?.trim() || `CNT-${randomUUID().substring(0, 8).toUpperCase()}`;
      const [existing] = await trx
        .select()
        .from(schema.inventoryCount)
        .where(and(eq(schema.inventoryCount.tenant_id, tenantId), eq(schema.inventoryCount.count_no, countNo)))
        .limit(1);
      if (existing) {
        throw new ConflictException(`Inventory Count with number '${countNo}' already exists.`);
      }

      const countId = randomUUID();
      const newCount = {
        count_id: countId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        count_no: countNo,
        warehouse_id: dto.warehouse_id,
        count_date: dto.count_date,
        status: 'DRAFT',
        notes: dto.notes || null,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.inventoryCount).values(newCount);

      // Create lines and capture expected quantities
      for (const line of dto.lines) {
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

        // Validate item existence
        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(and(eq(schema.itemMaster.item_id, line.item_id), eq(schema.itemMaster.tenant_id, tenantId)))
          .limit(1);
        if (!item) {
          throw new NotFoundException(`Item with ID '${line.item_id}' not found.`);
        }

        // Lot and Serial validation
        if (item.is_lot_tracked && !line.lot_id) {
          throw new BadRequestException(`Item '${item.item_code}' is lot-tracked. lot_id is required.`);
        }
        if (item.is_serial_tracked && !line.serial_id) {
          throw new BadRequestException(`Item '${item.item_code}' is serial-tracked. serial_id is required.`);
        }

        // Capture system expected stock count (on_hand count)
        const balance = await this.ledgerService.getBalance(
          line.item_id,
          dto.warehouse_id,
          line.location_id,
          line.lot_id || null,
          line.serial_id || null,
          tenantId,
          trx
        );

        const qtyExpected = balance.qty_on_hand;
        const variance = line.qty_counted - qtyExpected;

        // Resolve unit cost
        const unitCost = line.unit_cost !== undefined ? line.unit_cost : parseFloat(item.standard_cost || '0.0000');

        const lineId = randomUUID();
        await trx.insert(schema.inventoryCountLine).values({
          line_id: lineId,
          count_id: countId,
          item_id: line.item_id,
          location_id: line.location_id,
          lot_id: line.lot_id || null,
          serial_id: line.serial_id || null,
          qty_expected: qtyExpected.toFixed(4),
          qty_counted: line.qty_counted.toFixed(4),
          variance: variance.toFixed(4),
          unit_cost: unitCost.toFixed(4),
          reason_code: line.reason_code || null,
        });
      }

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'inventory_count',
        entityId: countId,
        newValues: newCount,
      });

      return this.findOne(countId, tenantId, trx);
    });
  }

  async post(countId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const count = await this.findOne(countId, tenantId, trx);
      if (count.status !== 'DRAFT') {
        throw new ConflictException(`Physical Count with ID '${countId}' is already ${count.status}.`);
      }

      for (const line of count.lines) {
        if (line.variance === 0) {
          continue;
        }

        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(eq(schema.itemMaster.item_id, line.item_id))
          .limit(1);

        if (line.variance > 0) {
          // Positive discrepancy: register addition
          if (item.is_lot_tracked && line.lot_id) {
            await this.lotService.updateStock(line.lot_id, line.variance, tenantId, trx);
          }
          if (item.is_serial_tracked && line.serial_id) {
            // Activate serial back to IN_STOCK if it was marked consumed
            await this.serialService.updateStatus(line.serial_id, 'IN_STOCK', tenantId, trx);
          }

          const totalValue = line.variance * line.unit_cost;

          // Post receipt ledger
          const ledgerId = await this.ledgerService.postLedgerEntry(
            {
              tenant_id: tenantId,
              company_id: count.company_id,
              warehouse_id: count.warehouse_id,
              location_id: line.location_id,
              item_id: line.item_id,
              lot_id: line.lot_id,
              serial_id: line.serial_id,
              transaction_type: 'ADJUSTMENT',
              transaction_date: count.count_date,
              posting_date: count.count_date,
              qty: line.variance.toFixed(4),
              unit_cost: line.unit_cost.toFixed(4),
              total_value: totalValue.toFixed(4),
              ref_doc_type: 'InventoryCount',
              ref_doc_id: countId,
              ref_doc_line_id: line.line_id,
            },
            tenantId,
            userId,
            trx
          );

          // Create FIFO layer
          if (item.valuation_method === 'FIFO') {
            await this.fifoService.createLayer(
              {
                tenant_id: tenantId,
                company_id: count.company_id,
                warehouse_id: count.warehouse_id,
                location_id: line.location_id,
                item_id: line.item_id,
                lot_id: line.lot_id,
                ledger_id: ledgerId,
                qty_initial: line.variance.toFixed(4),
                qty_remaining: line.variance.toFixed(4),
                unit_cost: line.unit_cost.toFixed(4),
                posting_date: count.count_date,
                is_exhausted: false,
              },
              tenantId,
              trx
            );
          }

        } else {
          // Negative discrepancy: register reduction
          const qtyToIssue = Math.abs(line.variance);

          if (item.is_lot_tracked && line.lot_id) {
            await this.lotService.validateExpiry(line.lot_id, tenantId, trx);
            await this.lotService.updateStock(line.lot_id, -qtyToIssue, tenantId, trx);
          }
          if (item.is_serial_tracked && line.serial_id) {
            await this.serialService.validateAvailability(line.serial_id, tenantId, trx);
            await this.serialService.updateStatus(line.serial_id, 'CONSUMED', tenantId, trx);
          }

          // Post issue ledger
          const ledgerId = await this.ledgerService.postLedgerEntry(
            {
              tenant_id: tenantId,
              company_id: count.company_id,
              warehouse_id: count.warehouse_id,
              location_id: line.location_id,
              item_id: line.item_id,
              lot_id: line.lot_id,
              serial_id: line.serial_id,
              transaction_type: 'ADJUSTMENT',
              transaction_date: count.count_date,
              posting_date: count.count_date,
              qty: line.variance.toFixed(4), // negative
              unit_cost: '0.0000',
              total_value: '0.0000',
              ref_doc_type: 'InventoryCount',
              ref_doc_id: countId,
              ref_doc_line_id: line.line_id,
            },
            tenantId,
            userId,
            trx
          );

          // Cost resolution
          let unitCost = 0;
          let totalValue = 0;

          if (item.valuation_method === 'FIFO') {
            totalValue = await this.fifoService.consumeLayers(
              count.company_id,
              count.warehouse_id,
              line.location_id,
              line.item_id,
              line.lot_id || null,
              qtyToIssue,
              ledgerId,
              tenantId,
              trx
            );
            unitCost = totalValue / qtyToIssue;
          } else {
            unitCost = parseFloat(item.standard_cost || '0.0000');
            totalValue = qtyToIssue * unitCost;
          }

          // Update ledger entries
          await trx
            .update(schema.inventoryLedger)
            .set({
              unit_cost: unitCost.toFixed(4),
              total_value: (-totalValue).toFixed(4),
            })
            .where(eq(schema.inventoryLedger.ledger_id, ledgerId));
        }
      }

      // Update count status to ADJUSTED
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.inventoryCount)
        .set({
          status: 'ADJUSTED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.inventoryCount.count_id, countId));

      await this.auditService.log({
        tenantId,
        companyId: count.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'inventory_count',
        entityId: countId,
        oldValues: count,
        newValues: { ...count, status: 'ADJUSTED' },
      });

      return { success: true, message: 'Physical Count posted and stock variance adjustments processed successfully.' };
    });
  }

  async findOne(countId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [count] = await dbClient
      .select()
      .from(schema.inventoryCount)
      .where(and(eq(schema.inventoryCount.count_id, countId), eq(schema.inventoryCount.tenant_id, tenantId)))
      .limit(1);

    if (!count) {
      throw new NotFoundException(`Physical Count with ID '${countId}' not found.`);
    }

    const lines = await dbClient
      .select()
      .from(schema.inventoryCountLine)
      .where(eq(schema.inventoryCountLine.count_id, countId));

    return {
      ...count,
      lines: lines.map(l => ({
        ...l,
        qty_expected: parseFloat(l.qty_expected),
        qty_counted: parseFloat(l.qty_counted),
        variance: parseFloat(l.variance),
        unit_cost: parseFloat(l.unit_cost),
        lot_id: l.lot_id || null,
        serial_id: l.serial_id || null,
      })),
    };
  }

  async findAll(query: QueryInventoryCountDto, tenantId: string) {
    const conditions = [eq(schema.inventoryCount.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.inventoryCount.company_id, query.companyId));
    }
    if (query.warehouseId) {
      conditions.push(eq(schema.inventoryCount.warehouse_id, query.warehouseId));
    }
    if (query.status) {
      conditions.push(eq(schema.inventoryCount.status, query.status));
    }
    if (query.search) {
      conditions.push(like(schema.inventoryCount.count_no, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.inventoryCount)
      .where(and(...conditions));
  }
}
