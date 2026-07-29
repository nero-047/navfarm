import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import {
  CreateFieldDto, SoilAnalysisDto, CreateCropPlanDto, UpdateCalendarActivityDto,
  IrrigationLogDto, FertilizerAppDto, PesticideAppDto,
  CreateHarvestPlanDto, RecordHarvestDto, ResourceAssignmentDto
} from '../dto/agri.dto';
import { GoodsReceiptService } from '../../inventory/services/goods-receipt.service';
import { GoodsIssueService } from '../../inventory/services/goods-issue.service';

@Injectable()
export class AgriV2Service {
  constructor(
    private readonly cls: ClsService,
    private readonly goodsReceiptService: GoodsReceiptService,
    private readonly goodsIssueService: GoodsIssueService,
  ) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  // ── FIELD ──────────────────────────────────────────────────────────────────
  async createField(dto: CreateFieldDto, tenantId: string, companyId: string, userId: string) {
    const [exists] = await this.db.select().from(schema.agriField)
      .where(and(eq(schema.agriField.tenant_id, tenantId), eq(schema.agriField.field_code, dto.field_code))).limit(1);
    if (exists) throw new ConflictException(`Field code '${dto.field_code}' already exists.`);

    const field_id = randomUUID();
    const record = {
      field_id, tenant_id: tenantId, company_id: companyId,
      field_code: dto.field_code, field_name: dto.field_name,
      area_acres: String(dto.area_acres),
      area_hectares: String((dto.area_acres * 0.404686).toFixed(4)),
      soil_type: dto.soil_type || null, soil_ph: dto.soil_ph ? String(dto.soil_ph) : null,
      gps_lat: dto.gps_lat ? String(dto.gps_lat) : null,
      gps_long: dto.gps_long ? String(dto.gps_long) : null,
      farm_id: dto.farm_id || null,
      irrigation_type: dto.irrigation_type || null, water_source: dto.water_source || null,
      field_status: 'AVAILABLE', notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriField).values(record);
    return record;
  }

  async listFields(tenantId: string) {
    return this.db.select().from(schema.agriField)
      .where(and(eq(schema.agriField.tenant_id, tenantId), isNull(schema.agriField.deleted_at)));
  }

  async getField(fieldId: string, tenantId: string) {
    const [field] = await this.db.select().from(schema.agriField)
      .where(and(eq(schema.agriField.field_id, fieldId), eq(schema.agriField.tenant_id, tenantId))).limit(1);
    if (!field) throw new NotFoundException(`Field '${fieldId}' not found.`);
    return field;
  }

  // ── SOIL ANALYSIS ──────────────────────────────────────────────────────────
  async addSoilAnalysis(fieldId: string, dto: SoilAnalysisDto, tenantId: string, userId: string) {
    await this.getField(fieldId, tenantId);
    const analysis_id = randomUUID();
    const record = {
      analysis_id, tenant_id: tenantId, field_id: fieldId,
      test_date: dto.test_date, lab_name: dto.lab_name || null,
      report_no: dto.report_no || null,
      ph: dto.ph ? String(dto.ph) : null,
      nitrogen_kg_ha: dto.nitrogen_kg_ha ? String(dto.nitrogen_kg_ha) : null,
      phosphorus_kg_ha: dto.phosphorus_kg_ha ? String(dto.phosphorus_kg_ha) : null,
      potassium_kg_ha: dto.potassium_kg_ha ? String(dto.potassium_kg_ha) : null,
      organic_matter_pct: dto.organic_matter_pct ? String(dto.organic_matter_pct) : null,
      ec_ds_m: dto.ec_ds_m ? String(dto.ec_ds_m) : null,
      recommendations: dto.recommendations || null,
      next_test_due: dto.next_test_due || null,
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriSoilAnalysis).values(record);
    // Auto alerts
    const alerts: string[] = [];
    if (dto.ph && (dto.ph < 5.5 || dto.ph > 8.0)) alerts.push(`⚠️ Soil pH (${dto.ph}) outside optimal range (5.5–8.0)`);
    if (dto.ec_ds_m && dto.ec_ds_m > 4.0) alerts.push(`⚠️ High salinity EC = ${dto.ec_ds_m} dS/m`);
    return { ...record, alerts };
  }

