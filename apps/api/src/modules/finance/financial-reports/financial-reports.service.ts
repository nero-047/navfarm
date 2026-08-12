import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, lte, between, isNull, sql, inArray } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

interface AccountBalanceRow {
  gl_account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_id: string | null;
  total_debit: number;
  total_credit: number;
}

// Normal-balance convention: ASSET/EXPENSE accounts increase with debits;
// LIABILITY/EQUITY/INCOME accounts increase with credits. Not stored on the
// account itself — derived from account_type, matching gl_account_master's
// existing ASSET/LIABILITY/EQUITY/INCOME/EXPENSE enum.
const DEBIT_NORMAL_TYPES = new Set(['ASSET', 'EXPENSE']);

function netBalance(row: AccountBalanceRow): number {
  return DEBIT_NORMAL_TYPES.has(row.account_type) ? row.total_debit - row.total_credit : row.total_credit - row.total_debit;
}

@Injectable()
export class FinancialReportsService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  private async getAccountBalances(
    tenantId: string,
    companyId: string,
    dateCondition: any,
    accountTypes?: string[]
  ): Promise<AccountBalanceRow[]> {
    const conditions: any[] = [
      eq(schema.journalHeader.tenant_id, tenantId),
      eq(schema.journalHeader.company_id, companyId),
      eq(schema.journalHeader.status, 'POSTED'),
      isNull(schema.journalHeader.deleted_at),
      dateCondition,
    ];
    if (accountTypes && accountTypes.length > 0) {
      conditions.push(inArray(schema.glAccountMaster.account_type, accountTypes));
    }

    const rows = await this.db
      .select({
        gl_account_id: schema.journalLine.gl_account_id,
        account_code: schema.glAccountMaster.account_code,
        account_name: schema.glAccountMaster.account_name,
        account_type: schema.glAccountMaster.account_type,
        parent_account_id: schema.glAccountMaster.parent_account_id,
        total_debit: sql<string>`COALESCE(SUM(${schema.journalLine.debit_amount}), 0)`,
        total_credit: sql<string>`COALESCE(SUM(${schema.journalLine.credit_amount}), 0)`,
      })
      .from(schema.journalLine)
      .innerJoin(schema.journalHeader, eq(schema.journalLine.journal_id, schema.journalHeader.journal_id))
      .innerJoin(schema.glAccountMaster, eq(schema.journalLine.gl_account_id, schema.glAccountMaster.gl_account_id))
      .where(and(...conditions))
      .groupBy(
        schema.journalLine.gl_account_id,
        schema.glAccountMaster.account_code,
        schema.glAccountMaster.account_name,
        schema.glAccountMaster.account_type,
        schema.glAccountMaster.parent_account_id
      );

    return rows.map((r) => ({ ...r, total_debit: Number(r.total_debit), total_credit: Number(r.total_credit) }));
  }

  async getTrialBalance(tenantId: string, companyId: string, asOfDate: string) {
    const rows = await this.getAccountBalances(tenantId, companyId, lte(schema.journalHeader.posting_date, asOfDate));

    const accounts = rows
      .map((r) => ({
        gl_account_id: r.gl_account_id,
        account_code: r.account_code,
        account_name: r.account_name,
        account_type: r.account_type,
        total_debit: r.total_debit,
        total_credit: r.total_credit,
      }))
      .sort((a, b) => a.account_code.localeCompare(b.account_code));

    const totalDebit = accounts.reduce((sum, a) => sum + a.total_debit, 0);
    const totalCredit = accounts.reduce((sum, a) => sum + a.total_credit, 0);

    return { asOfDate, accounts, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.0001 };
  }

  async getBalanceSheet(tenantId: string, companyId: string, asOfDate: string) {
    const rows = await this.getAccountBalances(tenantId, companyId, lte(schema.journalHeader.posting_date, asOfDate), [
      'ASSET',
      'LIABILITY',
      'EQUITY',
    ]);

    const toLine = (r: AccountBalanceRow) => ({
      gl_account_id: r.gl_account_id,
      account_code: r.account_code,
      account_name: r.account_name,
      balance: netBalance(r),
    });

    const assets = rows.filter((r) => r.account_type === 'ASSET').map(toLine).sort((a, b) => a.account_code.localeCompare(b.account_code));
    const liabilities = rows.filter((r) => r.account_type === 'LIABILITY').map(toLine).sort((a, b) => a.account_code.localeCompare(b.account_code));
    const equity = rows.filter((r) => r.account_type === 'EQUITY').map(toLine).sort((a, b) => a.account_code.localeCompare(b.account_code));

    // There's no period-close step anywhere in this system (no journal entry
    // ever zeroes Income/Expense into a retained-earnings GL account), so an
    // interim balance sheet has nowhere for the period's trading result to
    // land — Assets would never equal Liabilities + Equity for any company
    // with real revenue/expense activity. Computed on the fly (all posted
    // Income/Expense activity from inception through asOfDate, same
    // convention as the Asset/Liability/Equity pull above) and shown as one
    // synthetic Equity line, rather than requiring a formal closing entry.
    const plRows = await this.getAccountBalances(tenantId, companyId, lte(schema.journalHeader.posting_date, asOfDate), [
      'INCOME',
      'EXPENSE',
    ]);
    const totalIncome = plRows.filter((r) => r.account_type === 'INCOME').reduce((sum, r) => sum + netBalance(r), 0);
    const totalExpense = plRows.filter((r) => r.account_type === 'EXPENSE').reduce((sum, r) => sum + netBalance(r), 0);
    const retainedEarnings = totalIncome - totalExpense;

    if (Math.abs(retainedEarnings) > 0.0001) {
      equity.push({
        gl_account_id: 'retained-earnings-current-period',
        account_code: 'RE-CURRENT',
        account_name: 'Retained Earnings (Current Period)',
        balance: retainedEarnings,
      });
    }

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return {
      asOfDate,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.0001,
    };
  }

  async getProfitLoss(tenantId: string, companyId: string, dateFrom: string, dateTo: string) {
    const rows = await this.getAccountBalances(
      tenantId,
      companyId,
      between(schema.journalHeader.posting_date, dateFrom, dateTo),
      ['INCOME', 'EXPENSE']
    );

    const toLine = (r: AccountBalanceRow) => ({
      gl_account_id: r.gl_account_id,
      account_code: r.account_code,
      account_name: r.account_name,
      balance: netBalance(r),
    });

    const income = rows.filter((r) => r.account_type === 'INCOME').map(toLine).sort((a, b) => a.account_code.localeCompare(b.account_code));
    const expense = rows.filter((r) => r.account_type === 'EXPENSE').map(toLine).sort((a, b) => a.account_code.localeCompare(b.account_code));

    const totalIncome = income.reduce((sum, a) => sum + a.balance, 0);
    const totalExpense = expense.reduce((sum, a) => sum + a.balance, 0);

    return { dateFrom, dateTo, income, expense, totalIncome, totalExpense, netIncome: totalIncome - totalExpense };
  }
}
