import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

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
}
