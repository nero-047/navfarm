import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import * as mysql from 'mysql2/promise';
import * as master from '../core/database/master-schema';
import * as tenant from '../core/database/schema';
import { SYSTEM_UOM_SEED, SYSTEM_SPECIES_SEED, SYSTEM_BREED_SEED, SYSTEM_ITEM_SEED } from '../core/database/system-master-data-seed';
import { STARTER_GL_ACCOUNTS, STARTER_GL_MAPPINGS, STARTER_WAREHOUSE } from '../modules/system/setup-wizard/seed/starter-master-data.seed-data';

/**
 * One-command dev/demo environment: creates a working tenant + company +
 * TENANT_ADMIN + COMPANY_ADMIN, with the company already past onboarding and
 * carrying a starter chart of accounts, GL mappings, warehouse, and one
 * generic farm/shed — so a fresh clone of this repo can log in and start
 * creating batches immediately, without hand-building master data first.
 *
 * Prerequisite: the platform must already be bootstrapped (`db-bootstrap`) —
 * this script copies its NOB/LOB/UOM/species/language/currency taxonomy into
 * the new tenant, the same way a real signup does.
 *
 * Safe to re-run: existing tenant/company/users/master data are left as-is
 * (or upserted where that's meaningful), never duplicated.
 */

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';

const tenantCode = (process.env.DEV_TENANT_CODE || 'devco').toLowerCase();
const tenantName = process.env.DEV_TENANT_NAME || 'Dev Company';
const companyCode = process.env.DEV_COMPANY_CODE || 'DEVCO';
const companyName = process.env.DEV_COMPANY_NAME || 'Dev Company Pvt Ltd';

const tenantAdminName = process.env.DEV_TENANT_ADMIN_NAME || 'Dev Tenant Admin';
const tenantAdminEmail = (process.env.DEV_TENANT_ADMIN_EMAIL || `tenantadmin@${tenantCode}.local`).toLowerCase();
const tenantAdminPassword = process.env.DEV_TENANT_ADMIN_PASSWORD || 'DevTenant@12345';

const companyAdminName = process.env.DEV_COMPANY_ADMIN_NAME || 'Dev Company Admin';
const companyAdminEmail = (process.env.DEV_COMPANY_ADMIN_EMAIL || `admin@${tenantCode}.local`).toLowerCase();
const companyAdminPassword = process.env.DEV_COMPANY_ADMIN_PASSWORD || 'DevAdmin@12345';

const COMPANY_ID = '00000000-0000-0000-0000-000000000000';

