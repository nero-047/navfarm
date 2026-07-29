import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { ProductionBatchService } from '../../../production-costing/production/services/production-batch.service';
import { RecordEggSettingDto, RecordHatchResultDto } from '../dto/hatchery.dto';

@Injectable()
export class HatcheryService {
  constructor(
    private readonly cls: ClsService,
    private readonly productionBatchService: ProductionBatchService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async recordEggSetting(dto: RecordEggSettingDto, tenantId: string, userId?: string) {
    // 1. Create underlying Incubator Production Batch via Phase 5
    const prodBatch = await this.productionBatchService.createBatch(
      {
        company_id: dto.company_id,
        batch_no: dto.batch_no,
        farm_id: dto.farm_id,
        shed_id: dto.shed_id,
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        planned_qty: dto.eggs_set_qty,
        notes: `Hatchery Incubator Run (${dto.eggs_set_qty} Eggs Set)`,
      },
      tenantId,
      userId
    );

    // 2. Create Poultry Hatchery Batch record
    const poultryBatchId = randomUUID();
    const newPoultryBatch = {
      poultry_batch_id: poultryBatchId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      farm_id: dto.farm_id,
      shed_id: dto.shed_id,
      production_batch_id: prodBatch.batch_id,
      batch_type: 'HATCHERY',
      placement_date: dto.setting_date,
      initial_bird_count: dto.eggs_set_qty,
      current_bird_count: dto.eggs_set_qty,
      total_mortality: 0,
      status: 'ACTIVE',
      created_by: userId || null,
    };

    await this.db.insert(schema.poultryBatch).values(newPoultryBatch);

    const hatchId = randomUUID();
    const newHatchery = {
      hatch_id: hatchId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      poultry_batch_id: poultryBatchId,
      setting_date: dto.setting_date,
      eggs_set_qty: dto.eggs_set_qty,
      candled_fertile_qty: 0,
      chicks_hatched_qty: 0,
      hatch_loss_qty: 0,
      hatchability_pct: '0.00',
    };

    await this.db.insert(schema.poultryHatchery).values(newHatchery);

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

    return newHatchery;
  }

  async recordHatchResult(dto: RecordHatchResultDto, tenantId: string, userId?: string) {
    const [hatchery] = await this.db
      .select()
      .from(schema.poultryHatchery)
      .where(
        and(
          eq(schema.poultryHatchery.poultry_batch_id, dto.poultry_batch_id),
          eq(schema.poultryHatchery.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!hatchery) {
      throw new NotFoundException(`Hatchery batch record for '${dto.poultry_batch_id}' not found.`);
    }

    // Calculate Hatchability % = (Chicks Hatched / Eggs Set) * 100
    const hatchabilityPct = hatchery.eggs_set_qty > 0 ? (dto.chicks_hatched_qty / hatchery.eggs_set_qty) * 100 : 0;
    const hatchLoss = dto.hatch_loss_qty || Math.max(0, hatchery.eggs_set_qty - dto.chicks_hatched_qty);

    await this.db
      .update(schema.poultryHatchery)
      .set({
        hatch_date: dto.hatch_date,
        candled_fertile_qty: dto.candled_fertile_qty,
        chicks_hatched_qty: dto.chicks_hatched_qty,
        hatch_loss_qty: hatchLoss,
        hatchability_pct: hatchabilityPct.toFixed(2),
      })
      .where(eq(schema.poultryHatchery.hatch_id, hatchery.hatch_id));

    // Update KPI Snapshot
    await this.db
      .update(schema.poultryKpi)
      .set({
        hatchability_pct: hatchabilityPct.toFixed(2),
      })
      .where(eq(schema.poultryKpi.poultry_batch_id, dto.poultry_batch_id));

    return {
      hatch_id: hatchery.hatch_id,
      chicks_hatched_qty: dto.chicks_hatched_qty,
      hatchability_pct: hatchabilityPct,
    };
  }
}
