import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class PoultryKpiService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getBatchKpi(poultryBatchId: string, tenantId: string) {
    const [kpi] = await this.db
      .select()
      .from(schema.poultryKpi)
      .where(
        and(
          eq(schema.poultryKpi.poultry_batch_id, poultryBatchId),
          eq(schema.poultryKpi.tenant_id, tenantId)
        )
      )
      .limit(1);

    return kpi || null;
  }

  async getCompanyKpiSummary(companyId: string, tenantId: string) {
    const batches = await this.db
      .select({
        poultry_batch_id: schema.poultryBatch.poultry_batch_id,
        farm_id: schema.poultryBatch.farm_id,
        shed_id: schema.poultryBatch.shed_id,
        batch_type: schema.poultryBatch.batch_type,
        initial_bird_count: schema.poultryBatch.initial_bird_count,
        current_bird_count: schema.poultryBatch.current_bird_count,
        total_mortality: schema.poultryBatch.total_mortality,
        status: schema.poultryBatch.status,
        fcr: schema.poultryKpi.fcr,
        livability_pct: schema.poultryKpi.livability_pct,
        mortality_rate_pct: schema.poultryKpi.mortality_rate_pct,
        hdp_pct: schema.poultryKpi.hdp_pct,
        hatchability_pct: schema.poultryKpi.hatchability_pct,
      })
      .from(schema.poultryBatch)
      .leftJoin(schema.poultryKpi, eq(schema.poultryBatch.poultry_batch_id, schema.poultryKpi.poultry_batch_id))
      .where(
        and(
          eq(schema.poultryBatch.tenant_id, tenantId),
          eq(schema.poultryBatch.company_id, companyId)
        )
      );

    const totalPlaced = batches.reduce((acc, b) => acc + b.initial_bird_count, 0);
    const totalCurrent = batches.reduce((acc, b) => acc + b.current_bird_count, 0);
    const totalMortality = batches.reduce((acc, b) => acc + b.total_mortality, 0);
    const overallLivability = totalPlaced > 0 ? (totalCurrent / totalPlaced) * 100 : 100;

    return {
      company_id: companyId,
      total_active_batches: batches.length,
      total_birds_placed: totalPlaced,
      current_live_birds: totalCurrent,
      total_mortality: totalMortality,
      overall_livability_pct: parseFloat(overallLivability.toFixed(2)),
      batches,
    };
  }
}
