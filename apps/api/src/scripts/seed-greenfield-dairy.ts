/**
 * Seeds a working Dairy unit in the Greenfield tenant.
 *
 * The Dairy console had no data behind it — its screens invented a herd in
 * component state. This creates the real thing: a dairy company, an operational
 * area on the LVS_MILKING line of business, a milking-herd batch, a registered
 * herd in `animal_register`, and a fortnight of `milk_production_log` records,
 * so the rewritten panels have genuine rows to render.
 *
 * Idempotent: re-running updates rather than duplicating.
 */
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import * as mysql from 'mysql2/promise';
import * as tenant from '../core/database/schema';

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const DB = 'tenant_greenfield';

const uid = () => randomUUID();
const dAgo = (n: number) => { const t = new Date(); t.setDate(t.getDate() - n); return t.toISOString().slice(0, 10); };

const LOB_DAIRY = '60000000-6000-6000-6000-000000000006';
const NOB_LIVESTOCK = '50000000-5000-5000-5000-000000000002';

// A real Holstein herd: yields taper with days in milk, and a couple of animals
// are dry or heifers rather than every cow milking.
const HERD = [
  { tag: 'GDF-COW-001', rfid: 'RF-77-0001', type: 'COW', parity: 3, dim: 34, status: 'LACTATING', yield: 32.4 },
  { tag: 'GDF-COW-002', rfid: 'RF-77-0002', type: 'COW', parity: 2, dim: 45, status: 'LACTATING', yield: 29.8 },
  { tag: 'GDF-COW-003', rfid: 'RF-77-0003', type: 'COW', parity: 4, dim: 142, status: 'LACTATING', yield: 24.5 },
  { tag: 'GDF-COW-004', rfid: 'RF-77-0004', type: 'COW', parity: 2, dim: 220, status: 'LACTATING', yield: 21.0 },
  { tag: 'GDF-COW-005', rfid: 'RF-77-0005', type: 'COW', parity: 4, dim: 0, status: 'DRY', yield: 0 },
  { tag: 'GDF-COW-006', rfid: 'RF-77-0006', type: 'COW', parity: 3, dim: 28, status: 'LACTATING', yield: 26.2 },
  { tag: 'GDF-COW-007', rfid: 'RF-77-0007', type: 'COW', parity: 1, dim: 60, status: 'LACTATING', yield: 30.5 },
  { tag: 'GDF-COW-008', rfid: 'RF-77-0008', type: 'COW', parity: 5, dim: 190, status: 'LACTATING', yield: 22.8 },
  { tag: 'GDF-COW-009', rfid: 'RF-77-0009', type: 'COW', parity: 2, dim: 0, status: 'DRY', yield: 0 },
  { tag: 'GDF-HEI-010', rfid: 'RF-77-0010', type: 'HEIFER', parity: 0, dim: 0, status: 'PREGNANT', yield: 0 },
  { tag: 'GDF-HEI-011', rfid: 'RF-77-0011', type: 'HEIFER', parity: 0, dim: 0, status: 'PREGNANT', yield: 0 },
  { tag: 'GDF-COW-012', rfid: 'RF-77-0012', type: 'COW', parity: 3, dim: 95, status: 'LACTATING', yield: 27.6 },
];

