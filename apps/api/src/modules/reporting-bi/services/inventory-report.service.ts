import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class InventoryReportService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getStockSummaryReport(companyId: string, tenantId: string) {
    const items = await this.db
      .select()
      .from(schema.itemMaster)
      .where(
        and(
          eq(schema.itemMaster.tenant_id, tenantId),
          eq(schema.itemMaster.company_id, companyId)
        )
      );

    const lots = await this.db
      .select()
      .from(schema.lotMaster)
      .where(eq(schema.lotMaster.tenant_id, tenantId));

    return {
      company_id: companyId,
      total_items_count: items.length,
      total_active_lots_count: lots.length,
      items_summary: items.map(i => ({
        item_id: i.item_id,
        item_code: i.item_code,
        item_name: i.item_name,
        standard_cost: i.standard_cost,
        average_cost: i.average_cost,
      })),
    };
  }

  async getInventoryValuationFifoReport(companyId: string, tenantId: string) {
    const items = await this.db
      .select()
      .from(schema.itemMaster)
      .where(
        and(
          eq(schema.itemMaster.tenant_id, tenantId),
          eq(schema.itemMaster.company_id, companyId)
        )
      );

    const lots = await this.db
      .select()
      .from(schema.lotMaster)
      .where(eq(schema.lotMaster.tenant_id, tenantId));

    let totalValuation = 0;
    const valuationLayers = lots.map(l => {
      const qty = parseFloat(l.remaining_qty);
      const unitCost = parseFloat(l.unit_cost);
      const totalCost = qty * unitCost;
      totalValuation += totalCost;

      return {
        lot_number: l.lot_number,
        item_id: l.item_id,
        remaining_qty: qty,
        unit_cost: unitCost,
        total_valuation: totalCost,
      };
    });

    return {
      company_id: companyId,
      total_inventory_valuation: totalValuation,
      valuation_layers: valuationLayers,
    };
  }
}
