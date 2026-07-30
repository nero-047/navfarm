import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { LedgerService } from './ledger.service';

export interface PostAutomaticEntryParams {
  company_id: string;
  nob_id?: string | null;
  lob_id?: string | null;
  stage?: string | null;
  event_type?: string | null;
  item_category_id?: string | null;
  item_posting_group?: string | null;
  valuation_method?: string | null;
  transaction_type: string; // PURCHASE, CONSUMPTION, OUTPUT, SALE, ADJUSTMENT, MORTALITY, VARIANCE, WIP_TRANSFER, BATCH_CLOSE
  amount: number;
  posting_date: string;
  ref_doc_type: string;
  ref_doc_id: string;
  ref_doc_line_id?: string | null;
  cost_center_id?: string | null;
  dimension_values?: Record<string, string> | null;
  notes?: string | null;
}

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
    params: PostAutomaticEntryParams,
    tenantId: string,
    userId?: string,
    tx?: any
  ) {
    const trx = tx || this.db;

    if (params.amount <= 0) {
      // Omit zero-value financial entries
      return { success: true, message: 'Zero-amount operational transaction skipped for financial posting.' };
    }

    // Validate posting_date falls within an OPEN accounting period
    const allPeriods = await trx
      .select()
      .from(schema.accountingPeriod)
      .where(
        and(
          eq(schema.accountingPeriod.tenant_id, tenantId),
          eq(schema.accountingPeriod.company_id, params.company_id),
        )
      );

    if (allPeriods.length > 0) {
      const postingDate = params.posting_date;
      const matchingPeriod = allPeriods.find(p =>
        p.start_date && p.end_date && postingDate >= p.start_date && postingDate <= p.end_date
      );
      if (matchingPeriod && matchingPeriod.status !== 'OPEN') {
        throw new BadRequestException(
          `Cannot post to date ${postingDate}. Accounting period '${matchingPeriod.period_name || matchingPeriod.period_id}' is ${matchingPeriod.status}.`
        );
      }
    }

    // 1. Resolve GL Mapping rules using multi-level context specificity matching
    const allCandidateRules = await trx
      .select()
      .from(schema.glMappingMaster)
      .where(
        and(
          eq(schema.glMappingMaster.tenant_id, tenantId),
          eq(schema.glMappingMaster.company_id, params.company_id),
          eq(schema.glMappingMaster.transaction_type, params.transaction_type.toUpperCase()),
          eq(schema.glMappingMaster.is_active, true),
          isNull(schema.glMappingMaster.deleted_at)
        )
      );

    // Filter rules matching the specified context (or rule has null for wildcard)
    const matchingRules = allCandidateRules.filter(rule => {
      if (rule.nob_id && params.nob_id && rule.nob_id !== params.nob_id) return false;
      if (rule.lob_id && params.lob_id && rule.lob_id !== params.lob_id) return false;
      if (rule.stage && params.stage && rule.stage.toUpperCase() !== params.stage.toUpperCase()) return false;
      if (rule.event_type && params.event_type && rule.event_type.toUpperCase() !== params.event_type.toUpperCase()) return false;
      if (rule.item_category_id && params.item_category_id && rule.item_category_id !== params.item_category_id) return false;
      if (rule.item_posting_group && params.item_posting_group && rule.item_posting_group.toUpperCase() !== params.item_posting_group.toUpperCase()) return false;
      if (rule.valuation_method && params.valuation_method && rule.valuation_method.toUpperCase() !== params.valuation_method.toUpperCase()) return false;
      return true;
    });

    if (matchingRules.length === 0) {
      throw new BadRequestException(
        `GL Mapping rule not configured for Transaction Type '${params.transaction_type}' in this company.`
      );
    }

    // Rank matching rules by specificity score (higher matches = more specific rule wins)
    const scoredRules = matchingRules.map(rule => {
      let score = 0;
      if (rule.nob_id && rule.nob_id === params.nob_id) score += 10;
      if (rule.lob_id && rule.lob_id === params.lob_id) score += 10;
      if (rule.stage && params.stage && rule.stage.toUpperCase() === params.stage.toUpperCase()) score += 5;
      if (rule.event_type && params.event_type && rule.event_type.toUpperCase() === params.event_type.toUpperCase()) score += 5;
      if (rule.item_category_id && rule.item_category_id === params.item_category_id) score += 5;
      if (rule.item_posting_group && params.item_posting_group && rule.item_posting_group.toUpperCase() === params.item_posting_group.toUpperCase()) score += 5;
      if (rule.valuation_method && params.valuation_method && rule.valuation_method.toUpperCase() === params.valuation_method.toUpperCase()) score += 5;
      return { rule, score };
    });

    scoredRules.sort((a, b) => b.score - a.score);
    const mapping = scoredRules[0].rule;

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
