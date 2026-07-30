import { Injectable, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';

@Injectable()
export class SlaughterCostSplitService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async configureCostSplit(
    companyId: string,
    itemId: string,
    isMainProduct: boolean,
    costSplitPct: number,
    tenantId: string
  ) {
    // FIX-033 (GAP-044): Validate total cost_split_pct doesn't exceed 100%
    const existingConfigs = await this.getCostSplitConfigs(companyId, tenantId);
    const currentTotal = existingConfigs.reduce((sum, c) => sum + Number(c.cost_split_pct), 0);
    if (currentTotal + costSplitPct > 100.01) { // 0.01 tolerance for float rounding
      throw new BadRequestException(
        `Total cost split would be ${(currentTotal + costSplitPct).toFixed(2)}% which exceeds 100%. Current total: ${currentTotal.toFixed(2)}%. Max remaining: ${(100 - currentTotal).toFixed(2)}%.`
      );
    }

    const configId = randomUUID();
    const newConfig = {
      config_id: configId,
      tenant_id: tenantId,
      company_id: companyId,
      item_id: itemId,
      is_main_product: isMainProduct,
      cost_split_pct: costSplitPct.toFixed(2),
    };

    await this.db.insert(schema.slaughterCostSplitConfig).values(newConfig);
    return newConfig;
  }

  async getCostSplitConfigs(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.slaughterCostSplitConfig)
      .where(
        and(
          eq(schema.slaughterCostSplitConfig.tenant_id, tenantId),
          eq(schema.slaughterCostSplitConfig.company_id, companyId)
        )
      );
  }

  async calculateDynamicCostSplits(
    companyId: string,
    outputs: Array<{ item_id: string; qty_kg: number; unit_price?: number; cost_split_pct?: number }>,
    allocationMethod: 'PERCENTAGE' | 'WEIGHT' | 'MARKET_VALUE',
    tenantId: string
  ): Promise<Array<{ item_id: string; calculated_split_pct: number }>> {
    if (outputs.length === 0) return [];

    if (allocationMethod === 'WEIGHT') {
      const totalWeight = outputs.reduce((sum, o) => sum + (o.qty_kg || 0), 0);
      if (totalWeight <= 0) {
        const equalSplit = 100 / outputs.length;
        return outputs.map((o) => ({ item_id: o.item_id, calculated_split_pct: equalSplit }));
      }
      return outputs.map((o) => ({
        item_id: o.item_id,
        calculated_split_pct: parseFloat(((o.qty_kg / totalWeight) * 100).toFixed(4)),
      }));
    }

    if (allocationMethod === 'MARKET_VALUE') {
      const totalMarketValue = outputs.reduce((sum, o) => sum + (o.qty_kg || 0) * (o.unit_price || 1), 0);
      if (totalMarketValue <= 0) {
        const equalSplit = 100 / outputs.length;
        return outputs.map((o) => ({ item_id: o.item_id, calculated_split_pct: equalSplit }));
      }
      return outputs.map((o) => ({
        item_id: o.item_id,
        calculated_split_pct: parseFloat((((o.qty_kg * (o.unit_price || 1)) / totalMarketValue) * 100).toFixed(4)),
      }));
    }

    // Default: PERCENTAGE allocation
    const configuredConfigs = await this.getCostSplitConfigs(companyId, tenantId);
    return outputs.map((o) => {
      let splitPct = o.cost_split_pct;
      if (splitPct === undefined || splitPct === null) {
        const conf = configuredConfigs.find((c) => c.item_id === o.item_id);
        if (conf) {
          splitPct = parseFloat(conf.cost_split_pct);
        } else {
          splitPct = 100 / outputs.length;
        }
      }
      return { item_id: o.item_id, calculated_split_pct: splitPct };
    });
  }
}
