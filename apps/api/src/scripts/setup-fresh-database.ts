import * as mysql from 'mysql2/promise';
import { execSync } from 'node:child_process';

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';
const isPiggeryIsolated = masterDatabase.startsWith('piggery_');
const tenantPrefix = isPiggeryIsolated ? 'piggery_tenant_' : 'tenant_';
const systemDatabase = process.env.SYSTEM_TENANT_DATABASE || (isPiggeryIsolated ? 'piggery_tenant_system' : 'tenant_system');

const isRemoteOrTidb = port === 4000 || host.includes('tidbcloud') || process.env.DATABASE_SSL === 'true';
const ssl = isRemoteOrTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

function assertDbName(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe database name: ${value}`);
  }
  return value;
}

function runStep(title: string, scriptFile: string) {
  console.log(`\n⏳ ${title}...`);
  try {
    execSync(`node --env-file-if-exists=.env --import tsx src/scripts/${scriptFile}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
  } catch (err: any) {
    console.error(`❌ Failed during step: ${title}`);
    throw err;
  }
}

async function runFreshSetup() {
  console.log('================================================================');
  console.log('🚀 NAVFARM ERP — UNIFIED FRESH DATABASE MIGRATION & SEED ENGINE');
  console.log('================================================================');
  console.log(`Master Database:    ${masterDatabase}`);
  console.log(`System Database:    ${systemDatabase}`);
  console.log(`Tenant DB Prefix:   ${tenantPrefix}*`);
  console.log(`SSL Mode:           ${ssl ? 'TLSv1.2 Enabled' : 'Disabled'}`);
  console.log('----------------------------------------------------------------');

  // 1. DROP ALL LINKED DATABASES
  console.log('🧹 Step 1: Dropping all linked databases...');
  const server = await mysql.createConnection({ host, port, user, password, ssl });
  try {
    const [dbRows] = await server.query<mysql.RowDataPacket[]>('SHOW DATABASES');
    const targetDbs = (dbRows as Array<any>)
      .map((r) => r.Database || Object.values(r)[0])
      .filter((d) => d === masterDatabase || d === systemDatabase || d.startsWith(tenantPrefix));

    for (const dbName of targetDbs) {
      assertDbName(dbName);
      console.log(`   - Dropping database \`${dbName}\`...`);
      await server.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    }
  } finally {
    await server.end();
  }

  // 2. RUN BOOTSTRAP (Master & System DB migrations + Core seeds)
  runStep('Step 2: Bootstrapping Master & System Databases', 'bootstrap-database.ts');

  // 3. SYNC TAXONOMY & REFERENCE MASTERS
  runStep('Step 3: Syncing NOB & LOB Taxonomy (Livestock, Piggery, Poultry, etc.)', 'sync-nob-lob.ts');
  runStep('Step 4: Syncing Locales, Timezones & Countries', 'sync-locale-master.ts');
  runStep('Step 5: Seeding Reference Masters (UOMs, Species, Breeds, Stages, Items)', 'seed-system-master-data.ts');

  // 4. PROVISION DEV TENANT & COMPANY DEVCO (seed-dev-tenant.ts already runs the full
  // drizzle tenant migration set against the tenant's real db_name, so scheduler/draft
  // schema extensions land automatically — no separate ad-hoc schema-patch step needed)
  runStep('Step 6: Provisioning Dev Tenant (devco) & Company (DEVCO)', 'seed-dev-tenant.ts');

  // 5. SEED COMPLETE PIGGERY DATASET (ANIMALS, REPRODUCTION, BATCHES, TRANSACTIONS)
  runStep('Step 7: Seeding Complete Piggery Dataset (Herd Animals, Breeding, Farrowing, Batches)', 'seed-piggery-complete-data.ts');
  runStep('Step 7b: Applying Clean Multi-Stage Schedulers, Batches & 15-Day Data', 'reset-and-seed-piggery-data.js');

  // 6. PROVISION DEMO TENANT
  runStep('Step 8: Provisioning Demo Tenant (demo)', 'seed-demo-tenant.ts');

  console.log('\n================================================================');
  console.log('🎉 ALL DATABASES MIGRATED & DATA LINKED TOGETHER SUCCESSFULLY!');
  console.log('================================================================');
  console.log('Ready-to-Use Login Credentials:');
  console.log('');
  console.log('  1. Dev Company Admin (Full Piggery Data):');
  console.log('     URL:      http://localhost:3000/login?tenant=devco');
  console.log('     Email:    admin@devco.local');
  console.log('     Password: DevAdmin@12345');
  console.log('');
  console.log('  2. Dev Tenant Admin:');
  console.log('     Email:    tenantadmin@devco.local');
  console.log('     Password: DevTenant@12345');
  console.log('');
  console.log('  3. Platform Super Admin:');
  console.log('     Email:    admin@navfarm.local');
  console.log('     Password: SystemAdmin@12345');
  console.log('================================================================\n');
}

void runFreshSetup().catch((err) => {
  console.error('Setup failed:', err.message || err);
  process.exitCode = 1;
});
