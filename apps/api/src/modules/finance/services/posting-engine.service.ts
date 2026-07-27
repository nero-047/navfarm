import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { LedgerService } from './ledger.service';

@Injectable()
export class PostingEngineService {
  constructor(
    private readonly cls: ClsService,
    private readonly ledgerService: LedgerService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async postAutomaticEntry(
    params: {
      company_id: string;
      item_category_id?: string | null;
      transaction_type: string; // PURCHASE, CONSUMPTION, OUTPUT, SALE, ADJUSTMENT, etc.
      amount: number;
      posting_date: string;
      ref_doc_type: string;
      ref_doc_id: string;
      ref_doc_line_id?: string | null;
      cost_center_id?: string | null;
      dimension_values?: Record<string, string> | null;
      notes?: string | null;
    },
    tenantId: string,
    userId?: string,
    tx?: any
  ) {
    const trx = tx || this.db;

    if (params.amount <= 0) {
      // Omit zero-value financial entries
      return { success: true, message: 'Zero-amount operational transaction skipped for financial posting.' };
    }

    // 1. Resolve GL Mapping rules
    let mapping: typeof schema.glMappingMaster.$inferSelect | undefined;

    // A. Attempt to find specific category mapping first
    if (params.item_category_id) {
      [mapping] = await trx
        .select()
        .from(schema.glMappingMaster)
        .where(
          and(
            eq(schema.glMappingMaster.tenant_id, tenantId),
            eq(schema.glMappingMaster.company_id, params.company_id),
            eq(schema.glMappingMaster.item_category_id, params.item_category_id),
            eq(schema.glMappingMaster.transaction_type, params.transaction_type),
            eq(schema.glMappingMaster.is_active, true),
            isNull(schema.glMappingMaster.deleted_at)
          )
        )
        .limit(1);
    }

    // B. Fallback to general/company-wide mapping if no category mapping found
    if (!mapping) {
      [mapping] = await trx
        .select()
        .from(schema.glMappingMaster)
        .where(
          and(
            eq(schema.glMappingMaster.tenant_id, tenantId),
            eq(schema.glMappingMaster.company_id, params.company_id),
            isNull(schema.glMappingMaster.item_category_id),
            eq(schema.glMappingMaster.transaction_type, params.transaction_type),
            eq(schema.glMappingMaster.is_active, true),
            isNull(schema.glMappingMaster.deleted_at)
          )
        )
        .limit(1);
    }

    if (!mapping) {
      throw new BadRequestException(
        `GL Mapping rule not configured for Transaction Type '${params.transaction_type}' in this company.`
      );
    }

    const debitAccount = mapping.debit_gl_account_id;
    const creditAccount = mapping.credit_gl_account_id;

    if (!debitAccount || !creditAccount) {
      throw new BadRequestException(
        `GL Mapping rule is incomplete. Debit and Credit accounts are both required.`
      );
    }

    // 2. Write Debit general ledger line
    await this.ledgerService.postEntry(
      {
        company_id: params.company_id,
        gl_account_id: debitAccount,
        debit: params.amount,
        credit: 0,
        posting_date: params.posting_date,
        cost_center_id: params.cost_center_id || null,
        dimension_values: params.dimension_values || null,
        ref_doc_type: params.ref_doc_type,
        ref_doc_id: params.ref_doc_id,
        ref_doc_line_id: params.ref_doc_line_id || null,
        notes: params.notes || `Auto Posting: ${params.transaction_type}`,
      },
      tenantId,
      userId,
      trx
    );

    // 3. Write Credit general ledger line
    await this.ledgerService.postEntry(
      {
        company_id: params.company_id,
        gl_account_id: creditAccount,
        debit: 0,
        credit: params.amount,
        posting_date: params.posting_date,
        cost_center_id: params.cost_center_id || null,
        dimension_values: params.dimension_values || null,
        ref_doc_type: params.ref_doc_type,
        ref_doc_id: params.ref_doc_id,
        ref_doc_line_id: params.ref_doc_line_id || null,
        notes: params.notes || `Auto Posting: ${params.transaction_type}`,
      },
      tenantId,
      userId,
      trx
    );

    return { success: true, message: 'Automated double-entry general ledger records written successfully.' };
  }
}
