import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateAquaBatchDto, AquaDailyEntryDto, AquaHarvestDto, AquaSlaughterDto } from '../dto/aquaculture.dto';

@Injectable()
export class AquacultureService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createBatch(dto: CreateAquaBatchDto, tenantId: string, companyId: string) {
    const batch_id = randomUUID();
    const record = {
      batch_id, tenant_id: tenantId, company_id: companyId,
      batch_code: dto.batch_code, lob_id: dto.lob_id, costing_method: 'BIO_ASSET',
      species_item_id: dto.species_item_id, location_id: dto.location_id,
      stocking_date: dto.stocking_date, fingerlings_qty: dto.fingerlings_qty,
      nca_stocking_cost: dto.nca_stocking_cost ? String(dto.nca_stocking_cost) : null,
      batch_status: 'ACTIVE', notes: dto.notes || null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaBatch).values(record);
    return record;
  }

  async listBatches(tenantId: string) {
    return this.db.select().from(schema.aquaBatch).where(eq(schema.aquaBatch.tenant_id, tenantId));
  }

  async addDailyEntry(batchId: string, dto: AquaDailyEntryDto, userId: string) {
    const entry_id = randomUUID();
    const amount = (dto.qty || 0) * (dto.unit_rate || 0);
    const record = {
      entry_id, batch_id: batchId, entry_date: dto.entry_date, entry_type: dto.entry_type,
      item_id: dto.item_id || null, qty: dto.qty ? String(dto.qty) : null,
      sample_weight_g: dto.sample_weight_g ? String(dto.sample_weight_g) : null,
      unit_rate: dto.unit_rate ? String(dto.unit_rate) : null, amount: String(amount),
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaDailyEntry).values(record);
    return record;
  }

  async recordHarvest(batchId: string, dto: AquaHarvestDto) {
    const harvest_id = randomUUID();
    const record = {
      harvest_id, batch_id: batchId, harvest_date: dto.harvest_date, harvest_type: dto.harvest_type,
      live_fish_kg: String(dto.live_fish_kg),
      avg_weight_kg: dto.avg_weight_kg ? String(dto.avg_weight_kg) : null,
      lot_no: dto.lot_no || null, notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaHarvestRecord).values(record);
    if (dto.harvest_type === 'FULL') {
      await this.db.update(schema.aquaBatch)
        .set({ batch_status: 'COMPLETED', updated_at: new Date().toISOString() })
        .where(eq(schema.aquaBatch.batch_id, batchId));
    }
    return record;
  }

  async processSlaughter(dto: AquaSlaughterDto, tenantId: string) {
    const slaughter_id = randomUUID();
    const totalCost = (dto.input_cost || 0) + (dto.overhead_cost || 0);
    const filletPct = (dto.fillet_split_pct || 70) / 100;
    const mealPct = (dto.meal_split_pct || 15) / 100;
    const skinPct = (dto.skin_split_pct || 10) / 100;
    const filletCost = totalCost * filletPct;
    const mealCost = totalCost * mealPct;
    const skinCost = totalCost * skinPct;

    const record = {
      slaughter_id, tenant_id: tenantId, source_batch_id: dto.source_batch_id,
      slaughter_date: dto.slaughter_date, input_kg: String(dto.input_kg),
      input_cost: dto.input_cost ? String(dto.input_cost) : null,
      overhead_cost: String(dto.overhead_cost || 0),
      fillet_kg: dto.fillet_kg ? String(dto.fillet_kg) : null,
      fillet_split_pct: String(dto.fillet_split_pct || 70),
      fillet_unit_cost: dto.fillet_kg ? String(filletCost / dto.fillet_kg) : null,
      meal_kg: dto.meal_kg ? String(dto.meal_kg) : null,
      meal_split_pct: String(dto.meal_split_pct || 15),
      meal_unit_cost: dto.meal_kg ? String(mealCost / dto.meal_kg) : null,
      skin_kg: dto.skin_kg ? String(dto.skin_kg) : null,
      skin_split_pct: String(dto.skin_split_pct || 10),
      skin_unit_cost: dto.skin_kg ? String(skinCost / dto.skin_kg) : null,
      other_split_pct: String(100 - (dto.fillet_split_pct || 70) - (dto.meal_split_pct || 15) - (dto.skin_split_pct || 10)),
      qc_freshness_grade: dto.qc_freshness_grade || null,
      notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.aquaSlaughterRecord).values(record);
    return { ...record, costSummary: { totalCost, filletCost, mealCost, skinCost } };
  }
}
