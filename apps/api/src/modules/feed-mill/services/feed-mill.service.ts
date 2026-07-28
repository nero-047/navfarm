import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import {
  CreateBorDto, AddBorIngredientDto, SetBorNutritionDto,
  CreateFeedProductionBatchDto, RecordFeedProductionInputDto, CloseFeedProductionBatchDto
} from '../dto/feed-mill.dto';

@Injectable()
export class FeedMillService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  // ---- BOR Master ----
  async createBor(dto: CreateBorDto, tenantId: string, companyId: string) {
    const bor_id = randomUUID();
    const record = {
      bor_id, tenant_id: tenantId, company_id: companyId,
      bor_code: dto.bor_code, version: dto.version, bor_name: dto.bor_name,
      output_item_id: dto.output_item_id,
      output_qty: String(dto.output_qty),
      output_uom_id: dto.output_uom_id || null,
      is_active: true, notes: dto.notes || null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.borMaster).values(record);
    return record;
  }

  async getBor(borId: string, tenantId: string) {
    const [bor] = await this.db.select().from(schema.borMaster)
      .where(and(eq(schema.borMaster.bor_id, borId), eq(schema.borMaster.tenant_id, tenantId))).limit(1);
    if (!bor) throw new NotFoundException(`BOR '${borId}' not found.`);
    return bor;
  }

  async listBors(tenantId: string) {
    return this.db.select().from(schema.borMaster)
      .where(and(eq(schema.borMaster.tenant_id, tenantId), eq(schema.borMaster.is_active, true)));
  }

  async addIngredient(borId: string, dto: AddBorIngredientDto) {
    const line_id = randomUUID();
    const stdAmount = dto.std_qty * (dto.std_unit_rate || 0);
    const record = {
      line_id, bor_id: borId, line_no: dto.line_no,
      item_id: dto.item_id, std_qty: String(dto.std_qty),
      uom_id: dto.uom_id || null,
      pct_of_output: dto.pct_of_output ? String(dto.pct_of_output) : null,
      std_unit_rate: dto.std_unit_rate ? String(dto.std_unit_rate) : null,
      std_amount: String(stdAmount), is_active: true,
    };
    await this.db.insert(schema.borIngredientLine).values(record);
    return record;
  }

  async getBorIngredients(borId: string) {
    return this.db.select().from(schema.borIngredientLine)
      .where(and(eq(schema.borIngredientLine.bor_id, borId), eq(schema.borIngredientLine.is_active, true)));
  }

  async upsertNutrition(borId: string, dto: SetBorNutritionDto) {
    const [existing] = await this.db.select().from(schema.borNutritionalProfile)
      .where(eq(schema.borNutritionalProfile.bor_id, borId)).limit(1);

    const data = {
      bor_id: borId,
      crude_protein_pct: dto.crude_protein_pct ? String(dto.crude_protein_pct) : null,
      crude_fat_pct: dto.crude_fat_pct ? String(dto.crude_fat_pct) : null,
      crude_fibre_pct: dto.crude_fibre_pct ? String(dto.crude_fibre_pct) : null,
      moisture_pct: dto.moisture_pct ? String(dto.moisture_pct) : null,
      ash_pct: dto.ash_pct ? String(dto.ash_pct) : null,
      metabolisable_energy_kcal_kg: dto.metabolisable_energy_kcal_kg ? String(dto.metabolisable_energy_kcal_kg) : null,
      calcium_pct: dto.calcium_pct ? String(dto.calcium_pct) : null,
      phosphorus_pct: dto.phosphorus_pct ? String(dto.phosphorus_pct) : null,
      calculated_at: new Date().toISOString(),
    };

    if (existing) {
      await this.db.update(schema.borNutritionalProfile).set(data).where(eq(schema.borNutritionalProfile.bor_id, borId));
      return { ...existing, ...data, action: 'updated' };
    } else {
      const profile_id = randomUUID();
      await this.db.insert(schema.borNutritionalProfile).values({ profile_id, ...data });
      return { profile_id, ...data, action: 'created' };
    }
  }

  async getNutrition(borId: string) {
    const [profile] = await this.db.select().from(schema.borNutritionalProfile)
      .where(eq(schema.borNutritionalProfile.bor_id, borId)).limit(1);
    return profile || null;
  }

  // ---- Feed Production Batch ----
  async createProductionBatch(dto: CreateFeedProductionBatchDto, tenantId: string, companyId: string) {
    // Get BOR to validate
    const bor = await this.getBor(dto.bor_id, tenantId);
    const fp_batch_id = randomUUID();
    const record = {
      fp_batch_id, tenant_id: tenantId, company_id: companyId,
      fp_batch_code: dto.fp_batch_code, bor_id: dto.bor_id,
      planned_output_qty: String(dto.planned_output_qty),
      output_item_id: bor.output_item_id,
      batch_status: 'PLANNED',
      total_ingredient_cost: '0', total_resource_cost: '0',
      total_overhead_cost: '0', total_cost: '0',
      production_date: dto.production_date, location_id: dto.location_id,
      notes: dto.notes || null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.feedProductionBatch).values(record);
    return { ...record, bor };
  }

  async getProductionBatch(fpBatchId: string) {
    const [batch] = await this.db.select().from(schema.feedProductionBatch)
      .where(eq(schema.feedProductionBatch.fp_batch_id, fpBatchId)).limit(1);
    if (!batch) throw new NotFoundException(`Feed Production Batch '${fpBatchId}' not found.`);
    return batch;
  }

  async listProductionBatches(tenantId: string) {
    return this.db.select().from(schema.feedProductionBatch)
      .where(eq(schema.feedProductionBatch.tenant_id, tenantId));
  }

  async recordInput(fpBatchId: string, dto: RecordFeedProductionInputDto) {
    const batch = await this.getProductionBatch(fpBatchId);
    if (batch.batch_status === 'CLOSED') throw new BadRequestException('Cannot add inputs to a CLOSED batch.');

    const input_id = randomUUID();
    const amount = dto.actual_qty * (dto.unit_rate || 0);

    // Get std_qty from BOR line if available
    let stdQty: number | null = null;
    let usageVariance: number | null = null;
    if (dto.bor_line_id) {
      const [borLine] = await this.db.select().from(schema.borIngredientLine)
        .where(eq(schema.borIngredientLine.line_id, dto.bor_line_id)).limit(1);
      if (borLine) {
        const batchRatio = Number(batch.planned_output_qty) / Number(borLine.std_qty);
        stdQty = Number(borLine.std_qty);
        usageVariance = (dto.actual_qty - stdQty) * (dto.unit_rate || Number(borLine.std_unit_rate) || 0);
      }
    }

    const record = {
      input_id, fp_batch_id: fpBatchId,
      bor_line_id: dto.bor_line_id || null,
      item_id: dto.item_id, std_qty: stdQty ? String(stdQty) : null,
      actual_qty: String(dto.actual_qty), uom_id: dto.uom_id || null,
      unit_rate: dto.unit_rate ? String(dto.unit_rate) : null,
      amount: String(amount),
      usage_variance: usageVariance !== null ? String(usageVariance) : null,
      created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.feedProductionBatchInput).values(record);

    // Update running total_ingredient_cost on batch
    const newIngredientCost = Number(batch.total_ingredient_cost) + amount;
    await this.db.update(schema.feedProductionBatch)
      .set({
        total_ingredient_cost: String(newIngredientCost),
        batch_status: 'IN_PROGRESS',
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.feedProductionBatch.fp_batch_id, fpBatchId));

    return record;
  }

  async closeProductionBatch(fpBatchId: string, dto: CloseFeedProductionBatchDto) {
    const batch = await this.getProductionBatch(fpBatchId);
    if (batch.batch_status === 'CLOSED') throw new BadRequestException('Batch is already CLOSED.');

    const totalIngredientCost = Number(batch.total_ingredient_cost);
    const totalResourceCost = dto.total_resource_cost || 0;
    const totalOverheadCost = dto.total_overhead_cost || 0;
    const totalCost = totalIngredientCost + totalResourceCost + totalOverheadCost;
    const unitCost = dto.actual_output_qty > 0 ? totalCost / dto.actual_output_qty : 0;

    // Total usage variance from all inputs
    const inputs = await this.db.select().from(schema.feedProductionBatchInput)
      .where(eq(schema.feedProductionBatchInput.fp_batch_id, fpBatchId));
    const totalVariance = inputs.reduce((sum, i) => sum + (Number(i.usage_variance) || 0), 0);

    await this.db.update(schema.feedProductionBatch)
      .set({
        actual_output_qty: String(dto.actual_output_qty),
        total_resource_cost: String(totalResourceCost),
        total_overhead_cost: String(totalOverheadCost),
        total_cost: String(totalCost),
        unit_cost: String(unitCost),
        usage_variance_amount: String(totalVariance),
        batch_status: 'CLOSED',
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.feedProductionBatch.fp_batch_id, fpBatchId));

    return {
      fp_batch_id: fpBatchId, status: 'CLOSED',
      actual_output_qty: dto.actual_output_qty, totalCost,
      unit_cost: unitCost, usage_variance_amount: totalVariance,
      message: totalVariance > 0 ? 'Usage OVER standard (adverse variance)' : 'Usage UNDER standard (favourable variance)',
    };
  }
}
