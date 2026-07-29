import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';

@Injectable()
export class DashboardEngineService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getExecutiveDashboard(companyId: string, tenantId: string) {
    const jobs = await this.db
      .select()
      .from(schema.schedulerJob)
      .where(
        and(
          eq(schema.schedulerJob.tenant_id, tenantId),
          eq(schema.schedulerJob.company_id, companyId)
        )
      );

    const alerts = await this.db
      .select()
      .from(schema.alertEvent)
      .where(
        and(
          eq(schema.alertEvent.tenant_id, tenantId),
          eq(schema.alertEvent.company_id, companyId),
          eq(schema.alertEvent.status, 'ACTIVE')
        )
      );

    const kpis = await this.db
      .select()
      .from(schema.kpiDefinition)
      .where(
        and(
          eq(schema.kpiDefinition.tenant_id, tenantId),
          eq(schema.kpiDefinition.company_id, companyId)
        )
      );

    return {
      active_jobs_count: jobs.filter(j => j.is_enabled).length,
      active_alerts_count: alerts.length,
      critical_alerts_count: alerts.filter(a => a.severity === 'CRITICAL').length,
      monitored_kpis_count: kpis.length,
    };
  }
}
