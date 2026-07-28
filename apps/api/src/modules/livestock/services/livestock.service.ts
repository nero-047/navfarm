import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import {
  CreateLivestockBatchDto, LivestockDailyEntryDto,
  MilkHarvestDto, OffspringRecordDto, AmortisationRunDto, FairValueUpdateDto
} from '../dto/livestock.dto';

@Injectable()
export class LivestockService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createBatch(dto: CreateLivestockBatchDto, tenantId: string, companyId: string) {
    const id = randomUUID();
    const nca = dto.nca_purchase_cost || 0;
    const residual = dto.residual_value || 0;
    const lifeMonths = dto.useful_life_months || 60;
    const monthlyAmort = lifeMonths > 0 ? (nca - residual) / lifeMonths : 0;

    const record = {
      batch_id: id, tenant_id: tenantId, company_id: companyId,
      batch_code: dto.batch_code, lob_id: dto.lob_id,
      costing_method: dto.costing_method,
      opening_qty: String(dto.opening_qty),
      current_qty: String(dto.opening_qty),
      item_id: dto.item_id, location_id: dto.location_id,
      batch_status: 'ACTIVE', bio_asset_stage: 'PREMATURE',
      nca_purchase_cost: String(nca),
      nca_current: String(nca * dto.opening_qty),
      residual_value: String(residual),
      useful_life_months: lifeMonths,
      monthly_amortisation: String(monthlyAmort * dto.opening_qty),
      placement_date: dto.placement_date,
      maturity_date: dto.maturity_date || null,
      notes: dto.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.livestockBatch).values(record);
    return record;
  }

  async getBatch(batchId: string, tenantId: string) {
    const [batch] = await this.db.select().from(schema.livestockBatch)
      .where(and(eq(schema.livestockBatch.batch_id, batchId), eq(schema.livestockBatch.tenant_id, tenantId)))
      .limit(1);
    if (!batch) throw new NotFoundException(`Livestock batch '${batchId}' not found.`);
    return batch;
  }

  async listBatches(tenantId: string) {
    return this.db.select().from(schema.livestockBatch).where(eq(schema.livestockBatch.tenant_id, tenantId));
  }

  async addDailyEntry(batchId: string, dto: LivestockDailyEntryDto, userId: string) {
    const entry_id = randomUUID();
    const amount = (dto.qty || 0) * (dto.unit_rate || 0);
    const record = {
      entry_id, batch_id: batchId,
      entry_date: dto.entry_date, entry_type: dto.entry_type,
      item_id: dto.item_id || null, qty: dto.qty ? String(dto.qty) : null,
      uom_id: dto.uom_id || null, unit_rate: dto.unit_rate ? String(dto.unit_rate) : null,
      amount: String(amount), notes: dto.notes || null,
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.livestockDailyEntry).values(record);
    return record;
  }

  async recordMilkHarvest(batchId: string, dto: MilkHarvestDto, userId: string) {
    const record_id = randomUUID();
    const total_value = dto.litres_produced * (dto.unit_rate || 0);
    const record = {
      record_id, batch_id: batchId,
      record_date: dto.record_date, litres_produced: String(dto.litres_produced),
      unit_rate: dto.unit_rate ? String(dto.unit_rate) : null,
      total_value: String(total_value),
      fat_pct: dto.fat_pct ? String(dto.fat_pct) : null,
      snf_pct: dto.snf_pct ? String(dto.snf_pct) : null,
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.livestockMilkRecord).values(record);
    return record;
  }

  async recordOffspring(batchId: string, dto: OffspringRecordDto) {
    const record_id = randomUUID();
    const record = {
      record_id, parent_batch_id: batchId,
      record_date: dto.record_date, offspring_type: dto.offspring_type,
      qty_born: dto.qty_born, qty_alive: dto.qty_alive ?? dto.qty_born,
      qty_dead: (dto.qty_born - (dto.qty_alive ?? dto.qty_born)),
      avg_birth_weight_kg: dto.avg_birth_weight_kg ? String(dto.avg_birth_weight_kg) : null,
      notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.livestockOffspringRecord).values(record);
    return record;
  }

  async runAmortisation(batchId: string, dto: AmortisationRunDto, tenantId: string) {
    const batch = await this.getBatch(batchId, tenantId);
    const monthlyAmt = Number(batch.monthly_amortisation) || 0;
    const ncaBefore = Number(batch.nca_current) || 0;
    const ncaAfter = Math.max(0, ncaBefore - monthlyAmt);

    const schedule_id = randomUUID();
    const record = {
      schedule_id, batch_id: batchId,
      period_month: dto.period_month, period_year: dto.period_year,
      amortisation_amount: String(monthlyAmt),
      nca_before: String(ncaBefore), nca_after: String(ncaAfter),
      is_posted: false, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.livestockAmortisationSchedule).values(record);
    // Update running NCA on batch
    await this.db.update(schema.livestockBatch)
      .set({ nca_current: String(ncaAfter), updated_at: new Date().toISOString() })
      .where(eq(schema.livestockBatch.batch_id, batchId));
    return { ...record, message: `Amortisation of Rs ${monthlyAmt.toFixed(2)} posted for ${dto.period_month}/${dto.period_year}` };
  }

  async updateFairValue(batchId: string, dto: FairValueUpdateDto, tenantId: string, userId: string) {
    const batch = await this.getBatch(batchId, tenantId);
    const qty = Number(batch.current_qty) || 0;
    const total_fair_value = dto.fair_value_per_unit * qty;
    const nca_at_date = Number(batch.nca_current) || 0;
    const gain_loss = total_fair_value - nca_at_date;

    const fv_id = randomUUID();
    const record = {
      fv_id, batch_id: batchId,
      update_date: dto.update_date,
      fair_value_per_unit: String(dto.fair_value_per_unit),
      total_fair_value: String(total_fair_value),
      nca_at_date: String(nca_at_date),
      gain_loss_amount: String(gain_loss),
      updated_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.livestockFairValueUpdate).values(record);
    await this.db.update(schema.livestockBatch)
      .set({ fair_value_latest: String(total_fair_value), updated_at: new Date().toISOString() })
      .where(eq(schema.livestockBatch.batch_id, batchId));
    return { ...record, iasNote: gain_loss >= 0 ? 'Fair value GAIN (IAS 41 — Credit P&L)' : 'Fair value LOSS (IAS 41 — Debit P&L)' };
  }
}
