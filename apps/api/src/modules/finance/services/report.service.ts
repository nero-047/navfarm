import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, lte, gte, sum, isNull, lt } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

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
}
