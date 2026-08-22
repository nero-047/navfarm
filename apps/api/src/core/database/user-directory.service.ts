import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { MASTER_CONNECTION } from './database.module';
import * as masterSchema from './master-schema';

const toMysqlTimestamp = (date: Date = new Date()) =>
  date.toISOString().slice(0, 19).replace('T', ' ');

/**
 * Central email -> tenant index (see master-schema.userAuthIndex). Login uses
 * this to resolve which tenant database to connect to in one query instead of
 * scanning every tenant database for the email.
 */
@Injectable()
export class UserDirectoryService {
  constructor(
    @Inject(MASTER_CONNECTION)
    private readonly masterDb: MySql2Database<typeof masterSchema>,
  ) {}

  async index(email: string, userId: string, tenantId: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    await this.masterDb
      .insert(masterSchema.userAuthIndex)
      .values({ email: normalizedEmail, user_id: userId, tenant_id: tenantId })
      .onDuplicateKeyUpdate({
        set: { user_id: userId, tenant_id: tenantId, updated_at: toMysqlTimestamp() },
      });
  }

  async lookupTenantId(email: string): Promise<string | null> {
    const [row] = await this.masterDb
      .select({ tenant_id: masterSchema.userAuthIndex.tenant_id })
      .from(masterSchema.userAuthIndex)
      .where(eq(masterSchema.userAuthIndex.email, email.toLowerCase()))
      .limit(1);
    return row?.tenant_id ?? null;
  }
}
