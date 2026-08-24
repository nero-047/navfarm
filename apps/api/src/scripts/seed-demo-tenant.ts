import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import * as bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import * as mysql from 'mysql2/promise';
import * as master from '../core/database/master-schema';
import * as tenant from '../core/database/schema';
import { SYSTEM_UOM_SEED, SYSTEM_SPECIES_SEED, SYSTEM_BREED_SEED, SYSTEM_ITEM_SEED, SYSTEM_PARAMETER_SEED, SYSTEM_STAGE_SEED, SYSTEM_NO_SERIES_SEED } from '../core/database/system-master-data-seed';
import { STARTER_GL_ACCOUNTS, STARTER_GL_MAPPINGS } from '../modules/system/setup-wizard/seed/starter-master-data.seed-data';

/**
 * A permanent, multi-company demo tenant for exercising the full app: two
 * real companies (not the single-placeholder-company convention the dev
 * tenant uses) in two different verticals, sharing one tenant-wide
 * breed/item/parameter catalog. This script only provisions structure
 * (tenant, companies, GL/warehouses/farm/shed, admins) — see
 * seed-demo-full-flow.ts for the script that drives real transactions
 * through every module via the live API.
 *
 * Unlike the throwaway verification tenants used during development, this
 * tenant is meant to be kept — re-running is idempotent (upserts / skips
 * existing rows) but nothing here ever deletes data.
 */

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';

const tenantCode = (process.env.DEMO_TENANT_CODE || 'demo').toLowerCase();
const tenantName = process.env.DEMO_TENANT_NAME || 'NAVFarm Demo';
const tenantAdminEmail = (process.env.DEMO_TENANT_ADMIN_EMAIL || `tenantadmin@${tenantCode}.local`).toLowerCase();
const tenantAdminPassword = process.env.DEMO_TENANT_ADMIN_PASSWORD || 'DemoTenant@12345';

interface DemoCompanySpec {
  key: string;
  code: string;
  name: string;
  industryType: string;
  adminEmail: string;
  adminPassword: string;
}

const COMPANIES: DemoCompanySpec[] = [
  {
    key: 'poultry',
    code: 'SUNRISE',
    name: 'Sunrise Poultry Farms Pvt Ltd',
    industryType: 'Poultry Farming',
    adminEmail: `admin@sunrisepoultry.${tenantCode}.local`,
    adminPassword: 'Sunrise@Demo2026!',
  },
  {
    key: 'livestock',
    code: 'GREENVALLEY',
    name: 'Green Valley Livestock Pvt Ltd',
    industryType: 'Livestock Farming',
    adminEmail: `admin@greenvalley.${tenantCode}.local`,
    adminPassword: 'GreenValley@Demo2026!',
  },
];

function assertDatabaseName(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`Unsafe database name: ${value}`);
  return value;
}

