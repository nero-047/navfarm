import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateQualityPlanDto } from '../dto/quality-plan.dto';

@Injectable()
export class QualityPlanService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createQualityPlan(dto: CreateQualityPlanDto, tenantId: string) {
    const planId = randomUUID();
    const newPlan = {
      plan_id: planId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      plan_code: dto.plan_code,
      plan_name: dto.plan_name,
      inspection_type: dto.inspection_type,
      item_id: dto.item_id || null,
      item_category_id: dto.item_category_id || null,
      is_active: true,
    };

    await this.db.insert(schema.qualityPlan).values(newPlan);

    // Insert Parameters
    for (const p of dto.parameters) {
      await this.db.insert(schema.qualityParameter).values({
        parameter_id: randomUUID(),
        plan_id: planId,
        parameter_name: p.parameter_name,
        target_value: p.target_value !== undefined ? p.target_value.toFixed(4) : null,
        min_value: p.min_value !== undefined ? p.min_value.toFixed(4) : null,
        max_value: p.max_value !== undefined ? p.max_value.toFixed(4) : null,
        uom_id: p.uom_id || null,
        is_mandatory: p.is_mandatory !== undefined ? p.is_mandatory : true,
      });
    }

    return newPlan;
  }

  async getQualityPlans(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.qualityPlan)
      .where(
        and(
          eq(schema.qualityPlan.tenant_id, tenantId),
          eq(schema.qualityPlan.company_id, companyId)
        )
      );
  }
}
