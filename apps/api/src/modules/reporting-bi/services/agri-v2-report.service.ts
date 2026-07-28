import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class AgriV2ReportService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  async getCropYieldReport(tenantId: string, season?: string) {
    let plans = await this.db.select().from(schema.agriCropPlan).where(eq(schema.agriCropPlan.tenant_id, tenantId));
    if (season) plans = plans.filter(p => p.season === season);

    const analyses = await this.db.select().from(schema.agriYieldAnalysis).where(eq(schema.agriYieldAnalysis.tenant_id, tenantId));
    const totalActualYield = analyses.reduce((s, a) => s + Number(a.actual_yield_kg || 0), 0);
    const totalRevenue = analyses.reduce((s, a) => s + Number(a.total_revenue || 0), 0);
    const totalCost = analyses.reduce((s, a) => s + Number(a.total_production_cost || 0), 0);
    const avgGrossMargin = analyses.length > 0
      ? analyses.reduce((s, a) => s + Number(a.gross_margin_pct || 0), 0) / analyses.length : 0;

    return {
      report_type: 'AGRI_CROP_YIELD',
      season: season || 'ALL',
      tenant_id: tenantId,
      generated_at: new Date().toISOString(),
      summary: {
        total_crop_plans: plans.length,
        harvested_plans: plans.filter(p => p.plan_status === 'HARVESTED').length,
        active_plans: plans.filter(p => ['SOWING', 'GROWING'].includes(p.plan_status)).length,
        total_actual_yield_kg: parseFloat(totalActualYield.toFixed(2)),
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_cost: parseFloat(totalCost.toFixed(2)),
        net_margin: parseFloat((totalRevenue - totalCost).toFixed(2)),
        avg_gross_margin_pct: parseFloat(avgGrossMargin.toFixed(2)),
      },
    };
  }

  async getFieldUtilisationReport(tenantId: string) {
    const fields = await this.db.select().from(schema.agriField).where(eq(schema.agriField.tenant_id, tenantId));
    const plans = await this.db.select().from(schema.agriCropPlan).where(eq(schema.agriCropPlan.tenant_id, tenantId));
    return {
      report_type: 'FIELD_UTILISATION',
      total_fields: fields.length,
      total_area_acres: fields.reduce((s, f) => s + Number(f.area_acres || 0), 0),
      fields_in_crop: fields.filter(f => f.field_status === 'IN_CROP').length,
      fields_available: fields.filter(f => f.field_status === 'AVAILABLE').length,
      fields_fallow: fields.filter(f => f.field_status === 'FALLOW').length,
      active_crop_plans: plans.filter(p => ['SOWING', 'GROWING'].includes(p.plan_status)).length,
    };
  }
}