async function seedCompany(
  tenantDb: MySql2Database<typeof tenant>,
  tenantId: string,
  spec: DemoCompanySpec,
  defaultLangId: string,
  defaultCurrId: string,
): Promise<{ companyId: string; adminEmail: string; adminPassword: string }> {
  let [existing] = await tenantDb.select().from(tenant.companyMaster).where(eq(tenant.companyMaster.company_code, spec.code)).limit(1);
  const companyId = existing?.company_id || randomUUID();

  if (!existing) {
    await tenantDb.insert(tenant.companyMaster).values({
      company_id: companyId,
      tenant_id: tenantId,
      company_code: spec.code,
      company_name: spec.name,
      company_display_name: spec.name,
      company_type: 'Pvt Ltd',
      industry_type: spec.industryType,
      base_currency_id: defaultCurrId,
      default_language_id: defaultLangId,
      default_timezone_id: 'Asia/Kolkata',
      country_id: 'IND',
      financial_year_start: 4,
      onboarding_status: 'COMPLETED',
      is_active: true,
    });
  }

  const [existingAdmin] = await tenantDb.select().from(tenant.userMaster).where(eq(tenant.userMaster.email, spec.adminEmail)).limit(1);
  const adminHash = await bcrypt.hash(spec.adminPassword, 10);
  if (!existingAdmin) {
    await tenantDb.insert(tenant.userMaster).values({
      user_id: randomUUID(),
      company_id: companyId,
      tenant_id: tenantId,
      full_name: `${spec.name} Admin`,
      email: spec.adminEmail,
      password_hash: adminHash,
      user_type: 'COMPANY_ADMIN',
      timezone_pref_id: 'Asia/Kolkata',
      is_active: true,
    });
  } else {
    await tenantDb.update(tenant.userMaster).set({ password_hash: adminHash, is_active: true, failed_login_count: 0, locked_until: null }).where(eq(tenant.userMaster.user_id, existingAdmin.user_id));
  }

  const [existingGl] = await tenantDb.select().from(tenant.glAccountMaster).where(eq(tenant.glAccountMaster.company_id, companyId)).limit(1);
  if (!existingGl) {
    const accountIdByCode = new Map<string, string>();
    for (const account of STARTER_GL_ACCOUNTS) {
      const glAccountId = randomUUID();
      accountIdByCode.set(account.account_code, glAccountId);
      await tenantDb.insert(tenant.glAccountMaster).values({
        gl_account_id: glAccountId,
        tenant_id: tenantId,
        company_id: companyId,
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
      });
    }
    for (const mapping of STARTER_GL_MAPPINGS) {
      const debitAccountId = accountIdByCode.get(mapping.debit_account_code);
      const creditAccountId = accountIdByCode.get(mapping.credit_account_code);
      if (!debitAccountId || !creditAccountId) continue;
      await tenantDb.insert(tenant.glMappingMaster).values({
        mapping_id: randomUUID(),
        tenant_id: tenantId,
        company_id: companyId,
        transaction_type: mapping.transaction_type,
        debit_gl_account_id: debitAccountId,
        credit_gl_account_id: creditAccountId,
      });
    }
  }

  // Two warehouses per company so the demo flow has somewhere to Stock
  // Transfer between.
  const warehouseSpecs = [
    { code: 'WH-MAIN', name: 'Main Warehouse' },
    { code: 'WH-SECONDARY', name: 'Secondary Warehouse' },
  ];
  for (const wh of warehouseSpecs) {
    const [existingWh] = await tenantDb.select().from(tenant.warehouseMaster).where(and(eq(tenant.warehouseMaster.company_id, companyId), eq(tenant.warehouseMaster.warehouse_code, wh.code))).limit(1);
    if (!existingWh) {
      await tenantDb.insert(tenant.warehouseMaster).values({
        warehouse_id: randomUUID(),
        tenant_id: tenantId,
        company_id: companyId,
        warehouse_code: wh.code,
        warehouse_name: wh.name,
        warehouse_type: 'GENERAL',
      });
    }
  }

  const [existingFarm] = await tenantDb.select().from(tenant.farmMaster).where(eq(tenant.farmMaster.company_id, companyId)).limit(1);
  let farmId = existingFarm?.farm_id;
  if (!existingFarm) {
    farmId = randomUUID();
    await tenantDb.insert(tenant.farmMaster).values({
      farm_id: farmId,
      tenant_id: tenantId,
      company_id: companyId,
      farm_code: 'FARM-MAIN',
      farm_name: 'Main Farm',
      farm_type: 'GENERAL',
    });
  }
  const [existingShed] = await tenantDb.select().from(tenant.shedMaster).where(eq(tenant.shedMaster.company_id, companyId)).limit(1);
  if (!existingShed && farmId) {
    await tenantDb.insert(tenant.shedMaster).values({
      shed_id: randomUUID(),
      tenant_id: tenantId,
      company_id: companyId,
      farm_id: farmId,
      shed_code: 'SHED-MAIN',
      shed_name: 'Main Shed',
      shed_type: 'GENERAL',
    });
  }

  return { companyId, adminEmail: spec.adminEmail, adminPassword: spec.adminPassword };
}

