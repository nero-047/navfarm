import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';

@Injectable()
export class ProductionReportService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getWipReport(companyId: string, tenantId: string) {
    return this.db
      .select({
        wip_id: schema.productionWip.wip_id,
        batch_id: schema.productionWip.batch_id,
        batch_no: schema.productionBatch.batch_no,
        status: schema.productionBatch.status,
        material_cost: schema.productionWip.material_cost,
        labor_cost: schema.productionWip.labor_cost,
        machine_cost: schema.productionWip.machine_cost,
        overhead_cost: schema.productionWip.overhead_cost,
        total_wip_cost: schema.productionWip.total_wip_cost,
        completion_pct: schema.productionWip.completion_pct,
        updated_at: schema.productionWip.updated_at,
      })
      .from(schema.productionWip)
      .innerJoin(schema.productionBatch, eq(schema.productionWip.batch_id, schema.productionBatch.batch_id))
      .where(
        and(
          eq(schema.productionWip.tenant_id, tenantId),
          eq(schema.productionWip.company_id, companyId)
        )
      );
  }

  async getVarianceReport(companyId: string, tenantId: string) {
    return this.db
      .select({
        variance_id: schema.productionVariance.variance_id,
        batch_id: schema.productionVariance.batch_id,
        batch_no: schema.productionBatch.batch_no,
        planned_qty: schema.productionVariance.planned_qty,
        actual_qty: schema.productionVariance.actual_qty,
        qty_variance: schema.productionVariance.qty_variance,
        material_cost_variance: schema.productionVariance.material_cost_variance,
        labor_variance: schema.productionVariance.labor_variance,
        total_variance_cost: schema.productionVariance.total_variance_cost,
        created_at: schema.productionVariance.created_at,
      })
      .from(schema.productionVariance)
      .innerJoin(schema.productionBatch, eq(schema.productionVariance.batch_id, schema.productionBatch.batch_id))
      .where(
        and(
          eq(schema.productionVariance.tenant_id, tenantId),
          eq(schema.productionVariance.company_id, companyId)
        )
      );
  }
}
