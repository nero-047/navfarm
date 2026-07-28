import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateDashboardDto } from '../dto/dashboard-bi.dto';

@Injectable()
export class DashboardBiService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createDashboard(dto: CreateDashboardDto, tenantId: string, userId?: string) {
    const dashboardId = randomUUID();
    const newDashboard = {
      dashboard_id: dashboardId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      dashboard_name: dto.dashboard_name,
      dashboard_type: dto.dashboard_type,
      owner_id: userId || null,
    };

    await this.db.insert(schema.dashboard).values(newDashboard);

    if (dto.widgets && dto.widgets.length > 0) {
      for (const w of dto.widgets) {
        await this.db.insert(schema.dashboardWidget).values({
          widget_id: randomUUID(),
          dashboard_id: dashboardId,
          widget_title: w.widget_title,
          widget_type: w.widget_type,
          report_id: w.report_id || null,
          layout_json: w.layout_json || {},
        });
      }
    }

    return newDashboard;
  }

  async getDashboards(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.dashboard)
      .where(
        and(
          eq(schema.dashboard.tenant_id, tenantId),
          eq(schema.dashboard.company_id, companyId)
        )
      );
  }

  async getDashboardById(dashboardId: string, tenantId: string) {
    const [dash] = await this.db
      .select()
      .from(schema.dashboard)
      .where(
        and(
          eq(schema.dashboard.dashboard_id, dashboardId),
          eq(schema.dashboard.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!dash) {
      throw new NotFoundException(`Dashboard '${dashboardId}' not found.`);
    }

    const widgets = await this.db
      .select()
      .from(schema.dashboardWidget)
      .where(eq(schema.dashboardWidget.dashboard_id, dashboardId));

    return {
      ...dash,
      widgets,
    };
  }
}
