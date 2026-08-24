import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';

@Injectable()
export class ConnectionManagerService implements OnModuleDestroy {
  private tenantConnections = new Map<string, MySql2Database<typeof schema>>();
  private pools = new Map<string, mysql.Pool>();

  async getTenantConnection(tenant: {
    tenant_id: string;
    db_host: string;
    db_port: number;
    db_name: string;
    db_user: string;
    db_password?: string;
  }): Promise<MySql2Database<typeof schema>> {
    const cacheKey = tenant.tenant_id;
    if (this.tenantConnections.has(cacheKey)) {
      return this.tenantConnections.get(cacheKey)!;
    }

    const isRemoteOrTidb =
      tenant.db_port === 4000 ||
      (tenant.db_host && tenant.db_host.includes('tidbcloud')) ||
      process.env.DATABASE_SSL === 'true';

    const pool = mysql.createPool({
      host: tenant.db_host,
      port: tenant.db_port,
      user: tenant.db_user,
      password: tenant.db_password || '',
      database: tenant.db_name,
      ssl: isRemoteOrTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
    });

    const db = drizzle(pool, { schema, mode: 'default' });

    this.pools.set(cacheKey, pool);
    this.tenantConnections.set(cacheKey, db);

    return db;
  }

  async onModuleDestroy() {
    for (const [key, pool] of this.pools.entries()) {
      try {
        await pool.end();
      } catch (err) {
        console.error(`Error closing pool for tenant ${key}:`, err);
      }
    }
    this.pools.clear();
    this.tenantConnections.clear();
  }
}
