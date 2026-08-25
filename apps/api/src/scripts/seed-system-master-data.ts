import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { isNull, sql } from 'drizzle-orm';
import * as master from '../core/database/master-schema';
import * as tenant from '../core/database/schema';
import { SYSTEM_UOM_SEED, SYSTEM_SPECIES_SEED } from '../core/database/system-master-data-seed';

/**
 * One-time backfill: seeds the system-generated UOM/Species reference data
 * (see system-master-data-seed.ts) into every EXISTING tenant database.
 * New tenants get this automatically at signup (tenant.service.ts); this
 * script only needs to run once against databases created before that
 * seeding was added. Safe to re-run — skips any tenant that already has
 * tenant-wide (company_id IS NULL) UOM or Species rows.
 */

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const ssl = process.env.DATABASE_SSL === 'true'
  ? { minVersion: 'TLSv1.2' as const, rejectUnauthorized: true }
  : undefined;
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';

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

      try {
        const [existingUom] = await tenantDb
          .select({ count: sql<number>`count(*)` })
          .from(tenant.uomMaster)
          .where(isNull(tenant.uomMaster.company_id));
        if (Number(existingUom.count) === 0) {
          await tenantDb.insert(tenant.uomMaster).values(
            SYSTEM_UOM_SEED.map((u) => ({ ...u, tenant_id: t.tenant_id }))
          );
          console.log(`  [${t.tenant_code}] seeded ${SYSTEM_UOM_SEED.length} UOMs.`);
        } else {
          console.log(`  [${t.tenant_code}] UOM already seeded (${existingUom.count} tenant-wide rows), skipped.`);
        }

        const [existingSpecies] = await tenantDb
          .select({ count: sql<number>`count(*)` })
          .from(tenant.speciesMaster)
          .where(isNull(tenant.speciesMaster.company_id));
        if (Number(existingSpecies.count) === 0) {
          await tenantDb.insert(tenant.speciesMaster).values(
            SYSTEM_SPECIES_SEED.map((s) => ({ ...s, tenant_id: t.tenant_id }))
          );
          console.log(`  [${t.tenant_code}] seeded ${SYSTEM_SPECIES_SEED.length} Species.`);
        } else {
          console.log(`  [${t.tenant_code}] Species already seeded (${existingSpecies.count} tenant-wide rows), skipped.`);
        }
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