async function seedDemoTenant() {
  const isRemoteOrTidb = port === 4000 || host.includes('tidbcloud') || process.env.DATABASE_SSL === 'true';
  const ssl = isRemoteOrTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

  const masterPool = mysql.createPool({ host, port, user, password, database: masterDatabase, ssl });
  const masterDb = drizzle(masterPool, { schema: master, mode: 'default' });

  try {
    const [platformNob] = await masterDb.select().from(master.nobMaster).limit(1);
    if (!platformNob) throw new Error('Platform is not bootstrapped yet — run `pnpm nx run api:db-bootstrap` first.');

    const [plan] = await masterDb.select().from(master.planMaster).where(eq(master.planMaster.plan_id, 'PLAN_PRO')).limit(1);
    if (!plan) throw new Error("Plan 'PLAN_PRO' not found — run db-bootstrap first.");

    const [existingTenant] = await masterDb.select().from(master.tenantMaster).where(eq(master.tenantMaster.tenant_code, tenantCode)).limit(1);
    const defaultPrefix = masterDatabase.startsWith('piggery_') ? 'piggery_tenant_' : 'tenant_';
    const dbName = assertDatabaseName(existingTenant?.db_name || `${defaultPrefix}${tenantCode}`);
    const tenantId = existingTenant?.tenant_id || randomUUID();

    const server = await mysql.createConnection({ host, port, user, password, ssl });
    await server.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await server.end();

    const tenantPool = mysql.createPool({ host, port, user, password, database: dbName, ssl });
    const tenantDb = drizzle(tenantPool, { schema: tenant, mode: 'default' });

    const results: Array<{ companyId: string; adminEmail: string; adminPassword: string; name: string }> = [];

    try {
      await migrate(tenantDb, { migrationsFolder: resolve(process.cwd(), 'src/drizzle/tenant') });

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

      const [existingUom] = await tenantDb.select().from(tenant.uomMaster).limit(1);
      if (!existingUom) await tenantDb.insert(tenant.uomMaster).values(SYSTEM_UOM_SEED.map((u) => ({ ...u, tenant_id: tenantId })));
      const [existingSpecies] = await tenantDb.select().from(tenant.speciesMaster).limit(1);
      if (!existingSpecies) await tenantDb.insert(tenant.speciesMaster).values(SYSTEM_SPECIES_SEED.map((s) => ({ ...s, tenant_id: tenantId })));

      const nobIdByCode = new Map(masterNobs.map((n) => [n.nob_code, n.nob_id]));
      const lobIdByCode = new Map(masterLobs.map((l) => [l.lob_code, l.lob_id]));
      const speciesRows = await tenantDb.select().from(tenant.speciesMaster);
      const speciesIdByCode = new Map(speciesRows.map((s) => [s.species_code, s.species_id]));

      const existingBreedCodes = new Set((await tenantDb.select({ c: tenant.breedMaster.breed_code }).from(tenant.breedMaster)).map((r) => r.c));
      for (const breed of SYSTEM_BREED_SEED) {
        if (existingBreedCodes.has(breed.breed_code)) continue;
        const nobId = nobIdByCode.get(breed.nob_code);
        const lobId = lobIdByCode.get(breed.lob_code);
        const speciesId = speciesIdByCode.get(breed.species_code);
        if (!nobId || !lobId) continue;
        await tenantDb.insert(tenant.breedMaster).values({
          breed_id: randomUUID(), tenant_id: tenantId, company_id: null, nob_id: nobId, lob_id: lobId,
          breed_code: breed.breed_code, breed_name: breed.breed_name, species_id: speciesId || null, breed_type: breed.breed_type,
          gestation_days: breed.gestation_days ?? null, lactation_days: breed.lactation_days ?? null,
          productive_life_months: breed.productive_life_months ?? null, residual_value_pct: breed.residual_value_pct?.toString() ?? null,
          productive_life_cycles: breed.productive_life_cycles ?? null, avg_litter_size_born: breed.avg_litter_size_born?.toString() ?? null,
          avg_litter_size_weaned: breed.avg_litter_size_weaned?.toString() ?? null, avg_weaning_weight_kg: breed.avg_weaning_weight_kg?.toString() ?? null,
          farrowing_rate_pct: breed.farrowing_rate_pct?.toString() ?? null, boar_doses_per_week: breed.boar_doses_per_week?.toString() ?? null,
          boar_productive_life_months: breed.boar_productive_life_months ?? null,
        });
      }

      const itemIdByCode = new Map<string, string>();
      for (const row of await tenantDb.select().from(tenant.itemMaster)) itemIdByCode.set(row.item_code, row.item_id);
      for (const item of SYSTEM_ITEM_SEED) {
        if (itemIdByCode.has(item.item_code)) continue;
        const nobId = nobIdByCode.get(item.nob_code);
        const lobId = lobIdByCode.get(item.lob_code);
        if (!nobId || !lobId) continue;
        const itemId = randomUUID();
        itemIdByCode.set(item.item_code, itemId);
        await tenantDb.insert(tenant.itemMaster).values({
          item_id: itemId, tenant_id: tenantId, company_id: null, nob_id: nobId, lob_id: lobId,
          item_code: item.item_code, item_name: item.item_name, item_type: item.item_type, uom_primary: item.uom_primary,
        });
      }

      const existingParamCodes = new Set((await tenantDb.select({ c: tenant.parameterMaster.parameter_code }).from(tenant.parameterMaster)).map((r) => r.c));
      for (const param of SYSTEM_PARAMETER_SEED) {
        if (existingParamCodes.has(param.parameter_code)) continue;
        const nobId = nobIdByCode.get(param.nob_code);
        const lobId = lobIdByCode.get(param.lob_code);
        if (!nobId || !lobId) continue;
        const itemId = param.item_code ? itemIdByCode.get(param.item_code) : undefined;
        await tenantDb.insert(tenant.parameterMaster).values({
          parameter_id: randomUUID(), tenant_id: tenantId, company_id: null, nob_id: nobId, lob_id: lobId,
          parameter_code: param.parameter_code, parameter_name: param.parameter_name, parameter_type: param.parameter_type,
          item_id: itemId || null, default_uom: param.default_uom, qty_method: param.qty_method,
          default_qty_per_unit: param.default_qty_per_unit != null ? param.default_qty_per_unit.toString() : null,
          default_qty_per_batch: param.default_qty_per_batch != null ? param.default_qty_per_batch.toString() : null,
          is_mandatory: param.is_mandatory ?? false,
        });
      }

      const pigLobId = lobIdByCode.get('LVS_PIGGERY');
      const pigNobId = nobIdByCode.get('LIVESTOCK');
      const existingStageCodes = new Set((await tenantDb.select({ c: tenant.stageMaster.stage_code }).from(tenant.stageMaster)).map((r) => r.c));
      if (pigLobId && pigNobId && !SYSTEM_STAGE_SEED.every((s) => existingStageCodes.has(s.stage_code))) {
        // Two passes — next_stage_id/alt_next_stage_id are FKs MySQL checks per-statement
        // (BOAR_AI even points at itself), so insert every row first, then wire the chain.
        const stageIdByCode = new Map(SYSTEM_STAGE_SEED.map((s) => [s.stage_code, randomUUID()]));
        for (const stage of SYSTEM_STAGE_SEED) {
          if (existingStageCodes.has(stage.stage_code)) continue;
          await tenantDb.insert(tenant.stageMaster).values({
            stage_id: stageIdByCode.get(stage.stage_code)!, tenant_id: tenantId, company_id: null, nob_id: pigNobId, lob_id: pigLobId,
            stage_code: stage.stage_code, stage_name: stage.stage_name, stage_category: stage.stage_category,
            stage_sequence: stage.stage_sequence, typical_duration_days: stage.typical_duration_days ?? null,
            min_days_before_move: stage.min_days_before_move, transition_trigger: stage.transition_trigger,
            auto_move_on_day: stage.auto_move_on_day ?? null,
            alt_trigger_condition: stage.alt_trigger_condition || null, data_entry_form: stage.data_entry_form,
            show_on_animal_card: stage.show_on_animal_card, stage_description: stage.stage_description,
            sort_order: stage.stage_sequence, is_system: true,
          });
        }
        for (const stage of SYSTEM_STAGE_SEED) {
          if (existingStageCodes.has(stage.stage_code)) continue;
          if (!stage.next_stage_code && !stage.alt_next_stage_code) continue;
          await tenantDb.update(tenant.stageMaster).set({
            next_stage_id: stage.next_stage_code ? stageIdByCode.get(stage.next_stage_code) || null : null,
            alt_next_stage_id: stage.alt_next_stage_code ? stageIdByCode.get(stage.alt_next_stage_code) || null : null,
          }).where(eq(tenant.stageMaster.stage_id, stageIdByCode.get(stage.stage_code)!));
        }
      }

      const existingSeriesCodes = new Set((await tenantDb.select({ c: tenant.noSeriesMaster.series_code }).from(tenant.noSeriesMaster)).map((r) => r.c));
      for (const series of SYSTEM_NO_SERIES_SEED) {
        if (existingSeriesCodes.has(series.series_code)) continue;
        const seriesNobId = series.nob_code ? nobIdByCode.get(series.nob_code) : undefined;
        const seriesLobId = series.lob_code ? lobIdByCode.get(series.lob_code) : undefined;
        if ((series.nob_code && !seriesNobId) || (series.lob_code && !seriesLobId)) continue;
        await tenantDb.insert(tenant.noSeriesMaster).values({
          series_id: randomUUID(), tenant_id: tenantId, company_id: null,
          nob_id: seriesNobId || null, lob_id: seriesLobId || null,
          series_code: series.series_code, series_name: series.series_name, document_type: series.document_type,
          prefix: series.prefix || null, date_format: series.date_format || null, separator: series.separator,
          seq_length: series.seq_length, current_seq: 0, reset_frequency: series.reset_frequency,
        });
      }

      const defaultLangId = masterLangs.find((l) => l.is_system_default)?.lang_id || masterLangs[0]?.lang_id;
      const defaultCurrId = masterCurrs.find((c) => c.is_system_default)?.currency_id || masterCurrs[0]?.currency_id;

      // Companies first — userMaster.company_id is NOT NULL, so the tenant
      // admin below needs a real company to scope to (matches the real
      // signup convention of scoping the initial admin to the first company).
      for (const spec of COMPANIES) {
        const result = await seedCompany(tenantDb, tenantId, spec, defaultLangId!, defaultCurrId!);
        results.push({ ...result, name: spec.name });
      }

      const [existingTenantAdmin] = await tenantDb.select().from(tenant.userMaster).where(eq(tenant.userMaster.email, tenantAdminEmail)).limit(1);
      const tenantAdminHash = await bcrypt.hash(tenantAdminPassword, 10);
      if (!existingTenantAdmin) {
        await tenantDb.insert(tenant.userMaster).values({
          user_id: randomUUID(),
          company_id: results[0].companyId,
          tenant_id: tenantId,
          full_name: 'Demo Tenant Admin',
          email: tenantAdminEmail,
          password_hash: tenantAdminHash,
          user_type: 'TENANT_ADMIN',
          timezone_pref_id: 'Asia/Kolkata',
          is_active: true,
        });
      } else {
        await tenantDb.update(tenant.userMaster).set({ password_hash: tenantAdminHash, is_active: true, failed_login_count: 0, locked_until: null }).where(eq(tenant.userMaster.user_id, existingTenantAdmin.user_id));
      }
    } finally {
      await tenantPool.end();
    }

    if (!existingTenant) {
      const today = new Date().toISOString().slice(0, 10);
      await masterDb.insert(master.tenantMaster).values({
        tenant_id: tenantId,
        tenant_code: tenantCode,
        tenant_name: tenantName,
        tenant_type: 'SME',
        plan_id: plan.plan_id,
        plan_start_date: today,
        billing_email: tenantAdminEmail,
        billing_cycle: plan.billing_cycle,
        max_companies: plan.max_companies,
        max_users: plan.max_users,
        api_rate_limit: 1000,
        db_host: host,
        db_port: port,
        db_name: dbName,
        db_user: user,
        db_password: password,
      });
      await masterDb.insert(master.tenantSubscription).values({
        tenant_id: tenantId,
        plan_code: plan.plan_id,
        storage_limit_gb: plan.storage_limit_gb,
        support_tier: 'STANDARD',
        sla_uptime_pct: '99.50',
        renewal_auto: true,
        feature_flags: plan.feature_flags,
      });
    }

    console.log('');
    console.log('Demo tenant ready.');
    console.log('===================');
    console.log(`Tenant code:   ${tenantCode}`);
    console.log(`Tenant admin:  ${tenantAdminEmail} / ${tenantAdminPassword}`);
    console.log('');
    for (const r of results) {
      console.log(`${r.name} (company_id=${r.companyId})`);
      console.log(`  Login: ${r.adminEmail} / ${r.adminPassword}`);
    }
    console.log('');
    console.log(`Console: http://localhost:3001/login?tenant=${tenantCode}`);
    console.log('Next: pnpm nx run api:db-seed-demo-full-flow  (needs the API server running)');
    console.log('');
  } finally {
    await masterPool.end();
  }
}

void seedDemoTenant().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
