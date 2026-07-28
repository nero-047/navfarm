import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import {
  CreatePondDto, CreateTankDto, StockPondDto, WaterQualityDto, GrowthSampleDto,
  MortalityEventDto, DiseaseEventDto, PondTreatmentDto
} from '../dto/aqua.dto';

@Injectable()
export class AquaV2Service {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  // ── POND ──────────────────────────────────────────────────────────────────
  async createPond(dto: CreatePondDto, tenantId: string, companyId: string, userId: string) {
    const [exists] = await this.db.select().from(schema.aquaPond)
      .where(and(eq(schema.aquaPond.tenant_id, tenantId), eq(schema.aquaPond.pond_code, dto.pond_code))).limit(1);
    if (exists) throw new ConflictException(`Pond code '${dto.pond_code}' already exists.`);

    const pond_id = randomUUID();
    const volume = dto.area_sqm && dto.depth_m ? dto.area_sqm * dto.depth_m : null;
    const record = {
      pond_id, tenant_id: tenantId, company_id: companyId,
      pond_code: dto.pond_code, pond_name: dto.pond_name,
      pond_type: dto.pond_type || 'EARTHEN',
      area_sqm: dto.area_sqm ? String(dto.area_sqm) : null,
      depth_m: dto.depth_m ? String(dto.depth_m) : null,
      water_volume_m3: volume ? String(volume) : null,
      farm_id: dto.farm_id || null, water_source: dto.water_source || null,
      aerator_count: dto.aerator_count || null, aerator_hp: null,
      pond_status: 'EMPTY', current_batch_id: null, location_id: null,
      notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaPond).values(record);
    return record;
  }

  async listPonds(tenantId: string) {
    return this.db.select().from(schema.aquaPond)
      .where(and(eq(schema.aquaPond.tenant_id, tenantId), isNull(schema.aquaPond.deleted_at)));
  }

  async getPond(pondId: string, tenantId: string) {
    const [pond] = await this.db.select().from(schema.aquaPond)
      .where(and(eq(schema.aquaPond.pond_id, pondId), eq(schema.aquaPond.tenant_id, tenantId))).limit(1);
    if (!pond) throw new NotFoundException(`Pond '${pondId}' not found.`);
    return pond;
  }

  // ── TANK ──────────────────────────────────────────────────────────────────
  async createTank(dto: CreateTankDto, tenantId: string, companyId: string, userId: string) {
    const tank_id = randomUUID();
    const record = {
      tank_id, tenant_id: tenantId, company_id: companyId,
      tank_code: dto.tank_code, tank_name: dto.tank_name,
      system_type: dto.system_type || null, capacity_litre: dto.capacity_litre ? String(dto.capacity_litre) : null,
      shape: null, material: null, filter_type: null,
      farm_id: dto.farm_id || null, tank_status: 'EMPTY',
      notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaTank).values(record);
    return record;
  }

  async listTanks(tenantId: string) {
    return this.db.select().from(schema.aquaTank).where(eq(schema.aquaTank.tenant_id, tenantId));
  }

  // ── STOCKING ──────────────────────────────────────────────────────────────
  async stockPond(pondId: string, dto: StockPondDto, tenantId: string, userId: string) {
    const pond = await this.getPond(pondId, tenantId);
    const stocking_id = randomUUID();
    const area = parseFloat(pond.area_sqm || '1');
    const density = area > 0 ? dto.fingerlings_qty / area : null;
    const totalCost = dto.unit_cost ? dto.fingerlings_qty * dto.unit_cost : null;

    const record = {
      stocking_id, tenant_id: tenantId, pond_id: pondId, tank_id: null,
      batch_id: dto.batch_id || null, species_id: dto.species_id || null,
      stocking_date: dto.stocking_date, fingerlings_qty: dto.fingerlings_qty,
      avg_fingerling_weight_g: dto.avg_fingerling_weight_g ? String(dto.avg_fingerling_weight_g) : null,
      source: dto.source || null, supplier_id: dto.supplier_id || null,
      stocking_density_per_sqm: density ? String(density.toFixed(2)) : null,
      unit_cost: dto.unit_cost ? String(dto.unit_cost) : null,
      total_cost: totalCost ? String(totalCost) : null,
      notes: dto.notes || null, created_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaStockingEvent).values(record);
    // Update pond status
    await this.db.update(schema.aquaPond)
      .set({ pond_status: 'STOCKED', updated_at: new Date().toISOString() })
      .where(eq(schema.aquaPond.pond_id, pondId));

    const alerts: string[] = [];
    if (density && density > 20) alerts.push(`⚠️ High stocking density (${density.toFixed(1)}/sqm). Consider aeration increase.`);
    return { ...record, alerts };
  }