function assertDatabaseName(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe database name: ${value}`);
  }
  return value;
}

async function seedDevTenant() {
  if (!/^[a-z0-9-]{3,30}$/.test(tenantCode)) {
    throw new Error(`DEV_TENANT_CODE '${tenantCode}' must be 3-30 lowercase letters/numbers/hyphens.`);
  }
  for (const [label, pw] of [
    ['DEV_TENANT_ADMIN_PASSWORD', tenantAdminPassword],
    ['DEV_COMPANY_ADMIN_PASSWORD', companyAdminPassword],
  ] as const) {
    if (pw.length < 8) throw new Error(`${label} must be at least 8 characters.`);
  }

  const masterPool = mysql.createPool({ host, port, user, password, database: masterDatabase });
  const masterDb = drizzle(masterPool, { schema: master, mode: 'default' });

  try {
    const [platformNob] = await masterDb.select().from(master.nobMaster).limit(1);
    if (!platformNob) {
      throw new Error('Platform is not bootstrapped yet — run `pnpm nx run api:db-bootstrap` first.');
    }

    const [plan] = await masterDb.select().from(master.planMaster).where(eq(master.planMaster.plan_id, 'PLAN_PRO')).limit(1);
    if (!plan) throw new Error("Plan 'PLAN_PRO' not found — run db-bootstrap first.");

    let [existingTenant] = await masterDb
      .select()
      .from(master.tenantMaster)
      .where(eq(master.tenantMaster.tenant_code, tenantCode))
      .limit(1);

    const dbName = assertDatabaseName(`tenant_${tenantCode}`);
    const tenantId = existingTenant?.tenant_id || randomUUID();

    const server = await mysql.createConnection({ host, port, user, password });
    await server.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await server.end();

    const tenantPool = mysql.createPool({ host, port, user, password, database: dbName });
    const tenantDb = drizzle(tenantPool, { schema: tenant, mode: 'default' });

    try {
      await migrate(tenantDb, { migrationsFolder: resolve(process.cwd(), 'src/drizzle/tenant') });

      // Copy the shared taxonomy in, exactly like a real tenant signup does.
      const masterLangs = await masterDb.select().from(master.languageMaster);
      const masterCurrs = await masterDb.select().from(master.currencyMaster);
      const masterSteps = await masterDb.select().from(master.setupStepMaster);
      const masterNobs = await masterDb.select().from(master.nobMaster);
      const masterLobs = await masterDb.select().from(master.lobMaster);

      for (const row of masterLangs) await tenantDb.insert(tenant.languageMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
      for (const row of masterCurrs) await tenantDb.insert(tenant.currencyMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
      for (const row of masterSteps) await tenantDb.insert(tenant.setupStepMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
      for (const row of masterNobs) await tenantDb.insert(tenant.nobMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });
      for (const row of masterLobs) await tenantDb.insert(tenant.lobMaster).values(row).onDuplicateKeyUpdate({ set: { ...row } });

      const [existingUom] = await tenantDb.select().from(tenant.uomMaster).limit(1);
      if (!existingUom) {
        await tenantDb.insert(tenant.uomMaster).values(SYSTEM_UOM_SEED.map((u) => ({ ...u, tenant_id: tenantId })));
      }
      const [existingSpecies] = await tenantDb.select().from(tenant.speciesMaster).limit(1);
      if (!existingSpecies) {
        await tenantDb.insert(tenant.speciesMaster).values(SYSTEM_SPECIES_SEED.map((s) => ({ ...s, tenant_id: tenantId })));
      }

      // Default breeds/items per NOB/LOB, visible tenant-wide (company_id
      // null, matching the wildcard convention breed/item services already
      // match on) so every company under this tenant starts with a real
      // catalog instead of empty dropdowns.
      const [existingBreed] = await tenantDb.select().from(tenant.breedMaster).limit(1);
      const [existingItem] = await tenantDb.select().from(tenant.itemMaster).limit(1);
      if (!existingBreed || !existingItem) {
        const nobIdByCode = new Map(masterNobs.map((n) => [n.nob_code, n.nob_id]));
        const lobIdByCode = new Map(masterLobs.map((l) => [l.lob_code, l.lob_id]));
        const speciesRows = await tenantDb.select().from(tenant.speciesMaster);
        const speciesIdByCode = new Map(speciesRows.map((s) => [s.species_code, s.species_id]));

        if (!existingBreed) {
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
            });
          }
        }

        if (!existingItem) {
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
              item_type: item.item_type,
              uom_primary: item.uom_primary,
            });
          }
        }
      }

      const defaultLangId = masterLangs.find((l) => l.is_system_default)?.lang_id || masterLangs[0]?.lang_id;
      const defaultCurrId = masterCurrs.find((c) => c.is_system_default)?.currency_id || masterCurrs[0]?.currency_id;

      // Company: created directly past the onboarding wizard — same end state
      // as if all 9 steps + complete() had been called through the API.
      await tenantDb
        .insert(tenant.companyMaster)
        .values({
          company_id: COMPANY_ID,
          tenant_id: tenantId,
          company_code: companyCode,
          company_name: companyName,
          company_display_name: companyName,
          company_type: 'Pvt Ltd',
          industry_type: 'Poultry Farming',
          base_currency_id: defaultCurrId,
          default_language_id: defaultLangId,
          default_timezone_id: 'Asia/Kolkata',
          country_id: 'IND',
          financial_year_start: 4,
          onboarding_status: 'COMPLETED',
          is_active: true,
        })
        .onDuplicateKeyUpdate({
          set: {
            company_code: companyCode,
            company_name: companyName,
            company_display_name: companyName,
            onboarding_status: 'COMPLETED',
            is_active: true,
          },
        });

      const tenantAdminHash = await bcrypt.hash(tenantAdminPassword, 10);
      await tenantDb
        .insert(tenant.userMaster)
        .values({
          user_id: randomUUID(),
          company_id: COMPANY_ID,
          tenant_id: tenantId,
          full_name: tenantAdminName,
          email: tenantAdminEmail,
          password_hash: tenantAdminHash,
          user_type: 'TENANT_ADMIN',
          timezone_pref_id: 'Asia/Kolkata',
          is_active: true,
        })
        .onDuplicateKeyUpdate({ set: { password_hash: tenantAdminHash, user_type: 'TENANT_ADMIN', is_active: true, failed_login_count: 0, locked_until: null } });

      const companyAdminHash = await bcrypt.hash(companyAdminPassword, 10);
      await tenantDb
        .insert(tenant.userMaster)
        .values({
          user_id: randomUUID(),
          company_id: COMPANY_ID,
          tenant_id: tenantId,
          full_name: companyAdminName,
          email: companyAdminEmail,
          password_hash: companyAdminHash,
          user_type: 'COMPANY_ADMIN',
          timezone_pref_id: 'Asia/Kolkata',
          is_active: true,
        })
        .onDuplicateKeyUpdate({ set: { password_hash: companyAdminHash, user_type: 'COMPANY_ADMIN', is_active: true, failed_login_count: 0, locked_until: null } });

      // Starter chart of accounts + GL mappings + warehouse (same seed data
      // WS3's auto-seed-on-wizard-completion uses) — idempotent by design.
      const [existingGl] = await tenantDb.select().from(tenant.glAccountMaster).where(eq(tenant.glAccountMaster.company_id, COMPANY_ID)).limit(1);
      if (!existingGl) {
        const accountIdByCode = new Map<string, string>();
        for (const account of STARTER_GL_ACCOUNTS) {
          const glAccountId = randomUUID();
          accountIdByCode.set(account.account_code, glAccountId);
          await tenantDb.insert(tenant.glAccountMaster).values({
            gl_account_id: glAccountId,
            tenant_id: tenantId,
            company_id: COMPANY_ID,
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
            company_id: COMPANY_ID,
            transaction_type: mapping.transaction_type,
            debit_gl_account_id: debitAccountId,
            credit_gl_account_id: creditAccountId,
          });
        }
      }

      const [existingWarehouse] = await tenantDb.select().from(tenant.warehouseMaster).where(eq(tenant.warehouseMaster.company_id, COMPANY_ID)).limit(1);
      if (!existingWarehouse) {
        await tenantDb.insert(tenant.warehouseMaster).values({
          warehouse_id: randomUUID(),
          tenant_id: tenantId,
          company_id: COMPANY_ID,
          warehouse_code: STARTER_WAREHOUSE.warehouse_code,
          warehouse_name: STARTER_WAREHOUSE.warehouse_name,
          warehouse_type: STARTER_WAREHOUSE.warehouse_type,
        });
      }

      // One generic farm + shed (NOB/LOB left null — applies everywhere) so
      // there's somewhere to attach a batch immediately. Deliberately not
      // vertical-specific: no default breeds/items are seeded here.
      const [existingFarm] = await tenantDb.select().from(tenant.farmMaster).where(eq(tenant.farmMaster.company_id, COMPANY_ID)).limit(1);
      let farmId = existingFarm?.farm_id;
      if (!existingFarm) {
        farmId = randomUUID();
        await tenantDb.insert(tenant.farmMaster).values({
          farm_id: farmId,
          tenant_id: tenantId,
          company_id: COMPANY_ID,
          farm_code: 'FARM-MAIN',
          farm_name: 'Main Farm',
          farm_type: 'GENERAL',
        });
      }
      const [existingShed] = await tenantDb.select().from(tenant.shedMaster).where(eq(tenant.shedMaster.company_id, COMPANY_ID)).limit(1);
      if (!existingShed && farmId) {
        await tenantDb.insert(tenant.shedMaster).values({
          shed_id: randomUUID(),
          tenant_id: tenantId,
          company_id: COMPANY_ID,
          farm_id: farmId,
          shed_code: 'SHED-MAIN',
          shed_name: 'Main Shed',
          shed_type: 'GENERAL',
        });
      }
    } catch (err) {
      if (!existingTenant) {
        await masterDb.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
      }
      throw err;
    } finally {
      await tenantPool.end();
    }

    // Register tenant + subscription in the control plane (idempotent).
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
    console.log('Dev tenant ready.');
    console.log('==================');
    console.log(`Tenant code:      ${tenantCode}  (send as x-tenant-id header, or ?tenant=${tenantCode} on the login page)`);
    console.log(`Company:          ${companyName} (${companyCode})`);
    console.log('');
    console.log(`Tenant admin:     ${tenantAdminEmail} / ${tenantAdminPassword}`);
    console.log(`Company admin:    ${companyAdminEmail} / ${companyAdminPassword}`);
    console.log('');
    console.log(`Login:            http://localhost:3001/login?tenant=${tenantCode}`);
    console.log('Starter GL accounts, GL mappings, one warehouse, and one farm/shed are already seeded.');
    console.log('');
  } finally {
    await masterPool.end();
  }
}

void seedDevTenant().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
