import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateGoodsIssueDto, UpdateGoodsIssueDto, QueryGoodsIssueDto } from './dto/goods-issue.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { InventoryLedgerService } from '../inventory-ledger/inventory-ledger.service';
import { GlPostingService } from '../../finance/journal/gl-posting.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class GoodsIssueService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly glPostingService: GlPostingService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  private async generateIssueNo(tenantId: string, companyId: string): Promise<string> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.goodsIssue)
      .where(and(eq(schema.goodsIssue.tenant_id, tenantId), eq(schema.goodsIssue.company_id, companyId)));
    const seq = Number(row?.total || 0) + 1;
    return `GI-${String(seq).padStart(6, '0')}`;
  }

  async create(dto: CreateGoodsIssueDto, tenantId: string, userPayload?: any) {
    const issueId = randomUUID();
    const issueNo = await this.generateIssueNo(tenantId, dto.company_id);

    await this.db.insert(schema.goodsIssue).values({
      issue_id: issueId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      issue_no: issueNo,
      posting_date: dto.posting_date,
      warehouse_id: dto.warehouse_id,
      cost_center_id: dto.cost_center_id || null,
      remarks: dto.remarks || null,
      status: 'DRAFT',
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    });

    await this.insertLines(issueId, dto.lines);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'goods_issue',
      entityId: issueId,
      newValues: { issue_no: issueNo, ...dto },
    });

    return this.findOne(issueId);
  }

  private async insertLines(issueId: string, lines: CreateGoodsIssueDto['lines']) {
    await this.db.insert(schema.goodsIssueLine).values(
      lines.map((line, idx) => ({
        line_id: randomUUID(),
        issue_id: issueId,
        line_no: idx + 1,
        item_id: line.item_id,
        quantity: line.quantity.toString(),
        uom: line.uom,
        remarks: line.remarks || null,
      }))
    );
  }

  async findOne(id: string) {
    const [issue] = await this.db
      .select()
      .from(schema.goodsIssue)
      .where(and(eq(schema.goodsIssue.issue_id, id), isNull(schema.goodsIssue.deleted_at)))
      .limit(1);

    if (!issue) {
      throw new NotFoundException(`Goods Issue with ID '${id}' not found.`);
    }

    const lines = await this.db
      .select()
      .from(schema.goodsIssueLine)
      .where(eq(schema.goodsIssueLine.issue_id, id));

    return { ...issue, lines };
  }

  async findAll(query: QueryGoodsIssueDto, tenantId: string) {
    const conditions: any[] = [eq(schema.goodsIssue.tenant_id, tenantId), isNull(schema.goodsIssue.deleted_at)];

    if (query.companyId) conditions.push(eq(schema.goodsIssue.company_id, query.companyId));
    if (query.status) conditions.push(eq(schema.goodsIssue.status, query.status));
    if (query.warehouseId) conditions.push(eq(schema.goodsIssue.warehouse_id, query.warehouseId));
    if (query.search) conditions.push(like(schema.goodsIssue.issue_no, `%${query.search}%`));

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.goodsIssue)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  private assertDraft(issue: { status: string }) {
    if (issue.status !== 'DRAFT') {
      throw new BadRequestException(`Goods Issue cannot be modified — it is already ${issue.status}.`);
    }
  }

  async update(id: string, dto: UpdateGoodsIssueDto, tenantId: string, userPayload?: any) {
    const issue = await this.findOne(id);
    this.assertDraft(issue);

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };
    if (dto.warehouse_id !== undefined) updates.warehouse_id = dto.warehouse_id;
    if (dto.posting_date !== undefined) updates.posting_date = dto.posting_date;
    if (dto.cost_center_id !== undefined) updates.cost_center_id = dto.cost_center_id;
    if (dto.remarks !== undefined) updates.remarks = dto.remarks;

    await this.db.update(schema.goodsIssue).set(updates).where(eq(schema.goodsIssue.issue_id, id));

    if (dto.lines) {
      await this.db.delete(schema.goodsIssueLine).where(eq(schema.goodsIssueLine.issue_id, id));
      await this.insertLines(id, dto.lines);
    }

    await this.auditService.log({
      tenantId,
      companyId: issue.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'goods_issue',
      entityId: id,
      oldValues: issue,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const issue = await this.findOne(id);
    this.assertDraft(issue);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.goodsIssue)
      .set({ status: 'CANCELLED', deleted_at: deletedTime as any, updated_by: userPayload?.userId || null })
      .where(eq(schema.goodsIssue.issue_id, id));

    await this.auditService.log({
      tenantId,
      companyId: issue.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'goods_issue',
      entityId: id,
      oldValues: issue,
      newValues: { status: 'CANCELLED', deleted_at: deletedTime },
    });

    return { success: true, message: `Goods Issue '${issue.issue_no}' has been cancelled.` };
  }

  async post(id: string, tenantId: string, userPayload?: any) {
    const issue = await this.findOne(id);
    this.assertDraft(issue);

    if (!issue.lines || issue.lines.length === 0) {
      throw new BadRequestException('Cannot post a Goods Issue with no lines.');
    }

    for (const line of issue.lines) {
      const ledgerEntry = await this.ledgerService.writeNegativeEntry({
        tenantId,
        companyId: issue.company_id,
        itemId: line.item_id,
        documentType: 'GOODS_ISSUE',
        documentNo: issue.issue_no,
        documentLineId: line.line_id,
        postingDate: issue.posting_date,
        transactionType: 'CONSUMPTION',
        quantity: Number(line.quantity),
        uom: line.uom,
        warehouseId: issue.warehouse_id,
        userId: userPayload?.userId,
      });

      await this.glPostingService.postInventoryLedgerEntry(ledgerEntry, userPayload?.userId);
    }

    await this.db
      .update(schema.goodsIssue)
      .set({
        status: 'POSTED',
        posted_at: toMysqlTimestamp() as any,
        posted_by: userPayload?.userId || null,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.goodsIssue.issue_id, id));

    await this.auditService.log({
      tenantId,
      companyId: issue.company_id,
      userId: userPayload?.userId,
      action: 'POST',
      entityName: 'goods_issue',
      entityId: id,
      newValues: { status: 'POSTED' },
    });

    return this.findOne(id);
  }
}
