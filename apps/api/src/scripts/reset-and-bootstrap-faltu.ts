import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import * as mysql from 'mysql2/promise';
import * as master from '../core/database/master-schema';
import * as tenant from '../core/database/schema';
import {
  SYSTEM_UOM_SEED,
  SYSTEM_SPECIES_SEED,
  SYSTEM_BREED_SEED,
  SYSTEM_ITEM_SEED,
  SYSTEM_PARAMETER_SEED,
  SYSTEM_STAGE_SEED,
  SYSTEM_NO_SERIES_SEED,
  SYSTEM_BREED_LIFECYCLE_SEED
} from '../core/database/system-master-data-seed';
import { execSync } from 'node:child_process';

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';

function assertDbName(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`Unsafe db name: ${value}`);
  return value;
}

const apiDir = resolve(__dirname, '../..');
const tsxBin = resolve(apiDir, 'node_modules/.bin/tsx');

function runStep(scriptRelativePath: string) {
  const fullScript = resolve(apiDir, scriptRelativePath);
  execSync(`"${tsxBin}" --env-file-if-exists="${resolve(apiDir, '.env')}" "${fullScript}"`, {
    stdio: 'inherit',
    cwd: apiDir,
    env: process.env,
  });
}

async function runResetAndBootstrapFaltu() {
  console.log('================================================================');
  console.log('🚀 NAVFARM ERP — CLEAN DATABASE DROP & FALTU FARMS BOOTSTRAP');
  console.log('================================================================');

  // 1. DROP ALL LINKED DATABASES
  console.log('🧹 1. Dropping all databases related to navfarm...');
  const server = await mysql.createConnection({ host, port, user, password });
  try {
    const [dbRows] = await server.query<mysql.RowDataPacket[]>('SHOW DATABASES');
    for (const r of dbRows as Array<{ Database: string }>) {
      const name = r.Database;
      if (
        name === masterDatabase ||
        name.startsWith('tenant_') ||
        name.startsWith('navfarm_') ||
        name.startsWith('piggery_')
      ) {
        assertDbName(name);
        console.log(`   - Dropping database \`${name}\`...`);
        await server.query(`DROP DATABASE IF EXISTS \`${name}\``);
      }
    }
  } finally {
    await server.end();
  }

  // 2. RUN BASE PLATFORM BOOTSTRAP
  console.log('\n📦 2. Bootstrapping Master and System database baseline...');
  runStep('src/scripts/bootstrap-database.ts');
  runStep('src/scripts/sync-nob-lob.ts');
  runStep('src/scripts/sync-locale-master.ts');
  runStep('src/scripts/seed-system-master-data.ts');

  // 3. PROVISION "faltu farms" TENANT
  console.log('\n🏢 3. Provisioning Tenant "faltu farms" (tenant_faltu)...');
  const masterPool = mysql.createPool({ host, port, user, password, database: masterDatabase });
  const masterDb = drizzle(masterPool, { schema: master, mode: 'default' });

  const tenantCode = 'faltu';
  const tenantName = 'faltu farms';
  const tenantDbName = 'tenant_faltu';
  const tenantId = randomUUID();
  const commonPasswordHash = await bcrypt.hash('12345678', 10);

  const today = new Date().toISOString().slice(0, 10);
  // Register in master.tenantMaster
  await masterDb.insert(master.tenantMaster).values({
    tenant_id: tenantId,
    tenant_name: tenantName,
    tenant_code: tenantCode,
    tenant_type: 'ENTERPRISE',
    plan_id: 'PLAN_ENTERPRISE',
    plan_start_date: today,
    billing_email: 'admin@faltu.local',
    billing_cycle: 'ANNUAL',
    max_companies: 100,
    max_users: 1000,
    api_rate_limit: 10000,
    db_host: host,
    db_port: port,
    db_name: tenantDbName,
    db_user: user,
    db_password: password,
    is_active: true,
  });

  await masterDb.insert(master.tenantSubscription).values({
    tenant_id: tenantId,
    plan_code: 'PLAN_ENTERPRISE',
    storage_limit_gb: '500.00',
    support_tier: 'ENTERPRISE',
    sla_uptime_pct: '99.99',
    renewal_auto: true,
    feature_flags: { onboarding: true, operations: true, enterprise: true },
  });

  // Create tenant database
  const serverConn = await mysql.createConnection({ host, port, user, password });
  await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await serverConn.end();

  // Run migrations on tenant_faltu
  const tenantPool = mysql.createPool({ host, port, user, password, database: tenantDbName });
  const tenantDb = drizzle(tenantPool, { schema: tenant, mode: 'default' });
  await migrate(tenantDb, { migrationsFolder: resolve(apiDir, 'src/drizzle/tenant') });

  // Copy shared taxonomy
  const masterLangs = await masterDb.select().from(master.languageMaster);
  const masterCurrs = await masterDb.select().from(master.currencyMaster);
  const masterTimezones = await masterDb.select().from(master.timezoneMaster);
  const masterCountries = await masterDb.select().from(master.countryMaster);
  const masterStates = await masterDb.select().from(master.stateProvince);
  const masterCostingMethods = await masterDb.select().from(master.costingMethodConfig);
  const masterSteps = await masterDb.select().from(master.setupStepMaster);
  const masterNobs = await masterDb.select().from(master.nobMaster);
  const masterLobs = await masterDb.select().from(master.lobMaster);

  for (const row of masterLangs) await tenantDb.insert(tenant.languageMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
  for (const row of masterCurrs) await tenantDb.insert(tenant.currencyMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
  for (const row of masterTimezones) await tenantDb.insert(tenant.timezoneMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
  for (const row of masterCountries) await tenantDb.insert(tenant.countryMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
  for (const row of masterStates) await tenantDb.insert(tenant.stateProvince).values(row).onDuplicateKeyUpdate({ set: { ...row } });
  for (const row of masterCostingMethods) await tenantDb.insert(tenant.costingMethodConfig).values(row).onDuplicateKeyUpdate({ set: { ...row } });
  for (const row of masterSteps) await tenantDb.insert(tenant.setupStepMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
  for (const row of masterNobs) await tenantDb.insert(tenant.nobMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
  for (const row of masterLobs) await tenantDb.insert(tenant.lobMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });

  // Seed UOM, Species, Breeds, Items
  await tenantDb.insert(tenant.uomMaster).values(SYSTEM_UOM_SEED.map((u) => ({ ...u, tenant_id: tenantId })));
  await tenantDb.insert(tenant.speciesMaster).values(SYSTEM_SPECIES_SEED.map((s) => ({ ...s, tenant_id: tenantId })));

  const nobIdByCode = new Map(masterNobs.map((n) => [n.nob_code, n.nob_id]));
  const lobIdByCode = new Map(masterLobs.map((l) => [l.lob_code, l.lob_id]));
  const speciesRows = await tenantDb.select().from(tenant.speciesMaster);
  const speciesIdByCode = new Map(speciesRows.map((s) => [s.species_code, s.species_id]));

  for (const breed of SYSTEM_BREED_SEED) {
    const nobId = nobIdByCode.get(breed.nob_code);
    const lobId = lobIdByCode.get(breed.lob_code);
    const speciesId = speciesIdByCode.get(breed.species_code);
    if (!nobId || !lobId) continue;
    await tenantDb.insert(tenant.breedMaster).values({
      breed_id: randomUUID(),
      tenant_id: tenantId,
      company_id: null,
      nob_id: nobId,
      lob_id: lobId,
      breed_code: breed.breed_code,
      breed_name: breed.breed_name,
      species_id: speciesId || null,
      breed_type: breed.breed_type,
      gestation_days: breed.gestation_days ?? null,
      lactation_days: breed.lactation_days ?? null,
      productive_life_months: breed.productive_life_months ?? null,
      residual_value_pct: breed.residual_value_pct?.toString() ?? null,
      productive_life_cycles: breed.productive_life_cycles ?? null,
      avg_litter_size_born: breed.avg_litter_size_born?.toString() ?? null,
      avg_litter_size_weaned: breed.avg_litter_size_weaned?.toString() ?? null,
      avg_weaning_weight_kg: breed.avg_weaning_weight_kg?.toString() ?? null,
      farrowing_rate_pct: breed.farrowing_rate_pct?.toString() ?? null,
      boar_doses_per_week: breed.boar_doses_per_week?.toString() ?? null,
      boar_productive_life_months: breed.boar_productive_life_months ?? null,
    });
  }

  for (const item of SYSTEM_ITEM_SEED) {
    const nobId = nobIdByCode.get(item.nob_code);
    const lobId = lobIdByCode.get(item.lob_code);
    if (!nobId || !lobId) continue;
    await tenantDb.insert(tenant.itemMaster).values({
      item_id: randomUUID(),
      tenant_id: tenantId,
      company_id: null,
      nob_id: nobId,
      lob_id: lobId,
      item_code: item.item_code,
      item_name: item.item_name,
      item_type: item.item_category || 'CONSUMABLE',
      category: item.item_category || 'GENERAL',
      uom_primary: item.base_uom || 'KG',
      standard_cost: item.standard_cost ? String(item.standard_cost) : '0.00',
      valuation_method: item.valuation_method || 'FIFO',
      posting_group: item.item_category || 'GENERAL',
      is_biological_asset: item.is_bio_asset ?? false,
      is_active: true,
    });
  }

  const defaultLangId = masterLangs.find((l) => l.is_system_default)?.lang_id || masterLangs[0]?.lang_id || '10000000-1000-1000-1000-100000000001';
  const defaultCurrId = masterCurrs.find((c) => c.is_system_default)?.currency_id || masterCurrs[0]?.currency_id || '20000000-2000-2000-2000-200000000001';

  // 4. PROVISION TENANT ADMIN: admin@faltu.local
  console.log('👤 4. Creating Tenant Admin: admin@faltu.local ...');
  const tenantAdminId = randomUUID();
  const hqCompanyId = randomUUID();

  // Create Faltu Farms HQ company
  await tenantDb.insert(tenant.companyMaster).values({
    company_id: hqCompanyId,
    tenant_id: tenantId,
    company_name: 'Faltu Farms Corporate HQ',
    company_code: 'FF-HQ',
    company_display_name: 'Faltu Farms Corporate HQ',
    company_type: 'Pvt Ltd',
    industry_type: 'Livestock Farming',
    base_currency_id: defaultCurrId,
    default_language_id: defaultLangId,
    default_timezone_id: 'Asia/Kolkata',
    country_id: 'IND',
    financial_year_start: 4,
    onboarding_status: 'COMPLETED',
    is_active: true,
  });

  await tenantDb.insert(tenant.userMaster).values({
    user_id: tenantAdminId,
    tenant_id: tenantId,
    company_id: hqCompanyId,
    email: 'admin@faltu.local',
    password_hash: commonPasswordHash,
    full_name: 'Faltu Farms Group Admin',
    user_type: 'TENANT_ADMIN',
    status: 'ACTIVE',
    is_active: true,
  });

  await tenantDb.insert(tenant.userCompanyAssignments).values({
    assign_id: randomUUID(),
    user_id: tenantAdminId,
    company_id: hqCompanyId,
    is_primary: true,
    assigned_by: tenantAdminId,
  });

  // 5. PROVISION COMPANY 1: "first fultu company"
  console.log('🏢 5. Creating Company 1: "first fultu company" (admin@1st.local) ...');
  const comp1Id = randomUUID();
  await tenantDb.insert(tenant.companyMaster).values({
    company_id: comp1Id,
    tenant_id: tenantId,
    company_name: 'first fultu company',
    company_code: 'FFC',
    company_display_name: 'First Fultu Company',
    company_type: 'Pvt Ltd',
    industry_type: 'Livestock Farming',
    base_currency_id: defaultCurrId,
    default_language_id: defaultLangId,
    default_timezone_id: 'Asia/Kolkata',
    country_id: 'IND',
    financial_year_start: 4,
    onboarding_status: 'COMPLETED',
    is_active: true,
  });

  const admin1Id = randomUUID();
  await tenantDb.insert(tenant.userMaster).values({
    user_id: admin1Id,
    tenant_id: tenantId,
    company_id: comp1Id,
    email: 'admin@1st.local',
    password_hash: commonPasswordHash,
    full_name: '1st Fultu Admin',
    user_type: 'COMPANY_ADMIN',
    status: 'ACTIVE',
    is_active: true,
  });

  await tenantDb.insert(tenant.userCompanyAssignments).values({
    assign_id: randomUUID(),
    user_id: admin1Id,
    company_id: comp1Id,
    is_primary: true,
    assigned_by: admin1Id,
  });

  const livestockNobId = masterNobs.find(n => n.nob_code.includes('LIVESTOCK'))?.nob_id || masterNobs[0]?.nob_id;
  const piggeryLobId = masterLobs.find(l => l.lob_code.includes('PIG'))?.lob_id || masterLobs[0]?.lob_id;
  const dairyLobId = masterLobs.find(l => l.lob_code.includes('DAIRY'))?.lob_id || masterLobs[1]?.lob_id;

  // Company 1 -> Farm & Shed
  const farm1Id = randomUUID();
  await tenantDb.insert(tenant.farmMaster).values({
    farm_id: farm1Id,
    tenant_id: tenantId,
    company_id: comp1Id,
    farm_code: 'FFC-FARM-01',
    farm_name: 'First Fultu Piggery Estate',
    farm_type: 'COMMERCIAL',
    nob_id: livestockNobId,
    lob_id: piggeryLobId,
    capacity: 2500,
    is_active: true,
  });

  // Company 1 -> Operational Area: Piggery Unit
  const comp1PiggeryAreaId = randomUUID();
  await tenantDb.insert(tenant.operationalAreaMaster).values({
    area_id: comp1PiggeryAreaId,
    tenant_id: tenantId,
    company_id: comp1Id,
    farm_id: farm1Id,
    nob_id: livestockNobId,
    lob_id: piggeryLobId,
    area_code: 'FFC-PIG-01',
    area_name: 'Piggery Unit',
    description: 'First Fultu Company Piggery Breeding & Rearing Unit',
    preseed_source: 'TENANT',
    is_active: true,
  });

  // Company 1 Demo Gestation Batch
  const comp1BatchId = randomUUID();
  await tenantDb.insert(tenant.batchHeader).values({
    batch_id: comp1BatchId,
    tenant_id: tenantId,
    company_id: comp1Id,
    operational_area_id: comp1PiggeryAreaId,
    batch_no: 'PIG-SOW-GEST-2025-001',
    nob_id: livestockNobId,
    lob_id: piggeryLobId,
    start_date: '2025-03-01',
    opening_quantity: '28.00',
    closing_quantity: '28.00',
    uom: 'HEAD',
    status: 'ACTIVE',
    costing_method: 'STANDARD',
  });

  // 6. PROVISION COMPANY 2: "2nd faltu company"
  console.log('🏢 6. Creating Company 2: "2nd faltu company" (admin@2nd.local) ...');
  const comp2Id = randomUUID();
  await tenantDb.insert(tenant.companyMaster).values({
    company_id: comp2Id,
    tenant_id: tenantId,
    company_name: '2nd faltu company',
    company_code: 'SFC',
    company_display_name: '2nd Faltu Company',
    company_type: 'Pvt Ltd',
    industry_type: 'Livestock Farming',
    base_currency_id: defaultCurrId,
    default_language_id: defaultLangId,
    default_timezone_id: 'Asia/Kolkata',
    country_id: 'IND',
    financial_year_start: 4,
    onboarding_status: 'COMPLETED',
    is_active: true,
  });

  const admin2Id = randomUUID();
  await tenantDb.insert(tenant.userMaster).values({
    user_id: admin2Id,
    tenant_id: tenantId,
    company_id: comp2Id,
    email: 'admin@2nd.local',
    password_hash: commonPasswordHash,
    full_name: '2nd Faltu Admin',
    user_type: 'COMPANY_ADMIN',
    status: 'ACTIVE',
    is_active: true,
  });

  await tenantDb.insert(tenant.userCompanyAssignments).values({
    assign_id: randomUUID(),
    user_id: admin2Id,
    company_id: comp2Id,
    is_primary: true,
    assigned_by: admin2Id,
  });

  // Company 2 Farm
  const farm2Id = randomUUID();
  await tenantDb.insert(tenant.farmMaster).values({
    farm_id: farm2Id,
    tenant_id: tenantId,
    company_id: comp2Id,
    farm_code: 'SFC-FARM-01',
    farm_name: 'Second Faltu Multi-Species Complex',
    farm_type: 'COMMERCIAL',
    nob_id: livestockNobId,
    lob_id: piggeryLobId,
    capacity: 5000,
    is_active: true,
  });

  // Company 2 -> Operational Area 1: Piggery Unit
  const comp2PiggeryAreaId = randomUUID();
  await tenantDb.insert(tenant.operationalAreaMaster).values({
    area_id: comp2PiggeryAreaId,
    tenant_id: tenantId,
    company_id: comp2Id,
    farm_id: farm2Id,
    nob_id: livestockNobId,
    lob_id: piggeryLobId,
    area_code: 'SFC-PIG-01',
    area_name: 'Piggery Unit',
    description: 'Second Faltu Company Piggery Operational Section',
    preseed_source: 'TENANT',
    is_active: true,
  });

  // Company 2 Piggery Users: piggery.op1@2nd.local & piggery.op2@2nd.local
  const pigOp1Id = randomUUID();
  await tenantDb.insert(tenant.userMaster).values({
    user_id: pigOp1Id,
    tenant_id: tenantId,
    company_id: comp2Id,
    email: 'piggery.op1@2nd.local',
    password_hash: commonPasswordHash,
    full_name: 'Piggery Area Manager',
    user_type: 'OPERATIONAL_ADMIN',
    status: 'ACTIVE',
    is_active: true,
  });
  await tenantDb.insert(tenant.userCompanyAssignments).values({
    assign_id: randomUUID(),
    user_id: pigOp1Id,
    company_id: comp2Id,
    is_primary: true,
    assigned_by: admin2Id,
  });
  await tenantDb.insert(tenant.userOperationalAreaAssignment).values({
    assignment_id: randomUUID(),
    user_id: pigOp1Id,
    area_id: comp2PiggeryAreaId,
    company_id: comp2Id,
    is_primary: true,
  });

  const pigOp2Id = randomUUID();
  await tenantDb.insert(tenant.userMaster).values({
    user_id: pigOp2Id,
    tenant_id: tenantId,
    company_id: comp2Id,
    email: 'piggery.op2@2nd.local',
    password_hash: commonPasswordHash,
    full_name: 'Piggery Operator Staff',
    user_type: 'STANDARD_USER',
    status: 'ACTIVE',
    is_active: true,
  });
  await tenantDb.insert(tenant.userCompanyAssignments).values({
    assign_id: randomUUID(),
    user_id: pigOp2Id,
    company_id: comp2Id,
    is_primary: true,
    assigned_by: admin2Id,
  });
  await tenantDb.insert(tenant.userOperationalAreaAssignment).values({
    assignment_id: randomUUID(),
    user_id: pigOp2Id,
    area_id: comp2PiggeryAreaId,
    company_id: comp2Id,
    is_primary: true,
  });

  // Company 2 Piggery Active Batch
  const comp2PigBatchId = randomUUID();
  await tenantDb.insert(tenant.batchHeader).values({
    batch_id: comp2PigBatchId,
    tenant_id: tenantId,
    company_id: comp2Id,
    operational_area_id: comp2PiggeryAreaId,
    batch_no: 'SFC-PIG-GEST-2025-001',
    nob_id: livestockNobId,
    lob_id: piggeryLobId,
    start_date: '2025-03-01',
    opening_quantity: '28.00',
    closing_quantity: '28.00',
    uom: 'HEAD',
    status: 'ACTIVE',
    costing_method: 'STANDARD',
  });

  // Close DB pools
  await masterPool.end();
  await tenantPool.end();

  console.log('\n=============================================================');
  console.log('🎉 ALL DATABASES DROPPED & FRESH BOOTSTRAP COMPLETED!');
  console.log('=============================================================');
  console.log('ALL PASSWORDS: 12345678');
  console.log('-------------------------------------------------------------');
  console.log('1. Platform Admin:       admin@navfarm.local');
  console.log('2. Tenant Admin:         admin@faltu.local     (Tenant: "faltu farms")');
  console.log('3. 1st Company Admin:    admin@1st.local       (Company: "first fultu company" -> Area: Piggery Unit)');
  console.log('4. 2nd Company Admin:    admin@2nd.local       (Company: "2nd faltu company" -> Area: Piggery Unit)');
  console.log('   - Piggery User 1:     piggery.op1@2nd.local (OPERATIONAL_ADMIN)');
  console.log('   - Piggery User 2:     piggery.op2@2nd.local (STANDARD_USER)');
  console.log('=============================================================\n');
}

runResetAndBootstrapFaltu().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
