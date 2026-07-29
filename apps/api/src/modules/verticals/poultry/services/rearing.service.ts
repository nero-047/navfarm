import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { ProductionBatchService } from '../../../production-costing/production/services/production-batch.service';
import { BatchMaterialService } from '../../../production-costing/production/services/batch-material.service';
import { AuditLogService } from '../../../platform-identity/audit-log/audit-log.service';
import { PlaceChickBatchDto, RecordDailyRearingDto } from '../dto/rearing.dto';

@Injectable()
export class RearingService {
  constructor(
    private readonly cls: ClsService,
    private readonly productionBatchService: ProductionBatchService,
    private readonly batchMaterialService: BatchMaterialService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  // --- CHICK PLACEMENT (CREATES PRODUCTION BATCH VIA PHASE 5) ---

  async placeChickBatch(dto: PlaceChickBatchDto, tenantId: string, userId?: string) {
    // 1. Create underlying Production Batch in Phase 5
    const prodBatch = await this.productionBatchService.createBatch(
      {
        company_id: dto.company_id,
        batch_no: dto.batch_no,
        farm_id: dto.farm_id,
        shed_id: dto.shed_id,
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        planned_qty: dto.initial_bird_count,
        notes: `Rearing Chick Placement (${dto.initial_bird_count} DOCs)`,
      },
      tenantId,
      userId
    );

    // 2. Create Poultry Batch record in Phase 6
    const poultryBatchId = randomUUID();
    const newPoultryBatch = {
      poultry_batch_id: poultryBatchId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      farm_id: dto.farm_id,
      shed_id: dto.shed_id,
      production_batch_id: prodBatch.batch_id,
      batch_type: 'REARING',
      breed_id: dto.breed_id || null,
      species_id: dto.species_id || null,
      placement_date: dto.placement_date,
      initial_bird_count: dto.initial_bird_count,
      current_bird_count: dto.initial_bird_count,
      total_mortality: 0,
      status: 'ACTIVE',
      created_by: userId || null,
    };

    await this.db.insert(schema.poultryBatch).values(newPoultryBatch);

    // 3. Initialize Poultry KPI record
    await this.db.insert(schema.poultryKpi).values({
      kpi_id: randomUUID(),
      tenant_id: tenantId,
      company_id: dto.company_id,
      poultry_batch_id: poultryBatchId,
      fcr: '0.00',
      livability_pct: '100.00',
      mortality_rate_pct: '0.00',
      hdp_pct: '0.00',
      hatchability_pct: '0.00',
      cost_per_bird: '0.0000',
      cost_per_egg: '0.0000',
      cost_per_kg: '0.0000',
    });

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId,
      action: 'CREATE',
      entityName: 'poultry_batch',
      entityId: poultryBatchId,
      newValues: newPoultryBatch,
    });

