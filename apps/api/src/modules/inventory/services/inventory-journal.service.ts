import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateInventoryJournalDto, QueryInventoryJournalDto } from '../dto/journal-count.dto';
import { InventoryLedgerService } from './inventory-ledger.service';
import { FifoEngineService } from './fifo-engine.service';
import { LotService } from './lot.service';
import { SerialService } from './serial.service';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class InventoryJournalService {
  constructor(
    private readonly cls: ClsService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly fifoService: FifoEngineService,
    private readonly lotService: LotService,
    private readonly serialService: SerialService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async create(dto: CreateInventoryJournalDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      // 1. Verify company
      const [company] = await trx
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);
      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }

      // 2. Duplicate check
      const journalNo = dto.journal_no?.trim() || `JNL-${randomUUID().substring(0, 8).toUpperCase()}`;
      const [existing] = await trx
        .select()
        .from(schema.inventoryJournal)
        .where(and(eq(schema.inventoryJournal.tenant_id, tenantId), eq(schema.inventoryJournal.journal_no, journalNo)))
        .limit(1);
      if (existing) {
        throw new ConflictException(`Inventory Journal with number '${journalNo}' already exists.`);
      }

      const journalId = randomUUID();
      const newJournal = {
        journal_id: journalId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        journal_no: journalNo,
        posting_date: dto.posting_date,
        status: 'DRAFT',
        notes: dto.notes || null,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.inventoryJournal).values(newJournal);

      // Create lines
      for (const line of dto.lines) {
        // Validate warehouse and location
        const [warehouse] = await trx
          .select()
          .from(schema.warehouseMaster)
          .where(and(eq(schema.warehouseMaster.warehouse_id, line.warehouse_id), eq(schema.warehouseMaster.tenant_id, tenantId)))
          .limit(1);
        if (!warehouse) {
          throw new NotFoundException(`Warehouse with ID '${line.warehouse_id}' not found.`);
        }

        const [location] = await trx
          .select()
          .from(schema.locationMaster)
          .where(
            and(
              eq(schema.locationMaster.location_id, line.location_id),
              eq(schema.locationMaster.warehouse_id, line.warehouse_id),
              eq(schema.locationMaster.tenant_id, tenantId)
            )
          )
          .limit(1);
        if (!location) {
          throw new BadRequestException(
            `Location ID '${line.location_id}' does not exist in Warehouse ID '${line.warehouse_id}'.`
          );
        }

        // Validate item existence
        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(and(eq(schema.itemMaster.item_id, line.item_id), eq(schema.itemMaster.tenant_id, tenantId)))
          .limit(1);
        if (!item) {
          throw new NotFoundException(`Item with ID '${line.item_id}' not found.`);
        }

        if (line.qty === 0) {
          throw new BadRequestException('Journal line quantity cannot be zero.');
        }

        // Lot and Serial validation
        if (item.is_lot_tracked && !line.lot_id) {
          throw new BadRequestException(`Item '${item.item_code}' is lot-tracked. lot_id is required.`);
        }
        if (item.is_serial_tracked) {
          if (!line.serial_id) {
            throw new BadRequestException(`Item '${item.item_code}' is serial-tracked. serial_id is required.`);
          }
          if (Math.abs(line.qty) !== 1) {
            throw new BadRequestException(`Serialized line items must have a quantity of exactly 1 or -1.`);
          }
        }

        const lineId = randomUUID();
        await trx.insert(schema.inventoryJournalLine).values({
          line_id: lineId,
          journal_id: journalId,
          warehouse_id: line.warehouse_id,
          location_id: line.location_id,
          item_id: line.item_id,
          lot_id: line.lot_id || null,
          serial_id: line.serial_id || null,
          qty: line.qty.toFixed(4),
          unit_cost: line.unit_cost.toFixed(4),
          reason_code: line.reason_code,
        });
      }

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'inventory_journal',
        entityId: journalId,
        newValues: newJournal,
      });

      return this.findOne(journalId, tenantId, trx);
    });
  }

  async post(journalId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const journal = await this.findOne(journalId, tenantId, trx);
      if (journal.status !== 'DRAFT') {
        throw new ConflictException(`Inventory Journal with ID '${journalId}' is already ${journal.status}.`);
      }

      for (const line of journal.lines) {
        const [item] = await trx
          .select()
          .from(schema.itemMaster)
          .where(eq(schema.itemMaster.item_id, line.item_id))
          .limit(1);

        const qtyDelta = line.qty;

        if (qtyDelta > 0) {
          // RECEIPT (Positive correction)
          if (item.is_lot_tracked && line.lot_id) {
            await this.lotService.updateStock(line.lot_id, qtyDelta, tenantId, trx);
          }
          if (item.is_serial_tracked && line.serial_id) {
            await this.serialService.updateStatus(line.serial_id, 'IN_STOCK', tenantId, trx);
          }

          const totalValue = qtyDelta * line.unit_cost;

          // Post Ledger
          const ledgerId = await this.ledgerService.postLedgerEntry(
            {
              tenant_id: tenantId,
              company_id: journal.company_id,
              warehouse_id: line.warehouse_id,
              location_id: line.location_id,
              item_id: line.item_id,
              lot_id: line.lot_id,
              serial_id: line.serial_id,
              transaction_type: 'JOURNAL_CORRECTION',
              transaction_date: journal.posting_date,
              posting_date: journal.posting_date,
              qty: qtyDelta.toFixed(4),
              unit_cost: line.unit_cost.toFixed(4),
              total_value: totalValue.toFixed(4),
              ref_doc_type: 'InventoryJournal',
              ref_doc_id: journalId,
              ref_doc_line_id: line.line_id,
            },
            tenantId,
            userId,
            trx
          );

          // FIFO Cost layer creation
          if (item.valuation_method === 'FIFO') {
            await this.fifoService.createLayer(
              {
                tenant_id: tenantId,
                company_id: journal.company_id,
                warehouse_id: line.warehouse_id,
                location_id: line.location_id,
                item_id: line.item_id,
                lot_id: line.lot_id,
                ledger_id: ledgerId,
                qty_initial: qtyDelta.toFixed(4),
                qty_remaining: qtyDelta.toFixed(4),
                unit_cost: line.unit_cost.toFixed(4),
                posting_date: journal.posting_date,
                is_exhausted: false,
              },
              tenantId,
              trx
            );
          }

        } else {
          // ISSUE (Negative correction)
          const qtyToIssue = Math.abs(qtyDelta);

          // Check stock
          const available = await this.ledgerService.getAvailableStock(
            line.item_id,
            line.warehouse_id,
            line.location_id,
            line.lot_id || null,
            line.serial_id || null,
            tenantId,
            trx
          );

          if (available < qtyToIssue) {
            throw new BadRequestException(
              `Insufficient stock to execute journal issue. Available: ${available}, Requested: ${qtyToIssue}`
            );
          }

          if (item.is_lot_tracked && line.lot_id) {
            await this.lotService.validateExpiry(line.lot_id, tenantId, trx);
            await this.lotService.updateStock(line.lot_id, -qtyToIssue, tenantId, trx);
          }
          if (item.is_serial_tracked && line.serial_id) {
            await this.serialService.validateAvailability(line.serial_id, tenantId, trx);
            await this.serialService.updateStatus(line.serial_id, 'CONSUMED', tenantId, trx);
          }

          // Post Ledger Issue
          const ledgerId = await this.ledgerService.postLedgerEntry(
            {
              tenant_id: tenantId,
              company_id: journal.company_id,
              warehouse_id: line.warehouse_id,
              location_id: line.location_id,
              item_id: line.item_id,
              lot_id: line.lot_id,
              serial_id: line.serial_id,
              transaction_type: 'JOURNAL_CORRECTION',
              transaction_date: journal.posting_date,
              posting_date: journal.posting_date,
              qty: qtyDelta.toFixed(4), // negative
              unit_cost: '0.0000',
              total_value: '0.0000',
              ref_doc_type: 'InventoryJournal',
              ref_doc_id: journalId,
              ref_doc_line_id: line.line_id,
            },
            tenantId,
            userId,
            trx
          );

          // Cost Resolution
          let unitCost = 0;
          let totalValue = 0;

          if (item.valuation_method === 'FIFO') {
            totalValue = await this.fifoService.consumeLayers(
              journal.company_id,
              line.warehouse_id,
              line.location_id,
              line.item_id,
              line.lot_id || null,
              qtyToIssue,
              ledgerId,
              tenantId,
              trx
            );
            unitCost = totalValue / qtyToIssue;
          } else {
            unitCost = parseFloat(item.standard_cost || '0.0000');
            totalValue = qtyToIssue * unitCost;
          }

          // Update ledger costs
          await trx
            .update(schema.inventoryLedger)
            .set({
              unit_cost: unitCost.toFixed(4),
              total_value: (-totalValue).toFixed(4),
            })
            .where(eq(schema.inventoryLedger.ledger_id, ledgerId));
        }
      }

      // Update document status
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.inventoryJournal)
        .set({
          status: 'POSTED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.inventoryJournal.journal_id, journalId));

      await this.auditService.log({
        tenantId,
        companyId: journal.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'inventory_journal',
        entityId: journalId,
        oldValues: journal,
        newValues: { ...journal, status: 'POSTED' },
      });

      return { success: true, message: 'Inventory Journal posted successfully.' };
    });
  }

  async findOne(journalId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [journal] = await dbClient
      .select()
      .from(schema.inventoryJournal)
      .where(and(eq(schema.inventoryJournal.journal_id, journalId), eq(schema.inventoryJournal.tenant_id, tenantId)))
      .limit(1);

    if (!journal) {
      throw new NotFoundException(`Inventory Journal with ID '${journalId}' not found.`);
    }

    const lines = await dbClient
      .select()
      .from(schema.inventoryJournalLine)
      .where(eq(schema.inventoryJournalLine.journal_id, journalId));

    return {
      ...journal,
      lines: lines.map(l => ({
        ...l,
        qty: parseFloat(l.qty),
        unit_cost: parseFloat(l.unit_cost),
        lot_id: l.lot_id || null,
        serial_id: l.serial_id || null,
      })),
    };
  }

  async findAll(query: QueryInventoryJournalDto, tenantId: string) {
    const conditions = [eq(schema.inventoryJournal.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.inventoryJournal.company_id, query.companyId));
    }
    if (query.status) {
      conditions.push(eq(schema.inventoryJournal.status, query.status));
    }
    if (query.search) {
      conditions.push(like(schema.inventoryJournal.journal_no, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.inventoryJournal)
      .where(and(...conditions));
  }
}
