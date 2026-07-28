import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

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

  async getProductionEfficiencyReport(companyId: string, tenantId: string) {
    const batches = await this.db
      .select()
      .from(schema.productionBatch)
      .where(
        and(
          eq(schema.productionBatch.tenant_id, tenantId),
          eq(schema.productionBatch.company_id, companyId)
        )
      );

    const completed = batches.filter(b => b.status === 'FINISHED').length;
    const wip = batches.filter(b => b.status === 'IN_PROGRESS' || b.status === 'QUALITY_CHECK').length;
    const efficiencyRate = batches.length > 0 ? (completed / batches.length) * 100 : 100;

    return {
      company_id: companyId,
      total_batches_count: batches.length,
      completed_batches_count: completed,
      wip_batches_count: wip,
      production_efficiency_pct: efficiencyRate,
      batch_summary: batches.map(b => ({
        batch_id: b.batch_id,
        batch_number: b.batch_number,
        status: b.status,
        planned_qty: b.planned_qty,
        actual_qty: b.actual_qty,
      })),
    };
  }
}
