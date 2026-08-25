const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';
const isRemoteOrTidb = port === 4000 || host.includes('tidbcloud') || process.env.DATABASE_SSL === 'true';
const ssl = isRemoteOrTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

async function run() {
  // Resolve the devco tenant's *actual* registered database from the master DB rather
  // than assuming a fixed name — the tenant prefix/naming depends on DATABASE_NAME
  // (e.g. `tenant_devco` vs a `piggery_`-prefixed setup), and a hardcoded guess here
  // previously seeded a stale, disconnected database that the live app never read from.
  const masterConn = await mysql.createConnection({ host, port, user, password, database: masterDatabase, ssl });
  let dbName;
  try {
    const [tenants] = await masterConn.query(`SELECT db_name FROM tenant_master WHERE tenant_code = 'devco' LIMIT 1`);
    if (!tenants.length) throw new Error(`No tenant registered with tenant_code='devco' in ${masterDatabase}. Run seed-dev-tenant.ts first.`);
    dbName = tenants[0].db_name;
  } finally {
    await masterConn.end();
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
    ssl,
    multipleStatements: true,
  });

  console.log(`\n======================================================`);
  console.log(`Resetting & Re-Seeding Clean Schedulers, Batches & 15-Day Data in ${dbName}...`);
  console.log(`======================================================\n`);

  // 1. Fetch Master Data Context
  console.log('1. Loading Context...');
  const [companies] = await connection.query(`SELECT company_id, tenant_id FROM company_master LIMIT 1`);
  if (!companies.length) throw new Error('Company not found');
  const { company_id, tenant_id } = companies[0];

  // 2. Clean out existing batch and scheduler records
  console.log('2. Cleaning existing batches, transactions, and schedulers...');
  await connection.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  const tablesToClean = [
    'notification_alert_log',
    'bio_asset_ledger',
    'batch_daily_entry_draft',
    'batch_transaction',
    'batch_input_line',
    'batch_output_line',
    'batch_stage_log',
    'scheduler_line_custom_days',
    'scheduler_parameter_line',
    'scheduler_master',
    'batch_header',
    'animal_medication_log',
    'farrowing_record',
    'breeding_record',
    'animal_register',
  ];

  for (const tbl of tablesToClean) {
    try {
      await connection.query(`DELETE FROM \`${tbl}\` WHERE tenant_id = ?;`, [tenant_id]);
    } catch {
      try {
        await connection.query(`DELETE FROM \`${tbl}\`;`);
      } catch {}
    }
  }
  await connection.query(`SET FOREIGN_KEY_CHECKS = 1;`);

  const [users] = await connection.query(`SELECT user_id FROM user_master WHERE user_type = 'COMPANY_ADMIN' LIMIT 1`);
  const userId = users[0]?.user_id || randomUUID();

  const [nobs] = await connection.query(`SELECT nob_id FROM nob_master WHERE nob_code = 'LIVESTOCK' LIMIT 1`);
  const [lobs] = await connection.query(`SELECT lob_id FROM lob_master WHERE lob_code = 'LVS_PIGGERY' LIMIT 1`);
  const nob_id = nobs[0]?.nob_id || '50000000-5000-5000-5000-000000000002';
  const lob_id = lobs[0]?.lob_id || '60000000-6000-6000-6000-000000000007';

  const [breeds] = await connection.query(`SELECT breed_id, breed_code, breed_name FROM breed_master`);
  const landrace = breeds.find(b => b.breed_code === 'LANDRACE') || breeds[0];
  const duroc = breeds.find(b => b.breed_code === 'DUROC') || breeds[0];

  const [stages] = await connection.query(`SELECT stage_id, stage_code, stage_name, stage_category, typical_duration_days FROM stage_master WHERE lob_id = ? ORDER BY stage_sequence`, [lob_id]);

  const [items] = await connection.query(`SELECT item_id, item_code, item_name, standard_cost, item_type FROM item_master WHERE company_id = ? OR company_id IS NULL`, [company_id]);
  const itemMap = new Map(items.map(i => [i.item_code, i]));

  const [sheds] = await connection.query(`SELECT shed_id, shed_code, shed_name FROM shed_master WHERE company_id = ?`, [company_id]);
  const [pens] = await connection.query(`SELECT location_id, location_code, location_name FROM location_master WHERE company_id = ?`, [company_id]);

  const gestShed = sheds.find(s => s.shed_code.includes('GEST')) || sheds[0];
  const farrShed = sheds.find(s => s.shed_code.includes('FARR')) || sheds[0];
  const growShed = sheds.find(s => s.shed_code.includes('GROW')) || sheds[0];

  const gestPen = pens.find(p => p.location_code.includes('GEST')) || pens[0];
  const farrPen = pens.find(p => p.location_code.includes('FARR')) || pens[0];
  const growPen = pens.find(p => p.location_code.includes('GROW')) || pens[0];

  // Helper for Parameters
  const [existingParams] = await connection.query(`SELECT parameter_id, parameter_code, parameter_name, parameter_type, default_uom FROM parameter_master WHERE company_id = ?`, [company_id]);
  const paramMap = new Map(existingParams.map(p => [p.parameter_code, p]));

  async function getOrCreateParam(code, name, type, uom, itemId = null) {
    if (paramMap.has(code)) return paramMap.get(code);
    const pId = randomUUID();
    await connection.query(`
      INSERT INTO parameter_master (parameter_id, tenant_id, company_id, nob_id, lob_id, parameter_code, parameter_name, parameter_type, default_uom, qty_method, item_id, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PER_UNIT', ?, 1, ?)
    `, [pId, tenant_id, company_id, nob_id, lob_id, code, name, type, uom, itemId, userId]);
    const obj = { parameter_id: pId, parameter_code: code, parameter_name: name, parameter_type: type, default_uom: uom, item_id: itemId };
    paramMap.set(code, obj);
    return obj;
  }

  const pFeedGest = await getOrCreateParam('PARAM-FEED-GEST', 'Dry Sow Gestation Feed Intake', 'CONSUMPTION', 'KG', itemMap.get('FEED-GEST-SOW')?.item_id);
  const pFeedLact = await getOrCreateParam('PARAM-FEED-LACT', 'Lactation Sow Feed Consumption', 'CONSUMPTION', 'KG', itemMap.get('FEED-LACT-SOW')?.item_id || itemMap.get('FEED-GEST-SOW')?.item_id);
  const pFeedGrow = await getOrCreateParam('PARAM-FEED-GROW', 'Weaner-Grower Mash Consumption', 'CONSUMPTION', 'KG', itemMap.get('FEED-WEAN-GROW')?.item_id || itemMap.get('RAW-MAIZE-CORN')?.item_id);
  const pDeworm = await getOrCreateParam('PARAM-MED-DEWORM', 'Ivermectin 1% Swine Dewormer', 'CONSUMPTION', 'DOSES', itemMap.get('MED-IVERMECTIN')?.item_id);
  const pPcv2 = await getOrCreateParam('PARAM-VAC-PCV2', 'PCV2 & Parvovirus Swine Vaccine', 'CONSUMPTION', 'DOSES', itemMap.get('VAC-PARVO-LEPTO')?.item_id || itemMap.get('VAC-PRRS-MLV')?.item_id);
  const pIron = await getOrCreateParam('PARAM-MED-IRON', 'Iron Dextran 200mg Injection', 'CONSUMPTION', 'DOSES', itemMap.get('MED-IRON-DEX')?.item_id);
  const pHeadCount = await getOrCreateParam('PARAM-HEAD-COUNT', 'Daily Head Count Verification', 'DESCRIPTIVE', 'HEAD');
  const pMortality = await getOrCreateParam('PARAM-MORTALITY', 'Daily Mortality Log', 'DESCRIPTIVE', 'HEAD');
  const pWeight = await getOrCreateParam('PARAM-BODY-WEIGHT', 'Average Body Weight Sampling', 'DESCRIPTIVE', 'KG');
  const pAdg = await getOrCreateParam('PARAM-ADG-GROWTH', 'Average Daily Gain (ADG)', 'DESCRIPTIVE', 'G_PER_DAY');
  const pBcs = await getOrCreateParam('PARAM-BCS-SCORE', 'Body Condition Score (BCS 1-5)', 'DESCRIPTIVE', 'SCORE');
  const pPregScan = await getOrCreateParam('PARAM-PREG-SCAN', 'Ultrasound Pregnancy Scan Checkpoint', 'DESCRIPTIVE', 'CHECK');
  const pOvhElec = await getOrCreateParam('PARAM-OVH-ELEC', 'Barn Electricity & Ventilation', 'OVERHEAD', 'DAY');
  const pOvhWater = await getOrCreateParam('PARAM-OVH-WATER', 'Barn Water Supply & Misting', 'OVERHEAD', 'DAY');
  const pResLabour = await getOrCreateParam('PARAM-RES-LABOUR', 'Stockman Attendant Care Rounds', 'RESOURCE', 'HOURS');
  const pTransWean = await getOrCreateParam('PARAM-TRANS-WEAN', 'Transfer Weaned Piglets to Nursery Batch', 'TRANSFER', 'HEAD');

  // Dates for 15 Days of Historical Data
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 14); // 15 days total (Day 1 to Day 15)
  const startDateStr = startDate.toISOString().slice(0, 10);

  console.log(`3. Seeding 3 Premier Batches with Multi-Stage Schedulers (Start Date: ${startDateStr})...`);

  // ==========================================
  // BATCH 1: Gestation Breeding Sows (35 Sows)
  // ==========================================
  const batch1Id = randomUUID();
  const batch1No = 'PIG-SOW-2026-001';
  const batch1Animals = 35;

  console.log(`  -> Creating Batch 1: ${batch1No} (${batch1Animals} Sows, Stage: DRY_SOW_GESTATION)...`);

  let activeScheduler1Id = null;

  for (const stg of stages) {
    const sId = randomUUID();
    const isCurrent = stg.stage_code === 'DRY_SOW_GESTATION';
    if (isCurrent) activeScheduler1Id = sId;

    const sDuration = stg.typical_duration_days || (isCurrent ? 110 : 30);
    const schedCode = `SCHED-${batch1No}-${stg.stage_code}`;

    await connection.query(`
      INSERT INTO scheduler_master (
        scheduler_id, tenant_id, company_id, nob_id, lob_id, batch_id, stage_id, stage_code, stage_name,
        scheduler_code, scheduler_name, scheduler_status, duration_value, duration_unit, breed_id, animal_count,
        auto_generated, is_locked, description, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DAY', ?, ?, 1, 0, ?, 1, ?)
    `, [
      sId, tenant_id, company_id, nob_id, lob_id, batch1Id, stg.stage_id, stg.stage_code, stg.stage_name,
      schedCode, `${stg.stage_name} Scheduler - ${batch1No}`, isCurrent ? 'ACTIVE' : 'PENDING',
      sDuration, landrace.breed_id, batch1Animals,
      `Multi-stage lifecycle scheduler for ${stg.stage_name}`, userId
    ]);

    // Parameter Lines for Gestation
    let seq = 1;
    // Morning Feed
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, kpi_max_pct, critical_threshold_pct,
        lot_required, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'Morning Gestation Feed (1.15 kg/head)', 1, 1, ?, 'Morning Feed', 'DAILY', ?, ?, 1, ?, 40.0, 40.0, 'TOTAL_BATCH', 'KG', 'KG', 1, 'VALUE', 40.0, 10.0, 25.0, 1, 'Morning feed ration')
    `, [randomUUID(), sId, pFeedGest.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Evening Feed
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, kpi_max_pct, critical_threshold_pct,
        lot_required, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'Evening Gestation Feed (1.15 kg/head)', 2, 1, ?, 'Evening Feed', 'DAILY', ?, ?, 1, ?, 40.0, 40.0, 'TOTAL_BATCH', 'KG', 'KG', 1, 'VALUE', 40.0, 10.0, 25.0, 1, 'Evening feed ration')
    `, [randomUUID(), sId, pFeedGest.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Day 1 Deworming
    const dewormSplId = randomUUID();
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, lot_required, withdrawal_days, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'Entry Fenbendazole / Ivermectin Dewormer', 3, 1, 1, 'Day 1 Entry Deworming', 'CUSTOM', ?, ?, 1, 1, ?, ?, 'TOTAL_BATCH', 'DOSES', 'DOSES', 1, 14, 'Routine entry deworming for sows')
    `, [dewormSplId, sId, pDeworm.parameter_id, seq++, stg.stage_id, stg.stage_code, batch1Animals, batch1Animals]);
    await connection.query(`INSERT INTO scheduler_line_custom_days (custom_day_id, spl_id, day_number, day_label) VALUES (?, ?, 1, 'Day 1 Deworming')`, [randomUUID(), dewormSplId]);

    // Day 21 PCV2 Booster
    const pcv2SplId = randomUUID();
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, lot_required, withdrawal_days, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'PCV2 & Parvovirus Sow Booster Vaccine', 4, 21, 21, 'Day 21 Sow Booster', 'CUSTOM', ?, ?, 21, 21, ?, ?, 'TOTAL_BATCH', 'DOSES', 'DOSES', 1, 21, 'Administer booster on Day 21')
    `, [pcv2SplId, sId, pPcv2.parameter_id, seq++, stg.stage_id, stg.stage_code, batch1Animals, batch1Animals]);
    await connection.query(`INSERT INTO scheduler_line_custom_days (custom_day_id, spl_id, day_number, day_label) VALUES (?, ?, 21, 'Day 21 PCV2 Booster')`, [randomUUID(), pcv2SplId]);

    // Head Count & Mortality
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Morning & Evening Head Count Check', 5, 1, ?, 'Head Count', 'DAILY', ?, ?, 1, ?, 'HEAD', 'HEAD', 1, 'VALUE', ?, 'Daily herd verification')
    `, [randomUUID(), sId, pHeadCount.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration, batch1Animals]);

    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Daily Mortality & Morbidity Log', 6, 1, ?, 'Mortality', 'DAILY', ?, ?, 1, ?, 'HEAD', 'HEAD', 1, 'VALUE', 0, 'Target max mortality <= 0.05%')
    `, [randomUUID(), sId, pMortality.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Weekly Body Weight & BCS Score
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, uom, uom_override, kpi_target_value, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Weekly Body Weight Sample Check', 7, 1, ?, 'Weight Check', 'WEEKLY', ?, ?, 7, ?, 'KG', 'KG', 225.0, 'Standard gestation sow weight')
    `, [randomUUID(), sId, pWeight.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Ultrasound Pregnancy Checkpoint (Day 28)
    const scanSplId = randomUUID();
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, kpi_metric, uom, uom_override, is_mandatory, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Ultrasound Pregnancy Confirmation Scan (Day 28)', 8, 28, 28, 'Pregnancy Diagnosis Checkpoint', 'ONCE', ?, ?, 28, 28, 'PREGNANCY_CONFIRMED', 'CHECK', 'CHECK', 1, 'Real-time ultrasound scan between Day 28–35')
    `, [scanSplId, sId, pPregScan.parameter_id, seq++, stg.stage_id, stg.stage_code]);
    await connection.query(`INSERT INTO scheduler_line_custom_days (custom_day_id, spl_id, day_number, day_label) VALUES (?, ?, 28, 'Day 28 Pregnancy Scan')`, [randomUUID(), scanSplId]);

    // Overheads
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, overhead_category, estimated_cost, notes
      ) VALUES (?, ?, ?, ?, 'OVERHEAD', 'Barn Electricity, Ventilation & Climate Control', 9, 1, ?, 'Utility', 'DAILY', ?, ?, 'ELECTRICITY', 85.00, 'Automated fans and lighting')
    `, [randomUUID(), sId, pOvhElec.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code]);

    // Labour
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, standard_qty, uom, uom_override, notes
      ) VALUES (?, ?, ?, ?, 'RESOURCE', 'Stockman Daily Attendant & Feeding Rounds', 10, 1, ?, 'Labour', 'DAILY', ?, ?, 2.50, 'HOURS', 'HOURS', 'Daily shed management')
    `, [randomUUID(), sId, pResLabour.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code]);
  }

  // Insert Batch Header 1
  await connection.query(`
    INSERT INTO batch_header (
      batch_id, tenant_id, company_id, batch_no, lob_id, nob_id, costing_method, breed_id, scheduler_id,
      stage_id, current_stage_code, shed_id, sub_location_id, start_date, opening_quantity,
      uom, status, remarks, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, 'BIO_ASSET', ?, ?, ?, 'DRY_SOW_GESTATION', ?, ?, ?, ?, 'HEAD', 'ACTIVE', 'Breeding Gestation Sows - Parity 2 Cohort', ?)
  `, [
    batch1Id, tenant_id, company_id, batch1No, lob_id, nob_id, landrace.breed_id, activeScheduler1Id,
    stages.find(s => s.stage_code === 'DRY_SOW_GESTATION')?.stage_id,
    gestShed.shed_id, gestPen.location_id, startDateStr, batch1Animals, userId
  ]);

  // Insert 15 Days of Data Entries for Batch 1
  console.log(`  -> Seeding 15 consecutive days of historical transactions for ${batch1No}...`);
  let b1Head = batch1Animals;
  for (let d = 0; d < 15; d++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + d);
    const dateStr = curDate.toISOString().slice(0, 10);
    const dayNo = d + 1;

    // Day 8: 1 Mortality
    if (dayNo === 8) {
      b1Head -= 1;
      await connection.query(`
        INSERT INTO batch_transaction (
          transaction_id, batch_id, transaction_date, transaction_type,
          quantity, uom, remarks, created_by
        ) VALUES (?, ?, ?, 'MORTALITY', 1, 'HEAD', 'Poor body condition / Cardiac arrest - Veterinary post-mortem logged', ?)
      `, [randomUUID(), batch1Id, dateStr, userId]);
    }

    // Morning Feed
    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        item_id, quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'CONSUMPTION', ?, 40.0, 'KG', 12.50, 500.00, 'Morning gestation mash intake', ?)
    `, [randomUUID(), batch1Id, dateStr, itemMap.get('FEED-GEST-SOW')?.item_id, userId]);

    // Evening Feed
    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        item_id, quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'CONSUMPTION', ?, 40.0, 'KG', 12.50, 500.00, 'Evening gestation mash intake', ?)
    `, [randomUUID(), batch1Id, dateStr, itemMap.get('FEED-GEST-SOW')?.item_id, userId]);

    // Day 1: Dewormer
    if (dayNo === 1) {
      await connection.query(`
        INSERT INTO batch_transaction (
          transaction_id, batch_id, transaction_date, transaction_type,
          item_id, quantity, uom, rate, amount, remarks, created_by
        ) VALUES (?, ?, ?, 'CONSUMPTION', ?, 35.0, 'DOSES', 8.00, 280.00, 'Day 1 Sow Deworming Protocol', ?)
      `, [randomUUID(), batch1Id, dateStr, itemMap.get('MED-IVERMECTIN')?.item_id, userId]);
    }

    // Weight Observation on Day 7 and Day 14
    if (dayNo === 7 || dayNo === 14) {
      const avgW = dayNo === 7 ? 222.5 : 225.0;
      await connection.query(`
        INSERT INTO batch_transaction (
          transaction_id, batch_id, transaction_date, transaction_type,
          quantity, uom, remarks, created_by
        ) VALUES (?, ?, ?, 'OBSERVATION', ?, 'KG', 'Weekly average body weight sample check', ?)
      `, [randomUUID(), batch1Id, dateStr, avgW, userId]);
    }

    // Overhead: Electricity & Water
    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'OVERHEAD', 1, 'DAY', 85.00, 85.00, 'Barn power & ventilation', ?)
    `, [randomUUID(), batch1Id, dateStr, userId]);

    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'OVERHEAD', 1, 'DAY', 45.00, 45.00, 'Barn water & cooling mist', ?)
    `, [randomUUID(), batch1Id, dateStr, userId]);
  }

  // ==============================================
  // BATCH 2: Commercial Porker Grower Batch (120)
  // ==============================================
  const batch2Id = randomUUID();
  const batch2No = 'PIG-GROW-2026-002';
  const batch2Animals = 120;

  console.log(`  -> Creating Batch 2: ${batch2No} (${batch2Animals} Porkers, Stage: GROWER)...`);

  let activeScheduler2Id = null;

  for (const stg of stages) {
    const sId = randomUUID();
    const isCurrent = stg.stage_code === 'GROWER' || stg.stage_code === 'CB_GROWER';
    if (isCurrent && !activeScheduler2Id) activeScheduler2Id = sId;

    const sDuration = stg.typical_duration_days || (isCurrent ? 48 : 30);
    const schedCode = `SCHED-${batch2No}-${stg.stage_code}`;

    await connection.query(`
      INSERT INTO scheduler_master (
        scheduler_id, tenant_id, company_id, nob_id, lob_id, batch_id, stage_id, stage_code, stage_name,
        scheduler_code, scheduler_name, scheduler_status, duration_value, duration_unit, breed_id, animal_count,
        auto_generated, is_locked, description, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DAY', ?, ?, 1, 0, ?, 1, ?)
    `, [
      sId, tenant_id, company_id, nob_id, lob_id, batch2Id, stg.stage_id, stg.stage_code, stg.stage_name,
      schedCode, `${stg.stage_name} Scheduler - ${batch2No}`, (isCurrent && sId === activeScheduler2Id) ? 'ACTIVE' : 'PENDING',
      sDuration, duroc.breed_id, batch2Animals,
      `Commercial porker feeding and growth roadmap for ${stg.stage_name}`, userId
    ]);

    let seq = 1;
    // Morning Grower Feed (110 kg/day)
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, kpi_max_pct, critical_threshold_pct,
        lot_required, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'Morning Grower Mash (0.92 kg/head)', 1, 1, ?, 'Morning Feed', 'DAILY', ?, ?, 1, ?, 110.0, 110.0, 'TOTAL_BATCH', 'KG', 'KG', 1, 'VALUE', 110.0, 10.0, 25.0, 1, 'Grower morning ration')
    `, [randomUUID(), sId, pFeedGrow.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Evening Grower Feed (110 kg/day)
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, kpi_max_pct, critical_threshold_pct,
        lot_required, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'Evening Grower Mash (0.92 kg/head)', 2, 1, ?, 'Evening Feed', 'DAILY', ?, ?, 1, ?, 110.0, 110.0, 'TOTAL_BATCH', 'KG', 'KG', 1, 'VALUE', 110.0, 10.0, 25.0, 1, 'Grower evening ration')
    `, [randomUUID(), sId, pFeedGrow.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Head Count & Mortality
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Daily Head Count Check', 3, 1, ?, 'Head Count', 'DAILY', ?, ?, 1, ?, 'HEAD', 'HEAD', 1, 'VALUE', ?, 'Daily herd verification')
    `, [randomUUID(), sId, pHeadCount.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration, batch2Animals]);

    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Daily Mortality Count', 4, 1, ?, 'Mortality', 'DAILY', ?, ?, 1, ?, 'HEAD', 'HEAD', 1, 'VALUE', 0, 'Target max mortality <= 0.1%')
    `, [randomUUID(), sId, pMortality.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Body Weight & ADG
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, uom, uom_override, kpi_target_value, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Weekly Average Porker Weight', 5, 1, ?, 'Weight Check', 'WEEKLY', ?, ?, 7, ?, 'KG', 'KG', 45.0, 'Expected target grower weight')
    `, [randomUUID(), sId, pWeight.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, uom, uom_override, kpi_target_value, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Average Daily Gain Target (750 g/day)', 6, 1, ?, 'ADG Target', 'WEEKLY', ?, ?, 7, ?, 'G_PER_DAY', 'G_PER_DAY', 750.0, 'Standard daily growth gain')
    `, [randomUUID(), sId, pAdg.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);
  }

  // Insert Batch Header 2
  await connection.query(`
    INSERT INTO batch_header (
      batch_id, tenant_id, company_id, batch_no, lob_id, nob_id, costing_method, breed_id, scheduler_id,
      stage_id, current_stage_code, shed_id, sub_location_id, start_date, opening_quantity,
      uom, status, remarks, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, 'STANDARD', ?, ?, ?, 'GROWER', ?, ?, ?, ?, 'HEAD', 'ACTIVE', 'Commercial Porkers - Duroc x Landrace F1', ?)
  `, [
    batch2Id, tenant_id, company_id, batch2No, lob_id, nob_id, duroc.breed_id, activeScheduler2Id,
    stages.find(s => s.stage_code === 'GROWER' || s.stage_code === 'CB_GROWER')?.stage_id,
    growShed.shed_id, growPen.location_id, startDateStr, batch2Animals, userId
  ]);

  // Insert 15 Days of Data Entries for Batch 2
  console.log(`  -> Seeding 15 consecutive days of historical transactions for ${batch2No}...`);
  for (let d = 0; d < 15; d++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + d);
    const dateStr = curDate.toISOString().slice(0, 10);
    const dayNo = d + 1;

    // Day 5: 1 Mortality
    if (dayNo === 5) {
      await connection.query(`
        INSERT INTO batch_transaction (
          transaction_id, batch_id, transaction_date, transaction_type,
          quantity, uom, remarks, created_by
        ) VALUES (?, ?, ?, 'MORTALITY', 1, 'HEAD', 'Respiratory distress / Pneumonia - Treated with Tylosin, isolated', ?)
      `, [randomUUID(), batch2Id, dateStr, userId]);
    }

    // Morning Feed
    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        item_id, quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'CONSUMPTION', ?, 110.0, 'KG', 14.00, 1540.00, 'Grower morning feed intake', ?)
    `, [randomUUID(), batch2Id, dateStr, itemMap.get('RAW-MAIZE-CORN')?.item_id, userId]);

    // Evening Feed
    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        item_id, quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'CONSUMPTION', ?, 110.0, 'KG', 14.00, 1540.00, 'Grower evening feed intake', ?)
    `, [randomUUID(), batch2Id, dateStr, itemMap.get('RAW-MAIZE-CORN')?.item_id, userId]);

    // Weight Observation
    if (dayNo === 7 || dayNo === 14) {
      const avgW = dayNo === 7 ? 40.5 : 46.2;
      await connection.query(`
        INSERT INTO batch_transaction (
          transaction_id, batch_id, transaction_date, transaction_type,
          quantity, uom, remarks, created_by
        ) VALUES (?, ?, ?, 'OBSERVATION', ?, 'KG', 'Weekly cohort weight sample check', ?)
      `, [randomUUID(), batch2Id, dateStr, avgW, userId]);
    }

    // Overheads
    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'OVERHEAD', 1, 'DAY', 120.00, 120.00, 'Barn ventilation & power', ?)
    `, [randomUUID(), batch2Id, dateStr, userId]);
  }

  // ============================================
  // BATCH 3: Farrowing / Lactating Pen (10 Sows)
  // ============================================
  const batch3Id = randomUUID();
  const batch3No = 'PIG-FARR-2026-003';
  const batch3Animals = 10;

  console.log(`  -> Creating Batch 3: ${batch3No} (${batch3Animals} Sows + Litters, Stage: LACTATION)...`);

  let activeScheduler3Id = null;

  for (const stg of stages) {
    const sId = randomUUID();
    const isCurrent = stg.stage_code === 'LACTATION';
    if (isCurrent) activeScheduler3Id = sId;

    const sDuration = stg.typical_duration_days || (isCurrent ? 28 : 30);
    const schedCode = `SCHED-${batch3No}-${stg.stage_code}`;

    await connection.query(`
      INSERT INTO scheduler_master (
        scheduler_id, tenant_id, company_id, nob_id, lob_id, batch_id, stage_id, stage_code, stage_name,
        scheduler_code, scheduler_name, scheduler_status, duration_value, duration_unit, breed_id, animal_count,
        auto_generated, is_locked, description, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DAY', ?, ?, 1, 0, ?, 1, ?)
    `, [
      sId, tenant_id, company_id, nob_id, lob_id, batch3Id, stg.stage_id, stg.stage_code, stg.stage_name,
      schedCode, `${stg.stage_name} Scheduler - ${batch3No}`, isCurrent ? 'ACTIVE' : 'PENDING',
      sDuration, landrace.breed_id, batch3Animals,
      `Lactation and suckling piglet management for ${stg.stage_name}`, userId
    ]);

    let seq = 1;
    // Morning Lactation Feed (32.5 kg/day)
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, kpi_max_pct, critical_threshold_pct,
        lot_required, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'High-Protein Lactation Sow Feed', 1, 1, ?, 'Morning Feed', 'DAILY', ?, ?, 1, ?, 32.5, 32.5, 'TOTAL_BATCH', 'KG', 'KG', 1, 'VALUE', 32.5, 10.0, 25.0, 1, 'Morning high lactation ration')
    `, [randomUUID(), sId, pFeedLact.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Evening Lactation Feed (32.5 kg/day)
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, kpi_max_pct, critical_threshold_pct,
        lot_required, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'Evening Lactation Sow Feed', 2, 1, ?, 'Evening Feed', 'DAILY', ?, ?, 1, ?, 32.5, 32.5, 'TOTAL_BATCH', 'KG', 'KG', 1, 'VALUE', 32.5, 10.0, 25.0, 1, 'Evening high lactation ration')
    `, [randomUUID(), sId, pFeedLact.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Day 3 Iron Injection
    const ironSplId = randomUUID();
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, standard_qty, expected_qty_override,
        qty_basis, uom, uom_override, lot_required, notes
      ) VALUES (?, ?, ?, ?, 'CONSUMPTION', 'Piglet Iron Dextran 200mg Injection (Day 3)', 3, 3, 3, 'Day 3 Iron Injection', 'CUSTOM', ?, ?, 3, 3, 115.0, 115.0, 'TOTAL_BATCH', 'DOSES', 'DOSES', 1, 'Prevents piglet nutritional anemia')
    `, [ironSplId, sId, pIron.parameter_id, seq++, stg.stage_id, stg.stage_code]);
    await connection.query(`INSERT INTO scheduler_line_custom_days (custom_day_id, spl_id, day_number, day_label) VALUES (?, ?, 3, 'Day 3 Iron Dextran')`, [randomUUID(), ironSplId]);

    // Head Count & Mortality
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, uom, uom_override, kpi_enabled, kpi_mode, kpi_target_value, notes
      ) VALUES (?, ?, ?, ?, 'DESCRIPTIVE', 'Sow & Litter Head Count Verification', 4, 1, ?, 'Head Count', 'DAILY', ?, ?, 1, ?, 'HEAD', 'HEAD', 1, 'VALUE', 10.0, 'Daily crate verification')
    `, [randomUUID(), sId, pHeadCount.parameter_id, seq++, sDuration, stg.stage_id, stg.stage_code, sDuration]);

    // Weaning Transfer Trigger
    await connection.query(`
      INSERT INTO scheduler_parameter_line (
        spl_id, scheduler_id, parameter_id, line_seq, line_type, parameter_name, period_no, period_from, period_to,
        period_label, occurrence, stage_id, stage_code, start_day, end_day, transfer_qty_basis, capture_transfer_weight, auto_triggers_stage, notes
      ) VALUES (?, ?, ?, ?, 'TRANSFER', 'Transfer Weaned Piglets to Nursery Batch', 5, 28, 28, 'Weaning Day Transfer', 'ONCE', ?, ?, 28, 28, 'HEAD_COUNT', 1, 1, 'Auto-triggers weaning batch creation')
    `, [randomUUID(), sId, pTransWean.parameter_id, seq++, stg.stage_id, stg.stage_code]);
  }

  // Insert Batch Header 3
  await connection.query(`
    INSERT INTO batch_header (
      batch_id, tenant_id, company_id, batch_no, lob_id, nob_id, costing_method, breed_id, scheduler_id,
      stage_id, current_stage_code, shed_id, sub_location_id, start_date, opening_quantity,
      uom, status, remarks, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, 'BIO_ASSET', ?, ?, ?, 'LACTATION', ?, ?, ?, ?, 'HEAD', 'ACTIVE', 'Lactating Sows with Suckling Litters', ?)
  `, [
    batch3Id, tenant_id, company_id, batch3No, lob_id, nob_id, landrace.breed_id, activeScheduler3Id,
    stages.find(s => s.stage_code === 'LACTATION')?.stage_id,
    farrShed.shed_id, farrPen.location_id, startDateStr, batch3Animals, userId
  ]);

  // Insert 15 Days of Data Entries for Batch 3
  console.log(`  -> Seeding 15 consecutive days of historical transactions for ${batch3No}...`);
  for (let d = 0; d < 15; d++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + d);
    const dateStr = curDate.toISOString().slice(0, 10);
    const dayNo = d + 1;

    // Morning & Evening Feed
    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        item_id, quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'CONSUMPTION', ?, 32.5, 'KG', 16.00, 520.00, 'Lactation morning ration', ?)
    `, [randomUUID(), batch3Id, dateStr, itemMap.get('FEED-GEST-SOW')?.item_id, userId]);

    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        item_id, quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'CONSUMPTION', ?, 32.5, 'KG', 16.00, 520.00, 'Lactation evening ration', ?)
    `, [randomUUID(), batch3Id, dateStr, itemMap.get('FEED-GEST-SOW')?.item_id, userId]);

    // Day 3: Piglet Iron Dextran
    if (dayNo === 3) {
      await connection.query(`
        INSERT INTO batch_transaction (
          transaction_id, batch_id, transaction_date, transaction_type,
          item_id, quantity, uom, rate, amount, remarks, created_by
        ) VALUES (?, ?, ?, 'CONSUMPTION', ?, 115.0, 'DOSES', 4.50, 517.50, 'Day 3 Iron Injection for all piglets', ?)
      `, [randomUUID(), batch3Id, dateStr, itemMap.get('MED-IVERMECTIN')?.item_id, userId]);
    }

    // Overheads
    await connection.query(`
      INSERT INTO batch_transaction (
        transaction_id, batch_id, transaction_date, transaction_type,
        quantity, uom, rate, amount, remarks, created_by
      ) VALUES (?, ?, ?, 'OVERHEAD', 1, 'DAY', 90.00, 90.00, 'Heat lamps & barn ventilation', ?)
    `, [randomUUID(), batch3Id, dateStr, userId]);
  }

  // ── Seed Registered Animals in animal_register for Batches ──
  console.log(`\n  -> Seeding individual animal registers linked to batches...`);

  const sowItem = itemMap.get('FEED-GEST-SOW') || Array.from(itemMap.values())[0];

  // 1. Batch 1 Sows (35 Head)
  for (let i = 1; i <= 35; i++) {
    const numStr = String(i).padStart(3, '0');
    const anmId = randomUUID();
    await connection.query(`
      INSERT INTO animal_register (
        animal_id, tenant_id, company_id, nob_id, lob_id, animal_code, animal_type, breed_id,
        gender, dob, entry_type, entry_date, item_id, rfid_tag, ear_tag, acquisition_cost,
        total_opening_asset_value, current_bio_asset_value, current_stage_id, current_batch_id,
        parity_count, total_piglets_born_live, total_piglets_weaned, status, notes, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'SOW', ?, 'F', '2024-03-15', 'PURCHASED_LOCAL', ?, ?, ?, ?, 45000.00, 45000.00, 45000.00, ?, ?, 2, 22, 21, ?, 'Registered breeding sow', 1, ?)
    `, [
      anmId, tenant_id, company_id, nob_id, lob_id, `SOW-${numStr}`, landrace.breed_id,
      startDateStr, sowItem.item_id, `982000412880${numStr}`, `ET-SOW-${numStr}`,
      stages.find(s => s.stage_code === 'DRY_SOW_GESTATION')?.stage_id, batch1Id,
      i === 8 ? 'UNDER_OBSERVATION' : 'PREGNANT', userId
    ]);
  }
  console.log(`     ✓ 35 Registered Sows assigned to ${batch1No}`);

  // 2. Batch 2 Grower Porkers (120 Head)
  for (let i = 1; i <= 120; i++) {
    const numStr = String(i).padStart(3, '0');
    const anmId = randomUUID();
    await connection.query(`
      INSERT INTO animal_register (
        animal_id, tenant_id, company_id, nob_id, lob_id, animal_code, animal_type, breed_id,
        gender, dob, entry_type, entry_date, item_id, rfid_tag, ear_tag, acquisition_cost,
        total_opening_asset_value, current_bio_asset_value, current_stage_id, current_batch_id,
        parity_count, status, notes, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'PORKER', ?, ?, '2026-04-10', 'BORN_ON_FARM', ?, ?, ?, ?, 8500.00, 8500.00, 8500.00, ?, ?, 0, 'ACTIVE', 'Grower porker cohort', 1, ?)
    `, [
      anmId, tenant_id, company_id, nob_id, lob_id, `GROW-${numStr}`, duroc.breed_id,
      i % 2 === 0 ? 'M' : 'F', startDateStr, sowItem.item_id, `982000412890${numStr}`, `ET-GROW-${numStr}`,
      stages.find(s => s.stage_code === 'GROWER')?.stage_id, batch2Id, userId
    ]);
  }
  console.log(`     ✓ 120 Registered Grower Porkers assigned to ${batch2No}`);

  // 3. Batch 3 Lactating Sows (10 Head)
  for (let i = 1; i <= 10; i++) {
    const numStr = String(i).padStart(3, '0');
    const anmId = randomUUID();
    await connection.query(`
      INSERT INTO animal_register (
        animal_id, tenant_id, company_id, nob_id, lob_id, animal_code, animal_type, breed_id,
        gender, dob, entry_type, entry_date, item_id, rfid_tag, ear_tag, acquisition_cost,
        total_opening_asset_value, current_bio_asset_value, current_stage_id, current_batch_id,
        parity_count, total_piglets_born_live, total_piglets_weaned, status, notes, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'SOW', ?, 'F', '2023-11-20', 'PURCHASED_LOCAL', ?, ?, ?, ?, 48000.00, 48000.00, 48000.00, ?, ?, 3, 34, 32, 'LACTATING', 'Lactating sow with litter', 1, ?)
    `, [
      anmId, tenant_id, company_id, nob_id, lob_id, `FARR-${numStr}`, landrace.breed_id,
      startDateStr, sowItem.item_id, `982000412900${numStr}`, `ET-FARR-${numStr}`,
      stages.find(s => s.stage_code === 'LACTATION')?.stage_id, batch3Id, userId
    ]);
  }
  console.log(`     ✓ 10 Registered Lactating Sows assigned to ${batch3No}`);

  // 4. Unassigned animals in the farm available for batch assignment (15 Head)
  for (let i = 1; i <= 15; i++) {
    const numStr = String(i).padStart(3, '0');
    const anmId = randomUUID();
    await connection.query(`
      INSERT INTO animal_register (
        animal_id, tenant_id, company_id, nob_id, lob_id, animal_code, animal_type, breed_id,
        gender, dob, entry_type, entry_date, item_id, rfid_tag, ear_tag, acquisition_cost,
        total_opening_asset_value, current_bio_asset_value, current_stage_id, current_batch_id,
        parity_count, status, notes, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'GILT', ?, 'F', '2025-10-10', 'BORN_ON_FARM', ?, ?, ?, ?, 38000.00, 38000.00, 38000.00, NULL, NULL, 0, 'ACTIVE', 'Unassigned replacement gilt', 1, ?)
    `, [
      anmId, tenant_id, company_id, nob_id, lob_id, `GLT-FREE-${numStr}`, landrace.breed_id,
      startDateStr, sowItem.item_id, `982000412999${numStr}`, `ET-FREE-${numStr}`, userId
    ]);
  }
  console.log(`     ✓ 15 Unassigned Replacement Gilts seeded for Assignment workflows`);

  await connection.end();
  console.log(`\n======================================================`);
  console.log(`✓ All 3 Piggery Batches, Multi-Stage Schedulers, and 15 Days of Data Entries Successfully Seeded!`);
  console.log(`======================================================\n`);
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