  // ── WATER QUALITY ─────────────────────────────────────────────────────────
  async logWaterQuality(pondId: string, dto: WaterQualityDto, tenantId: string, userId: string) {
    const log_id = randomUUID();
    // Evaluate alerts
    const alerts: string[] = [];
    if (dto.do_mg_l !== undefined && dto.do_mg_l < 5.0) alerts.push(`🚨 CRITICAL: DO = ${dto.do_mg_l} mg/L (< 5.0). Aerate immediately!`);
    else if (dto.do_mg_l !== undefined && dto.do_mg_l < 6.0) alerts.push(`⚠️ LOW DO = ${dto.do_mg_l} mg/L. Monitor closely.`);
    if (dto.ammonia_ppm !== undefined && dto.ammonia_ppm > 0.5) alerts.push(`🚨 HIGH Ammonia = ${dto.ammonia_ppm} ppm. Do water exchange!`);
    if (dto.ph !== undefined && (dto.ph < 7.0 || dto.ph > 8.5)) alerts.push(`⚠️ pH = ${dto.ph} outside optimal range (7.0–8.5)`);
    if (dto.nitrite_ppm !== undefined && dto.nitrite_ppm > 0.1) alerts.push(`⚠️ Nitrite = ${dto.nitrite_ppm} ppm (> 0.1). Check biofilter.`);

    // Compute simple WQI 0-100
    let wqi = 100;
    if (dto.do_mg_l !== undefined) wqi -= Math.max(0, (6.0 - dto.do_mg_l) * 10);
    if (dto.ammonia_ppm !== undefined) wqi -= Math.min(30, dto.ammonia_ppm * 30);
    wqi = Math.max(0, Math.round(wqi));
    const status = alerts.some(a => a.includes('🚨')) ? 'CRITICAL' : alerts.length > 0 ? 'WARNING' : 'NORMAL';

    const record = {
      log_id, tenant_id: tenantId, pond_id: pondId, tank_id: null,
      batch_id: dto.batch_id || null, log_date: dto.log_date, log_time: dto.log_time || null,
      ph: dto.ph ? String(dto.ph) : null,
      do_mg_l: dto.do_mg_l ? String(dto.do_mg_l) : null,
      temperature_c: dto.temperature_c ? String(dto.temperature_c) : null,
      ammonia_ppm: dto.ammonia_ppm ? String(dto.ammonia_ppm) : null,
      nitrite_ppm: dto.nitrite_ppm ? String(dto.nitrite_ppm) : null,
      nitrate_ppm: dto.nitrate_ppm ? String(dto.nitrate_ppm) : null,
      turbidity_ntu: dto.turbidity_ntu ? String(dto.turbidity_ntu) : null,
      salinity_ppt: dto.salinity_ppt ? String(dto.salinity_ppt) : null,
      water_quality_index: String(wqi), status,
      alerts: JSON.stringify(alerts), recorded_by: userId,
      created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaWaterQuality).values(record);
    return { ...record, wqi, alerts, status };
  }

  async getWaterQualityHistory(pondId: string, tenantId: string) {
    return this.db.select().from(schema.aquaWaterQuality)
      .where(and(eq(schema.aquaWaterQuality.pond_id, pondId), eq(schema.aquaWaterQuality.tenant_id, tenantId)))
      .orderBy(desc(schema.aquaWaterQuality.log_date));
  }

  // ── GROWTH SAMPLING ───────────────────────────────────────────────────────
  async recordGrowthSample(pondId: string, dto: GrowthSampleDto, tenantId: string, userId: string) {
    // Get stocking event for this pond to compute FCR
    const [stocking] = await this.db.select().from(schema.aquaStockingEvent)
      .where(and(eq(schema.aquaStockingEvent.pond_id, pondId), eq(schema.aquaStockingEvent.tenant_id, tenantId)))
      .orderBy(desc(schema.aquaStockingEvent.stocking_date)).limit(1);

    const sample_id = randomUUID();
    const initialQty = stocking?.fingerlings_qty || 0;
    const initWeightG = parseFloat(stocking?.avg_fingerling_weight_g || '0.5');
    const survivalPct = initialQty > 0 ? ((dto.sample_count / initialQty) * 100) : null;

    // ADG = (current_abw - initial_abw) / culture_days
    const adg = (dto.culture_day && dto.culture_day > 0)
      ? ((dto.avg_weight_g - initWeightG) / dto.culture_day) : null;

    // Estimated biomass = current_qty * avg_weight_g / 1000
    const estimatedBiomass = (dto.sample_count * dto.avg_weight_g) / 1000;

    const record = {
      sample_id, tenant_id: tenantId, pond_id: pondId,
      batch_id: dto.batch_id || null, sample_date: dto.sample_date,
      culture_day: dto.culture_day || null, sample_count: dto.sample_count,
      avg_weight_g: String(dto.avg_weight_g),
      total_estimated_biomass_kg: String(estimatedBiomass.toFixed(2)),
      survival_rate_pct: survivalPct ? String(survivalPct.toFixed(2)) : null,
      fcr_running: null,  // Requires feed consumption data — computed separately
      adg_g: adg ? String(adg.toFixed(3)) : null,
      recorded_by: userId, notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaGrowthSample).values(record);
    return { ...record, message: `ABW = ${dto.avg_weight_g}g | Est. biomass = ${estimatedBiomass.toFixed(1)}kg | ADG = ${adg ? adg.toFixed(3) : 'N/A'}g/day` };
  }

