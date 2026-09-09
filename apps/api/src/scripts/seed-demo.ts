import * as mysql from 'mysql2/promise';
import { bootstrap } from './bootstrap-database';
import { seedDevTenant } from './seed-dev-tenant';
import { seedPiggeryData } from './seed-piggery-complete-data';
import { seedFullCoverage } from './seed-demo-full-coverage';
import { seedDemoGaps } from './seed-demo-gaps';

/**
 * One command to build the entire demo environment.
 *
 * Runs the whole chain in dependency order — platform bootstrap, tenant and its
 * two companies, the piggery operational dataset, the cross-module coverage
 * pass, then the master-data/configuration gap fill — so a presentation
 * environment is reproducible from nothing with a single target instead of four
 * scripts run by hand in the right order.
 *
 *   pnpm nx run api:db-seed-demo             # build (safe to re-run)
 *   pnpm nx run api:db-seed-demo --fresh     # drop the databases first
 *
 * Every stage is idempotent, so re-running only fills what is missing. Pass
 * --fresh (or SEED_FRESH=true) to drop navfarm_master, tenant_system and the
 * dev tenant database first and rebuild from empty.
 */

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const ssl = process.env.DATABASE_SSL === 'true'
  ? { minVersion: 'TLSv1.2' as const, rejectUnauthorized: true }
  : undefined;
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';
const systemDatabase = process.env.SYSTEM_TENANT_DATABASE || 'tenant_system';
const tenantCode = (process.env.DEV_TENANT_CODE || 'devco').toLowerCase();

const wantsFresh = process.argv.includes('--fresh') || process.env.SEED_FRESH === 'true';

function assertDatabaseName(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`Unsafe database name: ${value}`);
  return value;
}

async function dropDatabases() {
  // Only ever the three NAVFarm databases, named explicitly. Anything else on
  // this server — another project sharing the same local MySQL — is untouched.
  const targets = [masterDatabase, systemDatabase, `tenant_${tenantCode}`].map(assertDatabaseName);
  const conn = await mysql.createConnection({ host, port, user, password, ssl });
  try {
    for (const dbName of targets) {
      await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
      console.log(`  dropped ${dbName}`);
    }
  } finally {
    await conn.end();
  }
}

const stages: Array<{ label: string; fn: () => Promise<unknown> }> = [
  { label: 'Platform bootstrap (master + system tenant)', fn: bootstrap },
  { label: 'Tenant, companies, users, starter master data', fn: seedDevTenant },
  { label: 'Piggery operational dataset (both companies)', fn: seedPiggeryData },
  { label: 'Cross-module coverage (inventory, finance, QC, approvals)', fn: seedFullCoverage },
  { label: 'Master-data & configuration gap fill', fn: seedDemoGaps },
];

export async function seedDemo() {
  const started = Date.now();

  if (wantsFresh) {
    console.log('\n🗑️  Dropping NAVFarm databases (--fresh)...');
    await dropDatabases();
  }

  for (const [i, stage] of stages.entries()) {
    console.log(`\n━━ ${i + 1}/${stages.length} ${stage.label} ${'━'.repeat(Math.max(0, 46 - stage.label.length))}`);
    await stage.fn();
  }

  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(`\n✅ Demo environment ready in ${seconds}s.`);
  console.log('════════════════════════════════════════════════════');
  // Read back what was actually created rather than repeating a list written
  // by hand. The summary used to name six users on two companies, none of which
  // survived the rename to Triple C — it told you to sign in as addresses that
  // did not exist.
  const summaryPool = mysql.createPool({ host, port, user, password, database: assertDatabaseName(`tenant_${tenantCode}`), ssl });
  try {
    const [companies] = await summaryPool.query<any[]>('SELECT company_code, company_name FROM company_master WHERE deleted_at IS NULL');
    const [areas] = await summaryPool.query<any[]>('SELECT area_code, area_name FROM operational_area_master WHERE deleted_at IS NULL');
    const [users] = await summaryPool.query<any[]>(
      "SELECT email, user_type FROM user_master ORDER BY FIELD(user_type,'TENANT_ADMIN','COMPANY_ADMIN','OPERATIONAL_ADMIN','STANDARD_USER'), email"
    );

    console.log(`Tenant:            ${tenantCode}`);
    for (const c of companies) console.log(`Company:           ${c.company_name} (${c.company_code})`);
    for (const a of areas) console.log(`Operational area:  ${a.area_name} (${a.area_code})`);
    console.log('');
    console.log('Sign in at http://localhost:3002/login — password 12345678 for all:');
    for (const u of users) console.log(`  ${String(u.email).padEnd(32)} ${u.user_type}`);
  } finally {
    await summaryPool.end();
  }
  console.log('');
}

if (require.main === module) {
  void seedDemo().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
