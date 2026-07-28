import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class VarianceAuditReportService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getVarianceAnalysisReport(companyId: string, tenantId: string) {
    const variances = await this.db
      .select()
      .from(schema.varianceAnalysis)
      .where(
        and(
          eq(schema.varianceAnalysis.tenant_id, tenantId),
          eq(schema.varianceAnalysis.company_id, companyId)
        )
      );

    let totalFavorable = 0;
    let totalUnfavorable = 0;

    variances.forEach(v => {
      const val = parseFloat(v.total_variance || '0');
      if (val >= 0) {
        totalFavorable += val;
      } else {
        totalUnfavorable += Math.abs(val);
      }
    });

    return {
      company_id: companyId,
      total_variances_count: variances.length,
      total_favorable_amount: totalFavorable,
      total_unfavorable_amount: totalUnfavorable,
      net_variance_impact: totalFavorable - totalUnfavorable,
      variances_details: variances,
    };
  }
}
