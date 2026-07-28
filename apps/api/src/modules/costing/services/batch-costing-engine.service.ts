import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class BatchCostingEngineService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getBatchCostSummary(batchId: string, tenantId: string) {
    const [summary] = await this.db
      .select()
      .from(schema.batchCostSummary)
      .where(
        and(
          eq(schema.batchCostSummary.batch_id, batchId),
          eq(schema.batchCostSummary.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (summary) return summary;

    // Fallback: Query productionCost table from Phase 5
    const [pCost] = await this.db
      .select()
      .from(schema.productionCost)
      .where(eq(schema.productionCost.batch_id, batchId))
      .limit(1);

    return pCost || null;
  }

  async finalizeBatchCostSummary(
    batchId: string,
    companyId: string,
    tenantId: string,
    costs: {
      material_cost: number;
      labor_cost: number;
      machine_cost: number;
      overhead_cost: number;
      actual_output_qty: number;
    }
  ) {
    const totalCost = costs.material_cost + costs.labor_cost + costs.machine_cost + costs.overhead_cost;
    const unitCost = costs.actual_output_qty > 0 ? totalCost / costs.actual_output_qty : 0;

    const [existing] = await this.db
      .select()
      .from(schema.batchCostSummary)
      .where(eq(schema.batchCostSummary.batch_id, batchId))
      .limit(1);

    if (existing) {
      await this.db
        .update(schema.batchCostSummary)
        .set({
          material_cost: costs.material_cost.toFixed(4),
          labor_cost: costs.labor_cost.toFixed(4),
          machine_cost: costs.machine_cost.toFixed(4),
          overhead_cost: costs.overhead_cost.toFixed(4),
          total_batch_cost: totalCost.toFixed(4),
          actual_output_qty: costs.actual_output_qty.toFixed(4),
          unit_cost: unitCost.toFixed(4),
          finalized_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.batchCostSummary.summary_id, existing.summary_id));
    } else {
      await this.db.insert(schema.batchCostSummary).values({
        summary_id: randomUUID(),
        tenant_id: tenantId,
        company_id: companyId,
        batch_id: batchId,
        opening_wip_cost: '0.0000',
        material_cost: costs.material_cost.toFixed(4),
        labor_cost: costs.labor_cost.toFixed(4),
        machine_cost: costs.machine_cost.toFixed(4),
        overhead_cost: costs.overhead_cost.toFixed(4),
        total_batch_cost: totalCost.toFixed(4),
        actual_output_qty: costs.actual_output_qty.toFixed(4),
        unit_cost: unitCost.toFixed(4),
        finalized_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }

    return {
      batch_id: batchId,
      total_batch_cost: totalCost,
      actual_output_qty: costs.actual_output_qty,
      unit_cost: unitCost,
    };
  }
}
