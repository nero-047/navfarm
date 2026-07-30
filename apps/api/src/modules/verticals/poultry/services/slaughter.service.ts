import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { ProductionBatchService } from '../../../production-costing/production/services/production-batch.service';
import { BatchMaterialService } from '../../../production-costing/production/services/batch-material.service';
import { SlaughterCostSplitService } from './slaughter-cost-split.service';
import { RecordSlaughterYieldDto, RecordMultiOutputSlaughterYieldDto } from '../dto/slaughter.dto';

@Injectable()
export class SlaughterService {
  constructor(
    private readonly cls: ClsService,
    private readonly productionBatchService: ProductionBatchService,
    private readonly batchMaterialService: BatchMaterialService,
    private readonly costSplitService: SlaughterCostSplitService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async recordSlaughterYield(dto: RecordSlaughterYieldDto, tenantId: string, userId?: string) {
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

    // Calculate Dressing Yield % = (Dressed Weight / Live Weight) * 100
    const yieldPct = dto.total_live_weight_kg > 0 ? (dto.dressed_weight_kg / dto.total_live_weight_kg) * 100 : 0;

    // 1. Post Finished Meat Receipt into inventory via Phase 3 Inventory Engine
    const outputRes = await this.batchMaterialService.receiveBatchOutput(
      {
        company_id: dto.company_id,
        batch_id: pBatch.production_batch_id,
        item_id: dto.meat_item_id,
        uom_id: dto.uom_id,
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        output_type: 'FINISHED_GOOD' as any,
        qty: dto.dressed_weight_kg,
        cost_split_pct: 100,
      },
      tenantId,
      userId
    );

    // 2. Record Slaughter yield entry
    const slaughterId = randomUUID();
    const newSlaughter = {
      slaughter_id: slaughterId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      poultry_batch_id: dto.poultry_batch_id,
      slaughter_date: dto.slaughter_date,
      live_birds_received: dto.live_birds_received,
      total_live_weight_kg: dto.total_live_weight_kg.toFixed(4),
      dressed_weight_kg: dto.dressed_weight_kg.toFixed(4),
      yield_pct: yieldPct.toFixed(2),
      goods_receipt_id: outputRes.output.goods_receipt_id,
    };

    await this.db.insert(schema.poultrySlaughter).values(newSlaughter);

    // 3. Mark poultry_batch status as COMPLETED
    await this.db
      .update(schema.poultryBatch)
      .set({
        status: 'COMPLETED',
      })
      .where(eq(schema.poultryBatch.poultry_batch_id, dto.poultry_batch_id));

    return newSlaughter;
  }

  async recordMultiOutputSlaughterYield(dto: RecordMultiOutputSlaughterYieldDto, tenantId: string, userId?: string) {
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

    const totalDressedWeight = dto.outputs.reduce((sum, o) => sum + o.qty_kg, 0);
    const yieldPct = dto.total_live_weight_kg > 0 ? (totalDressedWeight / dto.total_live_weight_kg) * 100 : 0;

    // Resolve dynamic cost splits (PERCENTAGE, WEIGHT, or MARKET_VALUE)
    const allocationMethod = (dto as any).allocation_method || 'PERCENTAGE';
    const dynamicSplits = typeof this.costSplitService.calculateDynamicCostSplits === 'function'
      ? await this.costSplitService.calculateDynamicCostSplits(
          dto.company_id,
          dto.outputs,
          allocationMethod,
          tenantId
        )
      : null;

    // Fetch configured cost split percentages for company if dynamicSplits not present
    const configuredSplits = dynamicSplits ? [] : await this.costSplitService.getCostSplitConfigs(dto.company_id, tenantId);

    const postedOutputs: any[] = [];
    let primaryReceiptId: string | null = null;
    const slaughterId = randomUUID();

    for (const output of dto.outputs) {
      let splitPct = output.cost_split_pct;
      if (splitPct === undefined || splitPct === null) {
        if (dynamicSplits) {
          const splitInfo = dynamicSplits.find((s) => s.item_id === output.item_id);
          splitPct = splitInfo ? splitInfo.calculated_split_pct : (100 / dto.outputs.length);
        } else {
          const conf = configuredSplits.find(c => c.item_id === output.item_id);
          if (conf) {
            splitPct = parseFloat(conf.cost_split_pct);
          } else {
            splitPct = totalDressedWeight > 0 ? (output.qty_kg / totalDressedWeight) * 100 : (100 / dto.outputs.length);
          }
        }
      }

      const res = await this.batchMaterialService.receiveBatchOutput(
        {
          company_id: dto.company_id,
          batch_id: pBatch.production_batch_id,
          item_id: output.item_id,
          uom_id: output.uom_id,
          warehouse_id: dto.warehouse_id,
          location_id: dto.location_id,
          output_type: output.output_type as any,
          qty: output.qty_kg,
          cost_split_pct: splitPct,
        },
        tenantId,
        userId,
      );

      if (!primaryReceiptId) {
        primaryReceiptId = res.output.goods_receipt_id;
      }

      // Persist cost split execution history
      await this.db.insert(schema.slaughterCostSplitExecution).values({
        execution_id: randomUUID(),
        tenant_id: tenantId,
        company_id: dto.company_id,
        slaughter_id: slaughterId,
        item_id: output.item_id,
        output_type: output.output_type,
        qty_kg: output.qty_kg.toFixed(4),
        calculated_split_pct: splitPct.toFixed(4),
        allocated_cost: parseFloat(res.output.unit_cost) * output.qty_kg,
        goods_receipt_id: res.output.goods_receipt_id,
      });

      postedOutputs.push({ ...output, cost_split_pct: splitPct, goods_receipt_id: res.output.goods_receipt_id });
    }

    const newSlaughter = {
      slaughter_id: slaughterId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      poultry_batch_id: dto.poultry_batch_id,
      slaughter_date: dto.slaughter_date,
      live_birds_received: dto.live_birds_received,
      total_live_weight_kg: dto.total_live_weight_kg.toFixed(4),
      dressed_weight_kg: totalDressedWeight.toFixed(4),
      yield_pct: yieldPct.toFixed(2),
      goods_receipt_id: primaryReceiptId,
    };

    await this.db.insert(schema.poultrySlaughter).values(newSlaughter);

    await this.db
      .update(schema.poultryBatch)
      .set({ status: 'COMPLETED' })
      .where(eq(schema.poultryBatch.poultry_batch_id, dto.poultry_batch_id));

    return {
      slaughter: newSlaughter,
      outputs: postedOutputs,
    };
  }
}