    return newPoultryBatch;
  }

  // --- DAILY REARING ENTRY & FEED CONSUMPTION (PHASE 3 INVENTORY INTEGRATION) ---

  async addDailyRearingEntry(dto: RecordDailyRearingDto, tenantId: string, userId?: string) {
    const [pBatch] = await this.db
      .select()
      .from(schema.poultryBatch)
      .where(
        and(
          eq(schema.poultryBatch.poultry_batch_id, dto.poultry_batch_id),
          eq(schema.poultryBatch.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!pBatch) {
      throw new NotFoundException(`Poultry Batch '${dto.poultry_batch_id}' not found.`);
    }

    if (pBatch.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot log daily entries for batch in status '${pBatch.status}'.`);
    }

    // 1. Issue feed through Phase 3 Inventory Engine if feed_item_id is supplied
    if (dto.feed_item_id && dto.feed_consumed_kg && dto.feed_consumed_kg > 0) {
      const prodBatch = await this.productionBatchService.findBatchById(pBatch.production_batch_id, tenantId);
      await this.batchMaterialService.issueBatchMaterials(
        {
          company_id: dto.company_id,
          batch_id: pBatch.production_batch_id,
          item_id: dto.feed_item_id,
          uom_id: 'uom-kg',
          warehouse_id: prodBatch.warehouse_id,
          location_id: prodBatch.location_id,
          planned_qty: dto.feed_consumed_kg,
          actual_qty: dto.feed_consumed_kg,
        },
        tenantId,
        userId
      );
    }

    // 2. Record Daily Log
    const entryId = randomUUID();
    const newEntry = {
      entry_id: entryId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      farm_id: dto.farm_id,
      shed_id: dto.shed_id,
      poultry_batch_id: dto.poultry_batch_id,
      entry_date: dto.entry_date,
      feed_item_id: dto.feed_item_id || null,
      feed_consumed_kg: (dto.feed_consumed_kg || 0).toFixed(4),
      water_consumed_liters: (dto.water_consumed_liters || 0).toFixed(4),
      mortality_count: dto.mortality_count || 0,
      culling_count: dto.culling_count || 0,
      avg_weight_grams: (dto.avg_weight_grams || 0).toFixed(2),
      temperature_celsius: dto.temperature_celsius ? dto.temperature_celsius.toFixed(2) : null,
      humidity_pct: dto.humidity_pct ? dto.humidity_pct.toFixed(2) : null,
      notes: dto.notes || null,
      created_by: userId || null,
    };

    await this.db.insert(schema.poultryDailyEntry).values(newEntry);

    // 3. Update current bird count and total mortality on poultry_batch
    const newMortality = pBatch.total_mortality + (dto.mortality_count || 0) + (dto.culling_count || 0);
    const newCurrentCount = Math.max(0, pBatch.initial_bird_count - newMortality);

    await this.db
      .update(schema.poultryBatch)
      .set({
        total_mortality: newMortality,
        current_bird_count: newCurrentCount,
      })
      .where(eq(schema.poultryBatch.poultry_batch_id, dto.poultry_batch_id));

    // 4. Update KPI Snapshot (Livability & Mortality %)
    const livability = (newCurrentCount / pBatch.initial_bird_count) * 100;
    const mortalityRate = (newMortality / pBatch.initial_bird_count) * 100;

    await this.db
      .update(schema.poultryKpi)
      .set({
        livability_pct: livability.toFixed(2),
        mortality_rate_pct: mortalityRate.toFixed(2),
      })
      .where(eq(schema.poultryKpi.poultry_batch_id, dto.poultry_batch_id));

    return newEntry;
  }

  // --- QUERY & UTILITY METHODS ---

  async getPoultryBatchById(poultryBatchId: string, tenantId: string) {
    const [pBatch] = await this.db
      .select()
      .from(schema.poultryBatch)
      .where(
        and(
          eq(schema.poultryBatch.poultry_batch_id, poultryBatchId),
          eq(schema.poultryBatch.tenant_id, tenantId),
          isNull(schema.poultryBatch.deleted_at)
        )
      )
      .limit(1);

    if (!pBatch) {
      throw new NotFoundException(`Poultry Batch '${poultryBatchId}' not found.`);
    }

    const [kpi] = await this.db
      .select()
      .from(schema.poultryKpi)
      .where(eq(schema.poultryKpi.poultry_batch_id, poultryBatchId))
      .limit(1);

    return {
      ...pBatch,
      kpi: kpi || null,
    };
  }

  async listPoultryBatches(companyId: string, tenantId: string, batchType?: string, status?: string) {
    const conditions = [
      eq(schema.poultryBatch.tenant_id, tenantId),
      eq(schema.poultryBatch.company_id, companyId),
      isNull(schema.poultryBatch.deleted_at),
    ];

    if (batchType) conditions.push(eq(schema.poultryBatch.batch_type, batchType));
    if (status) conditions.push(eq(schema.poultryBatch.status, status));

    return this.db
      .select()
      .from(schema.poultryBatch)
      .where(and(...conditions));
  }

  async getDailyEntries(poultryBatchId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.poultryDailyEntry)
      .where(
        and(
          eq(schema.poultryDailyEntry.poultry_batch_id, poultryBatchId),
          eq(schema.poultryDailyEntry.tenant_id, tenantId)
        )
      );
  }
}
