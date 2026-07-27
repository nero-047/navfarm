import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateTransferOrderDto, QueryTransferOrderDto } from '../dto/transfer-order.dto';
import { InventoryLedgerService } from './inventory-ledger.service';
import { FifoEngineService } from './fifo-engine.service';
import { LotService } from './lot.service';
import { SerialService } from './serial.service';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class TransferOrderService {
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

  async create(dto: CreateTransferOrderDto, tenantId: string, userId?: string) {
    if (dto.from_warehouse_id === dto.to_warehouse_id) {
      throw new BadRequestException('Source and Target Warehouses must be different.');
    }

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

      // 2. Verify warehouses
      const [fromWarehouse] = await trx
        .select()
        .from(schema.warehouseMaster)
        .where(and(eq(schema.warehouseMaster.warehouse_id, dto.from_warehouse_id), eq(schema.warehouseMaster.tenant_id, tenantId)))
        .limit(1);
      if (!fromWarehouse) {
        throw new NotFoundException(`Source Warehouse with ID '${dto.from_warehouse_id}' not found.`);
      }

      const [toWarehouse] = await trx
        .select()
        .from(schema.warehouseMaster)
        .where(and(eq(schema.warehouseMaster.warehouse_id, dto.to_warehouse_id), eq(schema.warehouseMaster.tenant_id, tenantId)))
        .limit(1);
      if (!toWarehouse) {
        throw new NotFoundException(`Target Warehouse with ID '${dto.to_warehouse_id}' not found.`);
      }

      // 3. Resolve and validate Transfer Number
      const transferNo = dto.transfer_no?.trim() || `TO-${randomUUID().substring(0, 8).toUpperCase()}`;
      const [existing] = await trx
        .select()
        .from(schema.transferOrder)
        .where(and(eq(schema.transferOrder.tenant_id, tenantId), eq(schema.transferOrder.transfer_no, transferNo)))
        .limit(1);
      if (existing) {
        throw new ConflictException(`Transfer Order with number '${transferNo}' already exists.`);
      }

      const transferId = randomUUID();
      const newTransfer = {
        transfer_id: transferId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        transfer_no: transferNo,
        from_warehouse_id: dto.from_warehouse_id,
        to_warehouse_id: dto.to_warehouse_id,
        posting_date: dto.posting_date,
        status: 'DRAFT',
        notes: dto.notes || null,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.transferOrder).values(newTransfer);

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

        // Validate source location belongs to source warehouse
        const [fromLoc] = await trx
          .select()
          .from(schema.locationMaster)
          .where(
            and(
              eq(schema.locationMaster.location_id, line.from_location_id),
              eq(schema.locationMaster.warehouse_id, dto.from_warehouse_id),
              eq(schema.locationMaster.tenant_id, tenantId)
            )
          )
          .limit(1);
        if (!fromLoc) {
          throw new BadRequestException(
            `Source Location ID '${line.from_location_id}' does not exist in Warehouse ID '${dto.from_warehouse_id}'.`
          );
        }

        // Validate target location belongs to target warehouse
        const [toLoc] = await trx
          .select()
          .from(schema.locationMaster)
          .where(
            and(
              eq(schema.locationMaster.location_id, line.to_location_id),
              eq(schema.locationMaster.warehouse_id, dto.to_warehouse_id),
              eq(schema.locationMaster.tenant_id, tenantId)
            )
          )
          .limit(1);
        if (!toLoc) {
          throw new BadRequestException(
            `Target Location ID '${line.to_location_id}' does not exist in Warehouse ID '${dto.to_warehouse_id}'.`
          );
        }

        // Lot tracking validation
        if (item.is_lot_tracked && !line.lot_id) {
          throw new BadRequestException(`Item '${item.item_code}' is lot-tracked. lot_id is required.`);
        }

        // Serial tracking validation
        if (item.is_serial_tracked) {
          if (!line.serial_id) {
            throw new BadRequestException(`Item '${item.item_code}' is serial-tracked. serial_id is required.`);
          }
          if (line.qty !== 1) {
            throw new BadRequestException(`Serialized line items must have a quantity of exactly 1.`);
          }
        }

        const lineId = randomUUID();
        await trx.insert(schema.transferOrderLine).values({
          line_id: lineId,
          transfer_id: transferId,
          item_id: line.item_id,
          from_location_id: line.from_location_id,
          to_location_id: line.to_location_id,
          qty: line.qty.toFixed(4),
          uom_code: line.uom_code,
          lot_id: line.lot_id || null,
          serial_id: line.serial_id || null,
        });
      }

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'transfer_order',
        entityId: transferId,
        newValues: newTransfer,
      });

      return this.findOne(transferId, tenantId, trx);
    });
  }

  async post(transferId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const transfer = await this.findOne(transferId, tenantId, trx);
      if (transfer.status !== 'DRAFT') {
        throw new ConflictException(`Transfer Order with ID '${transferId}' is already ${transfer.status}.`);
      }

      for (const line of transfer.lines) {
        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(eq(schema.itemMaster.item_id, line.item_id))
          .limit(1);

        // 1. Verify available stock at source
        const available = await this.ledgerService.getAvailableStock(
          line.item_id,
          transfer.from_warehouse_id,
          line.from_location_id,
          line.lot_id || null,
          line.serial_id || null,
          tenantId,
          trx
        );

        if (available < line.qty) {
          throw new BadRequestException(
            `Insufficient stock to transfer item '${item.item_code}' from Location '${line.from_location_id}'. Available: ${available}, Requested: ${line.qty}`
          );
        }

        // 2. Lot Master updates
        if (item.is_lot_tracked && line.lot_id) {
          await this.lotService.validateExpiry(line.lot_id, tenantId, trx);
          // Decrement source lot stock
          await this.lotService.updateStock(line.lot_id, -line.qty, tenantId, trx);
          // Increment destination lot stock
          await this.lotService.updateStock(line.lot_id, line.qty, tenantId, trx);
        }

        // 3. Serial Master updates
        if (item.is_serial_tracked && line.serial_id) {
          await this.serialService.validateAvailability(line.serial_id, tenantId, trx);
          // Consume at source
          await this.serialService.updateStatus(line.serial_id, 'CONSUMED', tenantId, trx);
          // Make it available at destination
          await this.serialService.updateStatus(line.serial_id, 'IN_STOCK', tenantId, trx);
        }

        // 4. Post ISSUE Ledger Entry at Source
        const ledgerIdOut = await this.ledgerService.postLedgerEntry(
          {
            tenant_id: tenantId,
            company_id: transfer.company_id,
            warehouse_id: transfer.from_warehouse_id,
            location_id: line.from_location_id,
            item_id: line.item_id,
            lot_id: line.lot_id || null,
            serial_id: line.serial_id || null,
            transaction_type: 'TRANSFER',
            transaction_date: transfer.posting_date,
            posting_date: transfer.posting_date,
            qty: (-line.qty).toFixed(4),
            unit_cost: '0.0000', // cost resolved below
            total_value: '0.0000',
            ref_doc_type: 'TransferOrder',
            ref_doc_id: transferId,
            ref_doc_line_id: line.line_id,
          },
          tenantId,
          userId,
          trx
        );

        // 5. Cost Valuation Resolution (Draw down source layers)
        let unitCost = 0;
        let totalValue = 0;

        if (item.valuation_method === 'FIFO') {
          totalValue = await this.fifoService.consumeLayers(
            transfer.company_id,
            transfer.from_warehouse_id,
            line.from_location_id,
            line.item_id,
            line.lot_id || null,
            line.qty,
            ledgerIdOut,
            tenantId,
            trx
          );
          unitCost = totalValue / line.qty;
        } else {
          unitCost = parseFloat(item.standard_cost || '0.0000');
          totalValue = line.qty * unitCost;
        }

        // 6. Update Source Ledger Entry costs
        await trx
          .update(schema.inventoryLedger)
          .set({
            unit_cost: unitCost.toFixed(4),
            total_value: (-totalValue).toFixed(4),
          })
          .where(eq(schema.inventoryLedger.ledger_id, ledgerIdOut));

        // 7. Post RECEIPT Ledger Entry at Destination
        const ledgerIdIn = await this.ledgerService.postLedgerEntry(
          {
            tenant_id: tenantId,
            company_id: transfer.company_id,
            warehouse_id: transfer.to_warehouse_id,
            location_id: line.to_location_id,
            item_id: line.item_id,
            lot_id: line.lot_id || null,
            serial_id: line.serial_id || null,
            transaction_type: 'TRANSFER',
            transaction_date: transfer.posting_date,
            posting_date: transfer.posting_date,
            qty: line.qty.toFixed(4),
            unit_cost: unitCost.toFixed(4),
            total_value: totalValue.toFixed(4),
            ref_doc_type: 'TransferOrder',
            ref_doc_id: transferId,
            ref_doc_line_id: line.line_id,
          },
          tenantId,
          userId,
          trx
        );

        // 8. Create FIFO Cost Layer at target warehouse
        if (item.valuation_method === 'FIFO') {
          await this.fifoService.createLayer(
            {
              tenant_id: tenantId,
              company_id: transfer.company_id,
              warehouse_id: transfer.to_warehouse_id,
              location_id: line.to_location_id,
              item_id: line.item_id,
              lot_id: line.lot_id || null,
              ledger_id: ledgerIdIn,
              qty_initial: line.qty.toFixed(4),
              qty_remaining: line.qty.toFixed(4),
              unit_cost: unitCost.toFixed(4),
              posting_date: transfer.posting_date,
              is_exhausted: false,
            },
            tenantId,
            trx
          );
        }
      }

      // Update transfer status to POSTED
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.transferOrder)
        .set({
          status: 'POSTED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.transferOrder.transfer_id, transferId));

      await this.auditService.log({
        tenantId,
        companyId: transfer.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'transfer_order',
        entityId: transferId,
        oldValues: transfer,
        newValues: { ...transfer, status: 'POSTED' },
      });

      return { success: true, message: 'Transfer Order posted successfully.' };
    });
  }

  async findOne(transferId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [transfer] = await dbClient
      .select()
      .from(schema.transferOrder)
      .where(and(eq(schema.transferOrder.transfer_id, transferId), eq(schema.transferOrder.tenant_id, tenantId)))
      .limit(1);

    if (!transfer) {
      throw new NotFoundException(`Transfer Order with ID '${transferId}' not found.`);
    }

    const lines = await dbClient
      .select()
      .from(schema.transferOrderLine)
      .where(eq(schema.transferOrderLine.transfer_id, transferId));

    return {
      ...transfer,
      lines: lines.map(l => ({
        ...l,
        qty: parseFloat(l.qty),
        lot_id: l.lot_id || null,
        serial_id: l.serial_id || null,
      })),
    };
  }

  async findAll(query: QueryTransferOrderDto, tenantId: string) {
    const conditions = [eq(schema.transferOrder.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.transferOrder.company_id, query.companyId));
    }
    if (query.fromWarehouseId) {
      conditions.push(eq(schema.transferOrder.from_warehouse_id, query.fromWarehouseId));
    }
    if (query.toWarehouseId) {
      conditions.push(eq(schema.transferOrder.to_warehouse_id, query.toWarehouseId));
    }
    if (query.status) {
      conditions.push(eq(schema.transferOrder.status, query.status));
    }
    if (query.search) {
      conditions.push(like(schema.transferOrder.transfer_no, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.transferOrder)
      .where(and(...conditions));
  }
}
