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

export async function seedPiggeryData() {
  console.log(`Starting comprehensive piggery multi-company master & operational data seed into ${dbName}...`);
  const pool = mysql.createPool({ host, port, user, password, database: dbName });
  const db = drizzle(pool, { schema, mode: 'default' });

  try {
    // 1. Get Tenant & Company Contexts
    const companies = await db.select().from(schema.companyMaster);
    if (companies.length === 0) {
      throw new Error(`No companies found in ${dbName}. Run db-seed-dev-tenant first.`);
    }

    const company1 = companies.find((c) => c.company_code === 'APEXBREED') || companies[0];
    const company2 = companies.find((c) => c.company_code === 'HIGHLAND') || companies[1] || companies[0];
    const tenantId = company1.tenant_id;

    // Users
    const [tAdmin] = await db.select().from(schema.userMaster).where(eq(schema.userMaster.email, 'admin@apexagri.local')).limit(1);
    const [c1Admin] = await db.select().from(schema.userMaster).where(eq(schema.userMaster.email, 'arjun.sharma@apexagri.local')).limit(1);
    const [c2Admin] = await db.select().from(schema.userMaster).where(eq(schema.userMaster.email, 'vikram.singh@highlandpork.local')).limit(1);

    const tAdminId = tAdmin?.user_id || '00000000-0000-0000-0000-000000000000';
    const c1AdminId = c1Admin?.user_id || tAdminId;
    const c2AdminId = c2Admin?.user_id || tAdminId;

    const [nob] = await db.select().from(schema.nobMaster).where(eq(schema.nobMaster.nob_code, 'LIVESTOCK')).limit(1);
    const [lob] = await db.select().from(schema.lobMaster).where(eq(schema.lobMaster.lob_code, 'LVS_PIGGERY')).limit(1);
    if (!nob || !lob) {
      throw new Error('NOB LIVESTOCK or LOB LVS_PIGGERY not found.');
    }
    const nobId = nob.nob_id;
    const lobId = lob.lob_id;

    // Breeds & Stages
    const breeds = await db.select().from(schema.breedMaster);
    const yorkshire = breeds.find((b) => b.breed_code === 'YORKSHIRE') || breeds[0];
    const landrace = breeds.find((b) => b.breed_code === 'LANDRACE') || breeds[0];
    const duroc = breeds.find((b) => b.breed_code === 'DUROC') || breeds[0];
    const largeWhite = breeds.find((b) => b.breed_code === 'LARGE_WHITE') || breeds[0];

    const stages = await db.select().from(schema.stageMaster);
    const stageByCode = new Map(stages.map((s) => [s.stage_code, s]));

    console.log(`Context: Tenant ${tenantId}`);
    console.log(`  - Company 1: ${company1.company_name} (${company1.company_code})`);
    console.log(`  - Company 2: ${company2.company_name} (${company2.company_code})`);

    // =========================================================================
    // ═════════════════════════════════════════════════════════════════════════
    // 🏢 COMPANY 1: APEX SWINE GENETICS & BREEDING PVT LTD
    // ═════════════════════════════════════════════════════════════════════════
    // =========================================================================
    console.log('\n📦 Seeding Company 1 (Apex Swine Genetics & Breeding)...');
    const comp1Id = company1.company_id;

    // 1.1 Cost Centers
    const ccData1 = [
      { code: 'CC-APEX-01', name: 'Apex Nucleus Breeding Complex', type: 'FARM', parentCode: null },
      { code: 'CC-BREEDING', name: 'Breeding & Gestation Unit', type: 'DEPARTMENT', parentCode: 'CC-APEX-01' },
      { code: 'CC-FARROWING', name: 'Farrowing & Nursery Barn', type: 'DEPARTMENT', parentCode: 'CC-APEX-01' },
      { code: 'CC-FEEDMILL-A', name: 'Apex On-Farm Feed Processing Mill', type: 'WAREHOUSE', parentCode: 'CC-APEX-01' },
      { code: 'CC-ADMIN-A', name: 'Farm Administration & Veterinary Services', type: 'DEPARTMENT', parentCode: 'CC-APEX-01' },
    ];
    const ccMap1 = new Map<string, string>();
    for (const cc of ccData1.filter((c) => !c.parentCode)) {
      let [existingCC] = await db.select().from(schema.costCenterMaster).where(and(eq(schema.costCenterMaster.company_id, comp1Id), eq(schema.costCenterMaster.cost_center_code, cc.code))).limit(1);
      let ccId = existingCC?.cost_center_id;
      if (!existingCC) {
        ccId = randomUUID();
        await db.insert(schema.costCenterMaster).values({ cost_center_id: ccId, tenant_id: tenantId, company_id: comp1Id, cost_center_code: cc.code, cost_center_name: cc.name, cost_center_type: cc.type, is_active: true });
      }
      ccMap1.set(cc.code, ccId!);
    }
    for (const cc of ccData1.filter((c) => c.parentCode)) {
      let [existingCC] = await db.select().from(schema.costCenterMaster).where(and(eq(schema.costCenterMaster.company_id, comp1Id), eq(schema.costCenterMaster.cost_center_code, cc.code))).limit(1);
      let ccId = existingCC?.cost_center_id;
      if (!existingCC) {
        ccId = randomUUID();
        await db.insert(schema.costCenterMaster).values({ cost_center_id: ccId, tenant_id: tenantId, company_id: comp1Id, cost_center_code: cc.code, cost_center_name: cc.name, cost_center_type: cc.type, parent_cost_center_id: ccMap1.get(cc.parentCode!), is_active: true });
      }
      ccMap1.set(cc.code, ccId!);
    }

    // 1.2 Farm, Sheds & Pens
    let [farm1] = await db.select().from(schema.farmMaster).where(eq(schema.farmMaster.company_id, comp1Id)).limit(1);
    let farm1Id = farm1?.farm_id;
    if (!farm1) {
      farm1Id = randomUUID();
      await db.insert(schema.farmMaster).values({
        farm_id: farm1Id, tenant_id: tenantId, company_id: comp1Id, farm_code: 'FARM-APEX-01', farm_name: 'Apex Nucleus Breeding Farm', farm_type: 'LIVESTOCK', total_area: '45.00', area_unit: 'ACRE', city: 'Karnal', state: 'Haryana', country: 'India',
      });
    }

    // Operational Area 1: APEX-BREED-01
    let [area1] = await db.select().from(schema.operationalAreaMaster).where(and(eq(schema.operationalAreaMaster.company_id, comp1Id), eq(schema.operationalAreaMaster.area_code, 'APEX-BREED-01'))).limit(1);
    let area1Id = area1?.area_id;
    if (!area1) {
      area1Id = randomUUID();
      await db.insert(schema.operationalAreaMaster).values({
        area_id: area1Id, tenant_id: tenantId, company_id: comp1Id, farm_id: farm1Id!, nob_id: nobId, lob_id: lobId, area_code: 'APEX-BREED-01', area_name: 'Apex Nucleus Breeding & Gestation Unit', description: 'Nucleus Swine Breeding, Boar Stud & AI Station, Farrowing Operations', preseed_source: 'TENANT', is_active: true, status: 'ACTIVE',
      });
    }

    const shedConfigs1 = [
      { code: 'SHED-GEST-01', name: 'Breeding & Gestation Complex', type: 'GESTATION' },
      { code: 'SHED-FARR-02', name: 'Farrowing & Early Weaner Barn', type: 'FARROWING' },
    ];
    const shedMap1 = new Map<string, string>();
    for (const sc of shedConfigs1) {
      let [existingShed] = await db.select().from(schema.shedMaster).where(and(eq(schema.shedMaster.company_id, comp1Id), eq(schema.shedMaster.shed_code, sc.code))).limit(1);
      let sId = existingShed?.shed_id;
      if (!existingShed) {
        sId = randomUUID();
        await db.insert(schema.shedMaster).values({ shed_id: sId, tenant_id: tenantId, company_id: comp1Id, farm_id: farm1Id, shed_code: sc.code, shed_name: sc.name, shed_type: sc.type, capacity: '250.00', capacity_uom: 'HEAD' });
      }
      shedMap1.set(sc.code, sId!);
    }

    const penConfigs1 = [
      { code: 'PEN-GEST-A1', name: 'Gestation Stalls Bank A', shedCode: 'SHED-GEST-01', cap: 30, uom: 'HEAD', cleaned: '2026-08-10', disinfected: '2026-08-11' },
      { code: 'PEN-AI-B2', name: 'AI Insemination Service Bay', shedCode: 'SHED-GEST-01', cap: 15, uom: 'HEAD', cleaned: '2026-08-15', disinfected: '2026-08-16' },
      { code: 'PEN-BOAR-C1', name: 'Herd Sire Boar Stud Suite', shedCode: 'SHED-GEST-01', cap: 6, uom: 'HEAD', cleaned: '2026-08-12', disinfected: '2026-08-13' },
      { code: 'PEN-FARR-01', name: 'Farrowing Crate Bank 1', shedCode: 'SHED-FARR-02', cap: 14, uom: 'HEAD', cleaned: '2026-08-01', disinfected: '2026-08-02' },
      { code: 'PEN-WEAN-02', name: 'Weaner Flat-Deck Nursery', shedCode: 'SHED-FARR-02', cap: 80, uom: 'HEAD', cleaned: '2026-07-28', disinfected: '2026-07-29' },
      { code: 'PEN-QUAR-01', name: 'Biosecurity Isolation Pen', shedCode: 'SHED-GEST-01', cap: 20, uom: 'HEAD', cleaned: '2026-08-18', disinfected: '2026-08-19' },
    ];
    const penMap1 = new Map<string, string>();
    for (const pc of penConfigs1) {
      let [existingPen] = await db.select().from(schema.locationMaster).where(and(eq(schema.locationMaster.company_id, comp1Id), eq(schema.locationMaster.location_code, pc.code))).limit(1);
      let pId = existingPen?.location_id;
      if (!existingPen) {
        pId = randomUUID();
        await db.insert(schema.locationMaster).values({
          location_id: pId, tenant_id: tenantId, company_id: comp1Id, farm_id: farm1Id, shed_id: shedMap1.get(pc.shedCode)!, nob_id: nobId, lob_id: lobId, location_code: pc.code, location_name: pc.name, location_level: 3, location_type: 'PEN', max_capacity: pc.cap.toString(), capacity_uom: pc.uom, last_cleaned_date: pc.cleaned, last_disinfected_date: pc.disinfected,
        });
      }
      penMap1.set(pc.code, pId!);
    }

    // 1.3 Item Categories & Items for Company 1
    const catConfigs = [
      { code: 'CAT-RAW-GRAINS', name: 'Raw Grains & Cereals' },
      { code: 'CAT-PROTEIN-SUPP', name: 'Protein Meals & Supplements' },
      { code: 'CAT-FEED-PREMIX', name: 'Vitamins & Mineral Premixes' },
      { code: 'CAT-SWINE-FEEDS', name: 'Finished Swine Feeds & Diets' },
      { code: 'CAT-VET-MEDS', name: 'Veterinary Medicines & Antibiotics' },
      { code: 'CAT-VET-VACCINES', name: 'Swine Immunization Vaccines' },
      { code: 'CAT-BIO-BREEDING', name: 'Biological Assets - Breeding Stock' },
      { code: 'CAT-BIO-COMMERCIAL', name: 'Biological Assets - Grower & Finisher' },
    ];
    const catMap1 = new Map<string, string>();
    for (const cat of catConfigs) {
      let [existingCat] = await db.select().from(schema.itemCategoryMaster).where(and(eq(schema.itemCategoryMaster.company_id, comp1Id), eq(schema.itemCategoryMaster.category_code, cat.code))).limit(1);
      let catId = existingCat?.category_id;
      if (!existingCat) {
        catId = randomUUID();
        await db.insert(schema.itemCategoryMaster).values({ category_id: catId, tenant_id: tenantId, company_id: comp1Id, category_code: cat.code, category_name: cat.name, is_active: true });
      }
      catMap1.set(cat.code, catId!);
    }

    const itemCatalog1 = [
      { code: 'RAW-MAIZE-CORN', name: 'Yellow Feed Maize / Corn Grains', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '22.0000', bio: false },
      { code: 'RAW-SOYA-MEAL', name: 'De-hulled Soya Meal (46% CP)', type: 'RAW_MATERIAL', cat: 'CAT-PROTEIN-SUPP', uom: 'KG', val: 'FIFO', cost: '42.0000', bio: false },
      { code: 'RAW-WHEAT-BRAN', name: 'Coarse Wheat Bran (14% CP)', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '18.5000', bio: false },
      { code: 'RAW-FISH-MEAL', name: 'Steam-Dried Fish Meal (60% CP)', type: 'RAW_MATERIAL', cat: 'CAT-PROTEIN-SUPP', uom: 'KG', val: 'FIFO', cost: '65.0000', bio: false },
      { code: 'RAW-SWINE-PREMIX', name: 'Swine Vitamin & Trace Mineral Premix', type: 'RAW_MATERIAL', cat: 'CAT-FEED-PREMIX', uom: 'KG', val: 'FIFO', cost: '180.0000', bio: false },
      { code: 'RAW-WHEY-POWDER', name: 'Spray Dried Sweet Whey Powder', type: 'RAW_MATERIAL', cat: 'CAT-FEED-PREMIX', uom: 'KG', val: 'FIFO', cost: '95.0000', bio: false },
      { code: 'FEED-CREEP-PRE', name: 'Creep Feed Pre-Starter (22% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '55.0000', bio: false },
      { code: 'FEED-GEST-SOW', name: 'Dry Sow Gestation Mash (14% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '28.0000', bio: false },
      { code: 'FEED-LACT-SOW', name: 'High-Density Lactation Diet (17.5% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '38.0000', bio: false },
      { code: 'MED-IRON-DEX', name: 'Iron Dextran 100mg/ml 100ml Injection', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '180.0000', bio: false },
      { code: 'MED-PENICILLIN', name: 'Penicillin G Procaine 300K IU 100ml', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '220.0000', bio: false },
      { code: 'MED-OXYTOCIN', name: 'Oxytocin 10 IU/ml 50ml Injection', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '150.0000', bio: false },
      { code: 'MED-IVERMECTIN', name: 'Ivermectin 1% Swine Dewormer 100ml', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '280.0000', bio: false },
      { code: 'VAC-PARVO-LEPTO', name: 'Parvo-Shield L5 Swine Vaccine (50 Doses)', type: 'VACCINE', cat: 'CAT-VET-VACCINES', uom: 'DOSE', val: 'FIFO', cost: '85.0000', bio: false },
      { code: 'VAC-PRRS-MLV', name: 'Ingelvac PRRS MLV Swine Vaccine (50 Doses)', type: 'VACCINE', cat: 'CAT-VET-VACCINES', uom: 'DOSE', val: 'FIFO', cost: '120.0000', bio: false },
      { code: 'BIO-SWINE-PIGLET', name: 'Suckling Live Piglet (0-4 Wks)', type: 'LIVESTOCK', cat: 'CAT-BIO-COMMERCIAL', uom: 'HEAD', val: 'BIO_ASSET', cost: '3500.0000', bio: true },
      { code: 'BIO-SWINE-GILT', name: 'Replacement Breeding Gilt', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '18000.0000', bio: true },
      { code: 'BIO-SWINE-SOW', name: 'Mature Parity Breeding Sow', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '28000.0000', bio: true },
      { code: 'BIO-SWINE-BOAR', name: 'Mature Herd Sire Boar', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '45000.0000', bio: true },
    ];
    const itemMap1 = new Map<string, string>();
    for (const item of itemCatalog1) {
      let [existingItem] = await db.select().from(schema.itemMaster).where(and(eq(schema.itemMaster.company_id, comp1Id), eq(schema.itemMaster.item_code, item.code))).limit(1);
      let itId = existingItem?.item_id;
      if (!existingItem) {
        itId = randomUUID();
        await db.insert(schema.itemMaster).values({
          item_id: itId, tenant_id: tenantId, company_id: comp1Id, category_id: catMap1.get(item.cat), nob_id: nobId, lob_id: lobId, item_code: item.code, item_name: item.name, item_type: item.type, uom_primary: item.uom, valuation_method: item.val, standard_cost: item.cost, is_biological_asset: item.bio, is_inventoriable: true, is_active: true,
        });
      }
      itemMap1.set(item.code, itId!);
    }

    // 1.4 Production Parameters & Schedulers for Company 1
    const paramConfigs1 = [
      { code: 'PARAM-FEED-GEST', name: 'Gestation Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-GEST-SOW', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '2.20000000', isMandatory: true },
      { code: 'PARAM-FEED-LACT', name: 'Lactation Sow Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-LACT-SOW', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '6.00000000', isMandatory: true },
      { code: 'PARAM-FEED-CREEP', name: 'Creep Pre-Starter Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-CREEP-PRE', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '0.35000000', isMandatory: false },
      { code: 'PARAM-MORT-PIG', name: 'Swine Daily Mortality', type: 'MORTALITY', itemCode: null, uom: 'HEAD', method: 'MANUAL_AT_ENTRY', defaultQtyUnit: null, isMandatory: true },
      { code: 'PARAM-WATER-PIG', name: 'Swine Daily Water Intake', type: 'CONSUMPTION', itemCode: null, uom: 'LTR', method: 'PER_UNIT', defaultQtyUnit: '15.00000000', isMandatory: false },
    ];
    const paramMap1 = new Map<string, string>();
    for (const p of paramConfigs1) {
      let [existingParam] = await db.select().from(schema.parameterMaster).where(and(eq(schema.parameterMaster.company_id, comp1Id), eq(schema.parameterMaster.parameter_code, p.code))).limit(1);
      let pId = existingParam?.parameter_id;
      if (!existingParam) {
        pId = randomUUID();
        await db.insert(schema.parameterMaster).values({
          parameter_id: pId, tenant_id: tenantId, company_id: comp1Id, nob_id: nobId, lob_id: lobId, parameter_code: p.code, parameter_name: p.name, parameter_type: p.type, item_id: p.itemCode ? itemMap1.get(p.itemCode) : null, default_uom: p.uom, qty_method: p.method, default_qty_per_unit: p.defaultQtyUnit, is_mandatory: p.isMandatory, is_active: true, created_by: c1AdminId,
        });
      }
      paramMap1.set(p.code, pId!);
    }

    const schedConfigs1 = [
      {
        code: 'SCHED-PIG-GEST-114', name: '114-Day Swine Gestation Production Schedule', durationValue: 114, breed: yorkshire, desc: 'Standard 114-day gestation curve',
        lines: [
          { paramCode: 'PARAM-FEED-GEST', periodNo: 1, from: 1, to: 30, label: 'Early Gestation', occ: 'DAILY', qty: '2.00000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.0000' },
          { paramCode: 'PARAM-FEED-GEST', periodNo: 2, from: 31, to: 85, label: 'Mid Gestation', occ: 'DAILY', qty: '2.20000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.2000' },
          { paramCode: 'PARAM-FEED-GEST', periodNo: 3, from: 86, to: 110, label: 'Late Gestation', occ: 'DAILY', qty: '2.80000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.8000' },
          { paramCode: 'PARAM-FEED-LACT', periodNo: 4, from: 111, to: 114, label: 'Pre-Farrow Prep', occ: 'DAILY', qty: '2.00000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.0000' },
          { paramCode: 'PARAM-WATER-PIG', periodNo: 5, from: 1, to: 114, label: 'Gestation Water Intake', occ: 'DAILY', qty: '15.00000000', uom: 'LTR', kpi: false, minPct: null, maxPct: null, target: '15.0000' },
          { paramCode: 'PARAM-MORT-PIG', periodNo: 6, from: 1, to: 114, label: 'Gestation Sow Mortality Limit', occ: 'DAILY', qty: '0.00000000', uom: 'HEAD', kpi: true, minPct: null, maxPct: '1.00', target: '0.0000' },
        ]
      },
      {
        code: 'SCHED-PIG-FARR-28', name: '28-Day Farrowing & Lactation Nursery Schedule', durationValue: 28, breed: landrace, desc: 'Standard 28-day lactation protocol',
        lines: [
          { paramCode: 'PARAM-FEED-LACT', periodNo: 1, from: 1, to: 7, label: 'Early Lactation', occ: 'DAILY', qty: '4.00000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '4.0000' },
          { paramCode: 'PARAM-FEED-LACT', periodNo: 2, from: 8, to: 21, label: 'Peak Lactation', occ: 'DAILY', qty: '6.50000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '6.5000' },
          { paramCode: 'PARAM-FEED-LACT', periodNo: 3, from: 22, to: 28, label: 'Pre-Wean Stepdown', occ: 'DAILY', qty: '5.00000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '5.0000' },
          { paramCode: 'PARAM-FEED-CREEP', periodNo: 4, from: 7, to: 28, label: 'Piglet Creep Feed Intake', occ: 'DAILY', qty: '0.35000000', uom: 'KG', kpi: true, minPct: '15.00', maxPct: '15.00', target: '0.3500' },
          { paramCode: 'PARAM-MORT-PIG', periodNo: 5, from: 1, to: 28, label: 'Pre-Weaning Piglet Mortality', occ: 'DAILY', qty: '0.00000000', uom: 'HEAD', kpi: true, minPct: null, maxPct: '5.00', target: '0.0000' },
        ]
      }
    ];
    const schedMap1 = new Map<string, string>();
    for (const s of schedConfigs1) {
      let [existingSched] = await db.select().from(schema.schedulerMaster).where(and(eq(schema.schedulerMaster.company_id, comp1Id), eq(schema.schedulerMaster.scheduler_code, s.code))).limit(1);
      let sId = existingSched?.scheduler_id;
      if (!existingSched) {
        sId = randomUUID();
        await db.insert(schema.schedulerMaster).values({
          scheduler_id: sId, tenant_id: tenantId, company_id: comp1Id, nob_id: nobId, lob_id: lobId, scheduler_code: s.code, scheduler_name: s.name, duration_value: s.durationValue, duration_unit: 'DAY', breed_id: s.breed?.breed_id, is_locked: true, batch_start_from: 'Start Date', description: s.desc, is_active: true, created_by: c1AdminId,
        });
        for (const line of s.lines) {
          const pId = paramMap1.get(line.paramCode);
          if (pId) {
            await db.insert(schema.schedulerParameterLine).values({
              spl_id: randomUUID(), scheduler_id: sId, parameter_id: pId, period_no: line.periodNo, period_from: line.from, period_to: line.to, period_label: line.label, occurrence: line.occ as any, expected_qty_override: line.qty, uom_override: line.uom, kpi_enabled: line.kpi, kpi_mode: 'PCT', kpi_min_pct: line.minPct, kpi_max_pct: line.maxPct, kpi_target_value: line.target, notify_in_app: true,
            });
          }
        }
      }
      schedMap1.set(s.code, sId!);
    }

    // 1.5 Tagged Swine Herd Animals (15 Head)
    const animalConfigs1 = [
      { code: 'PIG-2026-0001', type: 'SOW', breed: yorkshire, gender: 'F', tag: 'SOW-YK-001', rfid: '982000412880001', stage: 'DRY_SOW_GESTATION', parity: 2, born: 24, weaned: 22, cost: '28000.0000', loc: 'PEN-GEST-A1', status: 'PREGNANT' },
      { code: 'PIG-2026-0002', type: 'SOW', breed: landrace, gender: 'F', tag: 'SOW-LR-002', rfid: '982000412880002', stage: 'LACTATION', parity: 3, born: 36, weaned: 34, cost: '30000.0000', loc: 'PEN-FARR-01', status: 'LACTATING' },
      { code: 'PIG-2026-0003', type: 'SOW', breed: yorkshire, gender: 'F', tag: 'SOW-YK-003', rfid: '982000412880003', stage: 'FLUSH_SERVICE', parity: 1, born: 12, weaned: 11, cost: '26000.0000', loc: 'PEN-AI-B2', status: 'ACTIVE' },
      { code: 'PIG-2026-0004', type: 'SOW', breed: largeWhite, gender: 'F', tag: 'SOW-LW-004', rfid: '982000412880004', stage: 'DRY_SOW_GESTATION', parity: 4, born: 48, weaned: 44, cost: '31000.0000', loc: 'PEN-GEST-A1', status: 'PREGNANT' },
      { code: 'PIG-2026-0005', type: 'SOW', breed: landrace, gender: 'F', tag: 'SOW-LR-005', rfid: '982000412880005', stage: 'LACTATION', parity: 2, born: 24, weaned: 23, cost: '27500.0000', loc: 'PEN-FARR-01', status: 'LACTATING' },
      { code: 'PIG-2026-0006', type: 'SOW', breed: duroc, gender: 'F', tag: 'SOW-DR-006', rfid: '982000412880006', stage: 'DRY_SOW_GESTATION', parity: 1, born: 11, weaned: 10, cost: '29000.0000', loc: 'PEN-GEST-A1', status: 'PREGNANT' },
      { code: 'PIG-2026-0007', type: 'SOW', breed: yorkshire, gender: 'F', tag: 'SOW-YK-007', rfid: '982000412880007', stage: 'FLUSH_SERVICE', parity: 0, born: 0, weaned: 0, cost: '25000.0000', loc: 'PEN-AI-B2', status: 'ACTIVE' },
      { code: 'PIG-2026-0008', type: 'SOW', breed: landrace, gender: 'F', tag: 'SOW-LR-008', rfid: '982000412880008', stage: 'QUARANTINE', parity: 2, born: 22, weaned: 20, cost: '26000.0000', loc: 'PEN-QUAR-01', status: 'SICK' },
      { code: 'PIG-2026-0009', type: 'BOAR', breed: duroc, gender: 'M', tag: 'BOAR-DR-001', rfid: '982000412880009', stage: 'BOAR_AI', parity: 0, born: 0, weaned: 0, cost: '45000.0000', loc: 'PEN-BOAR-C1', status: 'ACTIVE' },
      { code: 'PIG-2026-0010', type: 'BOAR', breed: yorkshire, gender: 'M', tag: 'BOAR-YK-002', rfid: '982000412880010', stage: 'BOAR_AI', parity: 0, born: 0, weaned: 0, cost: '42000.0000', loc: 'PEN-BOAR-C1', status: 'ACTIVE' },
      { code: 'PIG-2026-0011', type: 'GILT', breed: yorkshire, gender: 'F', tag: 'GLT-YK-011', rfid: '982000412880011', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GEST-A1', status: 'ACTIVE' },
      { code: 'PIG-2026-0012', type: 'GILT', breed: landrace, gender: 'F', tag: 'GLT-LR-012', rfid: '982000412880012', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GEST-A1', status: 'ACTIVE' },
      { code: 'PIG-2026-0013', type: 'GILT', breed: largeWhite, gender: 'F', tag: 'GLT-LW-013', rfid: '982000412880013', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GEST-A1', status: 'ACTIVE' },
      { code: 'PIG-2026-0014', type: 'GILT', breed: duroc, gender: 'F', tag: 'GLT-DR-014', rfid: '982000412880014', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GEST-A1', status: 'ACTIVE' },
      { code: 'PIG-2026-0015', type: 'GILT', breed: yorkshire, gender: 'F', tag: 'GLT-YK-015', rfid: '982000412880015', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GEST-A1', status: 'ACTIVE' },
    ];
    const animalMap1 = new Map<string, string>();
    for (const a of animalConfigs1) {
      let [existingAnimal] = await db.select().from(schema.animalRegister).where(and(eq(schema.animalRegister.company_id, comp1Id), eq(schema.animalRegister.animal_code, a.code))).limit(1);
      let aId = existingAnimal?.animal_id;
      if (!existingAnimal) {
        aId = randomUUID();
        const stage = stageByCode.get(a.stage);
        const locId = penMap1.get(a.loc)!;
        const itId = a.type === 'BOAR' ? itemMap1.get('BIO-SWINE-BOAR')! : a.type === 'GILT' ? itemMap1.get('BIO-SWINE-GILT')! : itemMap1.get('BIO-SWINE-SOW')!;
        await db.insert(schema.animalRegister).values({
          animal_id: aId, tenant_id: tenantId, company_id: comp1Id, nob_id: nobId, lob_id: lobId, animal_code: a.code, animal_type: a.type, breed_id: a.breed.breed_id, gender: a.gender, entry_type: 'PURCHASED', entry_date: '2026-01-10', item_id: itId, ear_tag: a.tag, rfid_tag: a.rfid, acquisition_cost: a.cost, total_opening_asset_value: a.cost, book_value: a.cost, current_bio_asset_value: a.cost, parity_count: a.parity, total_piglets_born_live: a.born, total_piglets_weaned: a.weaned, current_stage_id: stage?.stage_id, current_location_id: locId, status: a.status, is_active: true, created_by: c1AdminId,
        });
      }
      animalMap1.set(a.code, aId!);
    }

    // 1.6 Breeding, Farrowing & Semen Collections
    const sow1Id = animalMap1.get('PIG-2026-0001')!;
    const sow2Id = animalMap1.get('PIG-2026-0002')!;
    const sow3Id = animalMap1.get('PIG-2026-0003')!;
    const sow4Id = animalMap1.get('PIG-2026-0004')!;
    const sow5Id = animalMap1.get('PIG-2026-0005')!;
    const sow6Id = animalMap1.get('PIG-2026-0006')!;
    const boar9Id = animalMap1.get('PIG-2026-0009')!;
    const boar10Id = animalMap1.get('PIG-2026-0010')!;

    const matingEvents = [
      { sowId: sow1Id, boarId: boar9Id, type: 'AI', date: '2026-07-05', expFarr: '2026-10-27', pregDate: '2026-08-02', result: 'CONFIRMED', parity: 2 },
      { sowId: sow4Id, boarId: boar10Id, type: 'NATURAL_MATING', date: '2026-06-01', expFarr: '2026-09-23', pregDate: '2026-06-29', result: 'CONFIRMED', parity: 4 },
      { sowId: sow6Id, boarId: boar9Id, type: 'AI', date: '2026-07-28', expFarr: '2026-11-19', pregDate: '2026-08-25', result: 'CONFIRMED', parity: 1 },
      { sowId: sow3Id, boarId: boar10Id, type: 'AI', date: '2026-08-14', expFarr: '2026-12-06', pregDate: '2026-09-11', result: 'PENDING', parity: 1 },
    ];
    for (const m of matingEvents) {
      let [existingBreed] = await db.select().from(schema.breedingRecord).where(and(eq(schema.breedingRecord.company_id, comp1Id), eq(schema.breedingRecord.sow_animal_id, m.sowId), eq(schema.breedingRecord.mating_date, m.date))).limit(1);
      if (!existingBreed) {
        await db.insert(schema.breedingRecord).values({
          breeding_id: randomUUID(), tenant_id: tenantId, company_id: comp1Id, sow_animal_id: m.sowId, boar_animal_id: m.boarId, mating_type: m.type, mating_date: m.date, expected_farrowing_date: m.expFarr, preg_check_date: m.pregDate, preg_check_method: 'ULTRASOUND', pregnancy_confirmed: m.result === 'CONFIRMED', conception_result: m.result, parity_number: m.parity, created_by: c1AdminId,
        });
      }
    }

    const farrowingEvents = [
      { sowId: sow2Id, farrDate: '2026-07-29', total: 14, live: 13, still: 1, mum: 0, avgWt: '1.450', totWt: '18.850', weanDate: '2026-08-26', weanCnt: 12, weanWt: '7.600', parity: 3 },
      { sowId: sow5Id, farrDate: '2026-08-05', total: 13, live: 12, still: 0, mum: 1, avgWt: '1.400', totWt: '16.800', weanDate: '2026-09-02', weanCnt: 12, weanWt: '7.200', parity: 2 },
    ];
    for (const f of farrowingEvents) {
      let [existingFarr] = await db.select().from(schema.farrowingRecord).where(and(eq(schema.farrowingRecord.company_id, comp1Id), eq(schema.farrowingRecord.sow_animal_id, f.sowId), eq(schema.farrowingRecord.farrowing_date, f.farrDate))).limit(1);
      if (!existingFarr) {
        await db.insert(schema.farrowingRecord).values({
          farrow_id: randomUUID(), tenant_id: tenantId, company_id: comp1Id, sow_animal_id: f.sowId, farrowing_date: f.farrDate, piglets_born_total: f.total, piglets_born_live: f.live, piglets_stillborn: f.still, piglets_mummified: f.mum, avg_birth_weight_kg: f.avgWt, total_litter_weight_kg: f.totWt, farrowing_status: 'NORMAL', weaning_date: f.weanDate, piglets_weaned: f.weanCnt, avg_weaning_weight_kg: f.weanWt, parity_number: f.parity, created_by: c1AdminId,
        });
      }
    }

    const semenBatches = [
      { boarId: boar9Id, date: '2026-08-01', doses: '45.00', feed: '180.0000', drug: '40.0000', amort: '150.0000', ohead: '80.0000', tot: '450.0000', rate: '10.000000', used: '35.00', sold: '10.00' },
      { boarId: boar10Id, date: '2026-08-08', doses: '40.00', feed: '160.0000', drug: '30.0000', amort: '140.0000', ohead: '70.0000', tot: '400.0000', rate: '10.000000', used: '30.00', sold: '10.00' },
    ];
    for (const sb of semenBatches) {
      let [existingSemen] = await db.select().from(schema.semenBatch).where(and(eq(schema.semenBatch.company_id, comp1Id), eq(schema.semenBatch.boar_animal_id, sb.boarId), eq(schema.semenBatch.collection_date, sb.date))).limit(1);
      if (!existingSemen) {
        await db.insert(schema.semenBatch).values({
          semen_batch_id: randomUUID(), tenant_id: tenantId, company_id: comp1Id, boar_animal_id: sb.boarId, collection_date: sb.date, doses_collected: sb.doses, feed_cost_period: sb.feed, drug_cost_period: sb.drug, amortisation_period: sb.amort, overhead_cost_period: sb.ohead, running_cost_period: sb.tot, unit_cost_per_dose: sb.rate, doses_used_internal: sb.used, doses_sold: sb.sold, created_by: c1AdminId,
        });
      }
    }

    // 1.7 Production Batches & 30-Day Daily Entries for Company 1
    const batches1 = [
      { no: 'PIG-BAT-2026-0001', breed: yorkshire, costing: 'BIO_ASSET', stage: 'DRY_SOW_GESTATION', shedCode: 'SHED-GEST-01', penCode: 'PEN-GEST-A1', start: '2026-07-01', end: '2026-10-25', qty: '20.0000', status: 'ACTIVE', schedulerCode: 'SCHED-PIG-GEST-114', remarks: 'Yorkshire Parity 1-3 Breeding Gestation Cohort Alpha' },
      { no: 'PIG-BAT-2026-0002', breed: landrace, costing: 'BIO_ASSET', stage: 'LACTATION', shedCode: 'SHED-FARR-02', penCode: 'PEN-FARR-01', start: '2026-07-28', end: '2026-08-28', qty: '25.0000', status: 'ACTIVE', schedulerCode: 'SCHED-PIG-FARR-28', remarks: 'Farrowing Nursing Sows and Piglet Cohort Bravo' },
    ];
    for (const b of batches1) {
      let [existingBatch] = await db.select().from(schema.batchHeader).where(and(eq(schema.batchHeader.company_id, comp1Id), eq(schema.batchHeader.batch_no, b.no))).limit(1);
      let batId = existingBatch?.batch_id;
      const stage = stageByCode.get(b.stage);
      const schedId = schedMap1.get(b.schedulerCode);

      if (!existingBatch) {
        batId = randomUUID();
        await db.insert(schema.batchHeader).values({
          batch_id: batId, tenant_id: tenantId, company_id: comp1Id, nob_id: nobId, lob_id: lobId, batch_no: b.no, breed_id: b.breed.breed_id, scheduler_id: schedId || null, costing_method: b.costing, current_stage_code: b.stage, stage_id: stage?.stage_id, shed_id: shedMap1.get(b.shedCode)!, location_id: penMap1.get(b.penCode)!, start_date: b.start, expected_end_date: b.end, opening_quantity: b.qty, closing_quantity: b.qty, uom: 'HEAD', status: b.status, remarks: b.remarks, created_by: c1AdminId,
        });

        const bioStage = b.stage === 'DRY_SOW_GESTATION' || b.stage === 'LACTATION' ? 'MATURE' : 'PREMATURE';
        await db.insert(schema.batchBioAssetState).values({
          state_id: randomUUID(), batch_id: batId, stage: bioStage, current_quantity: b.qty, nca_book_value: bioStage === 'MATURE' ? (Number(b.qty) * 28000).toFixed(4) : '0.0000',
        });

        // 30 days gestation feed
        if (b.no === 'PIG-BAT-2026-0001') {
          const gestFeedId = itemMap1.get('FEED-GEST-SOW')!;
          for (let d = 1; d <= 30; d++) {
            const dayStr = d < 10 ? `0${d}` : `${d}`;
            await db.insert(schema.batchTransaction).values({
              transaction_id: randomUUID(), batch_id: batId, transaction_date: `2026-07-${dayStr}`, transaction_type: 'CONSUMPTION', item_id: gestFeedId, quantity: '48.0000', uom: 'KG', rate: '28.000000', amount: (48 * 28).toFixed(4), remarks: `Daily gestation mash ration Day ${d}`, created_by: c1AdminId,
            });
          }
        }
        // 21 days creep feed + Day 3 iron
        if (b.no === 'PIG-BAT-2026-0002') {
          const creepFeedId = itemMap1.get('FEED-CREEP-PRE')!;
          const ironMedId = itemMap1.get('MED-IRON-DEX')!;
          await db.insert(schema.batchTransaction).values({
            transaction_id: randomUUID(), batch_id: batId, transaction_date: '2026-07-31', transaction_type: 'CONSUMPTION', item_id: ironMedId, quantity: '50.0000', uom: 'ML', rate: '1.800000', amount: '90.0000', remarks: 'Day 3 Anemia Prevention Iron Dextran 2ml IM', created_by: c1AdminId,
          });
          for (let d = 1; d <= 21; d++) {
            const dayMonth = d <= 3 ? `2026-07-${28 + d}` : `2026-08-${d - 3 < 10 ? `0${d - 3}` : `${d - 3}`}`;
            const dailyKg = (3.5 + d * 0.45).toFixed(2);
            await db.insert(schema.batchTransaction).values({
              transaction_id: randomUUID(), batch_id: batId, transaction_date: dayMonth, transaction_type: 'CONSUMPTION', item_id: creepFeedId, quantity: dailyKg, uom: 'KG', rate: '55.000000', amount: (Number(dailyKg) * 55).toFixed(4), remarks: `Nursing piglet pre-starter creep feed Day ${d}`, created_by: c1AdminId,
            });
          }
        }
      }
    }

    // =========================================================================
    // ═════════════════════════════════════════════════════════════════════════
    // 🏢 COMPANY 2: HIGHLAND COMMERCIAL PORKERS & PROCESSING PVT LTD
    // ═════════════════════════════════════════════════════════════════════════
    // =========================================================================
    console.log('\n📦 Seeding Company 2 (Highland Commercial Porkers & Processing)...');
    const comp2Id = company2.company_id;

    // 2.1 Cost Centers for Company 2
    const ccData2 = [
      { code: 'CC-HIGH-01', name: 'Highland Commercial Swine Facility', type: 'FARM', parentCode: null },
      { code: 'CC-NURSERY', name: 'Commercial Nursery Unit', type: 'DEPARTMENT', parentCode: 'CC-HIGH-01' },
      { code: 'CC-GROW-FIN', name: 'Grower & Finisher Unit', type: 'DEPARTMENT', parentCode: 'CC-HIGH-01' },
      { code: 'CC-FEEDMILL-H', name: 'Highland Feed Processing Mill', type: 'WAREHOUSE', parentCode: 'CC-HIGH-01' },
      { code: 'CC-ADMIN-H', name: 'Highland Operations & Administration', type: 'DEPARTMENT', parentCode: 'CC-HIGH-01' },
    ];
    const ccMap2 = new Map<string, string>();
    for (const cc of ccData2.filter((c) => !c.parentCode)) {
      let [existingCC] = await db.select().from(schema.costCenterMaster).where(and(eq(schema.costCenterMaster.company_id, comp2Id), eq(schema.costCenterMaster.cost_center_code, cc.code))).limit(1);
      let ccId = existingCC?.cost_center_id;
      if (!existingCC) {
        ccId = randomUUID();
        await db.insert(schema.costCenterMaster).values({ cost_center_id: ccId, tenant_id: tenantId, company_id: comp2Id, cost_center_code: cc.code, cost_center_name: cc.name, cost_center_type: cc.type, is_active: true });
      }
      ccMap2.set(cc.code, ccId!);
    }
    for (const cc of ccData2.filter((c) => c.parentCode)) {
      let [existingCC] = await db.select().from(schema.costCenterMaster).where(and(eq(schema.costCenterMaster.company_id, comp2Id), eq(schema.costCenterMaster.cost_center_code, cc.code))).limit(1);
      let ccId = existingCC?.cost_center_id;
      if (!existingCC) {
        ccId = randomUUID();
        await db.insert(schema.costCenterMaster).values({ cost_center_id: ccId, tenant_id: tenantId, company_id: comp2Id, cost_center_code: cc.code, cost_center_name: cc.name, cost_center_type: cc.type, parent_cost_center_id: ccMap2.get(cc.parentCode!), is_active: true });
      }
      ccMap2.set(cc.code, ccId!);
    }

    // 2.2 Farm, Sheds & Pens for Company 2
    let [farm2] = await db.select().from(schema.farmMaster).where(eq(schema.farmMaster.company_id, comp2Id)).limit(1);
    let farm2Id = farm2?.farm_id;
    if (!farm2) {
      farm2Id = randomUUID();
      await db.insert(schema.farmMaster).values({
        farm_id: farm2Id, tenant_id: tenantId, company_id: comp2Id, farm_code: 'FARM-HIGH-01', farm_name: 'Highland Commercial Swine Facility', farm_type: 'LIVESTOCK', total_area: '60.00', area_unit: 'ACRE', city: 'Hisar', state: 'Haryana', country: 'India',
      });
    }

    // Operational Area 2: HIGH-GROW-01
    let [area2] = await db.select().from(schema.operationalAreaMaster).where(and(eq(schema.operationalAreaMaster.company_id, comp2Id), eq(schema.operationalAreaMaster.area_code, 'HIGH-GROW-01'))).limit(1);
    let area2Id = area2?.area_id;
    if (!area2) {
      area2Id = randomUUID();
      await db.insert(schema.operationalAreaMaster).values({
        area_id: area2Id, tenant_id: tenantId, company_id: comp2Id, farm_id: farm2Id!, nob_id: nobId, lob_id: lobId, area_code: 'HIGH-GROW-01', area_name: 'Highland Grow-Finish Commercial Complex', description: 'Commercial Weaner-to-Grower Rearing, High-Density Porker Finishing & Meat Harvest', preseed_source: 'TENANT', is_active: true, status: 'ACTIVE',
      });
    }

    const shedConfigs2 = [
      { code: 'SHED-NURS-01', name: 'Commercial Weaner Nursery Barn', type: 'NURSERY' },
      { code: 'SHED-GROW-02', name: 'Commercial Grower & Finisher Facility', type: 'GROWER' },
    ];
    const shedMap2 = new Map<string, string>();
    for (const sc of shedConfigs2) {
      let [existingShed] = await db.select().from(schema.shedMaster).where(and(eq(schema.shedMaster.company_id, comp2Id), eq(schema.shedMaster.shed_code, sc.code))).limit(1);
      let sId = existingShed?.shed_id;
      if (!existingShed) {
        sId = randomUUID();
        await db.insert(schema.shedMaster).values({ shed_id: sId, tenant_id: tenantId, company_id: comp2Id, farm_id: farm2Id, shed_code: sc.code, shed_name: sc.name, shed_type: sc.type, capacity: '400.00', capacity_uom: 'HEAD' });
      }
      shedMap2.set(sc.code, sId!);
    }

    const penConfigs2 = [
      { code: 'PEN-NURS-01', name: 'Weaner Nursery Cohort Pen 1', shedCode: 'SHED-NURS-01', cap: 100, uom: 'HEAD', cleaned: '2026-08-01', disinfected: '2026-08-02' },
      { code: 'PEN-GROW-02', name: 'Grower Cohort Pen Alpha', shedCode: 'SHED-GROW-02', cap: 120, uom: 'HEAD', cleaned: '2026-08-05', disinfected: '2026-08-06' },
      { code: 'PEN-FIN-03', name: 'Finisher Porker Pen Beta', shedCode: 'SHED-GROW-02', cap: 120, uom: 'HEAD', cleaned: '2026-08-05', disinfected: '2026-08-06' },
      { code: 'PEN-QUAR-02', name: 'Biosecurity Quarantine Pen', shedCode: 'SHED-GROW-02', cap: 20, uom: 'HEAD', cleaned: '2026-08-18', disinfected: '2026-08-19' },
    ];
    const penMap2 = new Map<string, string>();
    for (const pc of penConfigs2) {
      let [existingPen] = await db.select().from(schema.locationMaster).where(and(eq(schema.locationMaster.company_id, comp2Id), eq(schema.locationMaster.location_code, pc.code))).limit(1);
      let pId = existingPen?.location_id;
      if (!existingPen) {
        pId = randomUUID();
        await db.insert(schema.locationMaster).values({
          location_id: pId, tenant_id: tenantId, company_id: comp2Id, farm_id: farm2Id, shed_id: shedMap2.get(pc.shedCode)!, nob_id: nobId, lob_id: lobId, location_code: pc.code, location_name: pc.name, location_level: 3, location_type: 'PEN', max_capacity: pc.cap.toString(), capacity_uom: pc.uom, last_cleaned_date: pc.cleaned, last_disinfected_date: pc.disinfected,
        });
      }
      penMap2.set(pc.code, pId!);
    }

    // 2.3 Item Categories & Items for Company 2
    const catMap2 = new Map<string, string>();
    for (const cat of catConfigs) {
      let [existingCat] = await db.select().from(schema.itemCategoryMaster).where(and(eq(schema.itemCategoryMaster.company_id, comp2Id), eq(schema.itemCategoryMaster.category_code, cat.code))).limit(1);
      let catId = existingCat?.category_id;
      if (!existingCat) {
        catId = randomUUID();
        await db.insert(schema.itemCategoryMaster).values({ category_id: catId, tenant_id: tenantId, company_id: comp2Id, category_code: cat.code, category_name: cat.name, is_active: true });
      }
      catMap2.set(cat.code, catId!);
    }

    const itemCatalog2 = [
      { code: 'RAW-MAIZE-CORN', name: 'Yellow Feed Maize / Corn Grains', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '22.0000', bio: false },
      { code: 'RAW-SOYA-MEAL', name: 'De-hulled Soya Meal (46% CP)', type: 'RAW_MATERIAL', cat: 'CAT-PROTEIN-SUPP', uom: 'KG', val: 'FIFO', cost: '42.0000', bio: false },
      { code: 'RAW-WHEAT-BRAN', name: 'Coarse Wheat Bran (14% CP)', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '18.5000', bio: false },
      { code: 'RAW-SWINE-PREMIX', name: 'Swine Vitamin & Trace Mineral Premix', type: 'RAW_MATERIAL', cat: 'CAT-FEED-PREMIX', uom: 'KG', val: 'FIFO', cost: '180.0000', bio: false },
      { code: 'FEED-WEAN-GROW', name: 'Weaner Grower Mash (18% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '34.5000', bio: false },
      { code: 'FEED-FINISHER', name: 'Finisher High-Gain Porker Feed (15.5% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '31.0000', bio: false },
      { code: 'MED-IVERMECTIN', name: 'Ivermectin 1% Swine Dewormer 100ml', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '280.0000', bio: false },
      { code: 'MED-TYLOSIN', name: 'Tylosin Tartrate 100g Soluble Powder', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'PACK', val: 'FIFO', cost: '350.0000', bio: false },
      { code: 'BIO-SWINE-PIGLET', name: 'Weaned Feeder Piglet (7-10kg)', type: 'LIVESTOCK', cat: 'CAT-BIO-COMMERCIAL', uom: 'HEAD', val: 'BIO_ASSET', cost: '4200.0000', bio: true },
      { code: 'BIO-SWINE-FINISHER', name: 'Finished Market Porker (105kg Live)', type: 'LIVESTOCK', cat: 'CAT-BIO-COMMERCIAL', uom: 'HEAD', val: 'BIO_ASSET', cost: '12500.0000', bio: true },
      { code: 'LVS-DRESSED-PORK', name: 'Dressed Pork Carcass (Wholesale Cut)', type: 'FINISHED_GOODS', cat: 'CAT-BIO-COMMERCIAL', uom: 'KG', val: 'FIFO', cost: '185.0000', bio: false },
    ];
    const itemMap2 = new Map<string, string>();
    for (const item of itemCatalog2) {
      let [existingItem] = await db.select().from(schema.itemMaster).where(and(eq(schema.itemMaster.company_id, comp2Id), eq(schema.itemMaster.item_code, item.code))).limit(1);
      let itId = existingItem?.item_id;
      if (!existingItem) {
        itId = randomUUID();
        await db.insert(schema.itemMaster).values({
          item_id: itId, tenant_id: tenantId, company_id: comp2Id, category_id: catMap2.get(item.cat), nob_id: nobId, lob_id: lobId, item_code: item.code, item_name: item.name, item_type: item.type, uom_primary: item.uom, valuation_method: item.val, standard_cost: item.cost, is_biological_asset: item.bio, is_inventoriable: true, is_active: true,
        });
      }
      itemMap2.set(item.code, itId!);
    }

    // 2.4 Parameters & Schedulers for Company 2
    const paramConfigs2 = [
      { code: 'PARAM-FEED-GROW', name: 'Weaner-Grower Mash Consumption', type: 'CONSUMPTION', itemCode: 'FEED-WEAN-GROW', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '1.80000000', isMandatory: true },
      { code: 'PARAM-FEED-FIN', name: 'Porker Finisher Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-FINISHER', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '2.80000000', isMandatory: true },
      { code: 'PARAM-MORT-PIG', name: 'Swine Daily Mortality', type: 'MORTALITY', itemCode: null, uom: 'HEAD', method: 'MANUAL_AT_ENTRY', defaultQtyUnit: null, isMandatory: true },
      { code: 'PARAM-BODYWT-PIG', name: 'Average Body Weight', type: 'OBSERVATION', itemCode: null, uom: 'KG', method: 'MANUAL_AT_ENTRY', defaultQtyUnit: null, isMandatory: false },
      { code: 'PARAM-PORK-OUTPUT', name: 'Dressed Pork Carcass Yield', type: 'OUTPUT', itemCode: 'LVS-DRESSED-PORK', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '85.00000000', isMandatory: false },
    ];
    const paramMap2 = new Map<string, string>();
    for (const p of paramConfigs2) {
      let [existingParam] = await db.select().from(schema.parameterMaster).where(and(eq(schema.parameterMaster.company_id, comp2Id), eq(schema.parameterMaster.parameter_code, p.code))).limit(1);
      let pId = existingParam?.parameter_id;
      if (!existingParam) {
        pId = randomUUID();
        await db.insert(schema.parameterMaster).values({
          parameter_id: pId, tenant_id: tenantId, company_id: comp2Id, nob_id: nobId, lob_id: lobId, parameter_code: p.code, parameter_name: p.name, parameter_type: p.type, item_id: p.itemCode ? itemMap2.get(p.itemCode) : null, default_uom: p.uom, qty_method: p.method, default_qty_per_unit: p.defaultQtyUnit, is_mandatory: p.isMandatory, is_active: true, created_by: c2AdminId,
        });
      }
      paramMap2.set(p.code, pId!);
    }

    const schedConfigs2 = [
      {
        code: 'SCHED-PIG-GROW-60', name: '60-Day Weaner to Grower Growth Schedule', durationValue: 60, breed: duroc, desc: 'Standard 60-day grower growth curve',
        lines: [
          { paramCode: 'PARAM-FEED-GROW', periodNo: 1, from: 1, to: 20, label: 'Nursery Weaner Adaptation', occ: 'DAILY', qty: '1.20000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '1.2000' },
          { paramCode: 'PARAM-FEED-GROW', periodNo: 2, from: 21, to: 40, label: 'Early Grower Phase', occ: 'DAILY', qty: '1.80000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '1.8000' },
          { paramCode: 'PARAM-FEED-GROW', periodNo: 3, from: 41, to: 60, label: 'Late Grower Phase', occ: 'DAILY', qty: '2.30000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.3000' },
          { paramCode: 'PARAM-BODYWT-PIG', periodNo: 4, from: 1, to: 60, label: 'Target Final Grower Weight (60kg)', occ: 'DAILY', qty: '60.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '60.0000' },
          { paramCode: 'PARAM-MORT-PIG', periodNo: 5, from: 1, to: 60, label: 'Grower Mortality Limit', occ: 'DAILY', qty: '0.00000000', uom: 'HEAD', kpi: true, minPct: null, maxPct: '1.50', target: '0.0000' },
        ]
      },
      {
        code: 'SCHED-PIG-FIN-90', name: '90-Day Porker Finisher Standard Schedule', durationValue: 90, breed: duroc, desc: 'Standard 90-day finishing period targeting 110kg market weight',
        lines: [
          { paramCode: 'PARAM-FEED-FIN', periodNo: 1, from: 1, to: 30, label: 'Finisher Phase 1', occ: 'DAILY', qty: '2.50000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.5000' },
          { paramCode: 'PARAM-FEED-FIN', periodNo: 2, from: 31, to: 60, label: 'Finisher Phase 2', occ: 'DAILY', qty: '2.90000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.9000' },
          { paramCode: 'PARAM-FEED-FIN', periodNo: 3, from: 61, to: 90, label: 'Market Finishing Phase', occ: 'DAILY', qty: '3.20000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '3.2000' },
          { paramCode: 'PARAM-BODYWT-PIG', periodNo: 4, from: 1, to: 90, label: 'Target Market Slaughter Weight (110kg)', occ: 'DAILY', qty: '110.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '110.0000' },
          { paramCode: 'PARAM-PORK-OUTPUT', periodNo: 5, from: 90, to: 90, label: 'Dressed Pork Carcass Harvest Yield', occ: 'DAILY', qty: '85.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '85.0000' },
        ]
      }
    ];
    const schedMap2 = new Map<string, string>();
    for (const s of schedConfigs2) {
      let [existingSched] = await db.select().from(schema.schedulerMaster).where(and(eq(schema.schedulerMaster.company_id, comp2Id), eq(schema.schedulerMaster.scheduler_code, s.code))).limit(1);
      let sId = existingSched?.scheduler_id;
      if (!existingSched) {
        sId = randomUUID();
        await db.insert(schema.schedulerMaster).values({
          scheduler_id: sId, tenant_id: tenantId, company_id: comp2Id, nob_id: nobId, lob_id: lobId, scheduler_code: s.code, scheduler_name: s.name, duration_value: s.durationValue, duration_unit: 'DAY', breed_id: s.breed?.breed_id, is_locked: true, batch_start_from: 'Start Date', description: s.desc, is_active: true, created_by: c2AdminId,
        });
        for (const line of s.lines) {
          const pId = paramMap2.get(line.paramCode);
          if (pId) {
            await db.insert(schema.schedulerParameterLine).values({
              spl_id: randomUUID(), scheduler_id: sId, parameter_id: pId, period_no: line.periodNo, period_from: line.from, period_to: line.to, period_label: line.label, occurrence: line.occ as any, expected_qty_override: line.qty, uom_override: line.uom, kpi_enabled: line.kpi, kpi_mode: 'PCT', kpi_min_pct: line.minPct, kpi_max_pct: line.maxPct, kpi_target_value: line.target, notify_in_app: true,
            });
          }
        }
      }
      schedMap2.set(s.code, sId!);
    }

    // 2.5 Production Batches & 30-Day Daily Entries for Company 2
    const batches2 = [
      { no: 'PIG-BAT-2026-0101', breed: duroc, costing: 'STANDARD', stage: 'CB_GROWER', shedCode: 'SHED-GROW-02', penCode: 'PEN-GROW-02', start: '2026-07-15', end: '2026-11-15', qty: '120.0000', status: 'ACTIVE', schedulerCode: 'SCHED-PIG-GROW-60', remarks: 'Highland Commercial Finisher Porker Cohort 101' },
      { no: 'PIG-BAT-2026-0102', breed: duroc, costing: 'STANDARD', stage: 'SLAUGHTER', shedCode: 'SHED-GROW-02', penCode: 'PEN-FIN-03', start: '2026-03-01', end: '2026-07-15', qty: '100.0000', status: 'CLOSED', schedulerCode: 'SCHED-PIG-FIN-90', remarks: 'Harvested Finished Porkers Q2 Batch (Completed & Invoiced)' },
    ];
    for (const b of batches2) {
      let [existingBatch] = await db.select().from(schema.batchHeader).where(and(eq(schema.batchHeader.company_id, comp2Id), eq(schema.batchHeader.batch_no, b.no))).limit(1);
      let batId = existingBatch?.batch_id;
      const stage = stageByCode.get(b.stage);
      const schedId = schedMap2.get(b.schedulerCode);

      if (!existingBatch) {
        batId = randomUUID();
        await db.insert(schema.batchHeader).values({
          batch_id: batId, tenant_id: tenantId, company_id: comp2Id, nob_id: nobId, lob_id: lobId, batch_no: b.no, breed_id: b.breed.breed_id, scheduler_id: schedId || null, costing_method: b.costing, current_stage_code: b.stage, stage_id: stage?.stage_id, shed_id: shedMap2.get(b.shedCode)!, location_id: penMap2.get(b.penCode)!, start_date: b.start, expected_end_date: b.end, opening_quantity: b.qty, closing_quantity: b.status === 'CLOSED' ? '98.0000' : b.qty, uom: 'HEAD', status: b.status, remarks: b.remarks, created_by: c2AdminId,
        });

        await db.insert(schema.batchStandard).values({
          standard_id: randomUUID(), batch_id: batId, std_mortality_pct: '1.50', std_fcr: '2.50', std_adg_gpd: '750.00', std_unit_cost: '12500.0000', total_standard_cost: (Number(b.qty) * 12500).toFixed(4),
        });

        // Multi-day grower feeding transactions
        if (b.no === 'PIG-BAT-2026-0101') {
          const weanFeedId = itemMap2.get('FEED-WEAN-GROW')!;
          for (let d = 1; d <= 30; d++) {
            const dayMonth = d <= 16 ? `2026-07-${14 + d}` : `2026-08-${d - 16 < 10 ? `0${d - 16}` : `${d - 16}`}`;
            const headCount = d >= 8 ? 119 : 120;
            const perPigKg = 1.2 + d * 0.045;
            const totalKg = (headCount * perPigKg).toFixed(2);
            await db.insert(schema.batchTransaction).values({
              transaction_id: randomUUID(), batch_id: batId, transaction_date: dayMonth, transaction_type: 'CONSUMPTION', item_id: weanFeedId, quantity: totalKg, uom: 'KG', rate: '34.500000', amount: (Number(totalKg) * 34.5).toFixed(4), remarks: `Grower feed consumption Day ${d} (${headCount} head @ ${perPigKg.toFixed(2)} kg/head)`, created_by: c2AdminId,
            });
          }
          // Mortality Day 8
          await db.insert(schema.batchTransaction).values({
            transaction_id: randomUUID(), batch_id: batId, transaction_date: '2026-07-22', transaction_type: 'MORTALITY', quantity: '1.0000', uom: 'HEAD', remarks: 'Natural acute mortality in grower pen', created_by: c2AdminId,
          });
          // 4 Weekly weigh-in logs
          const weighIns = [
            { date: '2026-07-21', avgWt: '28.50', totWt: '3420.00', gain: '0.62' },
            { date: '2026-07-28', avgWt: '33.20', totWt: '3950.80', gain: '0.67' },
            { date: '2026-08-04', avgWt: '38.60', totWt: '4593.40', gain: '0.77' },
            { date: '2026-08-11', avgWt: '44.50', totWt: '5295.50', gain: '0.84' },
          ];
          for (const wi of weighIns) {
            await db.insert(schema.batchTransaction).values({
              transaction_id: randomUUID(), batch_id: batId, transaction_date: wi.date, transaction_type: 'WEIGHT_ENTRY', quantity: wi.avgWt, uom: 'KG', remarks: `Weekly weight check: Avg ${wi.avgWt} kg/head (ADG ${wi.gain} kg/day)`, created_by: c2AdminId,
            });
          }
        }

        // Closed batch output sale
        if (b.no === 'PIG-BAT-2026-0102') {
          const finisherBioId = itemMap2.get('BIO-SWINE-FINISHER')!;
          await db.insert(schema.batchTransaction).values({
            transaction_id: randomUUID(), batch_id: batId, transaction_date: '2026-07-15', transaction_type: 'OUTPUT', item_id: finisherBioId, quantity: '98.0000', uom: 'HEAD', rate: '12400.000000', amount: '1215200.0000', remarks: 'Final harvest of finished market porkers sold to Apex Meat Processors', created_by: c2AdminId,
          });
        }
      }
    }

    // =========================================================================
    // 3. User Operational Area Assignments
    // =========================================================================
    console.log('\n🔗 Wiring User Operational Area Assignments...');
    const userAreaMap = [
      { userId: tAdminId, areaId: area1Id!, companyId: comp1Id, isPrimary: true },
      { userId: tAdminId, areaId: area2Id!, companyId: comp2Id, isPrimary: false },
      { userId: c1AdminId, areaId: area1Id!, companyId: comp1Id, isPrimary: true },
      { userId: c2AdminId, areaId: area2Id!, companyId: comp2Id, isPrimary: true },
    ];
    for (const uaa of userAreaMap) {
      let [existingUAA] = await db.select().from(schema.userOperationalAreaAssignment)
        .where(and(eq(schema.userOperationalAreaAssignment.user_id, uaa.userId), eq(schema.userOperationalAreaAssignment.area_id, uaa.areaId)))
        .limit(1);
      if (!existingUAA) {
        await db.insert(schema.userOperationalAreaAssignment).values({
          assignment_id: randomUUID(),
          user_id: uaa.userId,
          area_id: uaa.areaId,
          company_id: uaa.companyId,
          is_primary: uaa.isPrimary,
        });
      }
    }

    console.log('\n✅ Piggery Multi-Company Dataset Successfully Seeded!');
    console.log('===========================================================');
    console.log('Company 1 (APEXBREED): Apex Swine Genetics & Breeding Pvt Ltd');
    console.log('  - Area: APEX-BREED-01 (Apex Nucleus Breeding & Gestation Unit)');
    console.log('  - 15 Tagged Animals with RFIDs & Parity (Sows, Boars, Gilts)');
    console.log('  - 4 Breeding/Mating Records & 2 Farrowing Litters');
    console.log('  - 2 Boar Semen Batches with Cost-Per-Dose Split');
    console.log('  - 2 Batches (Gestation & Farrowing) with 30-Day Multi-Day Feeds');
    console.log('-----------------------------------------------------------');
    console.log('Company 2 (HIGHLAND): Highland Commercial Porkers & Processing Pvt Ltd');
    console.log('  - Area: HIGH-GROW-01 (Highland Grow-Finish Commercial Complex)');
    console.log('  - 2 Schedulers (60-Day Grower, 90-Day Porker Finisher)');
    console.log('  - 2 Batches (Active Commercial Grower & Closed Finisher)');
    console.log('  - 30-Day Grower Feeding Stream, Mortality, 4 Weekly Weight Curves');
    console.log('  - Harvest Sale Transaction (₹12,15,200)\n');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  void seedPiggeryData().catch((err) => {
    console.error('❌ Piggery multi-company seed failed:', err);
    process.exitCode = 1;
  });
}
