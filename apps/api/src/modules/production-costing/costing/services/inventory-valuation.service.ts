import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { PostingEngineService } from '../../../finance-accounting/finance/services/posting-engine.service';
import { RevaluateItemCostDto } from '../dto/costing-revaluation.dto';

@Injectable()
export class InventoryValuationService {
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

  // --- REVALUATE ITEM COST (STANDARD / WEIGHTED AVG REVALUATION & GL ADJUSTMENT) ---

  async revaluateItemCost(dto: RevaluateItemCostDto, tenantId: string, userId?: string) {
    const [item] = await this.db
      .select()
      .from(schema.itemMaster)
      .where(
        and(
          eq(schema.itemMaster.item_id, dto.item_id),
          eq(schema.itemMaster.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Item '${dto.item_id}' not found.`);
    }

    const oldCost = parseFloat(item.standard_cost || '0.0000');
    const newCost = dto.new_cost;
    const costDiff = newCost - oldCost;

    // 1. Fetch total current inventory balance for item
    const balances = await this.db
      .select()
      .from(schema.inventoryBalance)
      .where(
        and(
          eq(schema.inventoryBalance.item_id, dto.item_id),
          eq(schema.inventoryBalance.tenant_id, tenantId),
          eq(schema.inventoryBalance.company_id, dto.company_id)
        )
      );

    const totalStockQty = balances.reduce((acc, b) => acc + parseFloat(b.qty_on_hand), 0);
    const revaluationAmount = Math.abs(totalStockQty * costDiff);

    let journalResult: { success: boolean; message: string } | null = null;

    // 2. Post GL revaluation entry via Phase 4 PostingEngine if stock exists & cost changed
    if (revaluationAmount > 0) {
      journalResult = await this.postingEngine.postAutomaticEntry(
        {
          company_id: dto.company_id,
          transaction_type: 'ADJUSTMENT',
          amount: revaluationAmount,
          posting_date: new Date().toISOString().split('T')[0],
          ref_doc_type: 'COST_REVALUATION',
          ref_doc_id: dto.item_id,
          notes: `Inventory Cost Revaluation for Item ${item.item_code} (${oldCost} -> ${newCost}). Reason: ${dto.change_reason}`,
        },
        tenantId,
        userId
      );
    }

    // 3. Update Item Master standard cost
    await this.db
      .update(schema.itemMaster)
      .set({
        standard_cost: newCost.toFixed(4),
      })
      .where(eq(schema.itemMaster.item_id, dto.item_id));

    // 4. Record Cost History
    const historyId = randomUUID();
    const newHistory = {
      history_id: historyId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      item_id: dto.item_id,
      old_cost: oldCost.toFixed(4),
      new_cost: newCost.toFixed(4),
      change_reason: dto.change_reason,
      revaluation_journal_id: journalResult ? journalResult.message : null,
    };

    await this.db.insert(schema.itemCostHistory).values(newHistory);

    return {
      item_id: dto.item_id,
      old_cost: oldCost,
      new_cost: newCost,
      total_stock_qty: totalStockQty,
      revaluation_amount: revaluationAmount,
      gl_posting: journalResult,
    };
  }

  async getItemCostHistory(itemId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.itemCostHistory)
      .where(
        and(
          eq(schema.itemCostHistory.item_id, itemId),
          eq(schema.itemCostHistory.tenant_id, tenantId)
        )
      );
  }
}
