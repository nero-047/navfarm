import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, or, isNull, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class CurrencyService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async listCurrencies() {
    return this.db.select().from(schema.currencyMaster).where(eq(schema.currencyMaster.is_active, true));
  }

  /**
   * Newest first, and scoped to the company asking. A rate with no company is a
   * legacy tenant-wide row and stays visible to everyone, so nothing recorded
   * before scoping existed disappears.
   *
   * Only the from-currency was joined before, so a row read "26.5 USD" without
   * saying what it converted to. Both sides are named now.
   */
  async listExchangeRates(companyId?: string | null) {
    const to = alias(schema.currencyMaster, 'to_currency');
    const conditions = companyId
      ? [or(eq(schema.exchangeRate.company_id, companyId), isNull(schema.exchangeRate.company_id))!]
      : [];
    return this.db
      .select({
        rate_id: schema.exchangeRate.rate_id,
        rate: schema.exchangeRate.rate,
        rate_date: schema.exchangeRate.rate_date,
        rate_source: schema.exchangeRate.rate_source,
        company_id: schema.exchangeRate.company_id,
        from_currency_id: schema.exchangeRate.from_currency_id,
        to_currency_id: schema.exchangeRate.to_currency_id,
        from_currency: schema.currencyMaster.iso_code,
        to_currency: to.iso_code,
      })
      .from(schema.exchangeRate)
      .innerJoin(schema.currencyMaster, eq(schema.exchangeRate.from_currency_id, schema.currencyMaster.currency_id))
      .innerJoin(to, eq(schema.exchangeRate.to_currency_id, to.currency_id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.exchangeRate.rate_date));
  }

  async updateExchangeRate(fromCurrencyId: string, toCurrencyId: string, rate: number, source?: string, rateDate?: string, companyId?: string | null) {
    const rateId = randomUUID();
    await this.db
      .insert(schema.exchangeRate)
      .values({
        rate_id: rateId,
        company_id: companyId || null,
        from_currency_id: fromCurrencyId,
        to_currency_id: toCurrencyId,
        rate: rate.toString(),
        // A dated row, not an overwrite: restating a past period needs the rate
        // as at that date, so each entry is kept rather than replacing the last.
        rate_date: rateDate || new Date().toISOString().split('T')[0],
        rate_source: source || 'MANUAL',
      });
    
    const [newRate] = await this.db
      .select()
      .from(schema.exchangeRate)
      .where(eq(schema.exchangeRate.rate_id, rateId))
      .limit(1);
    return newRate;
  }

  async createCurrency(data: any) {
    const currencyId = data.currency_id || randomUUID();
    await this.db.insert(schema.currencyMaster).values({
      ...data,
      currency_id: currencyId,
    });
    const [newCurr] = await this.db
      .select()
      .from(schema.currencyMaster)
      .where(eq(schema.currencyMaster.currency_id, currencyId))
      .limit(1);
    return newCurr;
  }

  async updateCurrency(id: string, data: any) {
    await this.db
      .update(schema.currencyMaster)
      .set(data)
      .where(eq(schema.currencyMaster.currency_id, id));
    
    const [updatedCurr] = await this.db
      .select()
      .from(schema.currencyMaster)
      .where(eq(schema.currencyMaster.currency_id, id))
      .limit(1);
    return updatedCurr;
  }

  async deleteCurrency(id: string) {
    const [deletedCurr] = await this.db
      .select()
      .from(schema.currencyMaster)
      .where(eq(schema.currencyMaster.currency_id, id))
      .limit(1);
    
    await this.db
      .delete(schema.currencyMaster)
      .where(eq(schema.currencyMaster.currency_id, id));
    
    return deletedCurr;
  }
}
