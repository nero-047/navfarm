import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';

@Injectable()
export class FeedProductionV2ReportService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  async getFeedProductionReport(tenantId: string) {
    const mosRaw = await this.db.select().from(schema.feedManufacturingOrder).where(eq(schema.feedManufacturingOrder.tenant_id, tenantId));
    const mos = Array.isArray(mosRaw) ? mosRaw : [];
    const qcListRaw = await this.db.select().from(schema.feedQcInspection).where(eq(schema.feedQcInspection.tenant_id, tenantId));
    const qcList = Array.isArray(qcListRaw) ? qcListRaw : [];
    const costsRaw = await this.db.select().from(schema.feedCostBreakdown).where(eq(schema.feedCostBreakdown.tenant_id, tenantId));
    const costs = Array.isArray(costsRaw) ? costsRaw : [];
    const deliveriesRaw = await this.db.select().from(schema.feedDeliveryNote).where(eq(schema.feedDeliveryNote.tenant_id, tenantId));
    const deliveries = Array.isArray(deliveriesRaw) ? deliveriesRaw : [];

    const completed = mos.filter(m => m.mo_status === 'COMPLETED');
    const totalProduced = completed.reduce((s, m) => s + Number(m.actual_qty_mt || 0), 0);
    const qcPass = qcList.filter(q => q.qc_result === 'PASS').length;
    const qcPassRate = qcList.length > 0 ? (qcPass / qcList.length) * 100 : 0;
    const avgCostMt = costs.length > 0 ? costs.reduce((s, c) => s + Number(c.cost_per_mt || 0), 0) / costs.length : 0;
    const totalDeliveryMt = deliveries.reduce((s, d) => s + Number(d.qty_mt || 0), 0);
    const aflatoxinAlerts = qcList.filter(q => parseFloat(q.aflatoxin_ppb || '0') > 10).length;

    return {
      report_type: 'FEED_PRODUCTION',
      tenant_id: tenantId,
      generated_at: new Date().toISOString(),
      summary: {
        total_mos: mos.length,
        completed_mos: completed.length,
        total_feed_produced_mt: parseFloat(totalProduced.toFixed(2)),
        qc_pass_rate_pct: parseFloat(qcPassRate.toFixed(2)),
        avg_cost_per_mt: parseFloat(avgCostMt.toFixed(2)),
        total_deliveries: deliveries.length,
        total_delivered_mt: parseFloat(totalDeliveryMt.toFixed(2)),
        aflatoxin_alerts: aflatoxinAlerts,
      },
    };
  }
}