  // ── MORTALITY ─────────────────────────────────────────────────────────────
  async recordMortality(pondId: string, dto: MortalityEventDto, tenantId: string, userId: string) {
    const event_id = randomUUID();
    const record = {
      event_id, tenant_id: tenantId, pond_id: pondId,
      batch_id: dto.batch_id || null, event_date: dto.event_date,
      qty_dead: dto.qty_dead, avg_weight_g: null,
      cause: dto.cause, remarks: dto.remarks || null,
      action_taken: dto.action_taken || null, recorded_by: userId,
      created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaMortalityEvent).values(record);
    return record;
  }

  // ── DISEASE ───────────────────────────────────────────────────────────────
  async recordDiseaseEvent(pondId: string, dto: DiseaseEventDto, tenantId: string) {
    const disease_id = randomUUID();
    const record = {
      disease_id, tenant_id: tenantId, pond_id: pondId,
      batch_id: dto.batch_id || null, event_date: dto.event_date,
      symptoms: dto.symptoms, diagnosis: dto.diagnosis || null,
      pathogen: dto.pathogen || null, severity: dto.severity || 'MODERATE',
      treatment_protocol: dto.treatment_protocol || null,
      medicine_used: dto.medicine_used || null, withdrawal_days: dto.withdrawal_days || null,
      vet_name: dto.vet_name || null, outcome: 'ONGOING',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaDiseaseEvent).values(record);
    return record;
  }

  // ── POND TREATMENT ────────────────────────────────────────────────────────
  async recordPondTreatment(pondId: string, dto: PondTreatmentDto, tenantId: string) {
    const treatment_id = randomUUID();
    const record = {
      treatment_id, tenant_id: tenantId, pond_id: pondId,
      treatment_date: dto.treatment_date, purpose: dto.purpose,
      chemical_name: dto.chemical_name, qty_kg: dto.qty_kg ? String(dto.qty_kg) : null,
      application_method: null, withdrawal_period_days: null,
      applied_by: null, cost: dto.cost ? String(dto.cost) : null,
      notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaPondTreatment).values(record);
    return record;
  }

  // ── KPI ───────────────────────────────────────────────────────────────────
  async getAquaKpi(tenantId: string, pondId?: string) {
    const ponds = pondId
      ? await this.db.select().from(schema.aquaPond).where(and(eq(schema.aquaPond.tenant_id, tenantId), eq(schema.aquaPond.pond_id, pondId)))
      : await this.db.select().from(schema.aquaPond).where(eq(schema.aquaPond.tenant_id, tenantId));

    // Latest water quality readings
    const wqLogs = await this.db.select().from(schema.aquaWaterQuality).where(eq(schema.aquaWaterQuality.tenant_id, tenantId));
    const criticalWQ = wqLogs.filter(w => w.status === 'CRITICAL').length;
    const avgWqi = wqLogs.length > 0 ? wqLogs.reduce((s, w) => s + Number(w.water_quality_index || 0), 0) / wqLogs.length : 0;

    // Growth samples
    const samples = await this.db.select().from(schema.aquaGrowthSample).where(eq(schema.aquaGrowthSample.tenant_id, tenantId));
    const avgAbw = samples.length > 0 ? samples.reduce((s, g) => s + Number(g.avg_weight_g || 0), 0) / samples.length : 0;

    return {
      kpis: {
        total_ponds: ponds.length,
        stocked_ponds: ponds.filter(p => p.pond_status === 'STOCKED').length,
        empty_ponds: ponds.filter(p => p.pond_status === 'EMPTY').length,
        avg_water_quality_index: parseFloat(avgWqi.toFixed(1)),
        critical_wq_events: criticalWQ,
        avg_abw_g: parseFloat(avgAbw.toFixed(2)),
        total_growth_samples: samples.length,
      },
      calculated_at: new Date().toISOString(),
    };
  }
}