async function main() {
  const pool = mysql.createPool({ host, port, user, password, database: DB, multipleStatements: true });
  const db = drizzle(pool, { schema: tenant, mode: 'default' });

  const [{ tenant_id: tenantId }] = await db
    .select({ tenant_id: tenant.companyMaster.tenant_id })
    .from(tenant.companyMaster)
    .limit(1);

  // ---- Company -----------------------------------------------------------
  let [company] = await db.select().from(tenant.companyMaster).where(eq(tenant.companyMaster.company_code, 'GDF')).limit(1);
  if (!company) {
    const companyId = uid();
    await db.insert(tenant.companyMaster).values({
      company_id: companyId,
      tenant_id: tenantId,
      company_code: 'GDF',
      company_name: 'Greenfield Dairy Farms Pvt Ltd',
      company_display_name: 'Greenfield Dairy',
      company_type: 'Pvt Ltd',
      industry_type: 'Livestock Farming',
      // Same locale/currency references the sibling companies use.
      base_currency_id: '20000000-2000-2000-2000-200000000001',
      default_language_id: '10000000-1000-1000-1000-100000000001',
      default_timezone_id: 'Asia/Kolkata',
      country_id: 'IND',
      onboarding_status: 'COMPLETED',
      is_active: true,
    } as typeof tenant.companyMaster.$inferInsert);
    [company] = await db.select().from(tenant.companyMaster).where(eq(tenant.companyMaster.company_id, companyId)).limit(1);
    console.log('  + company Greenfield Dairy Farms Pvt Ltd');
  } else {
    console.log('  = company already present');
  }
  const companyId = company.company_id;

  // ---- Farm --------------------------------------------------------------
  let [farm] = await db.select().from(tenant.farmMaster).where(eq(tenant.farmMaster.company_id, companyId)).limit(1);
  if (!farm) {
    const farmId = uid();
    await db.insert(tenant.farmMaster).values({
      farm_id: farmId, tenant_id: tenantId, company_id: companyId,
      farm_code: 'GDF-FARM-01', farm_name: 'Greenfield Dairy Farm', farm_type: 'DAIRY',
      nob_id: NOB_LIVESTOCK, lob_id: LOB_DAIRY, is_active: true,
    } as typeof tenant.farmMaster.$inferInsert);
    [farm] = await db.select().from(tenant.farmMaster).where(eq(tenant.farmMaster.farm_id, farmId)).limit(1);
    console.log('  + farm');
  }

  // ---- Operational area (the LVS_MILKING one the console needs) -----------
  let [area] = await db.select().from(tenant.operationalAreaMaster)
    .where(and(eq(tenant.operationalAreaMaster.company_id, companyId), eq(tenant.operationalAreaMaster.area_code, 'GDF-MILK-01'))).limit(1);
  if (!area) {
    const areaId = uid();
    await db.insert(tenant.operationalAreaMaster).values({
      area_id: areaId, tenant_id: tenantId, company_id: companyId, farm_id: farm.farm_id,
      nob_id: NOB_LIVESTOCK, lob_id: LOB_DAIRY,
      area_code: 'GDF-MILK-01', area_name: 'Main Milking & Lactation Unit',
      description: 'Free-stall milking herd with twice-daily parlour sessions.',
      preseed_source: 'TENANT', is_active: true, status: 'ACTIVE',
    } as typeof tenant.operationalAreaMaster.$inferInsert);
    [area] = await db.select().from(tenant.operationalAreaMaster).where(eq(tenant.operationalAreaMaster.area_id, areaId)).limit(1);
    console.log('  + operational area (LVS_MILKING)');
  }
  const areaId = area.area_id;

  // ---- Breed + item ------------------------------------------------------
  const [breed] = await db.select().from(tenant.breedMaster).where(eq(tenant.breedMaster.breed_code, 'HOLSTEIN-FRIESIAN')).limit(1);
  if (!breed) throw new Error('Holstein Friesian breed is missing from breed_master.');
  // Point the breed at this company so the register's breed dropdown finds it.
  await db.update(tenant.breedMaster).set({ company_id: companyId, nob_id: NOB_LIVESTOCK }).where(eq(tenant.breedMaster.breed_id, breed.breed_id));

  let [item] = await db.select().from(tenant.itemMaster).where(and(eq(tenant.itemMaster.company_id, companyId), eq(tenant.itemMaster.item_code, 'DAIRY-COW'))).limit(1);
  if (!item) {
    const itemId = uid();
    await db.insert(tenant.itemMaster).values({
      item_id: itemId, tenant_id: tenantId, company_id: companyId,
      item_code: 'DAIRY-COW', item_name: 'Dairy Cow (Bio Asset)', item_type: 'RAW_MATERIAL',
      uom_primary: 'HEAD', is_active: true,
    } as typeof tenant.itemMaster.$inferInsert);
    [item] = await db.select().from(tenant.itemMaster).where(eq(tenant.itemMaster.item_id, itemId)).limit(1);
    console.log('  + bio-asset item');
  }

  // ---- Number series so dairy animals get GDF- codes, not PIG- -----------
  const existingSeries = await db.select().from(tenant.noSeriesMaster)
    .where(and(eq(tenant.noSeriesMaster.tenant_id, tenantId), eq(tenant.noSeriesMaster.series_code, 'ANIMAL_LVS_MILKING'))).limit(1);
  if (!existingSeries.length) {
    await db.insert(tenant.noSeriesMaster).values({
      series_id: uid(), tenant_id: tenantId, company_id: companyId,
      series_code: 'ANIMAL_LVS_MILKING', series_name: 'Dairy Animal', document_type: 'ANIMAL',
      prefix: 'GDF-COW', date_format: 'YYYY', separator: '-', seq_length: 4,
      current_seq: HERD.length, reset_frequency: 'YEARLY', allow_manual: false, is_active: true,
    } as typeof tenant.noSeriesMaster.$inferInsert);
    console.log('  + ANIMAL_LVS_MILKING number series');
  }

  // ---- Milking herd batch ------------------------------------------------
  let [batch] = await db.select().from(tenant.batchHeader)
    .where(and(eq(tenant.batchHeader.company_id, companyId), eq(tenant.batchHeader.batch_no, 'GDF-MILK-2026-0001'))).limit(1);
  if (!batch) {
    const batchId = uid();
    await db.insert(tenant.batchHeader).values({
      batch_id: batchId, tenant_id: tenantId, company_id: companyId,
      batch_no: 'GDF-MILK-2026-0001', lob_id: LOB_DAIRY, nob_id: NOB_LIVESTOCK,
      costing_method: 'BIO_ASSET', breed_id: breed.breed_id, operational_area_id: areaId,
      farm_id: farm.farm_id, current_stage_code: 'EARLY_LAC',
      start_date: dAgo(240), status: 'ACTIVE',
      opening_quantity: String(HERD.length), uom: 'HEAD',
      closing_quantity: String(HERD.length),
      total_cost: '1080000.0000', unit_cost: '90000.000000',
      remarks: 'Main milking herd — twice-daily parlour.',
    } as typeof tenant.batchHeader.$inferInsert);
    [batch] = await db.select().from(tenant.batchHeader).where(eq(tenant.batchHeader.batch_id, batchId)).limit(1);
    console.log('  + milking herd batch');
  }
  const batchId = batch.batch_id;

  const stateRows = await db.select().from(tenant.batchBioAssetState).where(eq(tenant.batchBioAssetState.batch_id, batchId)).limit(1);
  if (!stateRows.length) {
    await db.insert(tenant.batchBioAssetState).values({
      state_id: uid(), batch_id: batchId, stage: 'MATURE',
      current_quantity: String(HERD.length), nca_book_value: String(HERD.length * 90000),
    } as typeof tenant.batchBioAssetState.$inferInsert);
  }

  // ---- The herd ----------------------------------------------------------
  let added = 0;
  for (const cow of HERD) {
    const existing = await db.select().from(tenant.animalRegister)
      .where(and(eq(tenant.animalRegister.tenant_id, tenantId), eq(tenant.animalRegister.animal_code, cow.tag))).limit(1);
    if (existing.length) continue;
    await db.insert(tenant.animalRegister).values({
      animal_id: uid(), tenant_id: tenantId, company_id: companyId,
      nob_id: NOB_LIVESTOCK, lob_id: LOB_DAIRY, operational_area_id: areaId,
      animal_code: cow.tag, animal_type: cow.type, breed_id: breed.breed_id,
      gender: cow.type === 'BULL' ? 'M' : 'F',
      dob: dAgo(365 * (2 + cow.parity)),
      entry_type: 'PURCHASED_LOCAL', entry_date: dAgo(240),
      item_id: item.item_id, rfid_tag: cow.rfid, ear_tag: cow.tag,
      acquisition_cost: '90000.0000', total_opening_asset_value: '90000.0000',
      current_batch_id: batchId, parity_count: cow.parity,
      // Days in milk is derived from this on screen, so it must be a real date.
      productive_life_start: cow.dim > 0 ? dAgo(cow.dim) : null,
      book_value: '90000.0000', status: cow.status, is_active: true,
    } as typeof tenant.animalRegister.$inferInsert);
    added++;
  }
  console.log(`  + ${added} animals registered (${HERD.length - added} already present)`);

  // ---- Fourteen days of milking ------------------------------------------
  const lactating = HERD.filter((c) => c.status === 'LACTATING');
  const herdDaily = lactating.reduce((s, c) => s + c.yield, 0);
  let logs = 0;
  for (let d = 13; d >= 0; d--) {
    const day = dAgo(d);
    // A little day-to-day variation, deterministic so re-runs match.
    const wobble = 1 + (((d * 37) % 11) - 5) / 100;
    const morning = Number((herdDaily * 0.54 * wobble).toFixed(1));
    const evening = Number((herdDaily * 0.46 * wobble).toFixed(1));
    for (const [session, qty] of [['MORNING', morning], ['EVENING', evening]] as const) {
      const dup = await db.select().from(tenant.milkProductionLog)
        .where(and(
          eq(tenant.milkProductionLog.batch_id, batchId),
          eq(tenant.milkProductionLog.log_date, day),
          eq(tenant.milkProductionLog.session, session),
        )).limit(1);
      if (dup.length) continue;
      await db.insert(tenant.milkProductionLog).values({
        log_id: uid(), tenant_id: tenantId, company_id: companyId,
        operational_area_id: areaId, batch_id: batchId, animal_id: null,
        log_date: day, session, quantity_litres: String(qty),
        fat_pct: session === 'MORNING' ? String(Number((4.05 + ((d * 13) % 7) / 100).toFixed(2))) : null,
        snf_pct: session === 'MORNING' ? String(Number((8.72 + ((d * 17) % 9) / 100).toFixed(2))) : null,
        scc_count: session === 'MORNING' ? 118000 + ((d * 2311) % 40000) : null,
        bmc_temperature_c: session === 'MORNING' ? '3.80' : null,
        remarks: d === 0 ? 'Parlour hygiene check passed; bulk tank holding at 3.8°C.' : null,
      } as typeof tenant.milkProductionLog.$inferInsert);
      logs++;
    }
  }
  console.log(`  + ${logs} milking session records`);

  // ---- Per-cow yields for today, so the register shows real litres --------
  const todayStr = dAgo(0);
  const animals = await db.select().from(tenant.animalRegister).where(eq(tenant.animalRegister.current_batch_id, batchId));
  let perCow = 0;
  for (const a of animals) {
    const spec = HERD.find((c) => c.tag === a.animal_code);
    if (!spec || spec.yield <= 0) continue;
    const dup = await db.select().from(tenant.milkProductionLog)
      .where(and(
        eq(tenant.milkProductionLog.batch_id, batchId),
        eq(tenant.milkProductionLog.log_date, todayStr),
        eq(tenant.milkProductionLog.session, 'BULK'),
        eq(tenant.milkProductionLog.animal_id, a.animal_id),
      )).limit(1);
    if (dup.length) continue;
    await db.insert(tenant.milkProductionLog).values({
      log_id: uid(), tenant_id: tenantId, company_id: companyId,
      operational_area_id: areaId, batch_id: batchId, animal_id: a.animal_id,
      log_date: todayStr, session: 'BULK', quantity_litres: String(spec.yield),
      fat_pct: String(Number((3.95 + (spec.yield % 7) / 10).toFixed(2))),
      snf_pct: String(Number((8.70 + (spec.yield % 5) / 10).toFixed(2))),
    } as typeof tenant.milkProductionLog.$inferInsert);
    perCow++;
  }
  console.log(`  + ${perCow} per-cow yield records for today`);

  // ---- A day of real cost lines ------------------------------------------
  // These are ordinary batch_transaction rows — the same shape the shared Data
  // Entry screen writes — so the dairy cost panel and cost-per-litre have real
  // figures to read rather than the hardcoded prices the old screen carried.
  const COST_ITEMS = [
    { code: 'FEED-TMR', name: 'Dairy TMR (Total Mixed Ration)', type: 'RAW_MATERIAL', uom: 'KG' },
    { code: 'MED-CALGEL', name: 'Calcium Gel Bolus', type: 'CONSUMABLE', uom: 'PCS' },
  ];
  const itemIds: Record<string, string> = {};
  for (const ci of COST_ITEMS) {
    let [row] = await db.select().from(tenant.itemMaster)
      .where(and(eq(tenant.itemMaster.company_id, companyId), eq(tenant.itemMaster.item_code, ci.code))).limit(1);
    if (!row) {
      const id = uid();
      await db.insert(tenant.itemMaster).values({
        item_id: id, tenant_id: tenantId, company_id: companyId,
        item_code: ci.code, item_name: ci.name, item_type: ci.type, uom_primary: ci.uom, is_active: true,
      } as typeof tenant.itemMaster.$inferInsert);
      [row] = await db.select().from(tenant.itemMaster).where(eq(tenant.itemMaster.item_id, id)).limit(1);
    }
    itemIds[ci.code] = row.item_id;
  }

  const todayCosts = await db.select().from(tenant.batchTransaction)
    .where(and(eq(tenant.batchTransaction.batch_id, batchId), eq(tenant.batchTransaction.transaction_date, todayStr))).limit(1);
  if (!todayCosts.length) {
    // Cost amounts are stored negative, matching batch.service.ts.
    await db.insert(tenant.batchTransaction).values([
      {
        transaction_id: uid(), batch_id: batchId, transaction_date: todayStr, transaction_type: 'CONSUMPTION',
        item_id: itemIds['FEED-TMR'], quantity: '300.0000', uom: 'KG', rate: '14.500000', amount: '-4350.0000',
        remarks: 'TMR — 25 kg/head across 12 animals',
      },
      {
        transaction_id: uid(), batch_id: batchId, transaction_date: todayStr, transaction_type: 'CONSUMPTION',
        item_id: itemIds['MED-CALGEL'], quantity: '4.0000', uom: 'PCS', rate: '362.500000', amount: '-1450.0000',
        remarks: 'Fresh cow calcium',
      },
      {
        transaction_id: uid(), batch_id: batchId, transaction_date: todayStr, transaction_type: 'OVERHEAD',
        quantity: '1.0000', uom: 'LOT', rate: '750.000000', amount: '-750.0000',
        remarks: 'Parlour electricity and water',
      },
    ] as (typeof tenant.batchTransaction.$inferInsert)[]);
    console.log('  + 3 cost lines for today');
  }

  await pool.end();
  console.log('\nDairy unit ready.');
  console.log(`  company : Greenfield Dairy Farms Pvt Ltd (${companyId})`);
  console.log(`  area    : Main Milking & Lactation Unit (${areaId})`);
  console.log(`  batch   : GDF-MILK-2026-0001 (${batchId})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
