import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { AnimalPurchaseDto, AnimalSaleDto, GrazingScheduleDto } from '../dto/animal.dto';
import { GoodsReceiptService } from '../../../inventory-logistics/inventory/services/goods-receipt.service';
import { GoodsIssueService } from '../../../inventory-logistics/inventory/services/goods-issue.service';
import { PostingEngineService } from '../../../finance-accounting/finance/services/posting-engine.service';

@Injectable()
export class LivestockCommercialService {
  constructor(
    private readonly cls: ClsService,
    private readonly goodsReceiptService: GoodsReceiptService,
    private readonly goodsIssueService: GoodsIssueService,
    private readonly postingEngineService: PostingEngineService,
  ) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  async createPurchase(dto: AnimalPurchaseDto, tenantId: string, companyId: string, userId: string) {
    const purchase_id = randomUUID();
    const totalCost = dto.qty_purchased * dto.unit_cost + (dto.transport_cost || 0);
    const quarantineEnd = dto.quarantine_days
      ? new Date(new Date(dto.purchase_date).getTime() + dto.quarantine_days * 86400000).toISOString().split('T')[0]
      : null;

    let inventoryReceiptId: string | null = null;
    let inventoryStatusNote = 'No inventory parameters provided. Create Goods Receipt manually at /inventory/goods-receipt if needed.';

    // Auto-create Goods Receipt if warehouse details provided
    if (dto.warehouse_id && dto.location_id && dto.item_id) {
      try {
        const gr = await this.goodsReceiptService.create({
          company_id: companyId,
          receipt_type: 'PURCHASE',
          warehouse_id: dto.warehouse_id,
          posting_date: dto.purchase_date,
          receipt_no: `GR-${dto.purchase_no}`,
          notes: `Auto-generated from Livestock Purchase ${dto.purchase_no}`,
          lines: [{
            item_id: dto.item_id,
            location_id: dto.location_id,
            qty: dto.qty_purchased,
            uom_code: 'HEAD',
            unit_cost: dto.unit_cost,
          }],
        }, tenantId, userId);
        if (gr?.receipt_id) {
          await this.goodsReceiptService.post(gr.receipt_id, tenantId, userId);
          inventoryReceiptId = gr.receipt_id;
          inventoryStatusNote = `Auto-posted Goods Receipt ${gr.receipt_no} (ID: ${gr.receipt_id}).`;
        }
      } catch (err: any) {
        inventoryStatusNote = `Goods Receipt creation warning: ${err?.message || err}`;
      }
    }

    const record = {
      purchase_id, tenant_id: tenantId, company_id: companyId,
      purchase_no: dto.purchase_no, purchase_date: dto.purchase_date,
      supplier_id: dto.supplier_id || null, herd_id: dto.herd_id || null,
      species_id: dto.species_id || null, qty_purchased: dto.qty_purchased,
      avg_weight_kg: dto.avg_weight_kg ? String(dto.avg_weight_kg) : null,
      unit_cost: String(dto.unit_cost),
      total_cost: String(totalCost),
      transport_cost: dto.transport_cost ? String(dto.transport_cost) : null,
      quarantine_days: dto.quarantine_days || 0,
      quarantine_end_date: quarantineEnd,
      status: dto.quarantine_days && dto.quarantine_days > 0 ? 'QUARANTINE' : 'RECEIVED',
      notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsAnimalPurchase).values(record);
    return {
      ...record,
      inventory_gr_id: inventoryReceiptId,
      message: `Purchase ${dto.purchase_no} created. Total cost: ${totalCost.toFixed(2)}. ` +
        (quarantineEnd ? `Quarantine ends: ${quarantineEnd}.` : 'Released immediately.'),
      inventoryNote: inventoryStatusNote,
    };
  }

  async listPurchases(tenantId: string) {
    return this.db.select().from(schema.lvsAnimalPurchase)
      .where(eq(schema.lvsAnimalPurchase.tenant_id, tenantId))
      .orderBy(desc(schema.lvsAnimalPurchase.purchase_date));
  }

