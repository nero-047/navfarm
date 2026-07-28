import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateAgriBatchDto, AgriFieldInputDto, AgriHarvestDto } from '../dto/agri.dto';

@Injectable()
export class AgriService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createBatch(dto: CreateAgriBatchDto, tenantId: string, companyId: string) {
    const batch_id = randomUUID();
    const record = {
      batch_id, tenant_id: tenantId, company_id: companyId,
      batch_code: dto.batch_code, lob_id: dto.lob_id,
      costing_method: dto.costing_method, crop_item_id: dto.crop_item_id,
      area_acres: dto.area_acres ? String(dto.area_acres) : null,
      location_id: dto.location_id, batch_status: 'ACTIVE',
      bio_asset_stage: dto.bio_asset_stage || null,
      premature_years: dto.premature_years || 0,
      nca_cost: dto.nca_cost ? String(dto.nca_cost) : null,
      annual_amortisation: dto.annual_amortisation ? String(dto.annual_amortisation) : null,
      season_year: dto.season_year || null,
      sowing_date: dto.sowing_date || null,
      expected_harvest_date: dto.expected_harvest_date || null,
      notes: dto.notes || null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriBatch).values(record);
    return record;
  }

  async getBatch(batchId: string, tenantId: string) {
    const [batch] = await this.db.select().from(schema.agriBatch)
      .where(and(eq(schema.agriBatch.batch_id, batchId), eq(schema.agriBatch.tenant_id, tenantId))).limit(1);
    if (!batch) throw new NotFoundException(`Agri batch '${batchId}' not found.`);
    return batch;
  }

  async listBatches(tenantId: string) {
    return this.db.select().from(schema.agriBatch).where(eq(schema.agriBatch.tenant_id, tenantId));
  }

  async addFieldInput(batchId: string, dto: AgriFieldInputDto, userId: string) {
    const input_id = randomUUID();
    const amount = dto.qty * (dto.unit_rate || 0);
    const record = {
      input_id, batch_id: batchId, input_date: dto.input_date,
      entry_type: dto.entry_type, item_id: dto.item_id || null,
      qty: String(dto.qty), uom_id: dto.uom_id || null,
      unit_rate: dto.unit_rate ? String(dto.unit_rate) : null,
      amount: String(amount), notes: dto.notes || null,
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriFieldInput).values(record);
    return record;
  }

  async recordHarvest(batchId: string, dto: AgriHarvestDto, tenantId: string, userId: string) {
    const harvest_id = randomUUID();
    const record = {
      harvest_id, batch_id: batchId, harvest_date: dto.harvest_date,
      harvest_type: dto.harvest_type, output_item_id: dto.output_item_id,
      qty_harvested: String(dto.qty_harvested), uom_id: dto.uom_id || null,
      qc_result: dto.qc_result || null, notes: dto.notes || null,
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriHarvestRecord).values(record);

    // Mark batch as HARVESTED if FULL
    if (dto.harvest_type === 'FULL') {
      await this.db.update(schema.agriBatch)
        .set({ batch_status: 'HARVESTED', actual_harvest_date: dto.harvest_date, updated_at: new Date().toISOString() })
        .where(eq(schema.agriBatch.batch_id, batchId));
    }
    return record;
  }

  async copyBatch(batchId: string, newSeasonYear: number, tenantId: string) {
    const source = await this.getBatch(batchId, tenantId);
    const newBatchId = randomUUID();
    const newBatchCode = source.batch_code.replace(/\d{4}/, String(newSeasonYear));
    const record = {
      ...source, batch_id: newBatchId, batch_code: newBatchCode,
      season_year: newSeasonYear, batch_status: 'ACTIVE',
      parent_batch_id: batchId,
      actual_harvest_date: null,
      sowing_date: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.agriBatch).values(record);
    return { ...record, message: `Batch copied for season ${newSeasonYear} (fruit tree continuation).` };
  }
}
