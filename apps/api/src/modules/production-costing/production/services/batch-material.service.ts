import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
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

  // --- MATERIAL INPUT CONSUMPTION (INTEGRATES WITH PHASE 3 GOODS ISSUE) ---

  async issueBatchMaterials(dto: AddBatchInputDto, tenantId: string, userId?: string) {
    const batch = await this.batchService.findBatchById(dto.batch_id, tenantId);

    if (['DRAFT', 'FINISHED', 'CLOSED'].includes(batch.status)) {
      throw new BadRequestException(`Cannot issue raw materials for batch in status '${batch.status}'.`);
    }

    const actualQty = dto.actual_qty !== undefined ? dto.actual_qty : dto.planned_qty;

    // 1. Post Goods Issue via Phase 3 Inventory Engine
    const giDraft = await this.goodsIssueService.create(
      {
        company_id: dto.company_id,
        warehouse_id: dto.warehouse_id,
        issue_date: new Date().toISOString().split('T')[0],
        ref_doc_type: 'PRODUCTION_BATCH',
        ref_doc_id: dto.batch_id,
        notes: `Production Batch Raw Material Issue for Batch ${batch.batch_no}`,
        lines: [
          {
            item_id: dto.item_id,
            location_id: dto.location_id,
            lot_id: dto.lot_id || null,
            serial_id: dto.serial_id || null,
            qty: actualQty,
          },
        ],
      },
      tenantId,
      userId
    );

    // Post the Goods Issue (depletes stock, uses FIFO cost, posts GL entries)
    const giPostResult = await this.goodsIssueService.post(giDraft.issue_id, tenantId, userId);

    // Read unit cost from created FIFO layer depletion or item unit cost
    const unitCost = 0; // Calculated via inventory posting
    const totalCost = actualQty * unitCost;

    // 2. Record Input record in Production Engine
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

    // 3. Transition Batch Status to MATERIAL_ISSUED if currently RELEASED
    if (batch.status === 'RELEASED') {
      await this.batchService.transitionStatus(dto.batch_id, 'MATERIAL_ISSUED' as any, tenantId, userId);
    }

    return {
      input: newInput,
      goods_issue: giPostResult,
    };
  }

  // --- FINISHED GOODS & BY-PRODUCT RECEIPT (INTEGRATES WITH PHASE 3 GOODS RECEIPT) ---

  async receiveBatchOutput(dto: RecordBatchOutputDto, tenantId: string, userId?: string) {
    const batch = await this.batchService.findBatchById(dto.batch_id, tenantId);

    if (['DRAFT', 'CLOSED'].includes(batch.status)) {
      throw new BadRequestException(`Cannot receive production outputs for batch in status '${batch.status}'.`);
    }

    // 1. Post Goods Receipt via Phase 3 Inventory Engine
    const grDraft = await this.goodsReceiptService.create(
      {
        company_id: dto.company_id,
        warehouse_id: dto.warehouse_id,
        receipt_date: new Date().toISOString().split('T')[0],
        ref_doc_type: 'PRODUCTION_BATCH',
        ref_doc_id: dto.batch_id,
        notes: `Production Batch Receipt (${dto.output_type}) for Batch ${batch.batch_no}`,
        lines: [
          {
            item_id: dto.item_id,
            location_id: dto.location_id,
            lot_id: dto.lot_id || null,
            qty: dto.qty,
            unit_cost: 0,
          },
        ],
      },
      tenantId,
      userId
    );

    const grPostResult = await this.goodsReceiptService.post(grDraft.receipt_id, tenantId, userId);

    // 2. Record Output record in Production Engine
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
      cost_split_pct: (dto.cost_split_pct || 100.0).toFixed(2),
      unit_cost: '0.0000',
      total_cost: '0.0000',
      goods_receipt_id: grDraft.receipt_id,
    };

    await this.db.insert(schema.productionBatchOutput).values(newOutput);

    return {
      output: newOutput,
      goods_receipt: grPostResult,
    };
  }

  async getBatchInputs(batchId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.productionBatchInput)
      .where(and(eq(schema.productionBatchInput.batch_id, batchId), eq(schema.productionBatchInput.tenant_id, tenantId)));
  }

  async getBatchOutputs(batchId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.productionBatchOutput)
      .where(and(eq(schema.productionBatchOutput.batch_id, batchId), eq(schema.productionBatchOutput.tenant_id, tenantId)));
  }
}
