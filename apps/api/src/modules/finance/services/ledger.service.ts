import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { FiscalService } from './fiscal.service';
import { DimensionService } from './dimension.service';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class LedgerService {
  constructor(
    private readonly cls: ClsService,
    private readonly fiscalService: FiscalService,
    private readonly dimService: DimensionService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async postEntry(
    entry: {
      company_id: string;
      gl_account_id: string;
      debit: number;
      credit: number;
      posting_date: string;
      cost_center_id?: string | null;
      dimension_values?: Record<string, string> | null;
      ref_doc_type: string;
      ref_doc_id: string;
      ref_doc_line_id?: string | null;
      notes?: string | null;
    },
    tenantId: string,
    userId?: string,
    tx?: any
  ): Promise<string> {
    const trx = tx || this.db;

    // 1. Verify period status (Throws if locked or closed)
    const { fiscalYearId, periodId } = await this.fiscalService.validatePostingDate(
      entry.company_id,
      entry.posting_date,
      tenantId,
      trx
    );

    // 2. Verify account exists
    const [account] = await trx
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.gl_account_id, entry.gl_account_id),
          eq(schema.glAccountMaster.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!account) {
      throw new NotFoundException(`GL Account with ID '${entry.gl_account_id}' not found.`);
    }

    if (!account.is_active) {
      throw new BadRequestException(`Cannot post. GL Account '${account.account_code}' is inactive.`);
    }

    // Rule: Parent/Roll-up accounts cannot receive postings directly if they contain children
    const [hasChildren] = await trx
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.parent_account_id, entry.gl_account_id),
          eq(schema.glAccountMaster.tenant_id, tenantId),
          isNull(schema.glAccountMaster.deleted_at)
        )
      )
      .limit(1);
    if (hasChildren) {
      throw new BadRequestException(
        `Cannot post to summary/parent account '${account.account_code}'. Postings must be made to leaf-level sub-accounts.`
      );
    }

    // 3. Validation: Cost Center
    if (account.cost_center_required && !entry.cost_center_id) {
      throw new BadRequestException(
        `Cost Center is required for account '${account.account_code}' but was not provided.`
      );
    }
    if (entry.cost_center_id) {
      await this.dimService.validateCostCenter(entry.cost_center_id, entry.company_id, tenantId, trx);
    }

    // 4. Validation: Dimensions
    if (account.dimension_required && (!entry.dimension_values || Object.keys(entry.dimension_values).length === 0)) {
      throw new BadRequestException(
        `Reporting Dimensions are required for account '${account.account_code}' but were not provided.`
      );
    }
    if (entry.dimension_values) {
      await this.dimService.validateDimensionValues(entry.company_id, entry.dimension_values, tenantId, trx);
    }

    // 5. Read last running balance of the account
    const [lastEntry] = await trx
      .select()
      .from(schema.generalLedgerEntry)
      .where(
        and(
          eq(schema.generalLedgerEntry.gl_account_id, entry.gl_account_id),
          eq(schema.generalLedgerEntry.tenant_id, tenantId)
        )
      )
      .orderBy(desc(schema.generalLedgerEntry.created_at))
      .limit(1);

    const lastBalance = lastEntry ? parseFloat(lastEntry.running_balance) : 0;
    const runningBalance = lastBalance + entry.debit - entry.credit;

    // 6. Insert ledger entry
    const entryId = randomUUID();
    const newEntry = {
      entry_id: entryId,
      tenant_id: tenantId,
      company_id: entry.company_id,
      gl_account_id: entry.gl_account_id,
      debit: entry.debit.toFixed(4),
      credit: entry.credit.toFixed(4),
      running_balance: runningBalance.toFixed(4),
      posting_date: entry.posting_date,
      fiscal_year_id: fiscalYearId,
      period_id: periodId,
      cost_center_id: entry.cost_center_id || null,
      dimension_values: entry.dimension_values || null,
      ref_doc_type: entry.ref_doc_type,
      ref_doc_id: entry.ref_doc_id,
      ref_doc_line_id: entry.ref_doc_line_id || null,
      notes: entry.notes || null,
      created_by: userId || null,
    };

    await trx.insert(schema.generalLedgerEntry).values(newEntry);

    // 7. Audit Log
    await this.auditService.log({
      tenantId,
      companyId: entry.company_id,
      userId,
      action: 'CREATE',
      entityName: 'general_ledger_entry',
      entityId: entryId,
      newValues: newEntry,
    });

    return entryId;
  }
}

import { isNull } from 'drizzle-orm';
