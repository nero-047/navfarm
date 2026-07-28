import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class FinanceReportService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getTrialBalanceReport(companyId: string, tenantId: string) {
    const accounts = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.tenant_id, tenantId),
          eq(schema.glAccountMaster.company_id, companyId)
        )
      );

    let totalDebit = 0;
    let totalCredit = 0;

    const accountBalances = accounts.map(acc => {
      const debit = parseFloat(acc.balance_debit || '0');
      const credit = parseFloat(acc.balance_credit || '0');
      totalDebit += debit;
      totalCredit += credit;

      return {
        account_id: acc.account_id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        debit,
        credit,
        net_balance: debit - credit,
      };
    });

    return {
      company_id: companyId,
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      accounts: accountBalances,
    };
  }

  async getProfitAndLossReport(companyId: string, tenantId: string) {
    const accounts = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.tenant_id, tenantId),
          eq(schema.glAccountMaster.company_id, companyId)
        )
      );

    let totalRevenue = 0;
    let totalExpenses = 0;

    accounts.forEach(acc => {
      const debit = parseFloat(acc.balance_debit || '0');
      const credit = parseFloat(acc.balance_credit || '0');

      if (acc.account_type === 'REVENUE') {
        totalRevenue += (credit - debit);
      } else if (acc.account_type === 'EXPENSE') {
        totalExpenses += (debit - credit);
      }
    });

    return {
      company_id: companyId,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: totalRevenue - totalExpenses,
      profit_margin_pct: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
    };
  }
}
