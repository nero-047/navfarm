import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateStockAdjustmentDto, UpdateStockAdjustmentDto, QueryStockAdjustmentDto } from './dto/stock-adjustment.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { InventoryLedgerService } from '../inventory-ledger/inventory-ledger.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class StockAdjustmentService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  private async generateAdjustmentNo(tenantId: string, companyId: string): Promise<string> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.stockAdjustment)
      .where(and(eq(schema.stockAdjustment.tenant_id, tenantId), eq(schema.stockAdjustment.company_id, companyId)));
    const seq = Number(row?.total || 0) + 1;
    return `ADJ-${String(seq).padStart(6, '0')}`;
  }

  async create(dto: CreateStockAdjustmentDto, tenantId: string, userPayload?: any) {
    const adjustmentId = randomUUID();
    const adjustmentNo = await this.generateAdjustmentNo(tenantId, dto.company_id);

    await this.db.insert(schema.stockAdjustment).values({
      adjustment_id: adjustmentId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      adjustment_no: adjustmentNo,
      posting_date: dto.posting_date,
      warehouse_id: dto.warehouse_id,
      reason: dto.reason || null,
      remarks: dto.remarks || null,
      status: 'DRAFT',
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    });

    await this.insertLines(adjustmentId, dto.lines);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'stock_adjustment',
      entityId: adjustmentId,
      newValues: { adjustment_no: adjustmentNo, ...dto },
    });

    return this.findOne(adjustmentId);
  }

  private async insertLines(adjustmentId: string, lines: CreateStockAdjustmentDto['lines']) {
    await this.db.insert(schema.stockAdjustmentLine).values(
      lines.map((line, idx) => ({
        line_id: randomUUID(),
        adjustment_id: adjustmentId,
        line_no: idx + 1,
        item_id: line.item_id,
        quantity: line.quantity.toString(),
        uom: line.uom,
        rate: line.rate?.toString() || null,
        remarks: line.remarks || null,
      }))
    );
  }

  async findOne(id: string) {
    const [adjustment] = await this.db
      .select()
      .from(schema.stockAdjustment)
      .where(and(eq(schema.stockAdjustment.adjustment_id, id), isNull(schema.stockAdjustment.deleted_at)))
      .limit(1);

    if (!adjustment) {
      throw new NotFoundException(`Stock Adjustment with ID '${id}' not found.`);
    }

    const lines = await this.db
      .select()
      .from(schema.stockAdjustmentLine)
      .where(eq(schema.stockAdjustmentLine.adjustment_id, id));

    return { ...adjustment, lines };
  }

  async findAll(query: QueryStockAdjustmentDto, tenantId: string) {
    const conditions: any[] = [eq(schema.stockAdjustment.tenant_id, tenantId), isNull(schema.stockAdjustment.deleted_at)];

    if (query.companyId) conditions.push(eq(schema.stockAdjustment.company_id, query.companyId));
    if (query.status) conditions.push(eq(schema.stockAdjustment.status, query.status));
    if (query.warehouseId) conditions.push(eq(schema.stockAdjustment.warehouse_id, query.warehouseId));
    if (query.search) conditions.push(like(schema.stockAdjustment.adjustment_no, `%${query.search}%`));

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.stockAdjustment)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  private assertDraft(adjustment: { status: string }) {
    if (adjustment.status !== 'DRAFT') {
      throw new BadRequestException(`Stock Adjustment cannot be modified — it is already ${adjustment.status}.`);
    }
  }

  async update(id: string, dto: UpdateStockAdjustmentDto, tenantId: string, userPayload?: any) {
    const adjustment = await this.findOne(id);
    this.assertDraft(adjustment);

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };
    if (dto.warehouse_id !== undefined) updates.warehouse_id = dto.warehouse_id;
    if (dto.posting_date !== undefined) updates.posting_date = dto.posting_date;
    if (dto.reason !== undefined) updates.reason = dto.reason;
    if (dto.remarks !== undefined) updates.remarks = dto.remarks;

    await this.db.update(schema.stockAdjustment).set(updates).where(eq(schema.stockAdjustment.adjustment_id, id));

    if (dto.lines) {
      await this.db.delete(schema.stockAdjustmentLine).where(eq(schema.stockAdjustmentLine.adjustment_id, id));
      await this.insertLines(id, dto.lines);
    }

    await this.auditService.log({
      tenantId,
      companyId: adjustment.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'stock_adjustment',
      entityId: id,
      oldValues: adjustment,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const adjustment = await this.findOne(id);
    this.assertDraft(adjustment);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.stockAdjustment)
      .set({ status: 'CANCELLED', deleted_at: deletedTime as any, updated_by: userPayload?.userId || null })
      .where(eq(schema.stockAdjustment.adjustment_id, id));

    await this.auditService.log({
      tenantId,
      companyId: adjustment.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'stock_adjustment',
      entityId: id,
      oldValues: adjustment,
      newValues: { status: 'CANCELLED', deleted_at: deletedTime },
    });

    return { success: true, message: `Stock Adjustment '${adjustment.adjustment_no}' has been cancelled.` };
  }

  async post(id: string, tenantId: string, userPayload?: any) {
    const adjustment = await this.findOne(id);
    this.assertDraft(adjustment);

    if (!adjustment.lines || adjustment.lines.length === 0) {
      throw new BadRequestException('Cannot post a Stock Adjustment with no lines.');
    }

    for (const line of adjustment.lines) {
      const quantity = Number(line.quantity);
      if (quantity > 0) {
        await this.ledgerService.writePositiveEntry({
          tenantId,
          companyId: adjustment.company_id,
          itemId: line.item_id,
          documentType: 'STOCK_ADJUSTMENT',
          documentNo: adjustment.adjustment_no,
          documentLineId: line.line_id,
          postingDate: adjustment.posting_date,
          transactionType: 'VARIANCE_POSITIVE',
          quantity,
          uom: line.uom,
          rate: line.rate ? Number(line.rate) : 0,
          warehouseId: adjustment.warehouse_id,
          userId: userPayload?.userId,
        });
      } else if (quantity < 0) {
        await this.ledgerService.writeNegativeEntry({
          tenantId,
          companyId: adjustment.company_id,
          itemId: line.item_id,
          documentType: 'STOCK_ADJUSTMENT',
          documentNo: adjustment.adjustment_no,
          documentLineId: line.line_id,
          postingDate: adjustment.posting_date,
          transactionType: 'VARIANCE_NEGATIVE',
          quantity: Math.abs(quantity),
          uom: line.uom,
          warehouseId: adjustment.warehouse_id,
          userId: userPayload?.userId,
        });
      }
    }

    await this.db
      .update(schema.stockAdjustment)
      .set({
        status: 'POSTED',
        posted_at: toMysqlTimestamp() as any,
        posted_by: userPayload?.userId || null,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.stockAdjustment.adjustment_id, id));

    await this.auditService.log({
      tenantId,
      companyId: adjustment.company_id,
      userId: userPayload?.userId,
      action: 'POST',
      entityName: 'stock_adjustment',
      entityId: id,
      newValues: { status: 'POSTED' },
    });

    return this.findOne(id);
  }
}
