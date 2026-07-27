import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateGoodsIssueDto, QueryGoodsIssueDto } from '../dto/goods-issue.dto';
import { InventoryLedgerService } from './inventory-ledger.service';
import { FifoEngineService } from './fifo-engine.service';
import { LotService } from './lot.service';
import { SerialService } from './serial.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { PostingEngineService } from '../../finance/services/posting-engine.service';

@Injectable()
export class GoodsIssueService {
  constructor(
    private readonly cls: ClsService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly fifoService: FifoEngineService,
    private readonly lotService: LotService,
    private readonly serialService: SerialService,
    private readonly auditService: AuditLogService,
    private readonly postingEngine: PostingEngineService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async create(dto: CreateGoodsIssueDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      // 1. Verify company exists
      const [company] = await trx
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);
      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }

      // 2. Verify warehouse exists
      const [warehouse] = await trx
        .select()
        .from(schema.warehouseMaster)
        .where(and(eq(schema.warehouseMaster.warehouse_id, dto.warehouse_id), eq(schema.warehouseMaster.tenant_id, tenantId)))
        .limit(1);
      if (!warehouse) {
        throw new NotFoundException(`Warehouse with ID '${dto.warehouse_id}' not found.`);
      }

      // 3. Resolve and validate Issue Number
      const issueNo = dto.issue_no?.trim() || `GI-${randomUUID().substring(0, 8).toUpperCase()}`;
      const [existing] = await trx
        .select()
        .from(schema.goodsIssue)
        .where(and(eq(schema.goodsIssue.tenant_id, tenantId), eq(schema.goodsIssue.issue_no, issueNo)))
        .limit(1);
      if (existing) {
        throw new ConflictException(`Goods Issue with number '${issueNo}' already exists.`);
      }

      const issueId = randomUUID();
      const newIssue = {
        issue_id: issueId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        issue_no: issueNo,
        issue_type: dto.issue_type,
        warehouse_id: dto.warehouse_id,
        posting_date: dto.posting_date,
        status: 'DRAFT',
        notes: dto.notes || null,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.goodsIssue).values(newIssue);

