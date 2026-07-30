/**
 * BatchCostingService — Phase 4 Production & Financial Engine
 *
 * Responsibilities:
 *   - Calculate total batch cost from real WIP data (no hard-coded values).
 *   - On closeBatch():
 *       1. Validate status transition (FINISHED → CLOSED).
 *       2. Enforce QC/QR requirements from LOB configuration.
 *       3. Verify WIP reconciles to zero after output receipts.
 *       4. Create documented variance entries for STANDARD batches only.
 *          FIFO and BIO_ASSET batches skip standard-cost variances.
 *       5. Post a balanced WIP_TRANSFER journal entry.
 *       6. Persist cost summary for reporting.
 */

import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import * as masterSchema from '../../../../core/database/master-schema';
import { MASTER_CONNECTION } from '../../../../core/database/database.module';
import { PostingEngineService } from '../../../finance-accounting/finance/services/posting-engine.service';
import { ProductionBatchService } from './production-batch.service';
import { BatchMaterialService } from './batch-material.service';

@Injectable()
export class BatchCostingService {
  constructor(
    private readonly cls: ClsService,
    private readonly batchService: ProductionBatchService,
    private readonly materialService: BatchMaterialService,
    private readonly postingEngine: PostingEngineService,
    @Inject(MASTER_CONNECTION)
    private readonly masterDb: MySql2Database<typeof masterSchema>,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant database connection context not established.');
    return tenantDb;
  }

  // ─── COST CALCULATION ────────────────────────────────────────────────────────

