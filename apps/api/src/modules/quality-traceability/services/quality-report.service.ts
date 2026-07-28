import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class QualityReportService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getQualitySummaryDashboard(companyId: string, tenantId: string) {
    const ncrs = await this.db
      .select()
      .from(schema.qualityNonConformance)
      .where(
        and(
          eq(schema.qualityNonConformance.tenant_id, tenantId),
          eq(schema.qualityNonConformance.company_id, companyId)
        )
      );

    const capas = await this.db
      .select()
      .from(schema.qualityCapa)
      .where(
        and(
          eq(schema.qualityCapa.tenant_id, tenantId),
          eq(schema.qualityCapa.company_id, companyId)
        )
      );

    const recalls = await this.db
      .select()
      .from(schema.recallManagement)
      .where(
        and(
          eq(schema.recallManagement.tenant_id, tenantId),
          eq(schema.recallManagement.company_id, companyId)
        )
      );

    return {
      open_ncrs_count: ncrs.filter(n => n.status === 'OPEN').length,
      active_capas_count: capas.filter(c => c.status === 'IN_PROGRESS').length,
      active_recalls_count: recalls.filter(r => r.status !== 'CLOSED').length,
      total_ncrs: ncrs.length,
      total_capas: capas.length,
    };
  }
}
