import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class AquaV2ReportService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  async getPondProductionReport(tenantId: string) {
    const ponds = await this.db.select().from(schema.aquaPond).where(eq(schema.aquaPond.tenant_id, tenantId));
    const wqLogs = await this.db.select().from(schema.aquaWaterQuality).where(eq(schema.aquaWaterQuality.tenant_id, tenantId));
    const growth = await this.db.select().from(schema.aquaGrowthSample).where(eq(schema.aquaGrowthSample.tenant_id, tenantId));
    const mortalities = await this.db.select().from(schema.aquaMortalityEvent).where(eq(schema.aquaMortalityEvent.tenant_id, tenantId));

    const criticalWQ = wqLogs.filter(w => w.status === 'CRITICAL').length;
    const avgWqi = wqLogs.length > 0 ? wqLogs.reduce((s, w) => s + Number(w.water_quality_index || 0), 0) / wqLogs.length : 0;
    const totalMortality = mortalities.reduce((s, m) => s + m.qty_dead, 0);
    const latestGrowth = growth.sort((a, b) => b.sample_date > a.sample_date ? 1 : -1);
    const avgAbw = latestGrowth.length > 0 ? latestGrowth.reduce((s, g) => s + Number(g.avg_weight_g || 0), 0) / latestGrowth.length : 0;

    return {
      report_type: 'AQUA_POND_PRODUCTION',
      tenant_id: tenantId,
      generated_at: new Date().toISOString(),
      summary: {
        total_ponds: ponds.length,
        stocked_ponds: ponds.filter(p => p.pond_status === 'STOCKED').length,
        avg_water_quality_index: parseFloat(avgWqi.toFixed(1)),
        critical_wq_events: criticalWQ,
        total_mortality_count: totalMortality,
        avg_abw_g: parseFloat(avgAbw.toFixed(2)),
        total_growth_samples: growth.length,
      },
    };
  }
}
