import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
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

  async listExchangeRates() {
    return this.db
      .select({
        rate_id: schema.exchangeRate.rate_id,
        rate: schema.exchangeRate.rate,
        rate_date: schema.exchangeRate.rate_date,
        rate_source: schema.exchangeRate.rate_source,
        from_currency: schema.currencyMaster.iso_code,
      })
      .from(schema.exchangeRate)
      .innerJoin(schema.currencyMaster, eq(schema.exchangeRate.from_currency_id, schema.currencyMaster.currency_id));
  }

  async updateExchangeRate(fromCurrencyId: string, toCurrencyId: string, rate: number, source?: string) {
    const rateId = randomUUID();
    await this.db
      .insert(schema.exchangeRate)
      .values({
        rate_id: rateId,
        from_currency_id: fromCurrencyId,
        to_currency_id: toCurrencyId,
        rate: rate.toString(),
        rate_date: new Date().toISOString().split('T')[0],
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