  async getSoilHistory(fieldId: string, tenantId: string) {
    return this.db.select().from(schema.agriSoilAnalysis)
      .where(and(eq(schema.agriSoilAnalysis.field_id, fieldId), eq(schema.agriSoilAnalysis.tenant_id, tenantId)))
      .orderBy(desc(schema.agriSoilAnalysis.test_date));
  }

  // ── CROP PLAN ──────────────────────────────────────────────────────────────
  async createCropPlan(dto: CreateCropPlanDto, tenantId: string, companyId: string, userId: string) {
    await this.getField(dto.field_id, tenantId);
    const plan_id = randomUUID();
    const record = {
      plan_id, tenant_id: tenantId, company_id: companyId,
      field_id: dto.field_id, season: dto.season,
      crop_item_id: dto.crop_item_id || null, crop_variety: dto.crop_variety || null,
      sowing_method: dto.sowing_method || null,
      planned_sowing_date: dto.planned_sowing_date || null,
      planned_harvest_date: dto.planned_harvest_date || null,
      actual_sowing_date: null, actual_harvest_date: null,
      target_yield_kg_acre: dto.target_yield_kg_acre ? String(dto.target_yield_kg_acre) : null,
      seed_qty_kg: dto.seed_qty_kg ? String(dto.seed_qty_kg) : null,
      seed_rate_kg_acre: dto.seed_rate_kg_acre ? String(dto.seed_rate_kg_acre) : null,
      plan_status: 'PLANNED', notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriCropPlan).values(record);
    // Auto-generate crop calendar activities
    await this.generateCalendar(plan_id, tenantId, dto.planned_sowing_date, dto.planned_harvest_date);
    return { ...record, message: 'Crop plan created. Calendar activities auto-generated.' };
  }

