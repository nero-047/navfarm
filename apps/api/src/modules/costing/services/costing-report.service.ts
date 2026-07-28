import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class CostingReportService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getInventoryValuationReport(companyId: string, tenantId: string) {
    const balances = await this.db
      .select({
        balance_id: schema.inventoryBalance.balance_id,
        item_id: schema.inventoryBalance.item_id,
        item_code: schema.itemMaster.item_code,
        item_name: schema.itemMaster.item_name,
        warehouse_id: schema.inventoryBalance.warehouse_id,
        warehouse_name: schema.warehouseMaster.name,
        location_id: schema.inventoryBalance.location_id,
        location_name: schema.locationMaster.name,
        qty_on_hand: schema.inventoryBalance.qty_on_hand,
        standard_cost: schema.itemMaster.standard_cost,
      })
      .from(schema.inventoryBalance)
      .innerJoin(schema.itemMaster, eq(schema.inventoryBalance.item_id, schema.itemMaster.item_id))
      .innerJoin(schema.warehouseMaster, eq(schema.inventoryBalance.warehouse_id, schema.warehouseMaster.warehouse_id))
      .innerJoin(schema.locationMaster, eq(schema.inventoryBalance.location_id, schema.locationMaster.location_id))
      .where(
        and(
          eq(schema.inventoryBalance.tenant_id, tenantId),
          eq(schema.inventoryBalance.company_id, companyId)
        )
      );

    return balances.map(b => {
      const qty = parseFloat(b.qty_on_hand);
      const unitCost = parseFloat(b.standard_cost || '0.0000');
      const totalValue = qty * unitCost;

      return {
        ...b,
        unit_cost: unitCost,
        total_valuation: parseFloat(totalValue.toFixed(4)),
      };
    });
  }

  async getBiologicalAssetValuationReport(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.biologicalAssetCost)
      .where(
        and(
          eq(schema.biologicalAssetCost.tenant_id, tenantId),
          eq(schema.biologicalAssetCost.company_id, companyId)
        )
      );
  }
}
