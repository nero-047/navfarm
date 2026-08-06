import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateStockTransferDto, UpdateStockTransferDto, QueryStockTransferDto } from './dto/stock-transfer.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { InventoryLedgerService } from '../inventory-ledger/inventory-ledger.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class StockTransferService {
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

  private async generateTransferNo(tenantId: string, companyId: string): Promise<string> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.stockTransfer)
      .where(and(eq(schema.stockTransfer.tenant_id, tenantId), eq(schema.stockTransfer.company_id, companyId)));
    const seq = Number(row?.total || 0) + 1;
    return `TR-${String(seq).padStart(6, '0')}`;
  }

  async create(dto: CreateStockTransferDto, tenantId: string, userPayload?: any) {
    if (dto.from_warehouse_id === dto.to_warehouse_id) {
      throw new BadRequestException('Source and destination warehouse must be different.');
    }

    const transferId = randomUUID();
    const transferNo = await this.generateTransferNo(tenantId, dto.company_id);

    await this.db.insert(schema.stockTransfer).values({
      transfer_id: transferId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      transfer_no: transferNo,
      posting_date: dto.posting_date,
      from_warehouse_id: dto.from_warehouse_id,
      to_warehouse_id: dto.to_warehouse_id,
      remarks: dto.remarks || null,
      status: 'DRAFT',
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    });

    await this.insertLines(transferId, dto.lines);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'stock_transfer',
      entityId: transferId,
      newValues: { transfer_no: transferNo, ...dto },
    });

    return this.findOne(transferId);
  }

  private async insertLines(transferId: string, lines: CreateStockTransferDto['lines']) {
    await this.db.insert(schema.stockTransferLine).values(
      lines.map((line, idx) => ({
        line_id: randomUUID(),
        transfer_id: transferId,
        line_no: idx + 1,
        item_id: line.item_id,
        quantity: line.quantity.toString(),
        uom: line.uom,
        remarks: line.remarks || null,
      }))
    );
  }

  async findOne(id: string) {
    const [transfer] = await this.db
      .select()
      .from(schema.stockTransfer)
      .where(and(eq(schema.stockTransfer.transfer_id, id), isNull(schema.stockTransfer.deleted_at)))
      .limit(1);

    if (!transfer) {
      throw new NotFoundException(`Stock Transfer with ID '${id}' not found.`);
    }

    const lines = await this.db
      .select()
      .from(schema.stockTransferLine)
      .where(eq(schema.stockTransferLine.transfer_id, id));

    return { ...transfer, lines };
  }

  async findAll(query: QueryStockTransferDto, tenantId: string) {
    const conditions: any[] = [eq(schema.stockTransfer.tenant_id, tenantId), isNull(schema.stockTransfer.deleted_at)];

    if (query.companyId) conditions.push(eq(schema.stockTransfer.company_id, query.companyId));
    if (query.status) conditions.push(eq(schema.stockTransfer.status, query.status));
    if (query.search) conditions.push(like(schema.stockTransfer.transfer_no, `%${query.search}%`));

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.stockTransfer)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  private assertDraft(transfer: { status: string }) {
    if (transfer.status !== 'DRAFT') {
      throw new BadRequestException(`Stock Transfer cannot be modified — it is already ${transfer.status}.`);
    }
  }

  async update(id: string, dto: UpdateStockTransferDto, tenantId: string, userPayload?: any) {
    const transfer = await this.findOne(id);
    this.assertDraft(transfer);

    const fromWarehouseId = dto.from_warehouse_id ?? transfer.from_warehouse_id;
    const toWarehouseId = dto.to_warehouse_id ?? transfer.to_warehouse_id;
    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Source and destination warehouse must be different.');
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };
    if (dto.from_warehouse_id !== undefined) updates.from_warehouse_id = dto.from_warehouse_id;
    if (dto.to_warehouse_id !== undefined) updates.to_warehouse_id = dto.to_warehouse_id;
    if (dto.posting_date !== undefined) updates.posting_date = dto.posting_date;
    if (dto.remarks !== undefined) updates.remarks = dto.remarks;

    await this.db.update(schema.stockTransfer).set(updates).where(eq(schema.stockTransfer.transfer_id, id));

    if (dto.lines) {
      await this.db.delete(schema.stockTransferLine).where(eq(schema.stockTransferLine.transfer_id, id));
      await this.insertLines(id, dto.lines);
    }

    await this.auditService.log({
      tenantId,
      companyId: transfer.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'stock_transfer',
      entityId: id,
      oldValues: transfer,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const transfer = await this.findOne(id);
    this.assertDraft(transfer);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.stockTransfer)
      .set({ status: 'CANCELLED', deleted_at: deletedTime as any, updated_by: userPayload?.userId || null })
      .where(eq(schema.stockTransfer.transfer_id, id));

    await this.auditService.log({
      tenantId,
      companyId: transfer.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'stock_transfer',
      entityId: id,
      oldValues: transfer,
      newValues: { status: 'CANCELLED', deleted_at: deletedTime },
    });

    return { success: true, message: `Stock Transfer '${transfer.transfer_no}' has been cancelled.` };
  }

  async post(id: string, tenantId: string, userPayload?: any) {
    const transfer = await this.findOne(id);
    this.assertDraft(transfer);

    if (!transfer.lines || transfer.lines.length === 0) {
      throw new BadRequestException('Cannot post a Stock Transfer with no lines.');
    }

    for (const line of transfer.lines) {
      await this.ledgerService.writeTransferEntries({
        tenantId,
        companyId: transfer.company_id,
        itemId: line.item_id,
        documentNo: transfer.transfer_no,
        documentLineId: line.line_id,
        postingDate: transfer.posting_date,
        quantity: Number(line.quantity),
        uom: line.uom,
        fromWarehouseId: transfer.from_warehouse_id,
        toWarehouseId: transfer.to_warehouse_id,
        userId: userPayload?.userId,
      });
    }

    await this.db
      .update(schema.stockTransfer)
      .set({
        status: 'POSTED',
        posted_at: toMysqlTimestamp() as any,
        posted_by: userPayload?.userId || null,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.stockTransfer.transfer_id, id));

    await this.auditService.log({
      tenantId,
      companyId: transfer.company_id,
      userId: userPayload?.userId,
      action: 'POST',
      entityName: 'stock_transfer',
      entityId: id,
      newValues: { status: 'POSTED' },
    });

    return this.findOne(id);
  }
}
