import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, sum } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { PostingEngineService } from '../../finance/services/posting-engine.service';
import { ProductionBatchService } from './production-batch.service';
import { BatchMaterialService } from './batch-material.service';

@Injectable()
export class BatchCostingService {
  constructor(
    private readonly cls: ClsService,
    private readonly batchService: ProductionBatchService,
    private readonly materialService: BatchMaterialService,
    private readonly postingEngine: PostingEngineService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  // --- BATCH COSTING & WIP RECONCILIATION ---

  async calculateBatchCost(batchId: string, tenantId: string) {
    const batch = await this.batchService.findBatchById(batchId, tenantId);

    // 1. Calculate Total Material Inputs Cost
    const inputs = await this.materialService.getBatchInputs(batchId, tenantId);
    const totalMaterialCost = inputs.reduce((acc, i) => acc + parseFloat(i.total_cost), 0);

    // 2. Calculate Resource Usage Cost (Labor, Machine, Overhead)
    const resourceUsages = await this.db
      .select()
      .from(schema.productionResourceUsage)
      .where(and(eq(schema.productionResourceUsage.batch_id, batchId), eq(schema.productionResourceUsage.tenant_id, tenantId)));

    let totalLaborCost = 0;
    let totalMachineCost = 0;
    let totalOverheadCost = 0;

    for (const r of resourceUsages) {
      const cost = parseFloat(r.total_cost);
      if (r.usage_type === 'LABOR') totalLaborCost += cost;
      else if (r.usage_type === 'MACHINE') totalMachineCost += cost;
      else totalOverheadCost += cost;
    }

    const totalResourceCost = totalLaborCost + totalMachineCost;
    const totalBatchCost = totalMaterialCost + totalResourceCost + totalOverheadCost;

    const actualYield = parseFloat(batch.actual_qty);
    const unitCost = actualYield > 0 ? totalBatchCost / actualYield : 0;

    // 3. Update or Insert Production Cost record
    const [existingCost] = await this.db
      .select()
      .from(schema.productionCost)
      .where(eq(schema.productionCost.batch_id, batchId))
      .limit(1);

    if (existingCost) {
      await this.db
        .update(schema.productionCost)
        .set({
          total_material_cost: totalMaterialCost.toFixed(4),
          total_resource_cost: totalResourceCost.toFixed(4),
          total_overhead_cost: totalOverheadCost.toFixed(4),
          total_batch_cost: totalBatchCost.toFixed(4),
          actual_yield_qty: actualYield.toFixed(4),
          unit_cost: unitCost.toFixed(4),
        })
        .where(eq(schema.productionCost.cost_id, existingCost.cost_id));
    } else {
      await this.db.insert(schema.productionCost).values({
        cost_id: randomUUID(),
        tenant_id: tenantId,
        company_id: batch.company_id,
        batch_id: batchId,
        total_material_cost: totalMaterialCost.toFixed(4),
        total_resource_cost: totalResourceCost.toFixed(4),
        total_overhead_cost: totalOverheadCost.toFixed(4),
        total_batch_cost: totalBatchCost.toFixed(4),
        actual_yield_qty: actualYield.toFixed(4),
        unit_cost: unitCost.toFixed(4),
      });
    }

    // 4. Update WIP Summary record
    await this.db
      .update(schema.productionWip)
      .set({
        material_cost: totalMaterialCost.toFixed(4),
        labor_cost: totalLaborCost.toFixed(4),
        machine_cost: totalMachineCost.toFixed(4),
        overhead_cost: totalOverheadCost.toFixed(4),
        total_wip_cost: totalBatchCost.toFixed(4),
        completion_pct: batch.status === 'CLOSED' ? '100.00' : '80.00',
      })
      .where(eq(schema.productionWip.batch_id, batchId));

    return {
      batch_id: batchId,
      total_material_cost: totalMaterialCost,
      total_resource_cost: totalResourceCost,
      total_overhead_cost: totalOverheadCost,
      total_batch_cost: totalBatchCost,
      actual_yield_qty: actualYield,
      unit_cost: unitCost,
    };
  }

  // --- VARIANCE CALCULATION & BATCH CLOSING ---

  async closeBatch(batchId: string, tenantId: string, userId?: string) {
    const batch = await this.batchService.findBatchById(batchId, tenantId);

    if (batch.status === 'CLOSED') {
      throw new BadRequestException(`Batch '${batch.batch_no}' is already CLOSED.`);
    }

    // 1. Calculate final costing
    const costing = await this.calculateBatchCost(batchId, tenantId);

    // 2. Calculate Yield and Cost Variances
    const plannedQty = parseFloat(batch.planned_qty);
    const actualQty = parseFloat(batch.actual_qty);
    const qtyVariance = actualQty - plannedQty;

    const materialVariance = 0; // Standard vs Actual variance
    const laborVariance = 0;
    const totalVariance = Math.abs(qtyVariance * costing.unit_cost);

    const [existingVar] = await this.db
      .select()
      .from(schema.productionVariance)
      .where(eq(schema.productionVariance.batch_id, batchId))
      .limit(1);

    if (existingVar) {
      await this.db
        .update(schema.productionVariance)
        .set({
          planned_qty: plannedQty.toFixed(4),
          actual_qty: actualQty.toFixed(4),
          qty_variance: qtyVariance.toFixed(4),
          material_cost_variance: materialVariance.toFixed(4),
          labor_variance: laborVariance.toFixed(4),
          total_variance_cost: totalVariance.toFixed(4),
        })
        .where(eq(schema.productionVariance.variance_id, existingVar.variance_id));
    } else {
      await this.db.insert(schema.productionVariance).values({
        variance_id: randomUUID(),
        tenant_id: tenantId,
        company_id: batch.company_id,
        batch_id: batchId,
        planned_qty: plannedQty.toFixed(4),
        actual_qty: actualQty.toFixed(4),
        qty_variance: qtyVariance.toFixed(4),
        material_cost_variance: materialVariance.toFixed(4),
        labor_variance: laborVariance.toFixed(4),
        total_variance_cost: totalVariance.toFixed(4),
      });
    }

    // 3. Post Financial Entry via Phase 4 PostingEngine
    if (costing.total_batch_cost > 0) {
      await this.postingEngine.postAutomaticEntry(
        {
          company_id: batch.company_id,
          transaction_type: 'CONSUMPTION',
          amount: costing.total_batch_cost,
          posting_date: new Date().toISOString().split('T')[0],
          ref_doc_type: 'PRODUCTION_BATCH',
          ref_doc_id: batchId,
          notes: `Batch Closure Cost Accounting for Batch ${batch.batch_no}`,
        },
        tenantId,
        userId
      );
    }

    // 4. Update Batch Status to CLOSED
    await this.batchService.transitionStatus(batchId, 'CLOSED' as any, tenantId, userId, 'Batch completed and financial WIP closed.');

    return {
      success: true,
      message: `Production Batch '${batch.batch_no}' successfully closed. Financial WIP zeroed out.`,
      costing,
      variance: {
        planned_qty: plannedQty,
        actual_qty: actualQty,
        qty_variance: qtyVariance,
        total_variance_cost: totalVariance,
      },
    };
  }
}
