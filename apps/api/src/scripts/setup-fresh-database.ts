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
  console.log('----------------------------------------------------------------');

  // 1. DROP ALL LINKED DATABASES
  console.log('🧹 Step 1: Dropping all linked databases...');
  const server = await mysql.createConnection({ host, port, user, password });
  try {
    const [dbRows] = await server.query<mysql.RowDataPacket[]>('SHOW DATABASES');
    const targetDbs = (dbRows as Array<{ Database: string }>)
      .map((r) => r.Database)
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

  // 4. PROVISION APEX TENANT & 2 COMPANIES (APEXBREED & HIGHLAND)
  runStep('Step 6: Provisioning Tenant (apexagri) & 2 Companies (APEXBREED & HIGHLAND)', 'seed-dev-tenant.ts');

  // 5. SEED COMPLETE PIGGERY DATASET FOR BOTH COMPANIES
  runStep('Step 7: Seeding Complete Piggery Dataset (Herd Animals, Breeding, Schedulers, Batches)', 'seed-piggery-complete-data.ts');

  // 6. PROVISION DEMO TENANT
  runStep('Step 8: Provisioning Demo Tenant (demo)', 'seed-demo-tenant.ts');

  console.log('\n================================================================');
  console.log('🎉 ALL DATABASES MIGRATED & DATA LINKED TOGETHER SUCCESSFULLY!');
  console.log('================================================================');
  console.log('Ready-to-Use Login Credentials (Password: 12345678):');
  console.log('');
  console.log('  1. Tenant Super Admin (Access to Both Companies & Areas):');
  console.log('     URL:      http://localhost:3001/login?tenant=apexagri');
  console.log('     Email:    admin@apexagri.local');
  console.log('     Name:     Rajesh Varma (Group CEO)');
  console.log('     Password: 12345678');
  console.log('');
  console.log('  2. Company 1 Admin (Apex Swine Genetics & Breeding):');
  console.log('     URL:      http://localhost:3001/login?tenant=apexagri');
  console.log('     Email:    arjun.sharma@apexagri.local');
  console.log('     Name:     Dr. Arjun Sharma (Director - Genetics & Breeding)');
  console.log('     Area:     APEX-BREED-01 (Apex Nucleus Breeding & Gestation Unit)');
  console.log('     Password: 12345678');
  console.log('');
  console.log('  3. Company 2 Admin (Highland Commercial Porkers & Processing):');
  console.log('     URL:      http://localhost:3001/login?tenant=apexagri');
  console.log('     Email:    vikram.singh@highlandpork.local');
  console.log('     Name:     Vikram Singh (Operations Director)');
  console.log('     Area:     HIGH-GROW-01 (Highland Grow-Finish Commercial Complex)');
  console.log('     Password: 12345678');
  console.log('');
  console.log('  4. Platform Super Administrator:');
  console.log('     URL:      http://localhost:3001/login  (or /admin)');
  console.log('     Email:    admin@navfarm.local');
  console.log('     Password: 12345678');
  console.log('================================================================\n');
}

void runFreshSetup().catch((err) => {
  console.error('Setup failed:', err.message || err);
  process.exitCode = 1;
});
