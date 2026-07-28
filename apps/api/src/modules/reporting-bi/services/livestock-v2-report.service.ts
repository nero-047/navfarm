import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class LivestockV2ReportService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  async getLivestockSummaryReport(tenantId: string, companyId?: string) {
    const conditions: any[] = [eq(schema.lvsHerd.tenant_id, tenantId)];
    if (companyId) conditions.push(eq(schema.lvsHerd.company_id, companyId));
    const herds = await this.db.select().from(schema.lvsHerd).where(and(...conditions));
    const animals = await this.db.select().from(schema.lvsAnimal).where(eq(schema.lvsAnimal.tenant_id, tenantId));
    const milkRecords = await this.db.select().from(schema.lvsMilkProduction).where(eq(schema.lvsMilkProduction.tenant_id, tenantId));
    const mortalities = await this.db.select().from(schema.lvsMortalityRecord).where(eq(schema.lvsMortalityRecord.tenant_id, tenantId));
    const purchases = await this.db.select().from(schema.lvsAnimalPurchase).where(eq(schema.lvsAnimalPurchase.tenant_id, tenantId));
    const sales = await this.db.select().from(schema.lvsAnimalSale).where(eq(schema.lvsAnimalSale.tenant_id, tenantId));

    const totalMilkLitres = milkRecords.reduce((s, r) => s + Number(r.litres || 0), 0);
    const totalPurchaseCost = purchases.reduce((s, p) => s + Number(p.total_cost || 0), 0);
    const totalSaleRevenue = sales.reduce((s, s2) => s + Number(s2.total_revenue || 0), 0);
    const mortalityCount = mortalities.length;
    const mortalityRate = animals.length > 0 ? (mortalityCount / animals.length) * 100 : 0;

    return {
      report_type: 'LIVESTOCK_SUMMARY',
      tenant_id: tenantId,
      generated_at: new Date().toISOString(),
      summary: {
        total_herds: herds.length,
        total_animals: animals.filter(a => a.animal_status === 'ACTIVE').length,
        pregnant_animals: animals.filter(a => a.pregnancy_status === 'PREGNANT').length,
        total_milk_litres: parseFloat(totalMilkLitres.toFixed(2)),
        mortality_count: mortalityCount,
        mortality_rate_pct: parseFloat(mortalityRate.toFixed(2)),
        total_purchase_cost: parseFloat(totalPurchaseCost.toFixed(2)),
        total_sale_revenue: parseFloat(totalSaleRevenue.toFixed(2)),
        gross_margin: parseFloat((totalSaleRevenue - totalPurchaseCost).toFixed(2)),
      },
      by_herd: herds.map(h => ({
        herd_id: h.herd_id, herd_code: h.herd_code, herd_type: h.herd_type,
        current_size: h.current_size, target_size: h.target_size,
        fill_rate_pct: h.target_size && h.current_size ? parseFloat(((h.current_size / h.target_size) * 100).toFixed(1)) : null,
      })),
    };
  }

  async getMilkProductionReport(tenantId: string, fromDate?: string, toDate?: string) {
    const records = await this.db.select().from(schema.lvsMilkProduction)
      .where(eq(schema.lvsMilkProduction.tenant_id, tenantId))
      .orderBy(desc(schema.lvsMilkProduction.record_date));

    const filtered = records.filter(r => {
      if (fromDate && r.record_date < fromDate) return false;
      if (toDate && r.record_date > toDate) return false;
      return true;
    });

    const totalLitres = filtered.reduce((s, r) => s + Number(r.litres || 0), 0);
    const totalValue = filtered.reduce((s, r) => s + Number(r.total_value || 0), 0);
    const avgFat = filtered.length > 0 ? filtered.reduce((s, r) => s + Number(r.fat_pct || 0), 0) / filtered.length : 0;
    const highSccCount = filtered.filter(r => (r.somatic_cell_count || 0) > 400000).length;

    return {
      report_type: 'MILK_PRODUCTION',
      period: { from: fromDate, to: toDate },
      summary: {
        total_records: filtered.length,
        total_litres: parseFloat(totalLitres.toFixed(2)),
        total_value: parseFloat(totalValue.toFixed(2)),
        avg_fat_pct: parseFloat(avgFat.toFixed(2)),
        high_scc_events: highSccCount,
      },
    };
  }
}