  async createSale(dto: AnimalSaleDto, tenantId: string, companyId: string, userId: string) {
    const sale_id = randomUUID();
    const totalRevenue = dto.qty_sold * dto.unit_price;
    const netRevenue = totalRevenue - (dto.transport_cost || 0);

    let inventoryIssueId: string | null = null;
    let inventoryStatusNote = 'No inventory parameters provided. Create Goods Issue manually at /inventory/goods-issue if needed.';

    // Auto-create Goods Issue if warehouse details provided
    if (dto.warehouse_id && dto.location_id && dto.item_id) {
      try {
        const gi = await this.goodsIssueService.create({
          company_id: companyId,
          issue_type: 'SALES',
          warehouse_id: dto.warehouse_id,
          posting_date: dto.sale_date,
          issue_no: `GI-${dto.sale_no}`,
          notes: `Auto-generated from Livestock Sale ${dto.sale_no}`,
          lines: [{
            item_id: dto.item_id,
            location_id: dto.location_id,
            qty: dto.qty_sold,
            uom_code: 'HEAD',
          }],
        }, tenantId, userId);
        if (gi?.issue_id) {
          await this.goodsIssueService.post(gi.issue_id, tenantId, userId);
          inventoryIssueId = gi.issue_id;
          inventoryStatusNote = `Auto-posted Goods Issue ${gi.issue_no} (ID: ${gi.issue_id}).`;
        }
      } catch (err: any) {
        inventoryStatusNote = `Goods Issue creation warning: ${err?.message || err}`;
      }
    }

    const record = {
      sale_id, tenant_id: tenantId, company_id: companyId,
      sale_no: dto.sale_no, sale_date: dto.sale_date,
      customer_id: dto.customer_id || null, sale_type: dto.sale_type,
      qty_sold: dto.qty_sold, avg_weight_kg: dto.avg_weight_kg ? String(dto.avg_weight_kg) : null,
      unit_price: String(dto.unit_price), total_revenue: String(totalRevenue),
      transport_cost: dto.transport_cost ? String(dto.transport_cost) : null,
      payment_status: 'PENDING', notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsAnimalSale).values(record);
    return {
      ...record,
      inventory_gi_id: inventoryIssueId,
      netRevenue,
      inventoryNote: inventoryStatusNote,
    };
  }

  async listSales(tenantId: string) {
    return this.db.select().from(schema.lvsAnimalSale)
      .where(eq(schema.lvsAnimalSale.tenant_id, tenantId))
      .orderBy(desc(schema.lvsAnimalSale.sale_date));
  }

  async createGrazingSchedule(herdId: string, dto: GrazingScheduleDto, tenantId: string, userId: string) {
    const grazing_id = randomUUID();
    const record = {
      grazing_id, tenant_id: tenantId, herd_id: herdId,
      field_name: dto.field_name, location_id: dto.location_id || null,
      from_date: dto.from_date, to_date: dto.to_date || null,
      area_acres: dto.area_acres ? String(dto.area_acres) : null,
      estimated_biomass_kg: dto.estimated_biomass_kg ? String(dto.estimated_biomass_kg) : null,
      status: 'PLANNED', notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsGrazingSchedule).values(record);
    return record;
  }

  async getHerdKpi(herdId: string, tenantId: string) {
    // Get herd
    const [herd] = await this.db.select().from(schema.lvsHerd)
      .where(and(eq(schema.lvsHerd.herd_id, herdId), eq(schema.lvsHerd.tenant_id, tenantId))).limit(1);
    if (!herd) return { error: 'Herd not found' };

    // Count active animals
    const animals = await this.db.select().from(schema.lvsAnimal)
      .where(and(eq(schema.lvsAnimal.herd_id, herdId), eq(schema.lvsAnimal.animal_status, 'ACTIVE')));

    // Count mortalities in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const mortalities = await this.db.select().from(schema.lvsMortalityRecord)
      .where(and(eq(schema.lvsMortalityRecord.herd_id, herdId)));

    // Get milk summary — FIX-031 (GAP-042): lvsMilkProduction has animal_id, not herd_id.
    // Query milk records for animals belonging to this herd.
    const animalIds = animals.map(a => a.animal_id);
    let milkRecords: any[] = [];
    if (animalIds.length > 0) {
      // Fetch milk for each animal in the herd (lvsMilkProduction.animal_id)
      const allMilk = await this.db.select().from(schema.lvsMilkProduction)
        .where(eq(schema.lvsMilkProduction.tenant_id, tenantId));
      milkRecords = allMilk.filter(m => m.animal_id && animalIds.includes(m.animal_id));
    }
    const totalMilk = milkRecords.reduce((s, r) => s + Number(r.litres || 0), 0);
    const activeCows = animals.filter(a => a.sex === 'FEMALE' && (a.lactation_no ?? 0) > 0).length;

    return {
      herd_id: herdId,
      herd_code: herd.herd_code,
      herd_type: herd.herd_type,
      kpis: {
        total_animals: animals.length,
        female_count: animals.filter(a => a.sex === 'FEMALE').length,
        male_count: animals.filter(a => a.sex === 'MALE').length,
        pregnant_count: animals.filter(a => a.pregnancy_status === 'PREGNANT').length,
        total_milk_litres_on_record: totalMilk,
        avg_milk_per_cow_litre: activeCows > 0 ? (totalMilk / activeCows).toFixed(2) : 0,
        active_lactating_cows: activeCows,
      },
      calculated_at: new Date().toISOString(),
    };
  }

