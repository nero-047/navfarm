import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class PoultryReportService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getPoultryPerformanceReport(companyId: string, tenantId: string) {
    const poultryBatches = await this.db
      .select()
      .from(schema.poultryBatch)
      .where(
        and(
          eq(schema.poultryBatch.tenant_id, tenantId),
          eq(schema.poultryBatch.company_id, companyId)
        )
      );

    const mortalities = await this.db
      .select()
      .from(schema.mortalityRecord)
      .where(
        and(
          eq(schema.mortalityRecord.tenant_id, tenantId),
          eq(schema.mortalityRecord.company_id, companyId)
        )
      );

    const weights = await this.db
      .select()
      .from(schema.weightRecord)
      .where(
        and(
          eq(schema.weightRecord.tenant_id, tenantId),
          eq(schema.weightRecord.company_id, companyId)
        )
      );

    const totalMortality = mortalities.reduce((sum, m) => sum + m.mortality_count, 0);

    return {
      company_id: companyId,
      active_flocks_count: poultryBatches.length,
      total_mortality_count: totalMortality,
      recorded_weights_count: weights.length,
      flocks_summary: poultryBatches.map(pb => ({
        poultry_batch_id: pb.poultry_batch_id,
        production_batch_id: pb.production_batch_id,
        flock_type: pb.flock_type,
        current_bird_count: pb.current_bird_count,
        fcr_ratio: pb.fcr_ratio,
      })),
    };
  }
}
