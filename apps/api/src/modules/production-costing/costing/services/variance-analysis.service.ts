import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { PostingEngineService } from '../../../finance-accounting/finance/services/posting-engine.service';

@Injectable()
export class VarianceAnalysisService {
  constructor(
    private readonly cls: ClsService,
    private readonly postingEngine: PostingEngineService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async calculateVarianceAnalysis(batchId: string, tenantId: string, userId?: string) {
    const [batch] = await this.db
      .select()
      .from(schema.productionBatch)
      .where(
        and(
          eq(schema.productionBatch.batch_id, batchId),
          eq(schema.productionBatch.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!batch) {
      throw new NotFoundException(`Production Batch '${batchId}' not found.`);
    }

    const costingMethod = (batch.costing_method || 'STANDARD').toUpperCase();

    // FIFO and BIO_ASSET batches do not create standard-cost variance entries
    if (costingMethod !== 'STANDARD') {
      const zeroAnalysis = {
        analysis_id: randomUUID(),
        tenant_id: tenantId,
        company_id: batch.company_id,
        batch_id: batchId,
        usage_variance: '0.0000',
        price_variance: '0.0000',
        yield_variance: '0.0000',
        labor_variance: '0.0000',
        overhead_variance: '0.0000',
        total_variance: '0.0000',
        posted_journal_id: null,
      };

      await this.db.insert(schema.varianceAnalysis).values(zeroAnalysis);
      return zeroAnalysis;
    }

    // 1. Calculate Usage & Price Variance (Planned Inputs vs Actual Consumed Inputs)
    const inputs = await this.db
      .select()
      .from(schema.productionBatchInput)
      .where(eq(schema.productionBatchInput.batch_id, batchId));

    let usageVariance = 0;
    let priceVariance = 0;

    for (const input of inputs) {
      const planned = parseFloat(input.planned_qty);
      const actual = parseFloat(input.actual_qty);
      const actualUnitCost = parseFloat(input.unit_cost || '0.0000');

      // Resolve standard cost from item master
      const [item] = await this.db
        .select({ standard_cost: schema.itemMaster.standard_cost })
        .from(schema.itemMaster)
        .where(eq(schema.itemMaster.item_id, input.item_id))
        .limit(1);

      const standardUnitCost = item ? parseFloat(item.standard_cost || '0') : actualUnitCost;

      usageVariance += (actual - planned) * standardUnitCost;
      priceVariance += (actualUnitCost - standardUnitCost) * actual;
    }

    // 2. Calculate Yield Variance (Planned Output vs Actual Yield)
    const plannedQty = parseFloat(batch.planned_qty);
    const actualQty = parseFloat(batch.actual_qty);

    const outputs = await this.db
      .select()
      .from(schema.productionBatchOutput)
      .where(eq(schema.productionBatchOutput.batch_id, batchId));

    const avgOutputUnitCost = outputs.length > 0
      ? outputs.reduce((sum, o) => sum + parseFloat(o.unit_cost), 0) / outputs.length
      : 0;

    const yieldVariance = (actualQty - plannedQty) * avgOutputUnitCost;

    // 3. Labor & Overhead Variance
    const laborVariance = 0;
    const overheadVariance = 0;

    const totalVariance = usageVariance + priceVariance + yieldVariance + laborVariance + overheadVariance;

    let journalResult: { success: boolean; message: string } | null = null;

    // 4. Post Financial Journal for Variance if variance exists
    if (Math.abs(totalVariance) > 0.001) {
      journalResult = await this.postingEngine.postAutomaticEntry(
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
          ref_doc_id: batchId,
          notes: `Production Batch Variance Financial Posting for Batch ${batch.batch_no}`,
        },
        tenantId,
        userId
      );
    }

    // 5. Record Variance Analysis record
    const analysisId = randomUUID();
    const newAnalysis = {
      analysis_id: analysisId,
      tenant_id: tenantId,
      company_id: batch.company_id,
      batch_id: batchId,
      usage_variance: usageVariance.toFixed(4),
      price_variance: priceVariance.toFixed(4),
      yield_variance: yieldVariance.toFixed(4),
      labor_variance: laborVariance.toFixed(4),
      overhead_variance: overheadVariance.toFixed(4),
      total_variance: totalVariance.toFixed(4),
      posted_journal_id: journalResult ? journalResult.message : null,
    };

    await this.db.insert(schema.varianceAnalysis).values(newAnalysis);

    return newAnalysis;
  }
}
