import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import * as mysql from 'mysql2/promise';
import * as master from '../core/database/master-schema';
import * as tenant from '../core/database/schema';

/**
 * Applies any pending tenant-schema migrations (src/drizzle/tenant) to every
 * EXISTING, master-registered tenant database. New tenants already get the
 * full migration set at signup (tenant.service.ts); this script is for
 * rolling schema changes out to tenants created before the change shipped.
 * Safe to re-run — drizzle tracks applied migrations per database.
 */

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';
const isRemoteOrTidb = port === 4000 || host.includes('tidbcloud') || process.env.DATABASE_SSL === 'true';
const ssl = isRemoteOrTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

function loadJournalMigrations(migrationsFolder: string) {
  const journalPath = resolve(migrationsFolder, 'meta/_journal.json');
  const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  return (journal.entries as Array<{ tag: string; when: number }>).map((entry) => {
    const sql = readFileSync(resolve(migrationsFolder, `${entry.tag}.sql`), 'utf8');
    return { tag: entry.tag, folderMillis: entry.when, hash: createHash('sha256').update(sql).digest('hex') };
  });
}

/**
 * drizzle's mysql2 migrator only compares the single most-recently-applied
 * migration's `created_at` against each candidate migration's folder timestamp —
 * it never re-checks hashes for anything it decides to skip. So if a tenant
 * database's latest `__drizzle_migrations` row has a `created_at` at or past a
 * given migration's folder timestamp, that migration is silently skipped even if
 * its hash was never actually applied (e.g. after a manual/parallel `drizzle-kit
 * push`, or any out-of-band row in that table). This walks the same comparison
 * drizzle does and flags any migration that would be skipped without ever having
 * been applied, so that case surfaces loudly instead of reporting false success.
 */
async function detectMigrationDrift(pool: mysql.Pool, migrationsFolder: string): Promise<string[]> {
  const [tables] = await pool.query(`SHOW TABLES LIKE '__drizzle_migrations'`);
  if (!(tables as unknown[]).length) return []; // fresh DB — migrate() will apply everything normally

  const [rows] = await pool.query('SELECT hash, created_at FROM __drizzle_migrations');
  const applied = rows as Array<{ hash: string; created_at: number }>;
  const appliedHashes = new Set(applied.map((r) => r.hash));
  const lastCreatedAt = applied.length ? Math.max(...applied.map((r) => Number(r.created_at))) : 0;

  return loadJournalMigrations(migrationsFolder)
    .filter((m) => lastCreatedAt >= m.folderMillis && !appliedHashes.has(m.hash))
    .map((m) => m.tag);
}

async function run() {
  const masterPool = mysql.createPool({ host, port, user, password, database: masterDatabase, ssl });
  const masterDb = drizzle(masterPool, { schema: master, mode: 'default' });

  try {
    const tenants = await masterDb.select().from(master.tenantMaster);
    console.log(`Found ${tenants.length} tenant(s) in ${masterDatabase}.`);

    for (const t of tenants) {
      const tenantPool = mysql.createPool({
        host: t.db_host || host,
        port: t.db_port || port,
        user: t.db_user || user,
        password: t.db_password || password,
        database: t.db_name,
        ssl,
      });
      const tenantDb = drizzle(tenantPool, { schema: tenant, mode: 'default' });
      const migrationsFolder = resolve(process.cwd(), 'src/drizzle/tenant');

      try {
        const drifted = await detectMigrationDrift(tenantPool, migrationsFolder);
        if (drifted.length > 0) {
          console.error(
            `  [${t.tenant_code}] MIGRATION DRIFT DETECTED — skipping this tenant. drizzle would silently ` +
            `skip re-applying these migrations even though their content was never applied to this database: ` +
            `${drifted.join(', ')}. Compare this database's actual schema against those migration files and ` +
            `apply the missing statements by hand (see the git history for how tenant_devco's slot-40 drift ` +
            `was resolved), then re-run this script.`
          );
          continue;
        }

        await migrate(tenantDb as any, { migrationsFolder });
        console.log(`  [${t.tenant_code}] migrations applied (or already up to date).`);
      } catch (err) {
        console.error(`  [${t.tenant_code}] FAILED:`, err instanceof Error ? err.message : err);
      } finally {
        await tenantPool.end();
      }
    }

    console.log('Done.');
  } finally {
    await masterPool.end();
  }
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
