import { Injectable, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, asc, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';

@Injectable()
export class FifoEngineService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createLayer(
    layer: Omit<typeof schema.fifoLayer.$inferInsert, 'layer_id' | 'created_at' | 'updated_at'>,
    tenantId: string,
    tx?: any
  ) {
    const dbClient = tx || this.db;
    const layerId = randomUUID();

    const newLayer = {
      ...layer,
      layer_id: layerId,
    };

    await dbClient.insert(schema.fifoLayer).values(newLayer);
    return layerId;
  }

  async consumeLayers(
    companyId: string,
    warehouseId: string,
    locationId: string,
    itemId: string,
    lotId: string | null,
    qtyToConsume: number,
    ledgerId: string, // issue ledger entry
    tenantId: string,
    tx: any
  ): Promise<number> {
    if (qtyToConsume <= 0) {
      return 0;
    }

    const conditions = [
      eq(schema.fifoLayer.tenant_id, tenantId),
      eq(schema.fifoLayer.company_id, companyId),
      eq(schema.fifoLayer.warehouse_id, warehouseId),
      eq(schema.fifoLayer.location_id, locationId),
      eq(schema.fifoLayer.item_id, itemId),
      eq(schema.fifoLayer.is_exhausted, false),
    ];

    if (lotId) {
      conditions.push(eq(schema.fifoLayer.lot_id, lotId));
    } else {
      conditions.push(isNull(schema.fifoLayer.lot_id));
    }

    // Query open layers ordered by oldest posting date, then oldest creation time
    const openLayers = await tx
      .select()
      .from(schema.fifoLayer)
      .where(and(...conditions))
      .orderBy(asc(schema.fifoLayer.posting_date), asc(schema.fifoLayer.created_at));

    let remainingQty = qtyToConsume;
    let totalCost = 0;

    for (const layer of openLayers) {
      const layerQtyRemaining = parseFloat(layer.qty_remaining);
      const layerUnitCost = parseFloat(layer.unit_cost);

      if (layerQtyRemaining <= 0) {
        continue;
      }

      if (layerQtyRemaining >= remainingQty) {
        const costSegment = remainingQty * layerUnitCost;
        totalCost += costSegment;

        const newRemaining = layerQtyRemaining - remainingQty;
        const isExhausted = newRemaining === 0;

        // Update layer
        await tx
          .update(schema.fifoLayer)
          .set({
            qty_remaining: newRemaining.toFixed(4),
            is_exhausted: isExhausted,
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          })
          .where(eq(schema.fifoLayer.layer_id, layer.layer_id));

        // Insert consumption log
        await tx.insert(schema.fifoConsumptionLog).values({
          consumption_id: randomUUID(),
          tenant_id: tenantId,
          layer_id: layer.layer_id,
          ledger_id: ledgerId,
          qty_consumed: remainingQty.toFixed(4),
          cost_consumed: costSegment.toFixed(4),
        });

        remainingQty = 0;
        break;
      } else {
        const costSegment = layerQtyRemaining * layerUnitCost;
        totalCost += costSegment;

        // Update layer
        await tx
          .update(schema.fifoLayer)
          .set({
            qty_remaining: '0.0000',
            is_exhausted: true,
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          })
          .where(eq(schema.fifoLayer.layer_id, layer.layer_id));

        // Insert consumption log
        await tx.insert(schema.fifoConsumptionLog).values({
          consumption_id: randomUUID(),
          tenant_id: tenantId,
          layer_id: layer.layer_id,
          ledger_id: ledgerId,
          qty_consumed: layerQtyRemaining.toFixed(4),
          cost_consumed: costSegment.toFixed(4),
        });

        remainingQty -= layerQtyRemaining;
      }
    }

    if (remainingQty > 0) {
      throw new BadRequestException(
        `Insufficient FIFO layers to consume quantity ${qtyToConsume} of item ID ${itemId}. Missing layer quantity: ${remainingQty}`
      );
    }

    return totalCost;
  }

  async getValuationReport(
    companyId: string,
    itemId?: string,
    warehouseId?: string,
    tenantId?: string
  ) {
    const conditions = [
      eq(schema.fifoLayer.is_exhausted, false)
    ];

    if (tenantId) {
      conditions.push(eq(schema.fifoLayer.tenant_id, tenantId));
    }
    if (companyId) {
      conditions.push(eq(schema.fifoLayer.company_id, companyId));
    }
    if (itemId) {
      conditions.push(eq(schema.fifoLayer.item_id, itemId));
    }
    if (warehouseId) {
      conditions.push(eq(schema.fifoLayer.warehouse_id, warehouseId));
    }

    const openLayers = await this.db
      .select()
      .from(schema.fifoLayer)
      .where(and(...conditions));

    let totalValuation = 0;
    const itemsMap: Record<string, { qty: number; value: number; layersCount: number }> = {};

    for (const layer of openLayers) {
      const qty = parseFloat(layer.qty_remaining);
      const val = qty * parseFloat(layer.unit_cost);
      totalValuation += val;

      if (!itemsMap[layer.item_id]) {
        itemsMap[layer.item_id] = { qty: 0, value: 0, layersCount: 0 };
      }
      itemsMap[layer.item_id].qty += qty;
      itemsMap[layer.item_id].value += val;
      itemsMap[layer.item_id].layersCount += 1;
    }

    return {
      totalValuation,
      items: Object.entries(itemsMap).map(([itemId, data]) => ({
        itemId,
        qtyRemaining: data.qty,
        valuation: data.value,
        averageUnitCost: data.qty > 0 ? data.value / data.qty : 0,
        openLayersCount: data.layersCount
      }))
    };
  }
}
