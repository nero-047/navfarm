import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, lte, gte, sum, isNull, lt, desc } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';

@Injectable()
export class ReportService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getTrialBalance(
    companyId: string,
    startDate: string,
    endDate: string,
    costCenterId: string | null,
    tenantId: string
  ) {
    // 1. Fetch all GL accounts for the company
    const accounts = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.tenant_id, tenantId),
          eq(schema.glAccountMaster.company_id, companyId),
          isNull(schema.glAccountMaster.deleted_at)
        )
      );

    const reportLines = [];

    for (const acc of accounts) {
      // 2. Query Opening balance (prior to startDate)
      const openingConditions = [
        eq(schema.generalLedgerEntry.gl_account_id, acc.gl_account_id),
        eq(schema.generalLedgerEntry.tenant_id, tenantId),
        lt(schema.generalLedgerEntry.posting_date, startDate),
      ];
      if (costCenterId) {
        openingConditions.push(eq(schema.generalLedgerEntry.cost_center_id, costCenterId));
      }

      const [openingResult] = await this.db
        .select({
          totalDebits: sum(schema.generalLedgerEntry.debit),
          totalCredits: sum(schema.generalLedgerEntry.credit),
        })
        .from(schema.generalLedgerEntry)
        .where(and(...openingConditions));

      const opDr = openingResult?.totalDebits ? parseFloat(openingResult.totalDebits) : 0;
      const opCr = openingResult?.totalCredits ? parseFloat(openingResult.totalCredits) : 0;
      const openingBalance = opDr - opCr;

      // 3. Query Activity inside range
      const activityConditions = [
        eq(schema.generalLedgerEntry.gl_account_id, acc.gl_account_id),
        eq(schema.generalLedgerEntry.tenant_id, tenantId),
        gte(schema.generalLedgerEntry.posting_date, startDate),
        lte(schema.generalLedgerEntry.posting_date, endDate),
      ];
      if (costCenterId) {
        activityConditions.push(eq(schema.generalLedgerEntry.cost_center_id, costCenterId));
      }

      const [activityResult] = await this.db
        .select({
          totalDebits: sum(schema.generalLedgerEntry.debit),
          totalCredits: sum(schema.generalLedgerEntry.credit),
        })
        .from(schema.generalLedgerEntry)
        .where(and(...activityConditions));

      const rangeDr = activityResult?.totalDebits ? parseFloat(activityResult.totalDebits) : 0;
      const rangeCr = activityResult?.totalCredits ? parseFloat(activityResult.totalCredits) : 0;

      const closingBalance = openingBalance + rangeDr - rangeCr;

      // Filter out zero balance accounts with no activity
      if (openingBalance !== 0 || rangeDr !== 0 || rangeCr !== 0 || closingBalance !== 0) {
        reportLines.push({
          account_id: acc.gl_account_id,
          account_code: acc.account_code,
          account_name: acc.account_name,
          account_type: acc.account_type,
          opening_balance: openingBalance,
          debit: rangeDr,
          credit: rangeCr,
          closing_balance: closingBalance,
        });
      }
    }

    return reportLines.sort((a, b) => a.account_code.localeCompare(b.account_code));
  }

  async getBalanceSheet(companyId: string, asOfDate: string, tenantId: string) {
    const accounts = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.tenant_id, tenantId),
          eq(schema.glAccountMaster.company_id, companyId),
          isNull(schema.glAccountMaster.deleted_at)
        )
      );

    const assetLines = [];
    const liabilityLines = [];
    const equityLines = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const acc of accounts) {
      if (!['ASSET', 'LIABILITY', 'EQUITY'].includes(acc.account_type)) {
        continue;
      }

      // Calculate net sum of entries up to asOfDate
      const [sumResult] = await this.db
        .select({
          debit: sum(schema.generalLedgerEntry.debit),
          credit: sum(schema.generalLedgerEntry.credit),
        })
        .from(schema.generalLedgerEntry)
        .where(
          and(
            eq(schema.generalLedgerEntry.gl_account_id, acc.gl_account_id),
            eq(schema.generalLedgerEntry.tenant_id, tenantId),
            lte(schema.generalLedgerEntry.posting_date, asOfDate)
          )
        );

      const dr = sumResult?.debit ? parseFloat(sumResult.debit) : 0;
      const cr = sumResult?.credit ? parseFloat(sumResult.credit) : 0;
      const balance = dr - cr;

      if (balance !== 0) {
        const line = {
          account_id: acc.gl_account_id,
          account_code: acc.account_code,
          account_name: acc.account_name,
          balance: balance,
        };

        if (acc.account_type === 'ASSET') {
          assetLines.push(line);
          totalAssets += balance;
        } else if (acc.account_type === 'LIABILITY') {
          liabilityLines.push(line);
          totalLiabilities += balance; // typically negative/credit balance
        } else if (acc.account_type === 'EQUITY') {
          equityLines.push(line);
          totalEquity += balance; // typically negative/credit balance
        }
      }
    }

    return {
      asOfDate,
      assets: {
        accounts: assetLines,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilityLines,
        total: totalLiabilities,
      },
      equity: {
        accounts: equityLines,
        total: totalEquity,
      },
      isBalanced: Math.abs(totalAssets + totalLiabilities + totalEquity) < 0.01
    };
  }

  async getProfitAndLoss(companyId: string, startDate: string, endDate: string, tenantId: string) {
    const accounts = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.tenant_id, tenantId),
          eq(schema.glAccountMaster.company_id, companyId),
          isNull(schema.glAccountMaster.deleted_at)
        )
      );

    const revenueLines = [];
    const expenseLines = [];

    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const acc of accounts) {
      if (!['INCOME', 'EXPENSE'].includes(acc.account_type)) {
        continue;
      }

      const [sumResult] = await this.db
        .select({
          debit: sum(schema.generalLedgerEntry.debit),
          credit: sum(schema.generalLedgerEntry.credit),
        })
        .from(schema.generalLedgerEntry)
        .where(
          and(
            eq(schema.generalLedgerEntry.gl_account_id, acc.gl_account_id),
            eq(schema.generalLedgerEntry.tenant_id, tenantId),
            gte(schema.generalLedgerEntry.posting_date, startDate),
            lte(schema.generalLedgerEntry.posting_date, endDate)
          )
        );

      const dr = sumResult?.debit ? parseFloat(sumResult.debit) : 0;
      const cr = sumResult?.credit ? parseFloat(sumResult.credit) : 0;

      if (acc.account_type === 'INCOME') {
        // Income is positive on Credit (Cr - Dr)
        const balance = cr - dr;
        if (balance !== 0) {
          revenueLines.push({
            account_id: acc.gl_account_id,
            account_code: acc.account_code,
            account_name: acc.account_name,
            balance: balance,
          });
          totalRevenue += balance;
        }
      } else {
        // Expense is positive on Debit (Dr - Cr)
        const balance = dr - cr;
        if (balance !== 0) {
          expenseLines.push({
            account_id: acc.gl_account_id,
            account_code: acc.account_code,
            account_name: acc.account_name,
            balance: balance,
          });
          totalExpenses += balance;
        }
      }
    }

    return {
      startDate,
      endDate,
      revenue: {
        accounts: revenueLines,
        total: totalRevenue,
      },
      expenses: {
        accounts: expenseLines,
        total: totalExpenses,
      },
      netProfit: totalRevenue - totalExpenses,
    };
  }

  async getGlLedgerEntries(
    params: {
      companyId: string;
      glAccountId?: string;
      startDate?: string;
      endDate?: string;
      costCenterId?: string;
      refDocType?: string;
      limit?: number;
      offset?: number;
    },
    tenantId: string
  ) {
    const conditions = [
      eq(schema.generalLedgerEntry.tenant_id, tenantId),
      eq(schema.generalLedgerEntry.company_id, params.companyId),
    ];

    if (params.glAccountId) {
      conditions.push(eq(schema.generalLedgerEntry.gl_account_id, params.glAccountId));
    }
    if (params.startDate) {
      conditions.push(gte(schema.generalLedgerEntry.posting_date, params.startDate));
    }
    if (params.endDate) {
      conditions.push(lte(schema.generalLedgerEntry.posting_date, params.endDate));
    }
    if (params.costCenterId) {
      conditions.push(eq(schema.generalLedgerEntry.cost_center_id, params.costCenterId));
    }
    if (params.refDocType) {
      conditions.push(eq(schema.generalLedgerEntry.ref_doc_type, params.refDocType));
    }

    const limit = params.limit ? Number(params.limit) : 50;
    const offset = params.offset ? Number(params.offset) : 0;

    const entries = await this.db
      .select({
        entry_id: schema.generalLedgerEntry.entry_id,
        tenant_id: schema.generalLedgerEntry.tenant_id,
        company_id: schema.generalLedgerEntry.company_id,
        gl_account_id: schema.generalLedgerEntry.gl_account_id,
        account_code: schema.glAccountMaster.account_code,
        account_name: schema.glAccountMaster.account_name,
        account_type: schema.glAccountMaster.account_type,
        debit: schema.generalLedgerEntry.debit,
        credit: schema.generalLedgerEntry.credit,
        running_balance: schema.generalLedgerEntry.running_balance,
        posting_date: schema.generalLedgerEntry.posting_date,
        cost_center_id: schema.generalLedgerEntry.cost_center_id,
        dimension_values: schema.generalLedgerEntry.dimension_values,
        ref_doc_type: schema.generalLedgerEntry.ref_doc_type,
        ref_doc_id: schema.generalLedgerEntry.ref_doc_id,
        ref_doc_line_id: schema.generalLedgerEntry.ref_doc_line_id,
        notes: schema.generalLedgerEntry.notes,
        created_at: schema.generalLedgerEntry.created_at,
      })
      .from(schema.generalLedgerEntry)
      .innerJoin(schema.glAccountMaster, eq(schema.generalLedgerEntry.gl_account_id, schema.glAccountMaster.gl_account_id))
      .where(and(...conditions))
      .orderBy(desc(schema.generalLedgerEntry.posting_date), desc(schema.generalLedgerEntry.created_at))
      .limit(limit)
      .offset(offset);

    const [totals] = await this.db
      .select({
        totalDebit: sum(schema.generalLedgerEntry.debit),
        totalCredit: sum(schema.generalLedgerEntry.credit),
      })
      .from(schema.generalLedgerEntry)
      .where(and(...conditions));

    return {
      entries,
      totalDebit: totals?.totalDebit ? parseFloat(totals.totalDebit) : 0,
      totalCredit: totals?.totalCredit ? parseFloat(totals.totalCredit) : 0,
      limit,
      offset,
    };
  }
}
