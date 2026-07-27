import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, sum } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class InventoryLedgerService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async postLedgerEntry(
    entry: Omit<typeof schema.inventoryLedger.$inferInsert, 'ledger_id' | 'created_at'>,
    tenantId: string,
    userId?: string,
    tx?: any
  ) {
    const dbClient = tx || this.db;

    // 1. Validate master references
    const [warehouse] = await dbClient
      .select()
      .from(schema.warehouseMaster)
      .where(and(eq(schema.warehouseMaster.warehouse_id, entry.warehouse_id), eq(schema.warehouseMaster.tenant_id, tenantId)))
      .limit(1);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID '${entry.warehouse_id}' not found.`);
    }

    const [location] = await dbClient
      .select()
      .from(schema.locationMaster)
      .where(and(eq(schema.locationMaster.location_id, entry.location_id), eq(schema.locationMaster.tenant_id, tenantId)))
      .limit(1);
    if (!location) {
      throw new NotFoundException(`Location with ID '${entry.location_id}' not found.`);
    }

    const [item] = await dbClient
      .select()
      .from(schema.itemMaster)
      .where(and(eq(schema.itemMaster.item_id, entry.item_id), eq(schema.itemMaster.tenant_id, tenantId)))
      .limit(1);
    if (!item) {
      throw new NotFoundException(`Item with ID '${entry.item_id}' not found.`);
    }

    // 2. Validate Lot / Serial if linked
    if (entry.lot_id) {
      const [lot] = await dbClient
        .select()
        .from(schema.lotMaster)
        .where(and(eq(schema.lotMaster.lot_id, entry.lot_id), eq(schema.lotMaster.tenant_id, tenantId)))
        .limit(1);
      if (!lot) {
        throw new NotFoundException(`Lot with ID '${entry.lot_id}' not found.`);
      }
    }
    if (entry.serial_id) {
      const [serial] = await dbClient
        .select()
        .from(schema.serialMaster)
        .where(and(eq(schema.serialMaster.serial_id, entry.serial_id), eq(schema.serialMaster.tenant_id, tenantId)))
        .limit(1);
      if (!serial) {
        throw new NotFoundException(`Serial with ID '${entry.serial_id}' not found.`);
      }
    }

    // 3. Insert Ledger record
    const ledgerId = randomUUID();
    const newEntry = {
      ...entry,
      ledger_id: ledgerId,
      created_by: userId || null,
    };

    await dbClient.insert(schema.inventoryLedger).values(newEntry);

    // 4. Update the Cached Stock Balance
    const qtyDelta = parseFloat(entry.qty.toString());
    await this.updateBalanceCache(
      entry.company_id,
      entry.warehouse_id,
      entry.location_id,
      entry.item_id,
      entry.lot_id || null,
      entry.serial_id || null,
      qtyDelta,
      tenantId,
      dbClient
    );

    // 5. Audit Log
    await this.auditService.log({
      tenantId,
      companyId: entry.company_id,
      userId,
      action: 'CREATE',
      entityName: 'inventory_ledger',
      entityId: ledgerId,
      newValues: newEntry,
    });

    return ledgerId;
  }

  private async updateBalanceCache(
    companyId: string,
    warehouseId: string,
    locationId: string,
    itemId: string,
    lotId: string | null,
    serialId: string | null,
    qtyDelta: number,
    tenantId: string,
    tx: any
  ) {
    const conditions = [
      eq(schema.inventoryBalance.tenant_id, tenantId),
      eq(schema.inventoryBalance.company_id, companyId),
      eq(schema.inventoryBalance.warehouse_id, warehouseId),
      eq(schema.inventoryBalance.location_id, locationId),
      eq(schema.inventoryBalance.item_id, itemId),
      lotId ? eq(schema.inventoryBalance.lot_id, lotId) : isNull(schema.inventoryBalance.lot_id),
      serialId ? eq(schema.inventoryBalance.serial_id, serialId) : isNull(schema.inventoryBalance.serial_id),
    ];

    const [existing] = await tx
      .select()
      .from(schema.inventoryBalance)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      const newOnHand = parseFloat(existing.qty_on_hand) + qtyDelta;
      const newAvailable = parseFloat(existing.qty_available) + qtyDelta;
      await tx
        .update(schema.inventoryBalance)
        .set({
          qty_on_hand: newOnHand.toFixed(4),
          qty_available: newAvailable.toFixed(4),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.inventoryBalance.balance_id, existing.balance_id));
    } else {
      await tx.insert(schema.inventoryBalance).values({
        balance_id: randomUUID(),
        tenant_id: tenantId,
        company_id: companyId,
        warehouse_id: warehouseId,
        location_id: locationId,
        item_id: itemId,
        lot_id: lotId,
        serial_id: serialId,
        qty_on_hand: qtyDelta.toFixed(4),
        qty_reserved: '0.0000',
        qty_available: qtyDelta.toFixed(4),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
  }

  async reserveStockCache(
    companyId: string,
    warehouseId: string,
    locationId: string,
    itemId: string,
    lotId: string | null,
    serialId: string | null,
    qtyReserved: number,
    tenantId: string,
    tx: any
  ) {
    const conditions = [
      eq(schema.inventoryBalance.tenant_id, tenantId),
      eq(schema.inventoryBalance.company_id, companyId),
      eq(schema.inventoryBalance.warehouse_id, warehouseId),
      eq(schema.inventoryBalance.location_id, locationId),
      eq(schema.inventoryBalance.item_id, itemId),
      lotId ? eq(schema.inventoryBalance.lot_id, lotId) : isNull(schema.inventoryBalance.lot_id),
      serialId ? eq(schema.inventoryBalance.serial_id, serialId) : isNull(schema.inventoryBalance.serial_id),
    ];

    const [existing] = await tx
      .select()
      .from(schema.inventoryBalance)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      const newReserved = parseFloat(existing.qty_reserved) + qtyReserved;
      const newAvailable = parseFloat(existing.qty_available) - qtyReserved;
      await tx
        .update(schema.inventoryBalance)
        .set({
          qty_reserved: newReserved.toFixed(4),
          qty_available: newAvailable.toFixed(4),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.inventoryBalance.balance_id, existing.balance_id));
    } else {
      await tx.insert(schema.inventoryBalance).values({
        balance_id: randomUUID(),
        tenant_id: tenantId,
        company_id: companyId,
        warehouse_id: warehouseId,
        location_id: locationId,
        item_id: itemId,
        lot_id: lotId,
        serial_id: serialId,
        qty_on_hand: '0.0000',
        qty_reserved: qtyReserved.toFixed(4),
        qty_available: (-qtyReserved).toFixed(4),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
  }

  async releaseStockCache(
    companyId: string,
    warehouseId: string,
    locationId: string,
    itemId: string,
    lotId: string | null,
    serialId: string | null,
    qtyReleased: number,
    tenantId: string,
    tx: any
  ) {
    const conditions = [
      eq(schema.inventoryBalance.tenant_id, tenantId),
      eq(schema.inventoryBalance.company_id, companyId),
      eq(schema.inventoryBalance.warehouse_id, warehouseId),
      eq(schema.inventoryBalance.location_id, locationId),
      eq(schema.inventoryBalance.item_id, itemId),
      lotId ? eq(schema.inventoryBalance.lot_id, lotId) : isNull(schema.inventoryBalance.lot_id),
      serialId ? eq(schema.inventoryBalance.serial_id, serialId) : isNull(schema.inventoryBalance.serial_id),
    ];

    const [existing] = await tx
      .select()
      .from(schema.inventoryBalance)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      const newReserved = parseFloat(existing.qty_reserved) - qtyReleased;
      const newAvailable = parseFloat(existing.qty_available) + qtyReleased;
      await tx
        .update(schema.inventoryBalance)
        .set({
          qty_reserved: newReserved.toFixed(4),
          qty_available: newAvailable.toFixed(4),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.inventoryBalance.balance_id, existing.balance_id));
    }
  }

  async consumeStockCache(
    companyId: string,
    warehouseId: string,
    locationId: string,
    itemId: string,
    lotId: string | null,
    serialId: string | null,
    qtyConsumed: number,
    tenantId: string,
    tx: any
  ) {
    const conditions = [
      eq(schema.inventoryBalance.tenant_id, tenantId),
      eq(schema.inventoryBalance.company_id, companyId),
      eq(schema.inventoryBalance.warehouse_id, warehouseId),
      eq(schema.inventoryBalance.location_id, locationId),
      eq(schema.inventoryBalance.item_id, itemId),
      lotId ? eq(schema.inventoryBalance.lot_id, lotId) : isNull(schema.inventoryBalance.lot_id),
      serialId ? eq(schema.inventoryBalance.serial_id, serialId) : isNull(schema.inventoryBalance.serial_id),
    ];

    const [existing] = await tx
      .select()
      .from(schema.inventoryBalance)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      const newReserved = parseFloat(existing.qty_reserved) - qtyConsumed;
      await tx
        .update(schema.inventoryBalance)
        .set({
          qty_reserved: newReserved.toFixed(4),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.inventoryBalance.balance_id, existing.balance_id));
    }
  }

  async getAvailableStock(
    itemId: string,
    warehouseId: string,
    locationId: string,
    lotId: string | null,
    serialId: string | null,
    tenantId: string,
    tx?: any
  ): Promise<number> {
    const dbClient = tx || this.db;
    const conditions = [
      eq(schema.inventoryBalance.tenant_id, tenantId),
      eq(schema.inventoryBalance.item_id, itemId),
      eq(schema.inventoryBalance.warehouse_id, warehouseId),
      eq(schema.inventoryBalance.location_id, locationId),
    ];

    if (lotId !== undefined && lotId !== null) {
      conditions.push(eq(schema.inventoryBalance.lot_id, lotId));
    }
    if (serialId !== undefined && serialId !== null) {
      conditions.push(eq(schema.inventoryBalance.serial_id, serialId));
    }

    const [result] = await dbClient
      .select({
        available: sum(schema.inventoryBalance.qty_available),
      })
      .from(schema.inventoryBalance)
      .where(and(...conditions));

    return result?.available ? parseFloat(result.available) : 0;
  }

  async getBalance(
    itemId: string,
    warehouseId: string,
    locationId: string,
    lotId: string | null,
    serialId: string | null,
    tenantId: string,
    tx?: any
  ) {
    const dbClient = tx || this.db;
    const conditions = [
      eq(schema.inventoryBalance.tenant_id, tenantId),
      eq(schema.inventoryBalance.item_id, itemId),
      eq(schema.inventoryBalance.warehouse_id, warehouseId),
      eq(schema.inventoryBalance.location_id, locationId),
      lotId ? eq(schema.inventoryBalance.lot_id, lotId) : isNull(schema.inventoryBalance.lot_id),
      serialId ? eq(schema.inventoryBalance.serial_id, serialId) : isNull(schema.inventoryBalance.serial_id),
    ];

    const [balance] = await dbClient
      .select()
      .from(schema.inventoryBalance)
      .where(and(...conditions))
      .limit(1);

    if (!balance) {
      return {
        qty_on_hand: 0,
        qty_reserved: 0,
        qty_available: 0,
      };
    }

    return {
      qty_on_hand: parseFloat(balance.qty_on_hand),
      qty_reserved: parseFloat(balance.qty_reserved),
      qty_available: parseFloat(balance.qty_available),
    };
  }

  async getBalancesByItem(itemId: string, tenantId: string) {
    const balances = await this.db
      .select()
      .from(schema.inventoryBalance)
      .where(and(eq(schema.inventoryBalance.item_id, itemId), eq(schema.inventoryBalance.tenant_id, tenantId)));

    return balances.map(b => ({
      ...b,
      qty_on_hand: parseFloat(b.qty_on_hand),
      qty_reserved: parseFloat(b.qty_reserved),
      qty_available: parseFloat(b.qty_available),
    }));
  }
}