  async calculateBatchCost(batchId: string, tenantId: string) {
    const batch = await this.batchService.findBatchById(batchId, tenantId);

    // Aggregate material costs from production_batch_input (real FIFO/standard costs)
    const inputs = await this.materialService.getBatchInputs(batchId, tenantId);
    const totalMaterialCost = inputs.reduce((acc, i) => acc + parseFloat(i.total_cost), 0);

    // Aggregate resource costs from production_resource_usage
    const resourceUsages = await this.db
      .select()
      .from(schema.productionResourceUsage)
      .where(
        and(
          eq(schema.productionResourceUsage.batch_id, batchId),
          eq(schema.productionResourceUsage.tenant_id, tenantId),
        ),
      );

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

    // Upsert production_cost summary
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

    // Refresh WIP summary
    await this.db
      .update(schema.productionWip)
      .set({
        material_cost: totalMaterialCost.toFixed(4),
        labor_cost: totalLaborCost.toFixed(4),
        machine_cost: totalMachineCost.toFixed(4),
        overhead_cost: totalOverheadCost.toFixed(4),
        total_wip_cost: totalBatchCost.toFixed(4),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .where(eq(schema.productionWip.batch_id, batchId));

    return {
      batch_id: batchId,
      costing_method: batch.costing_method || 'STANDARD',
      total_material_cost: totalMaterialCost,
      total_labor_cost: totalLaborCost,
      total_machine_cost: totalMachineCost,
      total_overhead_cost: totalOverheadCost,
      total_resource_cost: totalResourceCost,
      total_batch_cost: totalBatchCost,
      actual_yield_qty: actualYield,
      unit_cost: unitCost,
    };
  }

  // ─── LOB CONFIGURATION LOOKUP ────────────────────────────────────────────────

  private async getLobConfig(lobId: string): Promise<{
    qc_required: string;
    qr_required: string;
  } | null> {
    if (!lobId) return null;
    const [lob] = await this.masterDb
      .select({
        qc_required: masterSchema.lobMaster.qc_required,
        qr_required: masterSchema.lobMaster.qr_required,
      })
      .from(masterSchema.lobMaster)
      .where(eq(masterSchema.lobMaster.lob_id, lobId))
      .limit(1);
    return lob ?? null;
  }

  // ─── BATCH CLOSE ──────────────────────────────────────────────────────────────

  async closeBatch(batchId: string, tenantId: string, userId?: string) {
    const batch = await this.batchService.findBatchById(batchId, tenantId);

    // ── Task 4a: Valid status transition ────────────────────────────────────────
    // closeBatch can only be called on a FINISHED batch (state machine:
    // IN_PROGRESS/QUALITY_CHECK → FINISHED → CLOSED).
    if (batch.status === 'CLOSED') {
      throw new BadRequestException(`Batch '${batch.batch_no}' is already CLOSED.`);
    }
    if (batch.status !== 'FINISHED') {
      throw new BadRequestException(
        `Batch '${batch.batch_no}' must be in FINISHED status before closing. Current status: '${batch.status}'.`,
      );
    }

    const costingMethod = (batch.costing_method || 'STANDARD').toUpperCase();

    // ── Task 4b: Enforce QC/QR requirements from LOB configuration ──────────────
    if (batch.lob_id) {
      const lobConfig = await this.getLobConfig(batch.lob_id);

      if (lobConfig?.qc_required === 'YES') {
        // A QC inspection must have been created and linked to this batch
        const [qcInspection] = await this.db
          .select({ inspection_id: schema.qualityInspection.inspection_id })
          .from(schema.qualityInspection)
          .where(
            and(
              eq(schema.qualityInspection.batch_id, batchId),
              eq(schema.qualityInspection.tenant_id, tenantId),
            ),
          )
          .limit(1);

        if (!qcInspection) {
          throw new BadRequestException(
            `LOB '${batch.lob_id}' requires a QC inspection before batch close. ` +
            `No quality inspection record found for batch '${batch.batch_no}'.`,
          );
        }

        // QC result must be PASSED (not QUARANTINE or FAILED)
        const [latestInspection] = await this.db
          .select({
            inspection_id: schema.qualityInspection.inspection_id,
            overall_result: schema.qualityInspection.overall_result,
          })
          .from(schema.qualityInspection)
          .where(
            and(
              eq(schema.qualityInspection.batch_id, batchId),
              eq(schema.qualityInspection.tenant_id, tenantId),
            ),
          )
          .orderBy(schema.qualityInspection.inspected_at)
          .limit(1);

        if (latestInspection && latestInspection.overall_result !== 'PASSED') {
          throw new BadRequestException(
            `Batch '${batch.batch_no}' QC inspection result is '${latestInspection.overall_result}'. ` +
            `Only PASSED inspections allow batch close.`,
          );
        }

        // Store QC inspection ID on batch for audit trail (Task 5)
        await this.db
          .update(schema.productionBatch)
          .set({ qc_inspection_id: latestInspection?.inspection_id || null })
          .where(eq(schema.productionBatch.batch_id, batchId));
      }

      if (lobConfig?.qr_required === 'YES') {
        // A QR barcode must exist for this batch
        const [qrRecord] = await this.db
          .select({ qr_id: schema.qrBarcodeMaster.qr_id })
          .from(schema.qrBarcodeMaster)
          .where(
            and(
              eq(schema.qrBarcodeMaster.entity_id, batchId),
              eq(schema.qrBarcodeMaster.entity_type, 'BATCH'),
              eq(schema.qrBarcodeMaster.tenant_id, tenantId),
            ),
          )
          .limit(1);

        if (!qrRecord) {
          throw new BadRequestException(
            `LOB '${batch.lob_id}' requires a QR/barcode record before batch close. ` +
            `No QR code found for batch '${batch.batch_no}'.`,
          );
        }

        await this.db
          .update(schema.productionBatch)
          .set({ qr_id: qrRecord.qr_id })
          .where(eq(schema.productionBatch.batch_id, batchId));
      }
    }

    // ── Task 4c: Calculate final cost ───────────────────────────────────────────
    const costing = await this.calculateBatchCost(batchId, tenantId);

    // ── Task 4d: WIP reconciliation — outputs must absorb all WIP cost ─────────
    //
    // Sum of (output.unit_cost * output.qty) must equal total_wip_cost within a
    // small tolerance. This ensures the batch WIP is fully transferred to
    // finished goods / by-products before close.
    const outputs = await this.materialService.getBatchOutputs(batchId, tenantId);
    const totalOutputCost = outputs.reduce(
      (acc, o) => acc + parseFloat(o.unit_cost) * parseFloat(o.qty),
      0,
    );

    const wipBalance = costing.total_batch_cost - totalOutputCost;
    const WIP_TOLERANCE = 0.01; // Allow ±0.01 currency unit for rounding

    if (Math.abs(wipBalance) > WIP_TOLERANCE) {
      throw new BadRequestException(
        `WIP not fully reconciled for batch '${batch.batch_no}'. ` +
        `Total WIP cost: ${costing.total_batch_cost.toFixed(4)}, ` +
        `Total output cost: ${totalOutputCost.toFixed(4)}, ` +
        `Unreconciled balance: ${wipBalance.toFixed(4)}. ` +
        `Record additional outputs or adjust cost split percentages to zero the WIP balance.`,
      );
    }

    // ── Task 4e: Variance analysis (STANDARD only; skip for FIFO and BIO_ASSET) ─
    let varianceRecord: Record<string, number | string> | null = null;

    if (costingMethod === 'STANDARD') {
      varianceRecord = await this.createStandardCostVariances(batch, costing, tenantId, userId);
    }
    // FIFO and BIO_ASSET: no standard-cost variances — costs absorb actual values.

    // ── Task 4f: Post WIP_TRANSFER journal entry (balanced: Dr Finished Goods, Cr WIP) ─
    if (costing.total_batch_cost > 0) {
      await this.postingEngine.postAutomaticEntry(
        {
          company_id: batch.company_id,
          nob_id: batch.nob_id || undefined,
          lob_id: batch.lob_id || undefined,
          stage: batch.stage || undefined,
          valuation_method: costingMethod,
          transaction_type: 'WIP_TRANSFER',
          amount: costing.total_batch_cost,
          posting_date: new Date().toISOString().split('T')[0],
          ref_doc_type: 'PRODUCTION_BATCH',
          ref_doc_id: batchId,
          notes: `Batch close WIP transfer — ${batch.batch_no} (${costingMethod})`,
        },
        tenantId,
        userId,
      );
    }

    // ── Task 4g: Zero out WIP after reconciliation ────────────────────────────
    await this.db
      .update(schema.productionWip)
      .set({
        material_cost: '0.0000',
        labor_cost: '0.0000',
        machine_cost: '0.0000',
        overhead_cost: '0.0000',
        total_wip_cost: '0.0000',
        completion_pct: '100.00',
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .where(eq(schema.productionWip.batch_id, batchId));

    // ── Task 4h: Finalise batch_cost_summary (Task 5 — reporting foundation) ────
    await this.db
      .insert(schema.batchCostSummary)
      .values({
        summary_id: randomUUID(),
        tenant_id: tenantId,
        company_id: batch.company_id,
        batch_id: batchId,
        opening_wip_cost: '0.0000',
        material_cost: costing.total_material_cost.toFixed(4),
        labor_cost: costing.total_labor_cost.toFixed(4),
        machine_cost: costing.total_machine_cost.toFixed(4),
        overhead_cost: costing.total_overhead_cost.toFixed(4),
        total_batch_cost: costing.total_batch_cost.toFixed(4),
        actual_output_qty: costing.actual_yield_qty.toFixed(4),
        unit_cost: costing.unit_cost.toFixed(4),
        finalized_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .onDuplicateKeyUpdate({
        set: {
          material_cost: costing.total_material_cost.toFixed(4),
          labor_cost: costing.total_labor_cost.toFixed(4),
          machine_cost: costing.total_machine_cost.toFixed(4),
          overhead_cost: costing.total_overhead_cost.toFixed(4),
          total_batch_cost: costing.total_batch_cost.toFixed(4),
          actual_output_qty: costing.actual_yield_qty.toFixed(4),
          unit_cost: costing.unit_cost.toFixed(4),
          finalized_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });

    // ── Task 4i: Transition batch status to CLOSED ────────────────────────────
    await this.batchService.transitionStatus(batchId, 'CLOSED' as any, tenantId, userId,
      'Batch closed — WIP reconciled, costs finalised.');

    return {
      success: true,
      batch_no: batch.batch_no,
      costing_method: costingMethod,
      costing,
      variance: varianceRecord,
      message: `Production Batch '${batch.batch_no}' successfully closed.`,
    };
  }

  // ─── STANDARD COST VARIANCE CALCULATION ──────────────────────────────────────
  //
  // Task 4: STANDARD batches create documented price, usage, output/yield, and
  // overhead variances. FIFO and BIO_ASSET batches skip this.
  //
  // Variance types (per RAK Functional Doc and Transaction Ledger Structure):
  //   - Usage variance  : (actual_qty − planned_qty) × standard_unit_cost per input
  //   - Price variance  : (actual_unit_cost − standard_cost) × actual_qty per input
  //   - Yield variance  : (actual_output − planned_output) × standard_unit_cost
  //   - Overhead variance: actual_overhead − planned_overhead (resource usage vs budget)

  private async createStandardCostVariances(
    batch: typeof schema.productionBatch.$inferSelect,
    costing: Awaited<ReturnType<typeof this.calculateBatchCost>>,
    tenantId: string,
    userId?: string,
  ) {
    const inputs = await this.materialService.getBatchInputs(batch.batch_id, tenantId);

    let usageVariance = 0;
    let priceVariance = 0;

    for (const input of inputs) {
      const plannedQty = parseFloat(input.planned_qty);
      const actualQty = parseFloat(input.actual_qty);
      const actualUnitCost = parseFloat(input.unit_cost);

      // Resolve item standard cost for variance calculation
      const [item] = await this.db
        .select({ standard_cost: schema.itemMaster.standard_cost })
        .from(schema.itemMaster)
        .where(eq(schema.itemMaster.item_id, input.item_id))
        .limit(1);

      const standardUnitCost = item ? parseFloat(item.standard_cost || '0') : 0;

      // Usage variance = (actual − planned) × standard_cost
      usageVariance += (actualQty - plannedQty) * standardUnitCost;

      // Price variance = (actual_cost − standard_cost) × actual_qty
      priceVariance += (actualUnitCost - standardUnitCost) * actualQty;
    }

    // Yield variance = (actual_output − planned_output) × standard_unit_cost
    const plannedQty = parseFloat(batch.planned_qty);
    const actualQty = parseFloat(batch.actual_qty);

    // Standard unit cost for the output item — use the batch's own unit_cost
    const standardOutputCost = costing.unit_cost;
    const yieldVariance = (actualQty - plannedQty) * standardOutputCost;

    // Overhead variance = actual_overhead − 0 (no overhead budget on batch yet)
    // When overhead budgets are added to CreateProductionBatchDto, compare here.
    const overheadVariance = costing.total_overhead_cost; // All overhead is variance when no budget

    const totalVariance = usageVariance + priceVariance + yieldVariance + overheadVariance;

    // Upsert variance_analysis record (costing module table)
    const [existingVar] = await this.db
      .select()
      .from(schema.varianceAnalysis)
      .where(eq(schema.varianceAnalysis.batch_id, batch.batch_id))
      .limit(1);

    const varianceData = {
      usage_variance: usageVariance.toFixed(4),
      price_variance: priceVariance.toFixed(4),
      yield_variance: yieldVariance.toFixed(4),
      labor_variance: '0.0000',
      overhead_variance: overheadVariance.toFixed(4),
      total_variance: totalVariance.toFixed(4),
    };

    if (existingVar) {
      await this.db
        .update(schema.varianceAnalysis)
        .set(varianceData)
        .where(eq(schema.varianceAnalysis.analysis_id, existingVar.analysis_id));
    } else {
      await this.db.insert(schema.varianceAnalysis).values({
        analysis_id: randomUUID(),
        tenant_id: tenantId,
        company_id: batch.company_id,
        batch_id: batch.batch_id,
        ...varianceData,
      });
    }

    // Also upsert the production_variance table (production module — qty-focused)
    const [existingProdVar] = await this.db
      .select()
      .from(schema.productionVariance)
      .where(eq(schema.productionVariance.batch_id, batch.batch_id))
      .limit(1);

    const prodVarianceData = {
      planned_qty: plannedQty.toFixed(4),
      actual_qty: actualQty.toFixed(4),
      qty_variance: (actualQty - plannedQty).toFixed(4),
      material_cost_variance: (usageVariance + priceVariance).toFixed(4),
      labor_variance: '0.0000',
      total_variance_cost: totalVariance.toFixed(4),
    };

    if (existingProdVar) {
      await this.db
        .update(schema.productionVariance)
        .set(prodVarianceData)
        .where(eq(schema.productionVariance.variance_id, existingProdVar.variance_id));
    } else {
      await this.db.insert(schema.productionVariance).values({
        variance_id: randomUUID(),
        tenant_id: tenantId,
        company_id: batch.company_id,
        batch_id: batch.batch_id,
        ...prodVarianceData,
      });
    }

    // Post variance journal entry if there is a net variance to post
    if (Math.abs(totalVariance) > 0.001) {
      await this.postingEngine.postAutomaticEntry(
        {
          company_id: batch.company_id,
          nob_id: batch.nob_id || undefined,
          lob_id: batch.lob_id || undefined,
          stage: batch.stage || undefined,
          valuation_method: 'STANDARD',
          transaction_type: 'VARIANCE',
          amount: Math.abs(totalVariance),
          posting_date: new Date().toISOString().split('T')[0],
          ref_doc_type: 'VARIANCE_ANALYSIS',
          ref_doc_id: batch.batch_id,
          notes:
            `STANDARD cost variance — Batch ${batch.batch_no}. ` +
            `Usage: ${usageVariance.toFixed(4)}, Price: ${priceVariance.toFixed(4)}, ` +
            `Yield: ${yieldVariance.toFixed(4)}, Overhead: ${overheadVariance.toFixed(4)}`,
        },
        tenantId,
        userId,
      );
    }

    return {
      usage_variance: usageVariance,
      price_variance: priceVariance,
      yield_variance: yieldVariance,
      overhead_variance: overheadVariance,
      total_variance: totalVariance,
    };
  }
}
