import { randomUUID } from 'node:crypto';
import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import * as schema from '../core/database/schema';

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';
const isPiggeryIsolated = masterDatabase.startsWith('piggery_');
const tenantCode = process.env.DEV_TENANT_CODE || 'devco';
const dbName = isPiggeryIsolated ? `piggery_tenant_${tenantCode}` : `tenant_${tenantCode}`;

export async function seedNewSchedulersAndBatches() {
  console.log(`\n======================================================`);
  console.log(`Seeding Comprehensive Piggery Schedulers & Batches into ${dbName}...`);
  console.log(`======================================================\n`);

  const pool = mysql.createPool({ host, port, user, password, database: dbName });
  const db = drizzle(pool, { schema, mode: 'default' });

  try {
    // 1. Context
    const [company] = await db.select().from(schema.companyMaster).limit(1);
    if (!company) throw new Error(`Company not found in ${dbName}`);
    const tenantId = company.tenant_id;
    const companyId = company.company_id;

    const [userRow] = await db.select().from(schema.userMaster).where(eq(schema.userMaster.user_type, 'COMPANY_ADMIN')).limit(1);
    const userId = userRow?.user_id || '00000000-0000-0000-0000-000000000000';

    const [nob] = await db.select().from(schema.nobMaster).where(eq(schema.nobMaster.nob_code, 'LIVESTOCK')).limit(1);
    const [lob] = await db.select().from(schema.lobMaster).where(eq(schema.lobMaster.lob_code, 'LVS_PIGGERY')).limit(1);
    if (!nob || !lob) throw new Error('NOB or LOB not found');

    const nobId = nob.nob_id;
    const lobId = lob.lob_id;

    // 2. Fetch Breeds, Stages, Items, Sheds, Pens
    const breeds = await db.select().from(schema.breedMaster);
    const yorkshire = breeds.find((b) => b.breed_code === 'YORKSHIRE') || breeds[0];
    const duroc = breeds.find((b) => b.breed_code === 'DUROC') || breeds[0];
    const largeWhite = breeds.find((b) => b.breed_code === 'LARGE_WHITE') || breeds[0];

    const stages = await db.select().from(schema.stageMaster);
    const stageByCode = new Map(stages.map((s) => [s.stage_code, s]));

    const items = await db.select().from(schema.itemMaster).where(eq(schema.itemMaster.company_id, companyId));
    const itemMap = new Map(items.map((i) => [i.item_code, i.item_id]));

    const sheds = await db.select().from(schema.shedMaster).where(eq(schema.shedMaster.company_id, companyId));
    const shedMap = new Map(sheds.map((s) => [s.shed_code, s.shed_id]));
    const defaultShedId = sheds[0]?.shed_id;

    const pens = await db.select().from(schema.locationMaster).where(eq(schema.locationMaster.company_id, companyId));
    const penMap = new Map(pens.map((p) => [p.location_code, p.location_id]));
    const defaultPenId = pens[0]?.location_id;

    // 3. Ensure Parameters Exist
    console.log('1. Checking and creating rich parameters...');
    const richParams = [
      { code: 'PARAM-FEED-CREEP', name: 'Creep Pre-Starter Feed Intake', type: 'CONSUMPTION', itemCode: 'FEED-CREEP-PRE', uom: 'KG', method: 'PER_UNIT', defaultQty: '0.45000000' },
      { code: 'PARAM-FEED-GROW', name: 'Weaner-Grower Mash Consumption', type: 'CONSUMPTION', itemCode: 'FEED-WEAN-GROW', uom: 'KG', method: 'PER_UNIT', defaultQty: '1.85000000' },
      { code: 'PARAM-FEED-FIN', name: 'Porker Finisher Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-FINISHER', uom: 'KG', method: 'PER_UNIT', defaultQty: '2.85000000' },
      { code: 'PARAM-FEED-GEST', name: 'Gestation Sow Feed Intake', type: 'CONSUMPTION', itemCode: 'FEED-GEST-SOW', uom: 'KG', method: 'PER_UNIT', defaultQty: '2.20000000' },
      { code: 'PARAM-FEED-LACT', name: 'Lactation Sow Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-LACT-SOW', uom: 'KG', method: 'PER_UNIT', defaultQty: '6.50000000' },
      { code: 'PARAM-MED-IRON', name: 'Iron Dextran 200mg Injection', type: 'CONSUMPTION', itemCode: 'MED-IRON-DEX', uom: 'ML', method: 'PER_UNIT', defaultQty: '2.00000000' },
      { code: 'PARAM-VAC-PCV2', name: 'PCV2 Swine Single Dose Vaccine', type: 'CONSUMPTION', itemCode: 'VAC-PCV2-SWINE', uom: 'DOSES', method: 'PER_UNIT', defaultQty: '1.00000000' },
      { code: 'PARAM-MED-IVER', name: 'Ivermectin 1% Swine Dewormer', type: 'CONSUMPTION', itemCode: 'MED-IVER-PIG', uom: 'ML', method: 'PER_UNIT', defaultQty: '1.50000000' },
      { code: 'PARAM-BODYWT-PIG', name: 'Average Body Weight Standard', type: 'OBSERVATION', itemCode: null, uom: 'KG', method: 'MANUAL_AT_ENTRY', defaultQty: null },
      { code: 'PARAM-ADG-PIG', name: 'Average Daily Gain (ADG)', type: 'OBSERVATION', itemCode: null, uom: 'G_PER_DAY', method: 'MANUAL_AT_ENTRY', defaultQty: '750.00000000' },
      { code: 'PARAM-SCAN-PREG', name: 'Ultrasound Pregnancy Checkpoint', type: 'OBSERVATION', itemCode: null, uom: 'SCAN', method: 'MANUAL_AT_ENTRY', defaultQty: null },
      { code: 'PARAM-MORT-PIG', name: 'Swine Mortality & Cull Count', type: 'MORTALITY', itemCode: null, uom: 'HEAD', method: 'MANUAL_AT_ENTRY', defaultQty: '0.00000000' },
      { code: 'PARAM-PORK-OUTPUT', name: 'Dressed Pork Carcass Harvest Yield', type: 'OUTPUT', itemCode: 'LVS-DRESSED-PORK', uom: 'KG', method: 'PER_UNIT', defaultQty: '86.50000000' },
      { code: 'PARAM-PIGLET-OUTPUT', name: 'Live Born Weaner Piglets', type: 'OUTPUT', itemCode: 'LVS-WEANER-DUROC', uom: 'HEAD', method: 'PER_UNIT', defaultQty: '12.00000000' },
      { code: 'PARAM-OVH-ELEC', name: 'Barn Electricity & Lighting', type: 'OVERHEAD', itemCode: null, uom: 'UNITS', method: 'MANUAL_AT_ENTRY', defaultQty: '1.00000000' },
      { code: 'PARAM-OVH-LABOUR', name: 'Stockman Daily Labour Attendance', type: 'OVERHEAD', itemCode: null, uom: 'HOURS', method: 'MANUAL_AT_ENTRY', defaultQty: '4.00000000' },
    ];

    const parameterMap = new Map<string, string>();
    for (const p of richParams) {
      let [existingParam] = await db
        .select()
        .from(schema.parameterMaster)
        .where(and(eq(schema.parameterMaster.company_id, companyId), eq(schema.parameterMaster.parameter_code, p.code)))
        .limit(1);

      let pId = existingParam?.parameter_id;
      if (!existingParam) {
        pId = randomUUID();
        await db.insert(schema.parameterMaster).values({
          parameter_id: pId,
          tenant_id: tenantId,
          company_id: companyId,
          nob_id: nobId,
          lob_id: lobId,
          parameter_code: p.code,
          parameter_name: p.name,
          parameter_type: p.type as any,
          item_id: p.itemCode ? itemMap.get(p.itemCode) || null : null,
          default_uom: p.uom,
          qty_method: p.method as any,
          default_qty_per_unit: p.defaultQty,
          is_mandatory: true,
          is_active: true,
          created_by: userId,
        });
      }
      parameterMap.set(p.code, pId!);
    }

    // 4. Create Schedulers
    console.log('2. Creating Comprehensive Production Schedulers...');
    const schedulers = [
      {
        code: 'SCHED-PIG-FULL-CYCLE-150',
        name: '150-Day Complete Porker Production Lifecycle',
        durationValue: 150,
        durationUnit: 'DAY',
        breed: duroc,
        desc: 'Complete commercial porker cycle from Nursery (Day 1-42) to Grower (Day 43-90) to Finisher & Slaughter (Day 91-150)',
        lines: [
          // Nursery Phase (Day 1 - 42)
          { paramCode: 'PARAM-FEED-CREEP', periodNo: 1, from: 1, to: 21, label: 'Nursery Pre-Starter', occ: 'DAILY', qty: '0.45000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '0.4500' },
          { paramCode: 'PARAM-FEED-CREEP', periodNo: 2, from: 22, to: 42, label: 'Nursery Starter', occ: 'DAILY', qty: '0.90000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '0.9000' },
          { paramCode: 'PARAM-MED-IRON', periodNo: 3, from: 3, to: 3, label: 'Day 3 Iron Injection', occ: 'MILESTONE', qty: '2.00000000', uom: 'ML', kpi: false, minPct: null, maxPct: null, target: '2.0000' },
          { paramCode: 'PARAM-VAC-PCV2', periodNo: 4, from: 21, to: 21, label: 'Day 21 PCV2 Vaccine', occ: 'MILESTONE', qty: '1.00000000', uom: 'DOSES', kpi: false, minPct: null, maxPct: null, target: '1.0000' },
          { paramCode: 'PARAM-BODYWT-PIG', periodNo: 5, from: 42, to: 42, label: 'Nursery Exit (25kg)', occ: 'MILESTONE', qty: '25.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '25.0000' },

          // Grower Phase (Day 43 - 90)
          { paramCode: 'PARAM-FEED-GROW', periodNo: 6, from: 43, to: 70, label: 'Early Grower Mash', occ: 'DAILY', qty: '1.85000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '1.8500' },
          { paramCode: 'PARAM-FEED-GROW', periodNo: 7, from: 71, to: 90, label: 'Late Grower Mash', occ: 'DAILY', qty: '2.30000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.3000' },
          { paramCode: 'PARAM-MED-IVER', periodNo: 8, from: 60, to: 60, label: 'Day 60 Deworming (18d)', occ: 'MILESTONE', qty: '1.50000000', uom: 'ML', kpi: false, minPct: null, maxPct: null, target: '1.5000' },
          { paramCode: 'PARAM-BODYWT-PIG', periodNo: 9, from: 90, to: 90, label: 'Grower Exit (65kg)', occ: 'MILESTONE', qty: '65.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '65.0000' },

          // Finisher Phase (Day 91 - 150)
          { paramCode: 'PARAM-FEED-FIN', periodNo: 10, from: 91, to: 125, label: 'Finisher Phase 1', occ: 'DAILY', qty: '2.85000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.8500' },
          { paramCode: 'PARAM-FEED-FIN', periodNo: 11, from: 126, to: 150, label: 'Market Final Finisher', occ: 'DAILY', qty: '3.35000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '3.3500' },
          { paramCode: 'PARAM-BODYWT-PIG', periodNo: 12, from: 150, to: 150, label: 'Slaughter Target (115kg)', occ: 'MILESTONE', qty: '115.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '115.0000' },
          { paramCode: 'PARAM-PORK-OUTPUT', periodNo: 13, from: 150, to: 150, label: 'Carcass Harvest Yield', occ: 'MILESTONE', qty: '86.50000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '86.5000' },
          { paramCode: 'PARAM-MORT-PIG', periodNo: 14, from: 1, to: 150, label: 'Daily Mortality Limit', occ: 'DAILY', qty: '0.00000000', uom: 'HEAD', kpi: true, minPct: null, maxPct: '1.00', target: '0.0000' },
          { paramCode: 'PARAM-OVH-ELEC', periodNo: 15, from: 1, to: 150, label: 'Barn Power & Lights', occ: 'DAILY', qty: '1.00000000', uom: 'UNITS', kpi: false, minPct: null, maxPct: null, target: '1.0000' },
        ],
      },
      {
        code: 'SCHED-PIG-SOW-CYCLE-147',
        name: '147-Day Sow Breeding & Farrowing Lifecycle',
        durationValue: 147,
        durationUnit: 'DAY',
        breed: yorkshire,
        desc: 'Standard 147-day sow reproductive cycle: Flush/Service (D1-7), Gestation (D8-114), Farrowing & Lactation (D115-142), Weaning (D143-147)',
        lines: [
          // Flush & Service (Day 1 - 7)
          { paramCode: 'PARAM-FEED-GEST', periodNo: 1, from: 1, to: 7, label: 'Pre-Mating Flush Feed', occ: 'DAILY', qty: '3.00000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '3.0000' },

          // Gestation (Day 8 - 114)
          { paramCode: 'PARAM-FEED-GEST', periodNo: 2, from: 8, to: 85, label: 'Early/Mid Gestation Ration', occ: 'DAILY', qty: '2.20000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.2000' },
          { paramCode: 'PARAM-FEED-GEST', periodNo: 3, from: 86, to: 110, label: 'Late Gestation Bump', occ: 'DAILY', qty: '2.80000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.8000' },
          { paramCode: 'PARAM-SCAN-PREG', periodNo: 4, from: 21, to: 21, label: 'Day 21 Scan Check', occ: 'MILESTONE', qty: '1.00000000', uom: 'SCAN', kpi: false, minPct: null, maxPct: null, target: '1.0000' },
          { paramCode: 'PARAM-SCAN-PREG', periodNo: 5, from: 45, to: 45, label: 'Day 45 Scan Check', occ: 'MILESTONE', qty: '1.00000000', uom: 'SCAN', kpi: false, minPct: null, maxPct: null, target: '1.0000' },
          { paramCode: 'PARAM-SCAN-PREG', periodNo: 6, from: 60, to: 60, label: 'Day 60 Scan Check', occ: 'MILESTONE', qty: '1.00000000', uom: 'SCAN', kpi: false, minPct: null, maxPct: null, target: '1.0000' },

          // Farrowing & Lactation (Day 115 - 142)
          { paramCode: 'PARAM-FEED-LACT', periodNo: 7, from: 115, to: 142, label: 'Lactation Sow Diet', occ: 'DAILY', qty: '6.50000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '6.5000' },
          { paramCode: 'PARAM-FEED-CREEP', periodNo: 8, from: 122, to: 142, label: 'Piglet Creep Starter', occ: 'DAILY', qty: '0.35000000', uom: 'KG', kpi: true, minPct: '15.00', maxPct: '15.00', target: '0.3500' },
          { paramCode: 'PARAM-PIGLET-OUTPUT', periodNo: 9, from: 116, to: 116, label: 'Piglet Output (Live)', occ: 'MILESTONE', qty: '12.50000000', uom: 'HEAD', kpi: true, minPct: '10.00', maxPct: '10.00', target: '12.5000' },

          // General Overheads & Mortality
          { paramCode: 'PARAM-MORT-PIG', periodNo: 10, from: 1, to: 147, label: 'Breeding Sow Mortality', occ: 'DAILY', qty: '0.00000000', uom: 'HEAD', kpi: true, minPct: null, maxPct: '0.50', target: '0.0000' },
          { paramCode: 'PARAM-OVH-LABOUR', periodNo: 11, from: 1, to: 147, label: 'Daily Stockman Care', occ: 'DAILY', qty: '4.00000000', uom: 'HOURS', kpi: false, minPct: null, maxPct: null, target: '4.0000' },
        ],
      },
    ];

    const schedulerMap = new Map<string, string>();
    for (const s of schedulers) {
      let [existingSched] = await db
        .select()
        .from(schema.schedulerMaster)
        .where(and(eq(schema.schedulerMaster.company_id, companyId), eq(schema.schedulerMaster.scheduler_code, s.code)))
        .limit(1);

      let sId = existingSched?.scheduler_id;
      if (existingSched) {
        // Clear existing lines to ensure fresh update
        await db.delete(schema.schedulerParameterLine).where(eq(schema.schedulerParameterLine.scheduler_id, sId!));
      } else {
        sId = randomUUID();
        await db.insert(schema.schedulerMaster).values({
          scheduler_id: sId,
          tenant_id: tenantId,
          company_id: companyId,
          nob_id: nobId,
          lob_id: lobId,
          scheduler_code: s.code,
          scheduler_name: s.name,
          duration_value: s.durationValue,
          duration_unit: s.durationUnit as any,
          breed_id: s.breed?.breed_id,
          is_locked: true,
          batch_start_from: 'Start Date',
          description: s.desc,
          is_active: true,
          created_by: userId,
        });
      }

      for (const line of s.lines) {
        const paramId = parameterMap.get(line.paramCode);
        if (paramId) {
          await db.insert(schema.schedulerParameterLine).values({
            spl_id: randomUUID(),
            scheduler_id: sId!,
            parameter_id: paramId,
            period_no: line.periodNo,
            period_from: line.from,
            period_to: line.to,
            period_label: line.label,
            occurrence: line.occ as any,
            expected_qty_override: line.qty,
            uom_override: line.uom,
            kpi_enabled: line.kpi,
            kpi_mode: 'PCT',
            kpi_min_pct: line.minPct,
            kpi_max_pct: line.maxPct,
            kpi_target_value: line.target,
            notify_in_app: true,
            notify_push: false,
            notify_email: false,
          });
        }
      }
      schedulerMap.set(s.code, sId!);
    }

    // 5. Seed New Batches with Rich Lifecycle Stages
    console.log('3. Seeding New Batches with Stage Conversion Support...');
    const now = new Date();
    const dMinus44 = new Date(now.getTime() - 44 * 86400000).toISOString().slice(0, 10);
    const dPlus70 = new Date(now.getTime() + 70 * 86400000).toISOString().slice(0, 10);
    const dMinus27 = new Date(now.getTime() - 27 * 86400000).toISOString().slice(0, 10);
    const dPlus123 = new Date(now.getTime() + 123 * 86400000).toISOString().slice(0, 10);

    const newBatches = [
      {
        no: 'PIG-BAT-2026-0005',
        breed: yorkshire,
        costing: 'BIO_ASSET',
        stage: 'DRY_SOW_GESTATION',
        shedCode: 'SHED-GEST-01',
        penCode: 'PEN-GEST-01',
        start: dMinus44, // Today is Day 45 -> Ultrasound pregnancy checkpoint due!
        end: dPlus70,
        qty: '30.0000',
        status: 'ACTIVE',
        schedulerCode: 'SCHED-PIG-SOW-CYCLE-147',
        remarks: 'Yorkshire Grand Sow Breeding Cohort 2026 (Day 45 Pregnancy Checkpoint Due)',
        bioStage: 'MATURE',
        initialBioCost: '1350000.0000', // Rs 45,000 / sow x 30
        accumAmort: '56250.0000',
        nbv: '1293750.0000',
        monthlyAmort: '56250.0000',
      },
      {
        no: 'PIG-BAT-2026-0006',
        breed: duroc,
        costing: 'STANDARD',
        stage: 'NURSERY',
        shedCode: 'SHED-GROW-03',
        penCode: 'PEN-GROW-01',
        start: dMinus27, // Today is Day 28 of Nursery -> Ready for stage transition to GROWER!
        end: dPlus123,
        qty: '120.0000',
        status: 'ACTIVE',
        schedulerCode: 'SCHED-PIG-FULL-CYCLE-150',
        remarks: 'Duroc Commercial Porker Batch 201 (Nursery Phase — Convertible to Grower)',
        bioStage: null,
      },
    ];

    for (const b of newBatches) {
      let [existingBatch] = await db
        .select()
        .from(schema.batchHeader)
        .where(and(eq(schema.batchHeader.company_id, companyId), eq(schema.batchHeader.batch_no, b.no)))
        .limit(1);

      let batId = existingBatch?.batch_id;
      const stage = stageByCode.get(b.stage);
      const schedId = schedulerMap.get(b.schedulerCode);

      if (!existingBatch) {
        batId = randomUUID();
        await db.insert(schema.batchHeader).values({
          batch_id: batId,
          tenant_id: tenantId,
          company_id: companyId,
          nob_id: nobId,
          lob_id: lobId,
          batch_no: b.no,
          breed_id: b.breed.breed_id,
          scheduler_id: schedId || null,
          costing_method: b.costing as any,
          current_stage_code: b.stage,
          stage_id: stage?.stage_id,
          shed_id: shedMap.get(b.shedCode) || defaultShedId!,
          location_id: penMap.get(b.penCode) || defaultPenId!,
          start_date: b.start,
          expected_end_date: b.end,
          opening_quantity: b.qty,
          closing_quantity: b.qty,
          uom: 'HEAD',
          status: b.status as any,
          remarks: b.remarks,
          created_by: userId,
        });

        // Bio Asset State if applicable
        if (b.costing === 'BIO_ASSET') {
          await db.insert(schema.batchBioAssetState).values({
            state_id: randomUUID(),
            batch_id: batId,
            tenant_id: tenantId,
            company_id: companyId,
            bio_asset_stage: b.bioStage as any,
            is_nca_accounted: true,
            nca_capitalised_at: b.start,
            nca_book_value: b.nbv,
            initial_cost: b.initialBioCost,
            accumulated_amortization: b.accumAmort,
            monthly_amort_amount: b.monthlyAmort,
            useful_life_months: 24,
            remaining_months: 23,
            current_quantity: b.qty,
            uom: 'HEAD',
          });
        }

        // Add Stage Progression Logs
        if (b.no === 'PIG-BAT-2026-0005') {
          await db.insert(schema.batchStageLog).values([
            {
              log_id: randomUUID(),
              batch_id: batId,
              tenant_id: tenantId,
              from_stage_code: 'FLUSH_SERVICE',
              to_stage_code: 'DRY_SOW_GESTATION',
              from_stage_id: stageByCode.get('FLUSH_SERVICE')?.stage_id,
              to_stage_id: stage?.stage_id,
              transition_date: dMinus44,
              head_count: '30.0000',
              remarks: 'AI Conception confirmed — Transferred to Gestation Barn 01',
              created_by: userId,
            },
          ]);
        }

        // Add Realistic Seed Transactions for Past Days
        console.log(`   - Adding realistic historical transactions for ${b.no}...`);
        const todayStr = now.toISOString().slice(0, 10);

        if (b.no === 'PIG-BAT-2026-0005') {
          // Sow feed transactions
          await db.insert(schema.batchTransaction).values([
            {
              transaction_id: randomUUID(),
              batch_id: batId,
              tenant_id: tenantId,
              company_id: companyId,
              transaction_date: todayStr,
              transaction_type: 'CONSUMPTION',
              item_id: itemMap.get('FEED-GEST-SOW'),
              quantity: '66.0000', // 2.2 kg x 30 sows
              uom: 'KG',
              rate: '11.500000',
              amount: '759.0000',
              remarks: 'Daily Ration: Sow Gestation Pellets (Lot LOT-202608-01)',
              created_by: userId,
            },
            {
              transaction_id: randomUUID(),
              batch_id: batId,
              tenant_id: tenantId,
              company_id: companyId,
              transaction_date: todayStr,
              transaction_type: 'OBSERVATION',
              quantity: '182.5000',
              uom: 'KG',
              remarks: 'Avg Body Weight: 182.50 kg | BCS: 3.25 | Headcount: 30',
              created_by: userId,
            },
            {
              transaction_id: randomUUID(),
              batch_id: batId,
              tenant_id: tenantId,
              company_id: companyId,
              transaction_date: todayStr,
              transaction_type: 'OVERHEAD',
              quantity: '1.0000',
              uom: 'UNITS',
              rate: '85.000000',
              amount: '85.0000',
              remarks: 'Barn Electricity & Ventilation',
              created_by: userId,
            },
          ]);
        } else if (b.no === 'PIG-BAT-2026-0006') {
          // Nursery porker feed transactions
          await db.insert(schema.batchTransaction).values([
            {
              transaction_id: randomUUID(),
              batch_id: batId,
              tenant_id: tenantId,
              company_id: companyId,
              transaction_date: todayStr,
              transaction_type: 'CONSUMPTION',
              item_id: itemMap.get('FEED-CREEP-PRE'),
              quantity: '108.0000', // 0.9 kg x 120 head
              uom: 'KG',
              rate: '18.500000',
              amount: '1998.0000',
              remarks: 'Daily Feed: Nursery Starter Crumble (Lot LOT-202608-03)',
              created_by: userId,
            },
            {
              transaction_id: randomUUID(),
              batch_id: batId,
              tenant_id: tenantId,
              company_id: companyId,
              transaction_date: todayStr,
              transaction_type: 'CONSUMPTION',
              item_id: itemMap.get('VAC-PCV2-SWINE'),
              quantity: '120.0000',
              uom: 'DOSES',
              rate: '45.000000',
              amount: '5400.0000',
              remarks: 'Lot: MEDLOT-202608-01 - Day 21 PCV2 Vaccine protocol completed',
              created_by: userId,
            },
            {
              transaction_id: randomUUID(),
              batch_id: batId,
              tenant_id: tenantId,
              company_id: companyId,
              transaction_date: todayStr,
              transaction_type: 'OBSERVATION',
              quantity: '18.4000',
              uom: 'KG',
              remarks: 'Avg Body Weight: 18.40 kg | ADG: 450 g/d | Headcount: 120',
              created_by: userId,
            },
          ]);
        }
      }
    }

    console.log('\n✅ Successfully seeded comprehensive Piggery schedulers and active batches!');
  } catch (err) {
    console.error('❌ Error seeding piggery schedulers and batches:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

// Run directly
seedNewSchedulersAndBatches()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
