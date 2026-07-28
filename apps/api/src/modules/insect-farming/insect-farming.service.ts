import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { CreateInsectBatchDto, InsectDailyEntryDto, InsectHarvestDto } from './dto/insect-farming.dto';

@Injectable()
export class InsectFarmingService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createBatch(dto: CreateInsectBatchDto, tenantId: string, companyId: string) {
    const batch_id = randomUUID();
    const totalSetupCost = dto.hive_count * dto.hive_cost_per_unit;
    const record = {
      batch_id, tenant_id: tenantId, company_id: companyId,
      batch_code: dto.batch_code, lob_id: dto.lob_id, insect_type: dto.insect_type,
      location_id: dto.location_id, hive_count: dto.hive_count,
      hive_cost_per_unit: String(dto.hive_cost_per_unit),
      total_setup_cost: String(totalSetupCost),
      setup_date: dto.setup_date, batch_status: 'ACTIVE',
      notes: dto.notes || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.insectBatch).values(record);
    return record;
  }

  async listBatches(tenantId: string) {
    return this.db.select().from(schema.insectBatch).where(eq(schema.insectBatch.tenant_id, tenantId));
  }

  async addDailyEntry(batchId: string, dto: InsectDailyEntryDto, userId: string) {
    const entry_id = randomUUID();
    const amount = (dto.qty || 0) * (dto.unit_rate || 0);
    const record = {
      entry_id, batch_id: batchId, entry_date: dto.entry_date, entry_type: dto.entry_type,
      item_id: dto.item_id || null, qty: dto.qty ? String(dto.qty) : null,
      uom_id: dto.uom_id || null, unit_rate: dto.unit_rate ? String(dto.unit_rate) : null,
      amount: String(amount), recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.insectDailyEntry).values(record);
    return record;
  }

  async recordHarvest(batchId: string, dto: InsectHarvestDto) {
    const harvest_id = randomUUID();
    const record = {
      harvest_id, batch_id: batchId, harvest_date: dto.harvest_date,
      main_product_item_id: dto.main_product_item_id, main_qty_kg: String(dto.main_qty_kg),
      main_split_pct: String(dto.main_split_pct || 95),
      byproduct_item_id: dto.byproduct_item_id || null,
      byproduct_qty_kg: dto.byproduct_qty_kg ? String(dto.byproduct_qty_kg) : null,
      byproduct_split_pct: String(dto.byproduct_split_pct || 5),
      moisture_pct: dto.moisture_pct ? String(dto.moisture_pct) : null,
      qc_result: dto.qc_result || null, notes: dto.notes || null,
      created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.insectHarvestRecord).values(record);
    return record;
  }
}
