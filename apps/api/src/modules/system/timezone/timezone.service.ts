import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class TimezoneService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async listTimezones() {
    return this.db.select().from(schema.timezoneMaster).where(eq(schema.timezoneMaster.is_active, true));
  }

  async createTimezone(data: any) {
    const tzId = data.tz_id || randomUUID();
    await this.db.insert(schema.timezoneMaster).values({ ...data, tz_id: tzId });
    const [newTz] = await this.db.select().from(schema.timezoneMaster).where(eq(schema.timezoneMaster.tz_id, tzId)).limit(1);
    return newTz;
  }

  async updateTimezone(id: string, data: any) {
    await this.db.update(schema.timezoneMaster).set(data).where(eq(schema.timezoneMaster.tz_id, id));
    const [updated] = await this.db.select().from(schema.timezoneMaster).where(eq(schema.timezoneMaster.tz_id, id)).limit(1);
    return updated;
  }

  async deleteTimezone(id: string) {
    const [deleted] = await this.db.select().from(schema.timezoneMaster).where(eq(schema.timezoneMaster.tz_id, id)).limit(1);
    await this.db.delete(schema.timezoneMaster).where(eq(schema.timezoneMaster.tz_id, id));
    return deleted;
  }
}
