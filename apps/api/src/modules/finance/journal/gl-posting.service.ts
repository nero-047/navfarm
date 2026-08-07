import { Injectable, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, or } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { JournalService } from './journal.service';

/**
 * Auto-posting engine: mirrors an Inventory Ledger entry into the GL by
 * resolving its debit/credit accounts from gl_mapping_master and writing a
 * balanced, already-POSTED system Journal Entry. Called from document
 * services (Goods Receipt now; Issue/Transfer/Adjustment in a follow-up)
 * right after they write the corresponding Inventory Ledger entry.
 */
@Injectable()
export class GlPostingService {
  constructor(
    private readonly cls: ClsService,
    private readonly journalService: JournalService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  private async resolveMapping(tenantId: string, companyId: string, transactionType: string, categoryId?: string | null) {
    const conditions = [
      eq(schema.glMappingMaster.tenant_id, tenantId),
      eq(schema.glMappingMaster.company_id, companyId),
      eq(schema.glMappingMaster.transaction_type, transactionType),
      eq(schema.glMappingMaster.is_active, true),
      isNull(schema.glMappingMaster.deleted_at),
    ];
    conditions.push(
      categoryId
        ? or(eq(schema.glMappingMaster.item_category_id, categoryId), isNull(schema.glMappingMaster.item_category_id))!
        : isNull(schema.glMappingMaster.item_category_id)
    );

    const mappings = await this.db
      .select()
      .from(schema.glMappingMaster)
      .where(and(...conditions));

    // Prefer a category-specific mapping over a category-wildcard (item_category_id IS NULL) one.
    const mapping = mappings.find((m) => m.item_category_id === categoryId) ?? mappings.find((m) => !m.item_category_id);

    if (!mapping || !mapping.debit_gl_account_id || !mapping.credit_gl_account_id) {
      throw new BadRequestException(
        `No GL mapping configured for company '${companyId}', transaction type '${transactionType}'` +
          (categoryId ? `, item category '${categoryId}'` : '') +
          '. Add one under Master Data → GL Mappings before posting this document.'
      );
    }

    return mapping;
  }

  async postInventoryLedgerEntry(ledgerEntry: typeof schema.inventoryLedger.$inferSelect, userId?: string) {
    const mapping = await this.resolveMapping(
      ledgerEntry.tenant_id,
      ledgerEntry.company_id,
      ledgerEntry.transaction_type,
      ledgerEntry.category_id
    );

    const amount = Math.abs(Number(ledgerEntry.amount ?? 0));

    return this.journalService.createAndPostSystemJournal({
      tenantId: ledgerEntry.tenant_id,
      companyId: ledgerEntry.company_id,
      postingDate: ledgerEntry.posting_date,
      sourceDocumentType: ledgerEntry.document_type,
      sourceDocumentNo: ledgerEntry.document_no,
      sourceLedgerId: ledgerEntry.ledger_id,
      description: `${ledgerEntry.transaction_type} — ${ledgerEntry.item_code} (${ledgerEntry.document_no})`,
      lines: [
        {
          glAccountId: mapping.debit_gl_account_id!,
          debitAmount: amount,
          creditAmount: 0,
          nobId: ledgerEntry.nob_id || undefined,
          lobId: ledgerEntry.lob_id || undefined,
        },
        {
          glAccountId: mapping.credit_gl_account_id!,
          debitAmount: 0,
          creditAmount: amount,
          nobId: ledgerEntry.nob_id || undefined,
          lobId: ledgerEntry.lob_id || undefined,
        },
      ],
      userId,
    });
  }

  /**
   * Posts a GL entry for a cost that has no physical inventory movement to
   * hang off of (e.g. batch mortality write-off, batch overhead/labor cost).
   * Same gl_mapping_master resolution as postInventoryLedgerEntry, just
   * without requiring an inventory_ledger row as the source.
   */
  async postBatchCostEntry(params: {
    tenantId: string;
    companyId: string;
    transactionType: string;
    amount: number;
    documentNo: string;
    documentLineId?: string;
    postingDate: string;
    description?: string;
    nobId?: string;
    lobId?: string;
    userId?: string;
    // Swaps the mapping's debit/credit accounts — used for favorable variances,
    // where the normal "Dr Variance / Cr Inventory-WIP" posting reverses.
    reverseDirection?: boolean;
  }) {
    const mapping = await this.resolveMapping(params.tenantId, params.companyId, params.transactionType);
    const amount = Math.abs(params.amount);
    const debitAccountId = params.reverseDirection ? mapping.credit_gl_account_id! : mapping.debit_gl_account_id!;
    const creditAccountId = params.reverseDirection ? mapping.debit_gl_account_id! : mapping.credit_gl_account_id!;

    return this.journalService.createAndPostSystemJournal({
      tenantId: params.tenantId,
      companyId: params.companyId,
      postingDate: params.postingDate,
      sourceDocumentType: 'BATCH',
      sourceDocumentNo: params.documentNo,
      description: params.description || `${params.transactionType} — ${params.documentNo}`,
      lines: [
        {
          glAccountId: debitAccountId,
          debitAmount: amount,
          creditAmount: 0,
          nobId: params.nobId,
          lobId: params.lobId,
        },
        {
          glAccountId: creditAccountId,
          debitAmount: 0,
          creditAmount: amount,
          nobId: params.nobId,
          lobId: params.lobId,
        },
      ],
      userId: params.userId,
    });
  }
}