  private async generateCalendar(planId: string, tenantId: string, sowingDate?: string, harvestDate?: string) {
    const activities = [
      { type: 'LAND_PREP', name: 'Land Preparation', dayOffset: -7 },
      { type: 'SOWING', name: 'Sowing / Transplanting', dayOffset: 0 },
      { type: 'FERTILIZING', name: 'Basal Fertilizer Application', dayOffset: 7 },
      { type: 'IRRIGATION', name: 'First Irrigation', dayOffset: 3 },
      { type: 'WEEDING', name: 'First Weeding', dayOffset: 21 },
      { type: 'PESTICIDE', name: 'Preventive Spray', dayOffset: 30 },
      { type: 'FERTILIZING', name: 'Top Dressing Fertilizer', dayOffset: 45 },
      { type: 'HARVESTING', name: 'Harvest', dayOffset: null },
    ];
    const baseDate = sowingDate ? new Date(sowingDate) : null;
    const harvestDt = harvestDate ? new Date(harvestDate) : null;
    const rows = activities.map(a => {
      let scheduled: string | null = null;
      if (a.type === 'HARVESTING' && harvestDt) {
        scheduled = harvestDt.toISOString().split('T')[0];
      } else if (baseDate && a.dayOffset !== null) {
        const d = new Date(baseDate.getTime() + a.dayOffset * 86400000);
        scheduled = d.toISOString().split('T')[0];
      }
      return {
        activity_id: randomUUID(), tenant_id: tenantId, plan_id: planId,
        activity_type: a.type, activity_name: a.name,
        scheduled_date: scheduled, actual_date: null, status: 'PENDING',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
    });
    if (rows.length) await this.db.insert(schema.agriCropCalendar).values(rows);
  }

  async getCropPlan(planId: string, tenantId: string) {
    const [plan] = await this.db.select().from(schema.agriCropPlan)
      .where(and(eq(schema.agriCropPlan.plan_id, planId), eq(schema.agriCropPlan.tenant_id, tenantId))).limit(1);
    if (!plan) throw new NotFoundException(`Crop plan '${planId}' not found.`);
    const calendar = await this.db.select().from(schema.agriCropCalendar)
      .where(eq(schema.agriCropCalendar.plan_id, planId));
    return { ...plan, calendar };
  }

  async listCropPlans(tenantId: string, fieldId?: string) {
    const conditions: any[] = [eq(schema.agriCropPlan.tenant_id, tenantId)];
    if (fieldId) conditions.push(eq(schema.agriCropPlan.field_id, fieldId));
    return this.db.select().from(schema.agriCropPlan).where(and(...conditions)).orderBy(desc(schema.agriCropPlan.created_at));
  }

  async updateCalendarActivity(activityId: string, dto: UpdateCalendarActivityDto, tenantId: string) {
    const [act] = await this.db.select().from(schema.agriCropCalendar)
      .where(eq(schema.agriCropCalendar.activity_id, activityId)).limit(1);
    if (!act) throw new NotFoundException(`Calendar activity not found.`);
    await this.db.update(schema.agriCropCalendar).set({
      actual_date: dto.actual_date, status: dto.status,
      cost_actual: dto.cost_actual ? String(dto.cost_actual) : act.cost_actual,
      remarks: dto.remarks || null, updated_at: new Date().toISOString(),
    }).where(eq(schema.agriCropCalendar.activity_id, activityId));
    return { activityId, status: dto.status, actual_date: dto.actual_date };
  }

  // ── IRRIGATION ─────────────────────────────────────────────────────────────
  async logIrrigation(planId: string, dto: IrrigationLogDto, tenantId: string, userId: string) {
    const log_id = randomUUID();
    const [plan] = await this.db.select().from(schema.agriCropPlan)
      .where(and(eq(schema.agriCropPlan.plan_id, planId), eq(schema.agriCropPlan.tenant_id, tenantId))).limit(1);
    if (!plan) throw new NotFoundException(`Crop plan not found.`);
    const record = {
      log_id, tenant_id: tenantId, field_id: plan.field_id, plan_id: planId,
      irrigation_date: dto.irrigation_date, method: dto.method || null,
      duration_hrs: dto.duration_hrs ? String(dto.duration_hrs) : null,
      volume_litre: dto.volume_litre ? String(dto.volume_litre) : null,
      water_source: null, cost: dto.cost ? String(dto.cost) : null,
      remarks: dto.remarks || null, recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriIrrigationLog).values(record);
    return record;
  }

  // ── FERTILIZER ─────────────────────────────────────────────────────────────
  async logFertilizer(planId: string, dto: FertilizerAppDto, tenantId: string, userId: string) {
    const [plan] = await this.db.select().from(schema.agriCropPlan)
      .where(and(eq(schema.agriCropPlan.plan_id, planId), eq(schema.agriCropPlan.tenant_id, tenantId))).limit(1);
    if (!plan) throw new NotFoundException(`Crop plan not found.`);
    const [field] = await this.db.select().from(schema.agriField).where(eq(schema.agriField.field_id, plan.field_id || '')).limit(1);
    const fieldArea = field ? parseFloat(field.area_acres) : 1;

    let giId: string | null = null;
    let inventoryNote = dto.fertilizer_item_id ? 'Create GI at /inventory/goods-issue to deduct from warehouse stock.' : null;

    if (dto.fertilizer_item_id && dto.warehouse_id && dto.location_id) {
      try {
        const gi = await this.goodsIssueService.create({
          company_id: plan.company_id,
          issue_type: 'CONSUMPTION',
          warehouse_id: dto.warehouse_id,
          posting_date: dto.app_date,
          issue_no: `GI-FERT-${randomUUID().slice(0, 8)}`,
          notes: `Fertilizer application for crop plan ${planId}`,
          lines: [{
            item_id: dto.fertilizer_item_id,
            location_id: dto.location_id,
            qty: dto.qty_kg,
            uom_code: 'KG',
          }],
        }, tenantId, userId);
        if (gi?.issue_id) {
          await this.goodsIssueService.post(gi.issue_id, tenantId, userId);
          giId = gi.issue_id;
          inventoryNote = `Auto-posted Goods Issue ${gi.issue_no} for fertilizer application.`;
        }
      } catch (err: any) {
        inventoryNote = `Goods Issue creation warning: ${err?.message || err}`;
      }
    }

    const app_id = randomUUID();
    const record = {
      app_id, tenant_id: tenantId, field_id: plan.field_id, plan_id: planId,
      app_date: dto.app_date, fertilizer_item_id: dto.fertilizer_item_id || null,
      fertilizer_name: dto.fertilizer_name, qty_kg: String(dto.qty_kg),
      qty_per_acre: String((dto.qty_kg / fieldArea).toFixed(2)),
      growth_stage: dto.growth_stage || null, method: dto.method || null,
      cost: dto.cost ? String(dto.cost) : null, inventory_gi_id: giId,
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriFertilizerApp).values(record);
    return { ...record, inventoryNote };
  }

  // ── PESTICIDE ──────────────────────────────────────────────────────────────
  async logPesticide(planId: string, dto: PesticideAppDto, tenantId: string) {
    const [plan] = await this.db.select().from(schema.agriCropPlan)
      .where(and(eq(schema.agriCropPlan.plan_id, planId), eq(schema.agriCropPlan.tenant_id, tenantId))).limit(1);
    if (!plan) throw new NotFoundException(`Crop plan not found.`);
    const safeHarvestDate = new Date(new Date(dto.app_date).getTime() + dto.phi_days * 86400000).toISOString().split('T')[0];
    const app_id = randomUUID();
    const record = {
      app_id, tenant_id: tenantId, field_id: plan.field_id, plan_id: planId,
      app_date: dto.app_date, pest_type: dto.pest_type, pest_name: dto.pest_name || null,
      pesticide_item_id: dto.pesticide_item_id || null, pesticide_name: dto.pesticide_name,
      qty_litre: String(dto.qty_litre), dilution_ratio: dto.dilution_ratio || null,
      phi_days: dto.phi_days, safe_harvest_date: safeHarvestDate,
      applicator: null, weather_conditions: null,
      cost: dto.cost ? String(dto.cost) : null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriPesticideApp).values(record);
    return {
      ...record,
      warning: dto.phi_days > 0 ? `⚠️ PHI = ${dto.phi_days} days. Do NOT harvest before ${safeHarvestDate}.` : null,
    };
  }

  // ── HARVEST ────────────────────────────────────────────────────────────────
  async createHarvestPlan(planId: string, dto: CreateHarvestPlanDto, tenantId: string, companyId: string, userId: string) {
    const harvest_plan_id = randomUUID();
    const record = {
      harvest_plan_id, tenant_id: tenantId, company_id: companyId, plan_id: planId,
      target_harvest_date: dto.target_harvest_date,
      expected_yield_kg: dto.expected_yield_kg ? String(dto.expected_yield_kg) : null,
      harvest_method: dto.harvest_method || null, resources_required: null,
      status: 'PLANNED', notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriHarvestPlan).values(record);
    return record;
  }

  async recordHarvest(harvestPlanId: string, dto: RecordHarvestDto, tenantId: string, userId: string) {
    const [harvestPlan] = await this.db.select().from(schema.agriHarvestPlan)
      .where(and(eq(schema.agriHarvestPlan.harvest_plan_id, harvestPlanId), eq(schema.agriHarvestPlan.tenant_id, tenantId))).limit(1);
    if (!harvestPlan) throw new NotFoundException('Harvest plan not found.');

    const [cropPlan] = await this.db.select().from(schema.agriCropPlan)
      .where(eq(schema.agriCropPlan.plan_id, harvestPlan.plan_id || '')).limit(1);
    const [field] = cropPlan?.field_id
      ? await this.db.select().from(schema.agriField).where(eq(schema.agriField.field_id, cropPlan.field_id)).limit(1)
      : [null];

    // FIX-027 (GAP-036): PHI Safety Check — block harvest if within pesticide safe_harvest_date
    if (cropPlan?.plan_id) {
      const pesticideApps = await this.db.select().from(schema.agriPesticideApp)
        .where(eq(schema.agriPesticideApp.plan_id, cropPlan.plan_id));
      const today = new Date().toISOString().split('T')[0];
      const unsafeApp = pesticideApps.find(p => p.safe_harvest_date && p.safe_harvest_date > today);
      if (unsafeApp) {
        const safeDate = unsafeApp.safe_harvest_date!;
        const daysRemaining = Math.ceil((new Date(safeDate).getTime() - Date.now()) / 86400000);
        throw new BadRequestException(
          `🚫 Harvest BLOCKED by PHI safety check. Pesticide '${unsafeApp.pesticide_name || unsafeApp.pesticide_item_id}' applied on ${unsafeApp.app_date} has safe harvest date ${safeDate}. Today (${today}) is before the safe date. Wait ${daysRemaining} more days.`
        );
      }
    }

    const fieldArea = field ? parseFloat(field.area_acres) : 1;
    const yieldPerAcre = dto.actual_yield_kg / fieldArea;
    const expectedYield = parseFloat(harvestPlan.expected_yield_kg || '0');
    const varianceKg = dto.actual_yield_kg - expectedYield;
    const variancePct = expectedYield > 0 ? (varianceKg / expectedYield) * 100 : 0;
    const costPerKg = dto.total_production_cost ? dto.total_production_cost / dto.actual_yield_kg : null;
    const costPerAcre = dto.total_production_cost ? dto.total_production_cost / fieldArea : null;
    const totalRevenue = dto.sale_price_per_kg ? dto.actual_yield_kg * dto.sale_price_per_kg : null;
    const grossMargin = (totalRevenue && dto.total_production_cost) ? totalRevenue - dto.total_production_cost : null;

    let grId = dto.inventory_gr_id || null;
    let inventoryNote = 'Create GR manually at /inventory/goods-receipt if needed.';

    if (cropPlan?.crop_item_id && dto.warehouse_id && dto.location_id) {
      try {
        const gr = await this.goodsReceiptService.create({
          company_id: cropPlan.company_id,
          receipt_type: 'PRODUCTION',
          warehouse_id: dto.warehouse_id,
          posting_date: new Date().toISOString().split('T')[0],
          receipt_no: `GR-HARVEST-${randomUUID().slice(0, 8)}`,
          notes: `Harvest receipt for crop plan ${cropPlan.plan_id}`,
          lines: [{
            item_id: cropPlan.crop_item_id,
            location_id: dto.location_id,
            qty: dto.actual_yield_kg,
            uom_code: 'KG',
            unit_cost: costPerKg || 0,
          }],
        }, tenantId, userId);
        if (gr?.receipt_id) {
          await this.goodsReceiptService.post(gr.receipt_id, tenantId, userId);
          grId = gr.receipt_id;
          inventoryNote = `Auto-posted Goods Receipt ${gr.receipt_no} for crop harvest.`;
        }
      } catch (err: any) {
        inventoryNote = `Goods Receipt creation warning: ${err?.message || err}`;
      }
    }

    const analysis_id = randomUUID();
    const yieldRecord = {
      analysis_id, tenant_id: tenantId, plan_id: harvestPlan.plan_id,
      harvest_plan_id: harvestPlanId, field_id: cropPlan?.field_id || null,
      actual_yield_kg: String(dto.actual_yield_kg),
      actual_yield_kg_acre: String(yieldPerAcre.toFixed(2)),
      planned_yield_kg: harvestPlan.expected_yield_kg,
      yield_variance_kg: String(varianceKg.toFixed(2)),
      yield_variance_pct: String(variancePct.toFixed(2)),
      total_production_cost: dto.total_production_cost ? String(dto.total_production_cost) : null,
      cost_per_kg: costPerKg ? String(costPerKg.toFixed(4)) : null,
      cost_per_acre: costPerAcre ? String(costPerAcre.toFixed(2)) : null,
      sale_price_per_kg: dto.sale_price_per_kg ? String(dto.sale_price_per_kg) : null,
      total_revenue: totalRevenue ? String(totalRevenue) : null,
      gross_margin: grossMargin ? String(grossMargin) : null,
      gross_margin_pct: (grossMargin && totalRevenue) ? String(((grossMargin / totalRevenue) * 100).toFixed(2)) : null,
      inventory_gr_id: grId,
      calculated_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriYieldAnalysis).values(yieldRecord);

    // Update crop plan status
    if (cropPlan) {
      await this.db.update(schema.agriCropPlan)
        .set({ plan_status: 'HARVESTED', actual_harvest_date: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString() })
        .where(eq(schema.agriCropPlan.plan_id, cropPlan.plan_id));
    }
    // Update harvest plan status
    await this.db.update(schema.agriHarvestPlan)
      .set({ status: 'COMPLETED', updated_at: new Date().toISOString() })
      .where(eq(schema.agriHarvestPlan.harvest_plan_id, harvestPlanId));

    return { ...yieldRecord, message: 'Harvest recorded. Yield analysis complete.', inventoryNote };
  }

  // ── RESOURCE ASSIGNMENT ────────────────────────────────────────────────────
  async assignResource(planId: string, dto: ResourceAssignmentDto, tenantId: string) {
    const assignment_id = randomUUID();
    const totalCost = (dto.hours_planned || 0) * (dto.rate_per_hour || 0);
    const record = {
      assignment_id, tenant_id: tenantId, plan_id: planId,
      activity_id: dto.activity_id || null, field_id: null,
      resource_id: dto.resource_id || null,
      assigned_date: dto.assigned_date,
      hours_planned: dto.hours_planned ? String(dto.hours_planned) : null,
      hours_actual: null,
      rate_per_hour: dto.rate_per_hour ? String(dto.rate_per_hour) : null,
      total_cost: String(totalCost),
      notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriResourceAssignment).values(record);
    return record;
  }

  // ── AGRI KPI ───────────────────────────────────────────────────────────────
  async getAgriKpi(tenantId: string, fieldId?: string) {
    const conditions: any[] = [eq(schema.agriCropPlan.tenant_id, tenantId)];
    if (fieldId) conditions.push(eq(schema.agriCropPlan.field_id, fieldId));
    const plans = await this.db.select().from(schema.agriCropPlan).where(and(...conditions));
    const harvestedPlans = plans.filter(p => p.plan_status === 'HARVESTED');

    const analyses = fieldId
      ? await this.db.select().from(schema.agriYieldAnalysis)
          .where(and(eq(schema.agriYieldAnalysis.tenant_id, tenantId), eq(schema.agriYieldAnalysis.field_id, fieldId)))
      : await this.db.select().from(schema.agriYieldAnalysis)
          .where(eq(schema.agriYieldAnalysis.tenant_id, tenantId));

    const totalYieldKg = analyses.reduce((s, a) => s + Number(a.actual_yield_kg || 0), 0);
    const avgYieldPerAcre = analyses.length > 0
      ? analyses.reduce((s, a) => s + Number(a.actual_yield_kg_acre || 0), 0) / analyses.length : 0;
    const avgGrossMarginPct = analyses.length > 0
      ? analyses.reduce((s, a) => s + Number(a.gross_margin_pct || 0), 0) / analyses.length : 0;

    return {
      kpis: {
        total_crop_plans: plans.length,
        active_plans: plans.filter(p => ['SOWING', 'GROWING'].includes(p.plan_status)).length,
        harvested_plans: harvestedPlans.length,
        total_yield_kg: totalYieldKg,
        avg_yield_per_acre_kg: parseFloat(avgYieldPerAcre.toFixed(2)),
        avg_gross_margin_pct: parseFloat(avgGrossMarginPct.toFixed(2)),
      },
      calculated_at: new Date().toISOString(),
    };
  }
}
