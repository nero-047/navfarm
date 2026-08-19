import { Injectable, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class CostingMethodService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async listCostingMethods() {
    return this.db.select().from(schema.costingMethodConfig).where(eq(schema.costingMethodConfig.is_active, true));
  }

  async createCostingMethod(data: any) {
    await this.db.insert(schema.costingMethodConfig).values(data);
    const [newMethod] = await this.db
      .select()
      .from(schema.costingMethodConfig)
      .where(eq(schema.costingMethodConfig.method_code, data.method_code))
      .limit(1);
    return newMethod;
  }

  async updateCostingMethod(code: string, data: any) {
    await this.db.update(schema.costingMethodConfig).set(data).where(eq(schema.costingMethodConfig.method_code, code));
    const [updated] = await this.db
      .select()
      .from(schema.costingMethodConfig)
      .where(eq(schema.costingMethodConfig.method_code, code))
      .limit(1);
    return updated;
  }

  async deleteCostingMethod(code: string) {
    const [existing] = await this.db
      .select()
      .from(schema.costingMethodConfig)
      .where(eq(schema.costingMethodConfig.method_code, code))
      .limit(1);

    if (existing?.is_system) {
      throw new BadRequestException(`Costing method '${code}' is a system method and cannot be deleted.`);
    }

    await this.db.delete(schema.costingMethodConfig).where(eq(schema.costingMethodConfig.method_code, code));
    return existing;
  }
}
