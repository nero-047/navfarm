import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class CountryService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async listCountries() {
    return this.db.select().from(schema.countryMaster).where(eq(schema.countryMaster.is_active, true));
  }

  async createCountry(data: any) {
    const countryId = data.country_id || randomUUID();
    await this.db.insert(schema.countryMaster).values({ ...data, country_id: countryId });
    const [newCountry] = await this.db.select().from(schema.countryMaster).where(eq(schema.countryMaster.country_id, countryId)).limit(1);
    return newCountry;
  }

  async updateCountry(id: string, data: any) {
    await this.db.update(schema.countryMaster).set(data).where(eq(schema.countryMaster.country_id, id));
    const [updated] = await this.db.select().from(schema.countryMaster).where(eq(schema.countryMaster.country_id, id)).limit(1);
    return updated;
  }

  async deleteCountry(id: string) {
    const [deleted] = await this.db.select().from(schema.countryMaster).where(eq(schema.countryMaster.country_id, id)).limit(1);
    await this.db.delete(schema.countryMaster).where(eq(schema.countryMaster.country_id, id));
    return deleted;
  }

  private async assertCountryExists(countryId: string) {
    const [country] = await this.db.select().from(schema.countryMaster).where(eq(schema.countryMaster.country_id, countryId)).limit(1);
    if (!country) {
      throw new NotFoundException(`Country with ID '${countryId}' not found.`);
    }
  }

  async listStates(countryId: string) {
    await this.assertCountryExists(countryId);
    return this.db
      .select()
      .from(schema.stateProvince)
      .where(and(eq(schema.stateProvince.country_id, countryId), eq(schema.stateProvince.is_active, true)));
  }

  async createState(countryId: string, data: any) {
    await this.assertCountryExists(countryId);
    const stateId = randomUUID();
    await this.db.insert(schema.stateProvince).values({ ...data, state_id: stateId, country_id: countryId });
    const [newState] = await this.db.select().from(schema.stateProvince).where(eq(schema.stateProvince.state_id, stateId)).limit(1);
    return newState;
  }

  async updateState(stateId: string, data: any) {
    await this.db.update(schema.stateProvince).set(data).where(eq(schema.stateProvince.state_id, stateId));
    const [updated] = await this.db.select().from(schema.stateProvince).where(eq(schema.stateProvince.state_id, stateId)).limit(1);
    return updated;
  }

  async deleteState(stateId: string) {
    const [deleted] = await this.db.select().from(schema.stateProvince).where(eq(schema.stateProvince.state_id, stateId)).limit(1);
    await this.db.delete(schema.stateProvince).where(eq(schema.stateProvince.state_id, stateId));
    return deleted;
  }
}
