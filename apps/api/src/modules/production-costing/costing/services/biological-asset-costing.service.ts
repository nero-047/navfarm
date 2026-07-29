import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';

@Injectable()
export class BiologicalAssetCostingService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async calculateBiologicalAssetValuation(poultryBatchId: string, tenantId: string) {
    const [pBatch] = await this.db
      .select()
      .from(schema.poultryBatch)
      .where(
        and(
          eq(schema.poultryBatch.poultry_batch_id, poultryBatchId),
          eq(schema.poultryBatch.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!pBatch) {
      throw new NotFoundException(`Poultry Batch '${poultryBatchId}' not found.`);
    }

    // 1. Calculate Feed & Material Costs from Phase 5 Batch Inputs linked to production batch
    const inputs = await this.db
      .select()
      .from(schema.productionBatchInput)
      .where(eq(schema.productionBatchInput.batch_id, pBatch.production_batch_id));

    const feedCost = inputs.reduce((acc, i) => acc + parseFloat(i.total_cost), 0);

    // 2. Calculate Labor & Resource Costs
    const resourceUsages = await this.db
      .select()
      .from(schema.productionResourceUsage)
      .where(eq(schema.productionResourceUsage.batch_id, pBatch.production_batch_id));

    let laborCost = 0;
    let overheadCost = 0;

    for (const r of resourceUsages) {
      const cost = parseFloat(r.total_cost);
      if (r.usage_type === 'LABOR') laborCost += cost;
      else overheadCost += cost;
    }

    const acquisitionCost = pBatch.initial_bird_count * 1.5; // Initial DOC placement cost baseline
    const grossAssetValue = acquisitionCost + feedCost + laborCost + overheadCost;

    // Calculate Mortality Loss Impact
    const mortalityCount = pBatch.total_mortality;
    const liveCount = Math.max(1, pBatch.current_bird_count);
    const mortalityLossCost = pBatch.initial_bird_count > 0 ? (mortalityCount / pBatch.initial_bird_count) * grossAssetValue : 0;
    const netAssetValue = grossAssetValue - mortalityLossCost;

    const costPerBird = netAssetValue / liveCount;

    // 3. Upsert Biological Asset Cost record
    const [existing] = await this.db
      .select()
      .from(schema.biologicalAssetCost)
      .where(eq(schema.biologicalAssetCost.poultry_batch_id, poultryBatchId))
      .limit(1);

    if (existing) {
      await this.db
        .update(schema.biologicalAssetCost)
        .set({
          acquisition_cost: acquisitionCost.toFixed(4),
          feed_cost: feedCost.toFixed(4),
          labor_cost: laborCost.toFixed(4),
          overhead_cost: overheadCost.toFixed(4),
          mortality_loss_cost: mortalityLossCost.toFixed(4),
          net_asset_value: netAssetValue.toFixed(4),
          current_bird_count: liveCount,
          cost_per_bird: costPerBird.toFixed(4),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.biologicalAssetCost.asset_cost_id, existing.asset_cost_id));
    } else {
      await this.db.insert(schema.biologicalAssetCost).values({
        asset_cost_id: randomUUID(),
        tenant_id: tenantId,
        company_id: pBatch.company_id,
        poultry_batch_id: poultryBatchId,
        acquisition_cost: acquisitionCost.toFixed(4),
        feed_cost: feedCost.toFixed(4),
        medicine_cost: '0.0000',
        labor_cost: laborCost.toFixed(4),
        overhead_cost: overheadCost.toFixed(4),
        mortality_loss_cost: mortalityLossCost.toFixed(4),
        net_asset_value: netAssetValue.toFixed(4),
        current_bird_count: liveCount,
        cost_per_bird: costPerBird.toFixed(4),
      });
    }

    // 4. Update Poultry KPI snapshot with cost_per_bird
    await this.db
      .update(schema.poultryKpi)
      .set({
        cost_per_bird: costPerBird.toFixed(4),
      })
      .where(eq(schema.poultryKpi.poultry_batch_id, poultryBatchId));

    return {
      poultry_batch_id: poultryBatchId,
      acquisition_cost: acquisitionCost,
      feed_cost: feedCost,
      labor_cost: laborCost,
      overhead_cost: overheadCost,
      mortality_loss_cost: mortalityLossCost,
      net_asset_value: netAssetValue,
      current_bird_count: liveCount,
      cost_per_bird: costPerBird,
    };
  }
}