      // Create lines
      for (const line of dto.lines) {
        // Validate item existence
        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(and(eq(schema.itemMaster.item_id, line.item_id), eq(schema.itemMaster.tenant_id, tenantId)))
          .limit(1);
        if (!item) {
          throw new NotFoundException(`Item with ID '${line.item_id}' not found.`);
        }

        // Validate location belongs to warehouse
        const [location] = await trx
          .select()
          .from(schema.locationMaster)
          .where(
            and(
              eq(schema.locationMaster.location_id, line.location_id),
              eq(schema.locationMaster.warehouse_id, dto.warehouse_id),
              eq(schema.locationMaster.tenant_id, tenantId)
            )
          )
          .limit(1);
        if (!location) {
          throw new BadRequestException(
            `Location ID '${line.location_id}' does not exist in Warehouse ID '${dto.warehouse_id}'.`
          );
        }

        // Lot tracking validation
        if (item.is_lot_tracked && !line.lot_id) {
          throw new BadRequestException(`Item '${item.item_code}' is lot-tracked. lot_id is required.`);
        }

        // Serial tracking validation
        if (item.is_serial_tracked) {
          if (!line.serial_id) {
            throw new BadRequestException(`Item '${item.item_code}' is serial-tracked. serial_id is required.`);
          }
          if (line.qty !== 1) {
            throw new BadRequestException(`Serialized line items must have a quantity of exactly 1.`);
          }
        }

        const lineId = randomUUID();
        await trx.insert(schema.goodsIssueLine).values({
          line_id: lineId,
          issue_id: issueId,
          item_id: line.item_id,
          location_id: line.location_id,
          qty: line.qty.toFixed(4),
          uom_code: line.uom_code,
          lot_id: line.lot_id || null,
          serial_id: line.serial_id || null,
        });
      }

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'goods_issue',
        entityId: issueId,
        newValues: newIssue,
      });

      return this.findOne(issueId, tenantId, trx);
    });
  }

  async post(issueId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const issue = await this.findOne(issueId, tenantId, trx);
      if (issue.status !== 'DRAFT') {
        throw new ConflictException(`Goods Issue with ID '${issueId}' is already ${issue.status}.`);
      }

      for (const line of issue.lines) {
        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(eq(schema.itemMaster.item_id, line.item_id))
          .limit(1);

        // 1. Verify available stock (including reservation logic)
        const available = await this.ledgerService.getAvailableStock(
          line.item_id,
          issue.warehouse_id,
          line.location_id,
          line.lot_id || null,
          line.serial_id || null,
          tenantId,
          trx
        );

        if (available < line.qty) {
          throw new BadRequestException(
            `Insufficient stock to issue item '${item.item_code}' from Location '${line.location_id}'. Available: ${available}, Requested: ${line.qty}`
          );
        }

        // 2. Process Lot verification
        if (item.is_lot_tracked && line.lot_id) {
          // Validate expiry
          await this.lotService.validateExpiry(line.lot_id, tenantId, trx);
          // Decrement Lot stock
          await this.lotService.updateStock(line.lot_id, -line.qty, tenantId, trx);
        }

        // 3. Process Serial verification
        if (item.is_serial_tracked && line.serial_id) {
          await this.serialService.validateAvailability(line.serial_id, tenantId, trx);
          await this.serialService.updateStatus(line.serial_id, 'CONSUMED', tenantId, trx);
        }

        // 4. Post Ledger Entry (updates cache to negative qty)
        const ledgerId = await this.ledgerService.postLedgerEntry(
          {
            tenant_id: tenantId,
            company_id: issue.company_id,
            warehouse_id: issue.warehouse_id,
            location_id: line.location_id,
            item_id: line.item_id,
            lot_id: line.lot_id || null,
            serial_id: line.serial_id || null,
            transaction_type: 'GOODS_ISSUE',
            transaction_date: issue.posting_date,
            posting_date: issue.posting_date,
            qty: (-line.qty).toFixed(4),
            unit_cost: '0.0000', // cost to be resolved in the next step
            total_value: '0.0000',
            ref_doc_type: 'GoodsIssue',
            ref_doc_id: issueId,
            ref_doc_line_id: line.line_id,
          },
          tenantId,
          userId,
          trx
        );

        // 5. Cost Valuation Resolution
        let unitCost = 0;
        let totalValue = 0;

        if (item.valuation_method === 'FIFO') {
          // Draw down FIFO layers
          totalValue = await this.fifoService.consumeLayers(
            issue.company_id,
            issue.warehouse_id,
            line.location_id,
            line.item_id,
            line.lot_id || null,
            line.qty,
            ledgerId,
            tenantId,
            trx
          );
          unitCost = totalValue / line.qty;
        } else {
          // Standard costing default
          unitCost = parseFloat(item.standard_cost || '0.0000');
          totalValue = line.qty * unitCost;
        }

        // 6. Update Stock Ledger with actual calculated FIFO / standard costs
        await trx
          .update(schema.inventoryLedger)
          .set({
            unit_cost: unitCost.toFixed(4),
            total_value: (-totalValue).toFixed(4), // Negated since it represents value leaving the warehouse
          })
          .where(eq(schema.inventoryLedger.ledger_id, ledgerId));

        try {
          await this.postingEngine.postAutomaticEntry(
            {
              company_id: issue.company_id,
              item_category_id: item.category_id,
              transaction_type: 'CONSUMPTION',
              amount: totalValue,
              posting_date: issue.posting_date,
              ref_doc_type: 'GoodsIssue',
              ref_doc_id: issueId,
              ref_doc_line_id: line.line_id,
            },
            tenantId,
            userId,
            trx
          );
        } catch (err) {
          if (err.message && (err.message.includes('GL Mapping') || err.message.includes('No active Accounting Period'))) {
            console.warn(`[Finance Integration Warning]: ${err.message}`);
          } else {
            throw err;
          }
        }
      }

      // Update document status to POSTED
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.goodsIssue)
        .set({
          status: 'POSTED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.goodsIssue.issue_id, issueId));

      await this.auditService.log({
        tenantId,
        companyId: issue.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'goods_issue',
        entityId: issueId,
        oldValues: issue,
        newValues: { ...issue, status: 'POSTED' },
      });

      return { success: true, message: 'Goods Issue posted successfully.' };
    });
  }

  async findOne(issueId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [issue] = await dbClient
      .select()
      .from(schema.goodsIssue)
      .where(and(eq(schema.goodsIssue.issue_id, issueId), eq(schema.goodsIssue.tenant_id, tenantId)))
      .limit(1);

    if (!issue) {
      throw new NotFoundException(`Goods Issue with ID '${issueId}' not found.`);
    }

    const lines = await dbClient
      .select()
      .from(schema.goodsIssueLine)
      .where(eq(schema.goodsIssueLine.issue_id, issueId));

    return {
      ...issue,
      lines: lines.map(l => ({
        ...l,
        qty: parseFloat(l.qty),
        lot_id: l.lot_id || null,
        serial_id: l.serial_id || null,
      })),
    };
  }

  async findAll(query: QueryGoodsIssueDto, tenantId: string) {
    const conditions = [eq(schema.goodsIssue.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.goodsIssue.company_id, query.companyId));
    }
    if (query.warehouseId) {
      conditions.push(eq(schema.goodsIssue.warehouse_id, query.warehouseId));
    }
    if (query.status) {
      conditions.push(eq(schema.goodsIssue.status, query.status));
    }
    if (query.search) {
      conditions.push(like(schema.goodsIssue.issue_no, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.goodsIssue)
      .where(and(...conditions));
  }
}