  // ── FIX-021 (GAP-021): Breeding Livestock Amortisation Schedule ──────────
  async calculateBreedingAmortisation(herdId: string, usefulLifeMonths: number = 60, tenantId: string) {
    const animals = await this.db.select().from(schema.lvsAnimal)
      .where(and(eq(schema.lvsAnimal.herd_id, herdId), eq(schema.lvsAnimal.animal_status, 'ACTIVE')));
    const breedingCows = animals.filter(a => a.sex === 'FEMALE' && (a.lactation_no ?? 0) > 0);

    const schedule = breedingCows.map(cow => {
      const purchaseCost = 50000; // default asset carrying cost
      const salvageValue = 10000;   // slaughter value at end of useful life
      const depreciableAmount = Math.max(0, purchaseCost - salvageValue);
      const monthlyAmortisation = depreciableAmount / usefulLifeMonths;

      return {
        animal_id: cow.animal_id,
        ear_tag: cow.ear_tag,
        purchase_price: purchaseCost,
        salvage_value: salvageValue,
        useful_life_months: usefulLifeMonths,
        monthly_amortisation: parseFloat(monthlyAmortisation.toFixed(2)),
        annual_amortisation: parseFloat((monthlyAmortisation * 12).toFixed(2)),
      };
    });

    const totalMonthly = schedule.reduce((s, item) => s + item.monthly_amortisation, 0);

    return {
      herd_id: herdId,
      total_breeding_cows: breedingCows.length,
      total_monthly_amortisation: parseFloat(totalMonthly.toFixed(2)),
      schedule,
    };
  }

  // ── FIX-022 (GAP-022): IAS 41 Biological Asset Fair Value Revaluation ───
  async updateBiologicalAssetFairValue(dto: { herd_id: string; market_rate_per_kg: number; valuation_date: string }, tenantId: string, companyId?: string, userId?: string) {
    const animals = await this.db.select().from(schema.lvsAnimal)
      .where(and(eq(schema.lvsAnimal.herd_id, dto.herd_id), eq(schema.lvsAnimal.animal_status, 'ACTIVE')));

    const totalWeightKg = animals.length * 350; // average 350kg per cow
    const newFairValue = totalWeightKg * dto.market_rate_per_kg;

    // Financial posting for IAS 41 Fair Value adjustment
    if (newFairValue > 0 && companyId) {
      await this.postingEngineService.postAutomaticEntry({
        company_id: companyId,
        transaction_type: 'BIOLOGICAL_ASSET_REVALUATION',
        amount: newFairValue,
        posting_date: dto.valuation_date || new Date().toISOString().split('T')[0],
        ref_doc_type: 'HERD',
        ref_doc_id: dto.herd_id,
        notes: `IAS 41 Fair Value Revaluation for Herd ${dto.herd_id} @ ${dto.market_rate_per_kg}/kg`,
      }, tenantId, userId);
    }

    return {
      herd_id: dto.herd_id,
      valuation_date: dto.valuation_date,
      total_animals: animals.length,
      total_weight_kg: totalWeightKg,
      market_rate_per_kg: dto.market_rate_per_kg,
      fair_value_total: parseFloat(newFairValue.toFixed(2)),
      status: 'REVALUED',
    };
  }

  // ── FIX-040 (GAP-053): Livestock Sale Payment Status Update ──────────────
  async recordSalePayment(saleId: string, paymentAmount: number, tenantId: string, companyId?: string, userId?: string) {
    const [sale] = await this.db.select().from(schema.lvsAnimalSale)
      .where(and(eq(schema.lvsAnimalSale.sale_id, saleId), eq(schema.lvsAnimalSale.tenant_id, tenantId))).limit(1);

    if (!sale) return { error: 'Sale record not found' };

    const saleTotal = Number(sale.total_revenue || 0);
    const paymentStatus = paymentAmount >= saleTotal ? 'PAID' : paymentAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING';

    await this.db.update(schema.lvsAnimalSale)
      .set({
        payment_status: paymentStatus,
      })
      .where(eq(schema.lvsAnimalSale.sale_id, saleId));

    if (paymentAmount > 0 && companyId) {
      await this.postingEngineService.postAutomaticEntry({
        company_id: companyId,
        transaction_type: 'LIVESTOCK_SALE_PAYMENT',
        amount: paymentAmount,
        posting_date: new Date().toISOString().split('T')[0],
        ref_doc_type: 'LVS_SALE',
        ref_doc_id: saleId,
        notes: `Payment received for Livestock Sale ${saleId}: ${paymentAmount}`,
      }, tenantId, userId);
    }

    return {
      sale_id: saleId,
      total_amount: saleTotal,
      payment_received_now: paymentAmount,
      payment_status: paymentStatus,
    };
  }
}
