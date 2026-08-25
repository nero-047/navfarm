/**
 * Provisions the "Greenfield Agro Group" demo tenant end-to-end:
 *   tenant → 2 companies → 1 PIGGERY operational area each → full master data
 *   → sheds/pens → schedulers → batches → individually-registered animals with
 *   lifecycle stages → daily batch transactions → breeding + farrowing records.
 *
 * Assumes the base platform (navfarm_master + taxonomy) is already bootstrapped.
 * Every login it creates uses the password 12345678.
 */
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
  SYSTEM_UOM_SEED, SYSTEM_SPECIES_SEED, SYSTEM_BREED_SEED, SYSTEM_ITEM_SEED,
  SYSTEM_PARAMETER_SEED, SYSTEM_STAGE_SEED, SYSTEM_NO_SERIES_SEED,
} from '../core/database/system-master-data-seed';

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';

const TENANT_CODE = 'greenfield';
const TENANT_DB = `tenant_${TENANT_CODE}`;
const PASSWORD = '12345678';
const apiDir = resolve(__dirname, '../..');

const uid = () => randomUUID();
const dAgo = (n: number) => { const t = new Date(); t.setDate(t.getDate() - n); return t.toISOString().slice(0, 10); };
const money = (n: number) => n.toFixed(4);

async function run() {
  console.log('='.repeat(68));
  console.log('  PROVISIONING — Greenfield Agro Group');
  console.log('='.repeat(68));

  const hash = await bcrypt.hash(PASSWORD, 10);
  const tenantId = uid();
  const today = new Date().toISOString().slice(0, 10);

  const masterPool = mysql.createPool({ host, port, user, password, database: masterDatabase });
  const masterDb = drizzle(masterPool, { schema: master, mode: 'default' });

  await masterDb.insert(master.tenantMaster).values({
    tenant_id: tenantId, tenant_name: 'Greenfield Agro Group', tenant_code: TENANT_CODE,
    tenant_type: 'ENTERPRISE', plan_id: 'PLAN_ENTERPRISE', plan_start_date: today,
    billing_email: 'admin@greenfield.local', billing_cycle: 'ANNUAL',
    max_companies: 100, max_users: 1000, api_rate_limit: 10000,
    db_host: host, db_port: port, db_name: TENANT_DB, db_user: user, db_password: password, is_active: true,
  });
  await masterDb.insert(master.tenantSubscription).values({
    tenant_id: tenantId, plan_code: 'PLAN_ENTERPRISE', storage_limit_gb: '500.00',
    support_tier: 'ENTERPRISE', sla_uptime_pct: '99.99', renewal_auto: true,
    feature_flags: { onboarding: true, operations: true, enterprise: true },
  });
  console.log('✓ tenant registered');

  const c0 = await mysql.createConnection({ host, port, user, password });
  await c0.query(`CREATE DATABASE IF NOT EXISTS \`${TENANT_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await c0.end();

  const pool = mysql.createPool({ host, port, user, password, database: TENANT_DB });
  const db = drizzle(pool, { schema: tenant, mode: 'default' });
  await migrate(db, { migrationsFolder: resolve(apiDir, 'src/drizzle/tenant') });
  console.log('✓ database migrated');

  // ── Shared taxonomy ─────────────────────────────────────────────────────
  const [langs, currs, tzs, countries, states, costing, steps, nobs, lobs] = await Promise.all([
    masterDb.select().from(master.languageMaster), masterDb.select().from(master.currencyMaster),
    masterDb.select().from(master.timezoneMaster), masterDb.select().from(master.countryMaster),
    masterDb.select().from(master.stateProvince), masterDb.select().from(master.costingMethodConfig),
    masterDb.select().from(master.setupStepMaster), masterDb.select().from(master.nobMaster),
    masterDb.select().from(master.lobMaster),
  ]);
  const copy = async (tbl: any, rows: any[]) => { for (const r of rows) await db.insert(tbl).values(r).onDuplicateKeyUpdate({ set: { ...r } }); };
  await copy(tenant.languageMaster, langs); await copy(tenant.currencyMaster, currs);
  await copy(tenant.timezoneMaster, tzs); await copy(tenant.countryMaster, countries);
  await copy(tenant.stateProvince, states); await copy(tenant.costingMethodConfig, costing);
  await copy(tenant.setupStepMaster, steps); await copy(tenant.nobMaster, nobs); await copy(tenant.lobMaster, lobs);

  const nobByCode = new Map(nobs.map((n) => [n.nob_code, n.nob_id]));
  const lobByCode = new Map(lobs.map((l) => [l.lob_code, l.lob_id]));
  const NOB = nobByCode.get('LIVESTOCK')!;
  const LOB = lobByCode.get('LVS_PIGGERY')!;
  if (!NOB || !LOB) throw new Error('LIVESTOCK / LVS_PIGGERY taxonomy missing — run sync-nob-lob first.');
  const currencyId = currs.find((c) => c.is_system_default)?.currency_id || currs[0].currency_id;
  const langIdDefault = langs.find((l) => l.is_system_default)?.lang_id || langs[0].lang_id;
  console.log('✓ taxonomy copied');

  // ── System master data ──────────────────────────────────────────────────
  await db.insert(tenant.uomMaster).values(SYSTEM_UOM_SEED.map((u) => ({ ...u, tenant_id: tenantId })));
  await db.insert(tenant.speciesMaster).values(SYSTEM_SPECIES_SEED.map((s) => ({ ...s, tenant_id: tenantId })));
  const speciesByCode = new Map((await db.select().from(tenant.speciesMaster)).map((s) => [s.species_code, s.species_id]));

  for (const b of SYSTEM_BREED_SEED) {
    const n = nobByCode.get(b.nob_code), l = lobByCode.get(b.lob_code);
    if (!n || !l) continue;
    await db.insert(tenant.breedMaster).values({
      breed_id: uid(), tenant_id: tenantId, company_id: null, nob_id: n, lob_id: l,
      breed_code: b.breed_code, breed_name: b.breed_name, species_id: speciesByCode.get(b.species_code) || null,
      breed_type: b.breed_type, gestation_days: b.gestation_days ?? null, lactation_days: b.lactation_days ?? null,
      productive_life_months: b.productive_life_months ?? null, residual_value_pct: b.residual_value_pct?.toString() ?? null,
      productive_life_cycles: b.productive_life_cycles ?? null, avg_litter_size_born: b.avg_litter_size_born?.toString() ?? null,
      avg_litter_size_weaned: b.avg_litter_size_weaned?.toString() ?? null, avg_weaning_weight_kg: b.avg_weaning_weight_kg?.toString() ?? null,
      farrowing_rate_pct: b.farrowing_rate_pct?.toString() ?? null, boar_doses_per_week: b.boar_doses_per_week?.toString() ?? null,
      boar_productive_life_months: b.boar_productive_life_months ?? null,
    });
  }

  const itemIdByCode = new Map<string, string>();
  for (const it of SYSTEM_ITEM_SEED) {
    const n = nobByCode.get(it.nob_code), l = lobByCode.get(it.lob_code);
    if (!n || !l) continue;
    const id = uid(); itemIdByCode.set(it.item_code, id);
    await db.insert(tenant.itemMaster).values({
      item_id: id, tenant_id: tenantId, company_id: null, nob_id: n, lob_id: l,
      item_code: it.item_code, item_name: it.item_name, item_type: it.item_type, uom_primary: it.uom_primary,
    });
  }

  for (const p of SYSTEM_PARAMETER_SEED) {
    const n = nobByCode.get(p.nob_code), l = lobByCode.get(p.lob_code);
    if (!n || !l) continue;
    await db.insert(tenant.parameterMaster).values({
      parameter_id: uid(), tenant_id: tenantId, company_id: null, nob_id: n, lob_id: l,
      parameter_code: p.parameter_code, parameter_name: p.parameter_name, parameter_type: p.parameter_type,
      item_id: (p.item_code && itemIdByCode.get(p.item_code)) || null, default_uom: p.default_uom,
      qty_method: p.qty_method,
      default_qty_per_unit: p.default_qty_per_unit != null ? String(p.default_qty_per_unit) : null,
      default_qty_per_batch: p.default_qty_per_batch != null ? String(p.default_qty_per_batch) : null,
      is_mandatory: p.is_mandatory ?? false,
    });
  }

  // Stages: two passes — next/alt FKs are checked per-statement and BOAR_AI self-references.
  const stageIdByCode = new Map(SYSTEM_STAGE_SEED.map((s) => [s.stage_code, uid()]));
  for (const s of SYSTEM_STAGE_SEED) {
    await db.insert(tenant.stageMaster).values({
      stage_id: stageIdByCode.get(s.stage_code)!, tenant_id: tenantId, company_id: null, nob_id: NOB, lob_id: LOB,
      stage_code: s.stage_code, stage_name: s.stage_name, stage_category: s.stage_category,
      stage_sequence: s.stage_sequence, typical_duration_days: s.typical_duration_days ?? null,
      min_days_before_move: s.min_days_before_move, transition_trigger: s.transition_trigger,
      auto_move_on_day: s.auto_move_on_day ?? null, alt_trigger_condition: s.alt_trigger_condition || null,
      data_entry_form: s.data_entry_form, show_on_animal_card: s.show_on_animal_card,
      stage_description: s.stage_description, sort_order: s.stage_sequence, is_system: true,
    });
  }
  for (const s of SYSTEM_STAGE_SEED) {
    if (!s.next_stage_code && !s.alt_next_stage_code) continue;
    await db.update(tenant.stageMaster).set({
      next_stage_id: s.next_stage_code ? stageIdByCode.get(s.next_stage_code) || null : null,
      alt_next_stage_id: s.alt_next_stage_code ? stageIdByCode.get(s.alt_next_stage_code) || null : null,
    }).where(eq(tenant.stageMaster.stage_id, stageIdByCode.get(s.stage_code)!));
  }

  for (const s of SYSTEM_NO_SERIES_SEED) {
    const sn = s.nob_code ? nobByCode.get(s.nob_code) : undefined;
    const sl = s.lob_code ? lobByCode.get(s.lob_code) : undefined;
    if ((s.nob_code && !sn) || (s.lob_code && !sl)) continue;
    await db.insert(tenant.noSeriesMaster).values({
      series_id: uid(), tenant_id: tenantId, company_id: null, nob_id: sn || null, lob_id: sl || null,
      series_code: s.series_code, series_name: s.series_name, document_type: s.document_type,
      prefix: s.prefix ?? null, date_format: s.date_format ?? null, separator: s.separator,
      seq_length: s.seq_length, current_seq: 0, reset_frequency: s.reset_frequency,
    });
  }
  console.log(`✓ master data: ${SYSTEM_UOM_SEED.length} UOM · ${SYSTEM_BREED_SEED.length} breeds · ${SYSTEM_ITEM_SEED.length} items · ${SYSTEM_STAGE_SEED.length} stages · ${SYSTEM_PARAMETER_SEED.length} parameters`);

  const breeds = await db.select().from(tenant.breedMaster);
  const pigBreed = (name: string) => breeds.find((b) => b.breed_name.includes(name) && b.lob_id === LOB) || breeds.find((b) => b.lob_id === LOB)!;
  const items = await db.select().from(tenant.itemMaster);
  const item = (frag: string) => items.find((i) => i.item_code.includes(frag)) || items.find((i) => i.item_name.includes(frag));
  const pigStages = await db.select().from(tenant.stageMaster);
  const stageId = (c: string) => pigStages.find((s) => s.stage_code === c)?.stage_id || null;
  const pigParams = (await db.select().from(tenant.parameterMaster)).filter((p) => p.lob_id === LOB);

  // ══════════════════════════════════════════════════════════════════════
  //  COMPANIES
  // ══════════════════════════════════════════════════════════════════════
  const mkCompany = async (o: { name: string; code: string; display: string }) => {
    const id = uid();
    await db.insert(tenant.companyMaster).values({
      company_id: id, tenant_id: tenantId, company_name: o.name, company_code: o.code,
      company_display_name: o.display, company_type: 'Pvt Ltd', industry_type: 'Livestock Farming',
      base_currency_id: currencyId, default_language_id: langIdDefault, default_timezone_id: 'Asia/Kolkata',
      country_id: 'IND', financial_year_start: 4, onboarding_status: 'COMPLETED', is_active: true,
    });
    return id;
  };

  const mkUser = async (o: { email: string; name: string; type: string; companyId: string }) => {
    const id = uid();
    await db.insert(tenant.userMaster).values({
      user_id: id, tenant_id: tenantId, company_id: o.companyId, email: o.email,
      password_hash: hash, full_name: o.name, user_type: o.type, is_active: true,
    });
    await db.insert(tenant.userCompanyAssignments).values({
      assign_id: uid(), user_id: id, company_id: o.companyId, is_primary: true, assigned_by: id,
    });
    return id;
  };

  // Tenant-level HQ + group admin
  const hqId = await mkCompany({ name: 'Greenfield Agro Group HQ', code: 'GF-HQ', display: 'Greenfield Agro Group HQ' });
  const groupAdminId = await mkUser({ email: 'admin@greenfield.local', name: 'Greenfield Group Admin', type: 'TENANT_ADMIN', companyId: hqId });

  type Built = {
    companyId: string; areaId: string; farmId: string; adminId: string;
    batches: Array<{ id: string; no: string; stage: string }>;
  };

  const buildCompany = async (cfg: {
    name: string; code: string; display: string;
    adminEmail: string; adminName: string;
    opEmail: string; opName: string;
    farmCode: string; farmName: string; capacity: number;
    areaCode: string; areaName: string; areaDesc: string;
    breedName: string;
    pens: Array<{ code: string; name: string; cap: number }>;
    batches: Array<{ no: string; stage: string; head: number; startedDaysAgo: number; rate: number }>;
  }): Promise<Built> => {
    const companyId = await mkCompany({ name: cfg.name, code: cfg.code, display: cfg.display });
    const adminId = await mkUser({ email: cfg.adminEmail, name: cfg.adminName, type: 'COMPANY_ADMIN', companyId });
    const opId = await mkUser({ email: cfg.opEmail, name: cfg.opName, type: 'OPERATIONAL_ADMIN', companyId });

    const farmId = uid();
    await db.insert(tenant.farmMaster).values({
      farm_id: farmId, tenant_id: tenantId, company_id: companyId, farm_code: cfg.farmCode,
      farm_name: cfg.farmName, farm_type: 'COMMERCIAL', nob_id: NOB, lob_id: LOB,
      capacity: cfg.capacity, is_active: true,
    });

    const areaId = uid();
    await db.insert(tenant.operationalAreaMaster).values({
      area_id: areaId, tenant_id: tenantId, company_id: companyId, farm_id: farmId,
      nob_id: NOB, lob_id: LOB, area_code: cfg.areaCode, area_name: cfg.areaName,
      description: cfg.areaDesc, preseed_source: 'TENANT', is_active: true,
    });
    await db.insert(tenant.userOperationalAreaAssignment).values({
      assignment_id: uid(), user_id: opId, area_id: areaId, company_id: companyId, is_primary: true,
    });

    // Shed + pens (locations)
    const shedId = uid();
    await db.insert(tenant.shedMaster).values({
      shed_id: shedId, tenant_id: tenantId, company_id: companyId, farm_id: farmId,
      shed_code: `${cfg.code}-SHED-01`, shed_name: `${cfg.areaName} Main Shed`,
      shed_type: 'PIGGERY', capacity: cfg.capacity, is_active: true,
    });
    const penIds: string[] = [];
    for (const p of cfg.pens) {
      const pid = uid(); penIds.push(pid);
      await db.insert(tenant.locationMaster).values({
        location_id: pid, tenant_id: tenantId, company_id: companyId, nob_id: NOB, lob_id: LOB,
        farm_id: farmId, shed_id: shedId,
        location_code: p.code, location_name: p.name,
        // location_level is the depth in the farm → shed → pen hierarchy (3 = pen).
        location_level: 3, location_type: 'PEN',
        max_capacity: money(p.cap), capacity_uom: 'HEAD',
        current_count: money(Math.round(p.cap * 0.6)),
        last_cleaned_date: dAgo(9), last_disinfected_date: dAgo(8),
        is_quarantine_zone: p.code.includes('QUAR'),
        is_active: true, status: 'ACTIVE',
      });
    }

    // Scheduler with real parameter lines
    const consumption = cfg.pigParamsOverride ?? pigParams;
    const schedId = uid();
    await db.insert(tenant.schedulerMaster).values({
      scheduler_id: schedId, tenant_id: tenantId, company_id: companyId, nob_id: NOB, lob_id: LOB,
      scheduler_code: `${cfg.code}-SCHED-114`, scheduler_name: '114-Day Swine Production Schedule',
      duration_value: 114, duration_unit: 'DAY', breed_id: pigBreed(cfg.breedName).breed_id,
      batch_start_from: 'Start Date', description: 'Period-based KPI plan for the swine production cycle.',
      is_active: true, is_locked: false,
    });
    let periodNo = 1;
    for (const p of consumption.slice(0, 6)) {
      await db.insert(tenant.schedulerParameterLine).values({
        spl_id: uid(), scheduler_id: schedId, parameter_id: p.parameter_id,
        period_no: periodNo, period_from: (periodNo - 1) * 19 + 1, period_to: periodNo * 19,
        period_label: `Week ${periodNo}`, occurrence: 'WEEKLY',
        stage_code: ['QUARANTINE', 'GILT_GROWER', 'FLUSH_SERVICE', 'DRY_SOW_GESTATION', 'FARROWING', 'LACTATION'][periodNo - 1] || null,
        kpi_mode: 'PCT', kpi_min_pct: '90.00', kpi_max_pct: '110.00', critical_threshold_pct: '120.00',
      });
      periodNo++;
    }

    // Batches + animals + transactions
    const feed = item('FEED-GEST-SOW') || item('FEED') || items[0];
    const med = item('MED-IVERMECTIN') || item('MED') || items[0];
    const liveItem = items.find((i) => i.is_biological_asset) || item('SOW') || items[0];
    const builtBatches: Built['batches'] = [];
    // animal_code is unique per tenant, so the counter has to run across all
    // of this company's batches, not restart inside each one.
    let animalSeq = 0;

    for (const b of cfg.batches) {
      const batchId = uid();
      const start = dAgo(b.startedDaysAgo);
      await db.insert(tenant.batchHeader).values({
        batch_id: batchId, tenant_id: tenantId, company_id: companyId, operational_area_id: areaId,
        batch_no: b.no, nob_id: NOB, lob_id: LOB, costing_method: 'BIO_ASSET',
        breed_id: pigBreed(cfg.breedName).breed_id, scheduler_id: schedId, shed_id: shedId,
        location_id: penIds[0], start_date: start, status: 'ACTIVE',
        opening_quantity: String(b.head), uom: 'HEAD', current_stage_code: b.stage,
        remarks: `${cfg.areaName} — ${b.stage.replace(/_/g, ' ').toLowerCase()} cohort`,
      });
      await db.insert(tenant.batchInputLine).values({
        line_id: uid(), batch_id: batchId, line_no: 1, item_id: liveItem.item_id,
        quantity: String(b.head), uom: 'HEAD', rate: money(b.rate), amount: money(b.head * b.rate),
      });
      await db.insert(tenant.batchBioAssetState).values({
        state_id: uid(), batch_id: batchId, stage: 'MATURE',
        current_quantity: String(b.head), nca_book_value: money(b.head * b.rate),
      });

      // Stage history so the lifecycle stepper has a real trail
      const order = SYSTEM_STAGE_SEED.map((s) => s.stage_code);
      const upto = order.indexOf(b.stage);
      for (let i = 0; i <= upto && i < 8; i++) {
        await db.insert(tenant.batchStageLog).values({
          log_id: uid(), batch_id: batchId, from_stage_code: i === 0 ? null : order[i - 1],
          to_stage_code: order[i], transferred_at: dAgo(Math.max(1, b.startedDaysAgo - i * 12)),
          transferred_by: opId, remarks: 'Stage transition (seeded history)',
        });
      }

      // Individually-registered animals — one per head, with lifecycle stage
      const animalIds: string[] = [];
      for (let i = 0; i < b.head; i++) {
        const aid = uid(); animalIds.push(aid);
        animalSeq++;
        const female = i % 4 !== 0;
        await db.insert(tenant.animalRegister).values({
          animal_id: aid, tenant_id: tenantId, company_id: companyId, nob_id: NOB, lob_id: LOB,
          operational_area_id: areaId,
          animal_code: `${cfg.code}-PIG-${String(animalSeq).padStart(4, '0')}`,
          animal_type: b.stage === 'CB_GROWER' ? 'COMMERCIAL_PIG' : female ? 'SOW' : 'BOAR',
          breed_id: pigBreed(cfg.breedName).breed_id, gender: female ? 'F' : 'M',
          dob: dAgo(b.startedDaysAgo + 240), entry_type: 'PURCHASED_LOCAL', entry_date: start,
          item_id: liveItem.item_id, ear_tag: `${cfg.code}-${female ? 'SOW' : 'BOR'}-${String(animalSeq).padStart(3, '0')}`,
          acquisition_cost: money(b.rate), total_opening_asset_value: money(b.rate),
          current_bio_asset_value: money(b.rate), total_amortised: '0.0000', book_value: money(b.rate),
          current_stage_id: stageId(b.stage), current_batch_id: batchId,
          current_location_id: penIds[i % penIds.length],
          parity_count: b.stage === 'CB_GROWER' ? 0 : (i % 4) + 1,
          status: i === 0 && b.head > 6 ? 'SICK' : b.stage === 'DRY_SOW_GESTATION' && female ? 'PREGNANT' : 'ACTIVE',
          is_active: true, created_by: opId,
        });
      }

      // 14 days of feed + periodic mortality/weight so charts and reports fill in
      for (let day = 14; day >= 1; day--) {
        const date = dAgo(day);
        await db.insert(tenant.batchTransaction).values({
          transaction_id: uid(), batch_id: batchId, transaction_date: date, transaction_type: 'CONSUMPTION',
          item_id: feed.item_id, quantity: money(b.head * 2.4), uom: 'KG', rate: '28.0000',
          amount: money(b.head * 2.4 * 28), remarks: 'Daily ration', created_by: opId,
        });
        if (day % 5 === 0) {
          await db.insert(tenant.batchTransaction).values({
            transaction_id: uid(), batch_id: batchId, transaction_date: date, transaction_type: 'CONSUMPTION',
            item_id: med.item_id, quantity: '2.0000', uom: 'ML', rate: '250.0000', amount: '500.0000',
            remarks: 'Routine deworming', created_by: opId,
          });
        }
        if (day === 9 || day === 3) {
          await db.insert(tenant.batchTransaction).values({
            transaction_id: uid(), batch_id: batchId, transaction_date: date, transaction_type: 'MORTALITY',
            quantity: '1.0000', uom: 'HEAD', rate: money(b.rate), amount: money(-b.rate),
            animal_id: animalIds[animalIds.length - (day === 9 ? 1 : 2)] || null,
            remarks: day === 9 ? 'Sudden death — post-mortem inconclusive' : 'Lameness, culled on welfare grounds',
            created_by: opId,
          });
        }
        if (day % 7 === 0) {
          await db.insert(tenant.batchTransaction).values({
            transaction_id: uid(), batch_id: batchId, transaction_date: date, transaction_type: 'OBSERVATION',
            quantity: money(78 + (14 - day) * 0.6), uom: 'KG', adg: '0.6200', bcs_score: '3.0',
            remarks: 'Weekly weigh-in', created_by: opId,
          });
        }
      }

      // Breeding + farrowing for a gestation cohort
      if (b.stage === 'DRY_SOW_GESTATION' || b.stage === 'LACTATION') {
        for (let i = 0; i < Math.min(3, animalIds.length); i++) {
          const sow = animalIds[i + 1];
          if (!sow) continue;
          const mating = dAgo(b.startedDaysAgo - 5);
          const brId = uid();
          await db.insert(tenant.breedingRecord).values({
            breeding_id: brId, tenant_id: tenantId, company_id: companyId, sow_animal_id: sow,
            mating_type: i % 2 === 0 ? 'AI' : 'NATURAL', mating_date: mating,
            expected_farrowing_date: dAgo(Math.max(0, b.startedDaysAgo - 5 - 114)),
            parity_number: (i % 3) + 1, conception_result: 'CONFIRMED', created_by: opId,
          });
          if (b.stage === 'LACTATION') {
            await db.insert(tenant.farrowingRecord).values({
              farrow_id: uid(), tenant_id: tenantId, company_id: companyId, sow_animal_id: sow,
              breeding_id: brId, batch_id: batchId, farrowing_date: dAgo(20), parity_number: (i % 3) + 1,
              piglets_born_total: 12 + i, piglets_born_live: 11 + i, piglets_stillborn: 1,
              piglets_mummified: 0, avg_birth_weight_kg: '1.4500',
              total_litter_weight_kg: String(((11 + i) * 1.45).toFixed(2)),
              farrowing_status: 'COMPLETED', piglets_weaned: 10 + i,
              avg_weaning_weight_kg: '7.2000', created_by: opId,
            });
          }
        }
      }

      builtBatches.push({ id: batchId, no: b.no, stage: b.stage });
    }

    return { companyId, areaId, farmId, adminId, batches: builtBatches };
  };

  const c1 = await buildCompany({
    name: 'Greenfield Swine Genetics Pvt Ltd', code: 'GSG', display: 'Greenfield Swine Genetics',
    adminEmail: 'admin@swine.local', adminName: 'Swine Genetics Admin',
    opEmail: 'ops@swine.local', opName: 'Swine Genetics Farm Manager',
    farmCode: 'GSG-FARM-01', farmName: 'Greenfield Nucleus Breeding Farm', capacity: 1200,
    areaCode: 'GSG-PIG-01', areaName: 'Nucleus Breeding & Gestation Unit',
    areaDesc: 'Nucleus swine breeding, boar stud, AI station and farrowing operations.',
    breedName: 'Yorkshire',
    pens: [
      { code: 'GSG-PEN-GEST-A', name: 'Gestation Stalls Bank A', cap: 40 },
      { code: 'GSG-PEN-FARR-1', name: 'Farrowing Crate Bank 1', cap: 16 },
      { code: 'GSG-PEN-BOAR-C', name: 'Boar Stud Suite', cap: 8 },
      { code: 'GSG-PEN-QUAR-1', name: 'Biosecurity Isolation Pen', cap: 20 },
    ],
    batches: [
      { no: 'GSG-BAT-2026-0001', stage: 'DRY_SOW_GESTATION', head: 18, startedDaysAgo: 54, rate: 26000 },
      { no: 'GSG-BAT-2026-0002', stage: 'LACTATION', head: 12, startedDaysAgo: 96, rate: 28000 },
    ],
  } as any);

  const c2 = await buildCompany({
    name: 'Riverbend Pork Producers Pvt Ltd', code: 'RPP', display: 'Riverbend Pork Producers',
    adminEmail: 'admin@riverbend.local', adminName: 'Riverbend Admin',
    opEmail: 'ops@riverbend.local', opName: 'Riverbend Farm Manager',
    farmCode: 'RPP-FARM-01', farmName: 'Riverbend Grow-Finish Complex', capacity: 3000,
    areaCode: 'RPP-PIG-01', areaName: 'Commercial Grow-Finish Unit',
    areaDesc: 'Commercial weaner-to-finisher grow-out and dispatch operations.',
    breedName: 'Landrace',
    pens: [
      { code: 'RPP-PEN-WEAN-1', name: 'Weaner Flat-Deck Nursery', cap: 80 },
      { code: 'RPP-PEN-GROW-A', name: 'Grower Pen Row A', cap: 60 },
      { code: 'RPP-PEN-FIN-B', name: 'Finisher Pen Row B', cap: 60 },
    ],
    batches: [
      { no: 'RPP-BAT-2026-0001', stage: 'CB_GROWER', head: 24, startedDaysAgo: 38, rate: 8500 },
      { no: 'RPP-BAT-2026-0002', stage: 'GILT_GROWER', head: 15, startedDaysAgo: 20, rate: 9200 },
    ],
  } as any);

  // Group admin can see both companies
  for (const cid of [c1.companyId, c2.companyId]) {
    await db.insert(tenant.userCompanyAssignments).values({
      assign_id: uid(), user_id: groupAdminId, company_id: cid, is_primary: false, assigned_by: groupAdminId,
    });
  }

  const counts = async (t: any) => (await db.select().from(t)).length;
  console.log(`✓ companies: 2 operating + 1 HQ`);
  console.log(`✓ batches: ${await counts(tenant.batchHeader)} · animals: ${await counts(tenant.animalRegister)} · transactions: ${await counts(tenant.batchTransaction)}`);
  console.log(`✓ pens: ${await counts(tenant.locationMaster)} · schedulers: ${await counts(tenant.schedulerMaster)} · breeding: ${await counts(tenant.breedingRecord)}`);

  await pool.end();
  await masterPool.end();

  console.log('\n' + '='.repeat(68));
  console.log('  ACCOUNTS (password for all: 12345678)');
  console.log('='.repeat(68));
  console.log('  admin@greenfield.local   TENANT_ADMIN       — whole group');
  console.log('  admin@swine.local        COMPANY_ADMIN      — Greenfield Swine Genetics');
  console.log('  ops@swine.local          OPERATIONAL_ADMIN  — Nucleus Breeding & Gestation Unit');
  console.log('  admin@riverbend.local    COMPANY_ADMIN      — Riverbend Pork Producers');
  console.log('  ops@riverbend.local      OPERATIONAL_ADMIN  — Commercial Grow-Finish Unit');
  console.log('='.repeat(68));
}

run().then(() => process.exit(0)).catch((e) => { console.error('\n❌ FAILED:', e); process.exit(1); });
