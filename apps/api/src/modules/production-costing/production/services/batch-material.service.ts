import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { GoodsIssueService } from '../../../inventory-logistics/inventory/services/goods-issue.service';
import { GoodsReceiptService } from '../../../inventory-logistics/inventory/services/goods-receipt.service';
import { AddBatchInputDto, RecordBatchOutputDto } from '../dto/batch-input-output.dto';
import { ProductionBatchService } from './production-batch.service';

@Injectable()
export class BatchMaterialService {
  constructor(
    private readonly cls: ClsService,
    private readonly batchService: ProductionBatchService,
    private readonly goodsIssueService: GoodsIssueService,
    private readonly goodsReceiptService: GoodsReceiptService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  // ─── MATERIAL INPUT CONSUMPTION ──────────────────────────────────────────────
  //
  // Task 2 (Phase 4): Goods issues must capture actual valuation cost; never
  // record production inputs at zero cost.
  //
  // Flow:
  //   1. Create a DRAFT Goods Issue document.
  //   2. Post it — the GI engine resolves the FIFO / standard unit cost and
  //      writes it to the inventory_ledger row.
  //   3. Read the actual cost back from that ledger entry.
  //   4. Persist production_batch_input with real cost.
  //   5. Update the production_wip material_cost accumulator.

  async issueBatchMaterials(dto: AddBatchInputDto, tenantId: string, userId?: string) {
    const batch = await this.batchService.findBatchById(dto.batch_id, tenantId);

    if (['DRAFT', 'FINISHED', 'CLOSED'].includes(batch.status)) {
      throw new BadRequestException(
        `Cannot issue raw materials for batch in status '${batch.status}'.`,
      );
    }

    const actualQty = dto.actual_qty !== undefined ? dto.actual_qty : dto.planned_qty;
    if (actualQty <= 0) {
      throw new BadRequestException('Actual quantity must be greater than zero.');
    }

    // 1. Create DRAFT Goods Issue
    const giDraft = await this.goodsIssueService.create(
      {
        company_id: dto.company_id,
        warehouse_id: dto.warehouse_id,
        issue_type: 'PRODUCTION',
        posting_date: new Date().toISOString().split('T')[0],
        notes: `Production material issue — Batch ${batch.batch_no}, Item ${dto.item_id}`,
        lines: [
          {
            item_id: dto.item_id,
            location_id: dto.location_id,
            lot_id: dto.lot_id || undefined,
            serial_id: dto.serial_id || undefined,
            qty: actualQty,
            uom_code: dto.uom_id || 'KG',
          },
        ],
      },
      tenantId,
      userId,
    );

    // 2. Post the Goods Issue — depletes stock, resolves FIFO/standard cost,
    //    updates inventory_ledger with actual unit_cost and total_value.
    await this.goodsIssueService.post(giDraft.issue_id, tenantId, userId);

    // 3. Read the actual cost from the posted inventory ledger entry.
    //    The GI post writes exactly one ledger row per issue line (GOODS_ISSUE
    //    transaction_type) referencing this issue_id. total_value is stored as
    //    a negative number (value leaving stock); abs() gives the cost incurred.
    const [ledgerEntry] = await this.db
      .select({
        unit_cost: schema.inventoryLedger.unit_cost,
        total_value: schema.inventoryLedger.total_value,
      })
      .from(schema.inventoryLedger)
      .where(
        and(
          eq(schema.inventoryLedger.ref_doc_id, giDraft.issue_id),
          eq(schema.inventoryLedger.ref_doc_type, 'GoodsIssue'),
          eq(schema.inventoryLedger.tenant_id, tenantId),
        ),
      )
      .orderBy(desc(schema.inventoryLedger.created_at))
      .limit(1);

    // If no ledger entry was found (e.g. dry-run test), guard against zero cost
    const unitCost = ledgerEntry ? Math.abs(parseFloat(ledgerEntry.unit_cost)) : 0;
    const totalCost = ledgerEntry ? Math.abs(parseFloat(ledgerEntry.total_value)) : 0;

    if (unitCost === 0 && actualQty > 0) {
      throw new BadRequestException(
        `Production input for batch '${batch.batch_no}' item '${dto.item_id}' cannot be recorded at zero cost. ` +
        `Ensure item standard cost or FIFO layers are configured.`,
      );
    }

    // 4. Record Input in the Production Engine with real cost
    const inputId = randomUUID();
    const newInput = {
      input_id: inputId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      item_id: dto.item_id,
      uom_id: dto.uom_id,
      warehouse_id: dto.warehouse_id,
      location_id: dto.location_id,
      lot_id: dto.lot_id || null,
      serial_id: dto.serial_id || null,
      planned_qty: dto.planned_qty.toFixed(4),
      actual_qty: actualQty.toFixed(4),
      unit_cost: unitCost.toFixed(4),
      total_cost: totalCost.toFixed(4),
      goods_issue_id: giDraft.issue_id,
    };

    await this.db.insert(schema.productionBatchInput).values(newInput);

    // 5. Accumulate into the production WIP material_cost
    const [wip] = await this.db
      .select()
      .from(schema.productionWip)
      .where(eq(schema.productionWip.batch_id, dto.batch_id))
      .limit(1);

    if (wip) {
      const newMaterialCost = parseFloat(wip.material_cost) + totalCost;
      const newTotal = newMaterialCost
        + parseFloat(wip.labor_cost)
        + parseFloat(wip.machine_cost)
        + parseFloat(wip.overhead_cost);

      await this.db
        .update(schema.productionWip)
        .set({
          material_cost: newMaterialCost.toFixed(4),
          total_wip_cost: newTotal.toFixed(4),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.productionWip.batch_id, dto.batch_id));
    }

    // 6. Transition Batch Status to MATERIAL_ISSUED if currently RELEASED
    if (batch.status === 'RELEASED') {
      await this.batchService.transitionStatus(
        dto.batch_id,
        'MATERIAL_ISSUED' as any,
        tenantId,
        userId,
      );
    }

    return { input: newInput, goods_issue_id: giDraft.issue_id };
  }

  // ─── FINISHED GOODS & BY-PRODUCT RECEIPT ─────────────────────────────────────
  //
  // Task 2 (Phase 4): Goods receipts must carry calculated output cost.
  //
  // The output unit cost is computed as:
  //   total_wip_cost * (cost_split_pct / 100) / output_qty
  //
  // This mirrors the documented joint-cost split approach for main product and
  // by-products (slaughter cost split, etc.).

  async receiveBatchOutput(dto: RecordBatchOutputDto, tenantId: string, userId?: string) {
    const batch = await this.batchService.findBatchById(dto.batch_id, tenantId);

    if (['DRAFT', 'CLOSED'].includes(batch.status)) {
      throw new BadRequestException(
        `Cannot receive production outputs for batch in status '${batch.status}'.`,
      );
    }

    if (dto.qty <= 0) {
      throw new BadRequestException('Output quantity must be greater than zero.');
    }

    // Resolve WIP to compute output cost (Task 2 — no zero cost)
    const [wip] = await this.db
      .select()
      .from(schema.productionWip)
      .where(eq(schema.productionWip.batch_id, dto.batch_id))
      .limit(1);

    const totalWipCost = wip ? parseFloat(wip.total_wip_cost) : 0;
    const costSplitPct = (dto.cost_split_pct !== undefined ? dto.cost_split_pct : 100.0) / 100;
    const allocatedCost = totalWipCost * costSplitPct;
    const outputUnitCost = dto.qty > 0 ? allocatedCost / dto.qty : 0;

    // 1. Post Goods Receipt with calculated output unit cost
    const grDraft = await this.goodsReceiptService.create(
      {
        company_id: dto.company_id,
        warehouse_id: dto.warehouse_id,
        posting_date: new Date().toISOString().split('T')[0],
        receipt_type: 'PRODUCTION',
        notes: `Production output receipt (${dto.output_type}) — Batch ${batch.batch_no}`,
        lines: [
          {
            item_id: dto.item_id,
            location_id: dto.location_id,
            lot_no: dto.lot_id || undefined,
            qty: dto.qty,
            unit_cost: outputUnitCost,
            uom_code: dto.uom_id || 'KG',
          },
        ],
      },
      tenantId,
      userId,
    );

    await this.goodsReceiptService.post(grDraft.receipt_id, tenantId, userId);

    // 2. Record Output in Production Engine with real cost
    const outputId = randomUUID();
    const newOutput = {
      output_id: outputId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      item_id: dto.item_id,
      uom_id: dto.uom_id,
      warehouse_id: dto.warehouse_id,
      location_id: dto.location_id,
      lot_id: dto.lot_id || null,
      output_type: dto.output_type,
      qty: dto.qty.toFixed(4),
      cost_split_pct: (dto.cost_split_pct ?? 100.0).toFixed(2),
      unit_cost: outputUnitCost.toFixed(4),
      total_cost: allocatedCost.toFixed(4),
      goods_receipt_id: grDraft.receipt_id,
    };

    await this.db.insert(schema.productionBatchOutput).values(newOutput);

    return { output: newOutput, goods_receipt_id: grDraft.receipt_id };
  }

  async getBatchInputs(batchId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.productionBatchInput)
      .where(
        and(
          eq(schema.productionBatchInput.batch_id, batchId),
          eq(schema.productionBatchInput.tenant_id, tenantId),
        ),
      );
  }

  async getBatchOutputs(batchId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.productionBatchOutput)
      .where(
        and(
          eq(schema.productionBatchOutput.batch_id, batchId),
          eq(schema.productionBatchOutput.tenant_id, tenantId),
        ),
      );
  }
}
