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
const isRemoteOrTidb = port === 4000 || host.includes('tidbcloud') || process.env.DATABASE_SSL === 'true';
const ssl = isRemoteOrTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

export async function seedPiggeryData() {
  console.log(`Starting comprehensive piggery master & operational data seed into ${dbName}...`);
  const pool = mysql.createPool({ host, port, user, password, database: dbName, ssl });
  const db = drizzle(pool, { schema, mode: 'default' });

  try {
    // 1. Get Tenant & Company Context
    const [company] = await db.select().from(schema.companyMaster).limit(1);
    if (!company) {
      throw new Error(`Company not found in ${dbName}. Run db-seed-dev-tenant first.`);
    }
    const tenantId = company.tenant_id;
    const companyId = company.company_id;
    const [userRow] = await db.select().from(schema.userMaster).where(eq(schema.userMaster.user_type, 'COMPANY_ADMIN')).limit(1);
    const userId = userRow?.user_id || '00000000-0000-0000-0000-000000000000';

    const [nob] = await db.select().from(schema.nobMaster).where(eq(schema.nobMaster.nob_code, 'LIVESTOCK')).limit(1);
    const [lob] = await db.select().from(schema.lobMaster).where(eq(schema.lobMaster.lob_code, 'LVS_PIGGERY')).limit(1);
    if (!nob || !lob) {
      throw new Error('NOB LIVESTOCK or LOB LVS_PIGGERY not found.');
    }
    const nobId = nob.nob_id;
    const lobId = lob.lob_id;

    // Get Breeds & Stages
    const breeds = await db.select().from(schema.breedMaster);
    const yorkshire = breeds.find((b) => b.breed_code === 'YORKSHIRE') || breeds[0];
    const landrace = breeds.find((b) => b.breed_code === 'LANDRACE') || breeds[0];
    const duroc = breeds.find((b) => b.breed_code === 'DUROC') || breeds[0];
    const largeWhite = breeds.find((b) => b.breed_code === 'LARGE_WHITE') || breeds[0];

    const stages = await db.select().from(schema.stageMaster);
    const stageByCode = new Map(stages.map((s) => [s.stage_code, s]));

    console.log(`Context: Tenant ${tenantId}, Company ${company.company_name} (${companyId})`);

    // 2. Cost Centers
    console.log('   - Seeding Cost Centers...');
    const costCenterData = [
      { code: 'CC-FARM-01', name: 'Apex Commercial Swine Complex', type: 'FARM', parentCode: null },
      { code: 'CC-BREEDING', name: 'Breeding & Gestation Unit', type: 'DEPARTMENT', parentCode: 'CC-FARM-01' },
      { code: 'CC-FARROWING', name: 'Farrowing & Nursery Barn', type: 'DEPARTMENT', parentCode: 'CC-FARM-01' },
      { code: 'CC-GROWER', name: 'Grower & Finisher Facility', type: 'DEPARTMENT', parentCode: 'CC-FARM-01' },
      { code: 'CC-FEEDMILL', name: 'On-Farm Feed Processing Mill', type: 'WAREHOUSE', parentCode: 'CC-FARM-01' },
      { code: 'CC-ADMIN', name: 'Farm Administration & Veterinary Services', type: 'DEPARTMENT', parentCode: 'CC-FARM-01' },
    ];
    const costCenterMap = new Map<string, string>();

    // First insert root cost center
    for (const cc of costCenterData.filter((c) => !c.parentCode)) {
      let [existingCC] = await db.select().from(schema.costCenterMaster).where(and(eq(schema.costCenterMaster.company_id, companyId), eq(schema.costCenterMaster.cost_center_code, cc.code))).limit(1);
      let ccId = existingCC?.cost_center_id;
      if (!existingCC) {
        ccId = randomUUID();
        await db.insert(schema.costCenterMaster).values({
          cost_center_id: ccId,
          tenant_id: tenantId,
          company_id: companyId,
          cost_center_code: cc.code,
          cost_center_name: cc.name,
          cost_center_type: cc.type,
          is_active: true,
        });
      }
      costCenterMap.set(cc.code, ccId!);
    }

    // Then insert child cost centers
    for (const cc of costCenterData.filter((c) => c.parentCode)) {
      let [existingCC] = await db.select().from(schema.costCenterMaster).where(and(eq(schema.costCenterMaster.company_id, companyId), eq(schema.costCenterMaster.cost_center_code, cc.code))).limit(1);
      let ccId = existingCC?.cost_center_id;
      if (!existingCC) {
        ccId = randomUUID();
        await db.insert(schema.costCenterMaster).values({
          cost_center_id: ccId,
          tenant_id: tenantId,
          company_id: companyId,
          cost_center_code: cc.code,
          cost_center_name: cc.name,
          cost_center_type: cc.type,
          parent_cost_center_id: costCenterMap.get(cc.parentCode!),
          is_active: true,
        });
      }
      costCenterMap.set(cc.code, ccId!);
    }

    // 3. Item Categories
    console.log('   - Seeding Item Categories...');
    const itemCategories = [
      { code: 'CAT-RAW-GRAINS', name: 'Raw Grains & Cereals' },
      { code: 'CAT-PROTEIN-SUPP', name: 'Protein Meals & Supplements' },
      { code: 'CAT-FEED-PREMIX', name: 'Vitamins & Mineral Premixes' },
      { code: 'CAT-SWINE-FEEDS', name: 'Finished Swine Feeds & Diets' },
      { code: 'CAT-VET-MEDS', name: 'Veterinary Medicines & Antibiotics' },
      { code: 'CAT-VET-VACCINES', name: 'Swine Immunization Vaccines' },
      { code: 'CAT-BIO-BREEDING', name: 'Biological Assets - Breeding Stock' },
      { code: 'CAT-BIO-COMMERCIAL', name: 'Biological Assets - Grower & Finisher' },
      { code: 'CAT-FARM-EQUIP', name: 'Farm Equipment & Tools' },
    ];
    const categoryMap = new Map<string, string>();
    for (const cat of itemCategories) {
      let [existingCat] = await db.select().from(schema.itemCategoryMaster).where(and(eq(schema.itemCategoryMaster.tenant_id, tenantId), eq(schema.itemCategoryMaster.category_code, cat.code))).limit(1);
      let catId = existingCat?.category_id;
      if (!existingCat) {
        catId = randomUUID();
        await db.insert(schema.itemCategoryMaster).values({
          category_id: catId,
          tenant_id: tenantId,
          company_id: companyId,
          category_code: cat.code,
          category_name: cat.name,
          is_active: true,
        });
      }
      categoryMap.set(cat.code, catId!);
    }

    // 4. Item Attributes
    console.log('   - Seeding Item Attributes...');
    const itemAttributes = [
      { code: 'ATTR-CP', name: 'Crude Protein %', type: 'NUMBER', unit: '%' },
      { code: 'ATTR-ME', name: 'Metabolizable Energy', type: 'NUMBER', unit: 'kcal/kg' },
      { code: 'ATTR-LYS', name: 'Total Lysine %', type: 'NUMBER', unit: '%' },
      { code: 'ATTR-CALCIUM', name: 'Calcium %', type: 'NUMBER', unit: '%' },
      { code: 'ATTR-PHOS', name: 'Available Phosphorus %', type: 'NUMBER', unit: '%' },
      { code: 'ATTR-WITHDRAWAL', name: 'Slaughter Withdrawal Days', type: 'NUMBER', unit: 'DAYS' },
      { code: 'ATTR-ROUTE', name: 'Administration Route', type: 'STRING', unit: null },
      { code: 'ATTR-STORAGE-TEMP', name: 'Storage Temperature Requirement', type: 'STRING', unit: '°C' },
    ];
    const attributeMap = new Map<string, string>();
    for (const attr of itemAttributes) {
      let [existingAttr] = await db.select().from(schema.itemAttributeMaster).where(and(eq(schema.itemAttributeMaster.tenant_id, tenantId), eq(schema.itemAttributeMaster.attribute_code, attr.code))).limit(1);
      let attrId = existingAttr?.attribute_id;
      if (!existingAttr) {
        attrId = randomUUID();
        await db.insert(schema.itemAttributeMaster).values({
          attribute_id: attrId,
          tenant_id: tenantId,
          company_id: companyId,
          nob_id: nobId,
          lob_id: lobId,
          attribute_code: attr.code,
          attribute_name: attr.name,
          data_type: attr.type,
          unit: attr.unit,
          is_active: true,
        });
      }
      attributeMap.set(attr.code, attrId!);
    }

    // 5. Warehouses
    let [warehouse] = await db.select().from(schema.warehouseMaster).where(eq(schema.warehouseMaster.company_id, companyId)).limit(1);
    let warehouseId = warehouse?.warehouse_id;
    if (!warehouse) {
      warehouseId = randomUUID();
      await db.insert(schema.warehouseMaster).values({
        warehouse_id: warehouseId,
        tenant_id: tenantId,
        company_id: companyId,
        warehouse_code: 'WH-MAIN',
        warehouse_name: 'Central Feed & Medication Store',
        warehouse_type: 'GENERAL',
      });
    }

    // 6. Farms, Sheds & Pens Hierarchy
    let [farm] = await db.select().from(schema.farmMaster).where(eq(schema.farmMaster.company_id, companyId)).limit(1);
    let farmId = farm?.farm_id;
    if (!farm) {
      farmId = randomUUID();
      await db.insert(schema.farmMaster).values({
        farm_id: farmId,
        tenant_id: tenantId,
        company_id: companyId,
        farm_code: 'FARM-APEX-01',
        farm_name: 'Apex Commercial Swine Complex',
        farm_type: 'LIVESTOCK',
        capacity: 5000,
        city: 'Karnal',
        state: 'Haryana',
        country: 'India',
      });
    }

    const shedConfigs = [
      { code: 'SHED-GEST-01', name: 'Breeding & Gestation Complex', type: 'GESTATION' },
      { code: 'SHED-FARR-02', name: 'Farrowing & Early Weaner Barn', type: 'FARROWING' },
      { code: 'SHED-GROW-03', name: 'Grower & Finisher Shed 3', type: 'GROWER' },
    ];
    const shedMap = new Map<string, string>();
    for (const sc of shedConfigs) {
      let [existingShed] = await db.select().from(schema.shedMaster).where(and(eq(schema.shedMaster.company_id, companyId), eq(schema.shedMaster.shed_code, sc.code))).limit(1);
      let sId = existingShed?.shed_id;
      if (!existingShed) {
        sId = randomUUID();
        await db.insert(schema.shedMaster).values({
          shed_id: sId,
          tenant_id: tenantId,
          company_id: companyId,
          farm_id: farmId,
          shed_code: sc.code,
          shed_name: sc.name,
          shed_type: sc.type,
          capacity: 250,
        });
      }
      shedMap.set(sc.code, sId!);
    }

    const penConfigs = [
      { code: 'PEN-GEST-A1', name: 'Gestation Stalls Bank A', shedCode: 'SHED-GEST-01', cap: 30, uom: 'HEAD', cleaned: '2026-08-10', disinfected: '2026-08-11' },
      { code: 'PEN-AI-B2', name: 'AI Insemination Service Bay', shedCode: 'SHED-GEST-01', cap: 15, uom: 'HEAD', cleaned: '2026-08-15', disinfected: '2026-08-16' },
      { code: 'PEN-BOAR-C1', name: 'Herd Sire Boar Stud Suite', shedCode: 'SHED-GEST-01', cap: 6, uom: 'HEAD', cleaned: '2026-08-12', disinfected: '2026-08-13' },
      { code: 'PEN-FARR-01', name: 'Farrowing Crate Bank 1', shedCode: 'SHED-FARR-02', cap: 14, uom: 'HEAD', cleaned: '2026-08-01', disinfected: '2026-08-02' },
      { code: 'PEN-WEAN-02', name: 'Weaner Flat-Deck Nursery', shedCode: 'SHED-FARR-02', cap: 80, uom: 'HEAD', cleaned: '2026-07-28', disinfected: '2026-07-29' },
      { code: 'PEN-GROW-01', name: 'Grower Cohort Pen Alpha', shedCode: 'SHED-GROW-03', cap: 100, uom: 'HEAD', cleaned: '2026-08-05', disinfected: '2026-08-06' },
      { code: 'PEN-FIN-02', name: 'Finisher Porker Pen Beta', shedCode: 'SHED-GROW-03', cap: 100, uom: 'HEAD', cleaned: '2026-08-05', disinfected: '2026-08-06' },
      { code: 'PEN-QUAR-01', name: 'Biosecurity Isolation Pen', shedCode: 'SHED-GROW-03', cap: 20, uom: 'HEAD', cleaned: '2026-08-18', disinfected: '2026-08-19' },
    ];
    const penMap = new Map<string, string>();
    for (const pc of penConfigs) {
      let [existingPen] = await db.select().from(schema.locationMaster).where(and(eq(schema.locationMaster.company_id, companyId), eq(schema.locationMaster.location_code, pc.code))).limit(1);
      let pId = existingPen?.location_id;
      if (!existingPen) {
        pId = randomUUID();
        await db.insert(schema.locationMaster).values({
          location_id: pId,
          tenant_id: tenantId,
          company_id: companyId,
          farm_id: farmId,
          shed_id: shedMap.get(pc.shedCode)!,
          nob_id: nobId,
          lob_id: lobId,
          location_code: pc.code,
          location_name: pc.name,
          location_level: 3,
          location_type: 'PEN',
          max_capacity: pc.cap.toString(),
          capacity_uom: pc.uom,
          last_cleaned_date: pc.cleaned,
          last_disinfected_date: pc.disinfected,
        });
      }
      penMap.set(pc.code, pId!);
    }

    // 7. Comprehensive Item Catalog (Raw Grains, Finished Feeds, Meds, Vaccines, Bio Assets)
    console.log('   - Seeding Comprehensive Item Catalog...');
    const itemCatalog = [
      // Raw Grains & Premixes
      { code: 'RAW-MAIZE-CORN', name: 'Yellow Feed Maize / Corn Grains', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '22.0000', bio: false, withDays: 0 },
      { code: 'RAW-SOYA-MEAL', name: 'De-hulled Soya Meal (46% CP)', type: 'RAW_MATERIAL', cat: 'CAT-PROTEIN-SUPP', uom: 'KG', val: 'FIFO', cost: '42.0000', bio: false, withDays: 0 },
      { code: 'RAW-WHEAT-BRAN', name: 'Coarse Wheat Bran (14% CP)', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '18.5000', bio: false, withDays: 0 },
      { code: 'RAW-FISH-MEAL', name: 'Steam-Dried Fish Meal (60% CP)', type: 'RAW_MATERIAL', cat: 'CAT-PROTEIN-SUPP', uom: 'KG', val: 'FIFO', cost: '65.0000', bio: false, withDays: 0 },
      { code: 'RAW-SWINE-PREMIX', name: 'Swine Vitamin & Trace Mineral Premix', type: 'RAW_MATERIAL', cat: 'CAT-FEED-PREMIX', uom: 'KG', val: 'FIFO', cost: '180.0000', bio: false, withDays: 0 },
      { code: 'RAW-WHEY-POWDER', name: 'Spray Dried Sweet Whey Powder', type: 'RAW_MATERIAL', cat: 'CAT-FEED-PREMIX', uom: 'KG', val: 'FIFO', cost: '95.0000', bio: false, withDays: 0 },

      // Finished Swine Feeds
      { code: 'FEED-CREEP-PRE', name: 'Creep Feed Pre-Starter (22% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '55.0000', bio: false, withDays: 0 },
      { code: 'FEED-WEAN-GROW', name: 'Weaner Grower Mash (18% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '34.5000', bio: false, withDays: 0 },
      { code: 'FEED-GEST-SOW', name: 'Dry Sow Gestation Mash (14% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '28.0000', bio: false, withDays: 0 },
      { code: 'FEED-LACT-SOW', name: 'High-Density Lactation Diet (17.5% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '38.0000', bio: false, withDays: 0 },
      { code: 'FEED-FINISHER', name: 'Finisher High-Gain Porker Feed (15.5% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '31.0000', bio: false, withDays: 0 },

      // Medicines
      { code: 'MED-IRON-DEX', name: 'Iron Dextran 100mg/ml 100ml Injection', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '180.0000', bio: false, withDays: 0 },
      { code: 'MED-PENICILLIN', name: 'Penicillin G Procaine 300K IU 100ml', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '220.0000', bio: false, withDays: 10 },
      { code: 'MED-OXYTOCIN', name: 'Oxytocin 10 IU/ml 50ml Injection', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '150.0000', bio: false, withDays: 1 },
      { code: 'MED-IVERMECTIN', name: 'Ivermectin 1% Swine Dewormer 100ml', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '280.0000', bio: false, withDays: 18 },
      { code: 'MED-TYLOSIN', name: 'Tylosin Tartrate 100g Soluble Powder', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'PACK', val: 'FIFO', cost: '350.0000', bio: false, withDays: 5 },

      // Vaccines
      { code: 'VAC-PARVO-LEPTO', name: 'Parvo-Shield L5 Swine Vaccine (50 Doses)', type: 'VACCINE', cat: 'CAT-VET-VACCINES', uom: 'DOSE', val: 'FIFO', cost: '85.0000', bio: false, withDays: 21 },
      { code: 'VAC-PRRS-MLV', name: 'Ingelvac PRRS MLV Swine Vaccine (50 Doses)', type: 'VACCINE', cat: 'CAT-VET-VACCINES', uom: 'DOSE', val: 'FIFO', cost: '120.0000', bio: false, withDays: 21 },

      // Biological Assets
      { code: 'BIO-SWINE-PIGLET', name: 'Suckling Live Piglet (0-4 Wks)', type: 'LIVESTOCK', cat: 'CAT-BIO-COMMERCIAL', uom: 'HEAD', val: 'BIO_ASSET', cost: '3500.0000', bio: true, withDays: 0 },
      { code: 'BIO-SWINE-GILT', name: 'Replacement Breeding Gilt', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '18000.0000', bio: true, withDays: 0 },
      { code: 'BIO-SWINE-SOW', name: 'Mature Parity Breeding Sow', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '28000.0000', bio: true, withDays: 0 },
      { code: 'BIO-SWINE-BOAR', name: 'Mature Herd Sire Boar', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '45000.0000', bio: true, withDays: 0 },
      { code: 'BIO-SWINE-FINISHER', name: 'Finished Market Porker (105kg Live)', type: 'LIVESTOCK', cat: 'CAT-BIO-COMMERCIAL', uom: 'HEAD', val: 'BIO_ASSET', cost: '12500.0000', bio: true, withDays: 0 },
    ];
    const itemMap = new Map<string, string>();

    for (const item of itemCatalog) {
      let [existingItem] = await db.select().from(schema.itemMaster).where(and(eq(schema.itemMaster.company_id, companyId), eq(schema.itemMaster.item_code, item.code))).limit(1);
      let itId = existingItem?.item_id;
      if (!existingItem) {
        itId = randomUUID();
        await db.insert(schema.itemMaster).values({
          item_id: itId,
          tenant_id: tenantId,
          company_id: companyId,
          category_id: categoryMap.get(item.cat),
          nob_id: nobId,
          lob_id: lobId,
          item_code: item.code,
          item_name: item.name,
          item_type: item.type,
          uom_primary: item.uom,
          valuation_method: item.val,
          standard_cost: item.cost,
          withdrawal_days: item.withDays,
          is_biological_asset: item.bio,
          is_inventoriable: true,
          is_active: true,
        });
      }
      itemMap.set(item.code, itId!);
    }

    // 8. Link Item Attributes
    console.log('   - Linking Item Attributes...');
    const attributeValueData = [
      { itemCode: 'FEED-CREEP-PRE', attrCode: 'ATTR-CP', val: '22.0' },
      { itemCode: 'FEED-CREEP-PRE', attrCode: 'ATTR-ME', val: '3350' },
      { itemCode: 'FEED-CREEP-PRE', attrCode: 'ATTR-LYS', val: '1.45' },
      { itemCode: 'FEED-WEAN-GROW', attrCode: 'ATTR-CP', val: '18.0' },
      { itemCode: 'FEED-WEAN-GROW', attrCode: 'ATTR-ME', val: '3250' },
      { itemCode: 'FEED-GEST-SOW', attrCode: 'ATTR-CP', val: '14.0' },
      { itemCode: 'FEED-GEST-SOW', attrCode: 'ATTR-ME', val: '3100' },
      { itemCode: 'FEED-LACT-SOW', attrCode: 'ATTR-CP', val: '17.5' },
      { itemCode: 'FEED-LACT-SOW', attrCode: 'ATTR-ME', val: '3300' },
      { itemCode: 'MED-PENICILLIN', attrCode: 'ATTR-WITHDRAWAL', val: '10' },
      { itemCode: 'MED-PENICILLIN', attrCode: 'ATTR-ROUTE', val: 'INJECTION_IM' },
      { itemCode: 'MED-PENICILLIN', attrCode: 'ATTR-STORAGE-TEMP', val: '2-8°C (Refrigerated)' },
      { itemCode: 'MED-IVERMECTIN', attrCode: 'ATTR-WITHDRAWAL', val: '18' },
      { itemCode: 'MED-IVERMECTIN', attrCode: 'ATTR-ROUTE', val: 'INJECTION_SC' },
    ];
    for (const av of attributeValueData) {
      const itId = itemMap.get(av.itemCode);
      const atId = attributeMap.get(av.attrCode);
      if (itId && atId) {
        let [existingVal] = await db.select().from(schema.itemAttributeValues).where(and(eq(schema.itemAttributeValues.item_id, itId), eq(schema.itemAttributeValues.attribute_id, atId))).limit(1);
        if (!existingVal) {
          await db.insert(schema.itemAttributeValues).values({
            value_id: randomUUID(),
            item_id: itId,
            attribute_id: atId,
            attribute_value: av.val,
          });
        }
      }
    }

    // 9. Medicines Master
    console.log('   - Seeding Medicines Master...');
    const medicinesData = [
      { code: 'MED-IRON-DEX', comp: 'Iron Dextran 100mg/ml', dose: '2 ml IM per piglet on Day 3 post farrowing', withdrawal: 0, route: 'INJECTION' },
      { code: 'MED-PENICILLIN', comp: 'Procaine Penicillin G 300,000 IU/ml', dose: '1 ml per 15 kg body weight IM daily for 3-5 days', withdrawal: 10, route: 'INJECTION' },
      { code: 'MED-OXYTOCIN', comp: 'Oxytocin 10 IU/ml', dose: '0.5 to 1.5 ml IM per sow during difficult farrowing', withdrawal: 1, route: 'INJECTION' },
      { code: 'MED-IVERMECTIN', comp: 'Ivermectin 10mg/ml Solution', dose: '1 ml per 33 kg body weight SC once', withdrawal: 18, route: 'INJECTION' },
      { code: 'MED-TYLOSIN', comp: 'Tylosin Tartrate 100g Soluble', dose: '1g per 2 Litres water for 5 consecutive days', withdrawal: 5, route: 'WATER' },
    ];
    for (const med of medicinesData) {
      const itId = itemMap.get(med.code);
      if (itId) {
        let [existingMed] = await db.select().from(schema.medicineMaster).where(and(eq(schema.medicineMaster.company_id, companyId), eq(schema.medicineMaster.item_id, itId))).limit(1);
        if (!existingMed) {
          await db.insert(schema.medicineMaster).values({
            medicine_id: randomUUID(),
            tenant_id: tenantId,
            company_id: companyId,
            item_id: itId,
            composition: med.comp,
            dosage_guideline: med.dose,
            withdrawal_period_days: med.withdrawal,
            route_of_administration: med.route,
            is_active: true,
          });
        }
      }
    }

    // 10. Feed Formulas & Formula Ingredients
    console.log('   - Seeding Feed Formulas & Ingredients...');
    const formulaData = [
      {
        code: 'FORM-PIG-CREEP',
        name: 'Creep Feed Pre-Starter Formula (22% CP)',
        targetCode: 'FEED-CREEP-PRE',
        batchSize: '1000.0000',
        unit: 'KG',
        ingredients: [
          { code: 'RAW-MAIZE-CORN', qty: '450.0000', pct: '45.00' },
          { code: 'RAW-SOYA-MEAL', qty: '300.0000', pct: '30.00' },
          { code: 'RAW-WHEY-POWDER', qty: '150.0000', pct: '15.00' },
          { code: 'RAW-FISH-MEAL', qty: '50.0000', pct: '5.00' },
          { code: 'RAW-SWINE-PREMIX', qty: '50.0000', pct: '5.00' },
        ],
      },
      {
        code: 'FORM-PIG-WEAN',
        name: 'Weaner Starter Mash Formula (18% CP)',
        targetCode: 'FEED-WEAN-GROW',
        batchSize: '1000.0000',
        unit: 'KG',
        ingredients: [
          { code: 'RAW-MAIZE-CORN', qty: '550.0000', pct: '55.00' },
          { code: 'RAW-SOYA-MEAL', qty: '280.0000', pct: '28.00' },
          { code: 'RAW-WHEAT-BRAN', qty: '100.0000', pct: '10.00' },
          { code: 'RAW-SWINE-PREMIX', qty: '70.0000', pct: '7.00' },
        ],
      },
      {
        code: 'FORM-PIG-GEST',
        name: 'Dry Sow Gestation Mash Formula (14% CP)',
        targetCode: 'FEED-GEST-SOW',
        batchSize: '1000.0000',
        unit: 'KG',
        ingredients: [
          { code: 'RAW-MAIZE-CORN', qty: '500.0000', pct: '50.00' },
          { code: 'RAW-WHEAT-BRAN', qty: '280.0000', pct: '28.00' },
          { code: 'RAW-SOYA-MEAL', qty: '150.0000', pct: '15.00' },
          { code: 'RAW-SWINE-PREMIX', qty: '70.0000', pct: '7.00' },
        ],
      },
      {
        code: 'FORM-PIG-LACT',
        name: 'Lactation High-Density Diet Formula (17.5% CP)',
        targetCode: 'FEED-LACT-SOW',
        batchSize: '1000.0000',
        unit: 'KG',
        ingredients: [
          { code: 'RAW-MAIZE-CORN', qty: '520.0000', pct: '52.00' },
          { code: 'RAW-SOYA-MEAL', qty: '270.0000', pct: '27.00' },
          { code: 'RAW-WHEAT-BRAN', qty: '100.0000', pct: '10.00' },
          { code: 'RAW-FISH-MEAL', qty: '40.0000', pct: '4.00' },
          { code: 'RAW-SWINE-PREMIX', qty: '70.0000', pct: '7.00' },
        ],
      },
    ];

    for (const f of formulaData) {
      const targetItemId = itemMap.get(f.targetCode);
      if (targetItemId) {
        let [existingForm] = await db.select().from(schema.feedFormulaMaster).where(and(eq(schema.feedFormulaMaster.company_id, companyId), eq(schema.feedFormulaMaster.formula_code, f.code))).limit(1);
        let formId = existingForm?.formula_id;
        if (!existingForm) {
          formId = randomUUID();
          await db.insert(schema.feedFormulaMaster).values({
            formula_id: formId,
            tenant_id: tenantId,
            company_id: companyId,
            formula_code: f.code,
            formula_name: f.name,
            target_item_id: targetItemId,
            batch_size: f.batchSize,
            batch_unit: f.unit,
            is_active: true,
          });

          for (const ing of f.ingredients) {
            const ingItemId = itemMap.get(ing.code);
            if (ingItemId) {
              await db.insert(schema.feedFormulaIngredients).values({
                ingredient_id: randomUUID(),
                tenant_id: tenantId,
                company_id: companyId,
                formula_id: formId,
                item_id: ingItemId,
                quantity: ing.qty,
                unit: 'KG',
                inclusion_pct: ing.pct,
                is_active: true,
              });
            }
          }
        }
      }
    }

    // 11. Suppliers, Customers & Resources
    console.log('   - Seeding Suppliers, Customers & Resources...');
    const suppliers = [
      { code: 'SUP-CARGILL', name: 'Cargill Animal Nutrition India Ltd', email: 'cargill@partner.navfarm.local', phone: '+91-9876543210' },
      { code: 'SUP-ZOETIS', name: 'Zoetis Animal Health India Ltd', email: 'zoetis@partner.navfarm.local', phone: '+91-9876543211' },
      { code: 'SUP-PIC-GENETICS', name: 'PIC Swine Genetics India', email: 'pic@partner.navfarm.local', phone: '+91-9876543212' },
    ];
    const supplierMap = new Map<string, string>();
    for (const sup of suppliers) {
      let [existingSup] = await db.select().from(schema.supplierMaster).where(and(eq(schema.supplierMaster.company_id, companyId), eq(schema.supplierMaster.supplier_code, sup.code))).limit(1);
      let supId = existingSup?.supplier_id;
      if (!existingSup) {
        supId = randomUUID();
        await db.insert(schema.supplierMaster).values({
          supplier_id: supId,
          tenant_id: tenantId,
          company_id: companyId,
          supplier_code: sup.code,
          supplier_name: sup.name,
          email: sup.email,
          phone: sup.phone,
          payment_terms: 'NET_30',
          city: 'Gurugram',
          country: 'India',
        });
      }
      supplierMap.set(sup.code, supId!);
    }

    const customers = [
      { code: 'CUST-APEX-MEAT', name: 'Apex Meat Processing & Exports Ltd', mobile: '+91-9876543211', city: 'Delhi' },
      { code: 'CUST-SWINE-FARMERS', name: 'Northern Swine Breeders Cooperative', mobile: '+91-9876543212', city: 'Chandigarh' },
    ];
    for (const cust of customers) {
      let [existingCust] = await db.select().from(schema.customerMaster).where(and(eq(schema.customerMaster.company_id, companyId), eq(schema.customerMaster.customer_code, cust.code))).limit(1);
      if (!existingCust) {
        await db.insert(schema.customerMaster).values({
          customer_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          customer_code: cust.code,
          customer_name: cust.name,
          email: `${cust.code.toLowerCase()}@buyer.navfarm.local`,
          mobile: cust.mobile,
          city: cust.city,
          country: 'India',
        });
      }
    }

    const resources = [
      { code: 'RES-VET-RAJESH', name: 'Dr. Rajesh Sharma (Lead Vet)', type: 'LABOR', sub: 'PERMANENT', desig: 'Lead Swine Veterinarian', rate: '1500.0000', unit: 'DAY' },
      { code: 'RES-AI-SURESH', name: 'Suresh Kumar (AI Specialist)', type: 'LABOR', sub: 'PERMANENT', desig: 'Artificial Insemination Specialist', rate: '900.0000', unit: 'DAY' },
      { code: 'RES-SCANNER-US', name: 'Draminski Ultrasound Pregnancy Scanner', type: 'EQUIPMENT', sub: 'OWNED', make: 'Draminski', rate: '250.0000', unit: 'HOUR' },
      { code: 'RES-FEED-AUGER', name: 'Automated Gestation Feed Distribution Auger', type: 'EQUIPMENT', sub: 'OWNED', make: 'Big Dutchman', rate: '150.0000', unit: 'HOUR' },
    ];
    for (const res of resources) {
      let [existingRes] = await db.select().from(schema.resourceMaster).where(and(eq(schema.resourceMaster.company_id, companyId), eq(schema.resourceMaster.resource_code, res.code))).limit(1);
      if (!existingRes) {
        await db.insert(schema.resourceMaster).values({
          resource_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          nob_id: nobId,
          lob_id: lobId,
          resource_code: res.code,
          resource_name: res.name,
          resource_type: res.type,
          resource_sub_type: res.sub,
          designation: res.desig,
          asset_make: res.make,
          cost_rate: res.rate,
          unit: res.unit,
          status: 'ACTIVE',
        });
      }
    }

    // 12. Diseases Master
    const diseases = [
      { code: 'DIS-ASF', name: 'African Swine Fever (ASF)', sev: 'CRITICAL' },
      { code: 'DIS-PRRS', name: 'Porcine Reproductive & Respiratory Syndrome', sev: 'HIGH' },
      { code: 'DIS-PEDV', name: 'Porcine Epidemic Diarrhea Virus', sev: 'HIGH' },
      { code: 'DIS-ERYSIPELAS', name: 'Swine Erysipelas (Diamond Skin)', sev: 'MEDIUM' },
      { code: 'DIS-MYCO', name: 'Mycoplasmal Pneumonia', sev: 'MEDIUM' },
    ];
    for (const d of diseases) {
      let [existingDis] = await db.select().from(schema.diseaseMaster).where(and(eq(schema.diseaseMaster.company_id, companyId), eq(schema.diseaseMaster.disease_code, d.code))).limit(1);
      if (!existingDis) {
        await db.insert(schema.diseaseMaster).values({
          disease_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          disease_code: d.code,
          disease_name: d.name,
        });
      }
    }

    // 13. Production Parameter Master
    console.log('   - Seeding Production Parameter Master...');
    const parameterData = [
      { code: 'PARAM-FEED-GEST', name: 'Gestation Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-GEST-SOW', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '2.20000000', defaultQtyBatch: null, isMandatory: true },
      { code: 'PARAM-FEED-LACT', name: 'Lactation Sow Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-LACT-SOW', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '6.00000000', defaultQtyBatch: null, isMandatory: true },
      { code: 'PARAM-FEED-CREEP', name: 'Creep Pre-Starter Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-CREEP-PRE', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '0.35000000', defaultQtyBatch: null, isMandatory: false },
      { code: 'PARAM-FEED-GROW', name: 'Weaner-Grower Mash Consumption', type: 'CONSUMPTION', itemCode: 'FEED-WEAN-GROW', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '1.80000000', defaultQtyBatch: null, isMandatory: true },
      { code: 'PARAM-FEED-FIN', name: 'Porker Finisher Feed Consumption', type: 'CONSUMPTION', itemCode: 'FEED-FINISHER', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '2.80000000', defaultQtyBatch: null, isMandatory: true },
      { code: 'PARAM-MORT-PIG', name: 'Swine Daily Mortality', type: 'MORTALITY', itemCode: null, uom: 'HEAD', method: 'MANUAL_AT_ENTRY', defaultQtyUnit: null, defaultQtyBatch: null, isMandatory: true },
      { code: 'PARAM-WATER-PIG', name: 'Swine Daily Water Intake', type: 'CONSUMPTION', itemCode: null, uom: 'LTR', method: 'PER_UNIT', defaultQtyUnit: '15.00000000', defaultQtyBatch: null, isMandatory: false },
      { code: 'PARAM-TEMP-PIG', name: 'Shed Ambient Temperature', type: 'OBSERVATION', itemCode: null, uom: 'CELSIUS', method: 'MANUAL_AT_ENTRY', defaultQtyUnit: '22.00000000', defaultQtyBatch: null, isMandatory: false },
      { code: 'PARAM-BODYWT-PIG', name: 'Average Body Weight', type: 'OBSERVATION', itemCode: null, uom: 'KG', method: 'MANUAL_AT_ENTRY', defaultQtyUnit: null, defaultQtyBatch: null, isMandatory: false },
      { code: 'PARAM-PORK-OUTPUT', name: 'Dressed Pork Carcass Yield', type: 'OUTPUT', itemCode: 'LVS-DRESSED-PORK', uom: 'KG', method: 'PER_UNIT', defaultQtyUnit: '85.00000000', defaultQtyBatch: null, isMandatory: false },
    ];
    const parameterMap = new Map<string, string>();
    for (const p of parameterData) {
      let [existingParam] = await db.select().from(schema.parameterMaster).where(and(eq(schema.parameterMaster.company_id, companyId), eq(schema.parameterMaster.parameter_code, p.code))).limit(1);
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
          parameter_type: p.type,
          item_id: p.itemCode ? itemMap.get(p.itemCode) : null,
          default_uom: p.uom,
          qty_method: p.method,
          default_qty_per_unit: p.defaultQtyUnit,
          default_qty_per_batch: p.defaultQtyBatch,
          is_mandatory: p.isMandatory,
          is_active: true,
          created_by: userId,
        });
      }
      parameterMap.set(p.code, pId!);
    }

    // 14. Production Scheduler Master & Parameter Lines
    console.log('   - Seeding Production Schedulers & KPI Parameter Lines...');
    const schedulerData = [
      {
        code: 'SCHED-PIG-GEST-114',
        name: '114-Day Swine Gestation Production Schedule',
        durationValue: 114,
        durationUnit: 'DAY',
        breed: yorkshire,
        desc: 'Standard 114-day gestation curve: Early gestation (D1-30), Mid gestation (D31-85), Late gestation (D86-110), Pre-farrow (D111-114)',
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
        code: 'SCHED-PIG-FARR-28',
        name: '28-Day Farrowing & Lactation Nursery Schedule',
        durationValue: 28,
        durationUnit: 'DAY',
        breed: landrace,
        desc: 'Standard 28-day lactation & creep feeding protocol with daily litter survival KPIs',
        lines: [
          { paramCode: 'PARAM-FEED-LACT', periodNo: 1, from: 1, to: 7, label: 'Early Lactation', occ: 'DAILY', qty: '4.00000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '4.0000' },
          { paramCode: 'PARAM-FEED-LACT', periodNo: 2, from: 8, to: 21, label: 'Peak Lactation', occ: 'DAILY', qty: '6.50000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '6.5000' },
          { paramCode: 'PARAM-FEED-LACT', periodNo: 3, from: 22, to: 28, label: 'Pre-Wean Stepdown', occ: 'DAILY', qty: '5.00000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '5.0000' },
          { paramCode: 'PARAM-FEED-CREEP', periodNo: 4, from: 7, to: 28, label: 'Piglet Creep Feed Intake', occ: 'DAILY', qty: '0.35000000', uom: 'KG', kpi: true, minPct: '15.00', maxPct: '15.00', target: '0.3500' },
          { paramCode: 'PARAM-MORT-PIG', periodNo: 5, from: 1, to: 28, label: 'Pre-Weaning Piglet Mortality', occ: 'DAILY', qty: '0.00000000', uom: 'HEAD', kpi: true, minPct: null, maxPct: '5.00', target: '0.0000' },
        ]
      },
      {
        code: 'SCHED-PIG-GROW-60',
        name: '60-Day Weaner to Grower Growth Schedule',
        durationValue: 60,
        durationUnit: 'DAY',
        breed: duroc,
        desc: 'Standard 60-day post-weaning growth curve from 7.5kg wean to 60kg grower',
        lines: [
          { paramCode: 'PARAM-FEED-GROW', periodNo: 1, from: 1, to: 20, label: 'Nursery Weaner Adaptation', occ: 'DAILY', qty: '1.20000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '1.2000' },
          { paramCode: 'PARAM-FEED-GROW', periodNo: 2, from: 21, to: 40, label: 'Early Grower Phase', occ: 'DAILY', qty: '1.80000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '1.8000' },
          { paramCode: 'PARAM-FEED-GROW', periodNo: 3, from: 41, to: 60, label: 'Late Grower Phase', occ: 'DAILY', qty: '2.30000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.3000' },
          { paramCode: 'PARAM-BODYWT-PIG', periodNo: 4, from: 1, to: 60, label: 'Target Final Grower Weight (60kg)', occ: 'DAILY', qty: '60.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '60.0000' },
          { paramCode: 'PARAM-MORT-PIG', periodNo: 5, from: 1, to: 60, label: 'Grower Mortality Limit', occ: 'DAILY', qty: '0.00000000', uom: 'HEAD', kpi: true, minPct: null, maxPct: '1.50', target: '0.0000' },
        ]
      },
      {
        code: 'SCHED-PIG-FIN-90',
        name: '90-Day Porker Finisher Standard Schedule',
        durationValue: 90,
        durationUnit: 'DAY',
        breed: duroc,
        desc: 'Standard 90-day finishing period targeting 110kg market slaughter weight',
        lines: [
          { paramCode: 'PARAM-FEED-FIN', periodNo: 1, from: 1, to: 30, label: 'Finisher Phase 1', occ: 'DAILY', qty: '2.50000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.5000' },
          { paramCode: 'PARAM-FEED-FIN', periodNo: 2, from: 31, to: 60, label: 'Finisher Phase 2', occ: 'DAILY', qty: '2.90000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '2.9000' },
          { paramCode: 'PARAM-FEED-FIN', periodNo: 3, from: 61, to: 90, label: 'Market Finishing Phase', occ: 'DAILY', qty: '3.20000000', uom: 'KG', kpi: true, minPct: '10.00', maxPct: '10.00', target: '3.2000' },
          { paramCode: 'PARAM-BODYWT-PIG', periodNo: 4, from: 1, to: 90, label: 'Target Market Slaughter Weight (110kg)', occ: 'DAILY', qty: '110.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '110.0000' },
          { paramCode: 'PARAM-PORK-OUTPUT', periodNo: 5, from: 90, to: 90, label: 'Dressed Pork Carcass Harvest Yield', occ: 'DAILY', qty: '85.00000000', uom: 'KG', kpi: true, minPct: '5.00', maxPct: '5.00', target: '85.0000' },
        ]
      }
    ];

    const schedulerMap = new Map<string, string>();
    for (const s of schedulerData) {
      let [existingSched] = await db.select().from(schema.schedulerMaster).where(and(eq(schema.schedulerMaster.company_id, companyId), eq(schema.schedulerMaster.scheduler_code, s.code))).limit(1);
      let sId = existingSched?.scheduler_id;
      if (!existingSched) {
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
          duration_unit: s.durationUnit,
          breed_id: s.breed?.breed_id,
          is_locked: true,
          batch_start_from: 'Start Date',
          description: s.desc,
          is_active: true,
          created_by: userId,
        });

        for (const line of s.lines) {
          const paramId = parameterMap.get(line.paramCode);
          if (paramId) {
            await db.insert(schema.schedulerParameterLine).values({
              spl_id: randomUUID(),
              scheduler_id: sId,
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
      }
      schedulerMap.set(s.code, sId!);
    }

    // 15. Inventory Goods Receipts & Inbound Ledger Postings
    console.log('   - Seeding Inventory Goods Receipts & Ledger Postings...');
    
    // 15.1 GRN-2026-0001 (Cargill: All Raw Grains & Finished Feeds)
    let [grn1] = await db.select().from(schema.goodsReceipt).where(and(eq(schema.goodsReceipt.company_id, companyId), eq(schema.goodsReceipt.receipt_no, 'GRN-2026-0001'))).limit(1);
    let grn1Id = grn1?.receipt_id;
    if (!grn1) {
      grn1Id = randomUUID();
      await db.insert(schema.goodsReceipt).values({
        receipt_id: grn1Id,
        tenant_id: tenantId,
        company_id: companyId,
        receipt_no: 'GRN-2026-0001',
        posting_date: '2026-07-01',
        warehouse_id: warehouseId!,
        supplier_id: supplierMap.get('SUP-CARGILL'),
        external_reference_no: 'INV-CRG-90812',
        remarks: 'Bulk procurement of Swine Raw Grains & Formulated Diets',
        status: 'POSTED',
        posted_at: '2026-07-01 09:30:00',
        posted_by: userId,
      });

      const grn1Lines = [
        { itemCode: 'RAW-MAIZE-CORN', qty: '100000.0000', rate: '22.0000', uom: 'KG', lot: 'LOT-CRG-MAIZE-01' },
        { itemCode: 'RAW-SOYA-MEAL', qty: '50000.0000', rate: '42.0000', uom: 'KG', lot: 'LOT-CRG-SOYA-01' },
        { itemCode: 'RAW-WHEAT-BRAN', qty: '30000.0000', rate: '18.5000', uom: 'KG', lot: 'LOT-CRG-BRAN-01' },
        { itemCode: 'RAW-FISH-MEAL', qty: '20000.0000', rate: '65.0000', uom: 'KG', lot: 'LOT-CRG-FISH-01' },
        { itemCode: 'RAW-SWINE-PREMIX', qty: '10000.0000', rate: '180.0000', uom: 'KG', lot: 'LOT-CRG-PREMIX-01' },
        { itemCode: 'RAW-WHEY-POWDER', qty: '10000.0000', rate: '95.0000', uom: 'KG', lot: 'LOT-CRG-WHEY-01' },
        { itemCode: 'FEED-CREEP-PRE', qty: '25000.0000', rate: '55.0000', uom: 'KG', lot: 'LOT-CRG-CREEP-01' },
        { itemCode: 'FEED-WEAN-GROW', qty: '50000.0000', rate: '34.5000', uom: 'KG', lot: 'LOT-CRG-WEAN-01' },
        { itemCode: 'FEED-GEST-SOW', qty: '50000.0000', rate: '28.0000', uom: 'KG', lot: 'LOT-CRG-GEST-01' },
        { itemCode: 'FEED-LACT-SOW', qty: '50000.0000', rate: '38.0000', uom: 'KG', lot: 'LOT-CRG-LACT-01' },
        { itemCode: 'FEED-FINISHER', qty: '50000.0000', rate: '31.0000', uom: 'KG', lot: 'LOT-CRG-FINISH-01' },
      ];

      for (let i = 0; i < grn1Lines.length; i++) {
        const line = grn1Lines[i];
        const itId = itemMap.get(line.itemCode)!;
        const lineId = randomUUID();
        const amt = (Number(line.qty) * Number(line.rate)).toFixed(4);

        await db.insert(schema.goodsReceiptLine).values({
          line_id: lineId,
          receipt_id: grn1Id,
          line_no: i + 1,
          item_id: itId,
          quantity: line.qty,
          uom: line.uom,
          rate: line.rate,
          amount: amt,
          lot_no: line.lot,
          remarks: 'Inbound verified against QC standard',
        });

        // Post to Inventory Ledger
        await db.insert(schema.inventoryLedger).values({
          ledger_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          item_id: itId,
          item_code: line.itemCode,
          item_description: line.itemCode,
          document_type: 'GOODS_RECEIPT',
          document_no: 'GRN-2026-0001',
          document_line_id: lineId,
          posting_date: '2026-07-01',
          entry_type: 'POSITIVE',
          transaction_type: 'PURCHASE',
          quantity: line.qty,
          remaining_quantity: line.qty,
          uom: line.uom,
          rate: line.rate,
          amount: amt,
          lot_no: line.lot,
          warehouse_id: warehouseId,
          nob_id: nobId,
          lob_id: lobId,
          created_by: userId,
        });
      }
    }

    // 13.2 GRN-2026-0002 (Zoetis: All Veterinary Medicines & Vaccines)
    let [grn2] = await db.select().from(schema.goodsReceipt).where(and(eq(schema.goodsReceipt.company_id, companyId), eq(schema.goodsReceipt.receipt_no, 'GRN-2026-0002'))).limit(1);
    let grn2Id = grn2?.receipt_id;
    if (!grn2) {
      grn2Id = randomUUID();
      await db.insert(schema.goodsReceipt).values({
        receipt_id: grn2Id,
        tenant_id: tenantId,
        company_id: companyId,
        receipt_no: 'GRN-2026-0002',
        posting_date: '2026-07-05',
        warehouse_id: warehouseId!,
        supplier_id: supplierMap.get('SUP-ZOETIS'),
        external_reference_no: 'INV-ZOETIS-4410',
        remarks: 'Veterinary Medicines & Swine Immunisation Vaccines Stocking',
        status: 'POSTED',
        posted_at: '2026-07-05 10:00:00',
        posted_by: userId,
      });

      const grn2Lines = [
        { itemCode: 'MED-IRON-DEX', qty: '1000.0000', rate: '180.0000', uom: 'VIAL', lot: 'LOT-ZOE-IRON-01' },
        { itemCode: 'MED-PENICILLIN', qty: '1000.0000', rate: '220.0000', uom: 'VIAL', lot: 'LOT-ZOE-PEN-01' },
        { itemCode: 'MED-OXYTOCIN', qty: '1000.0000', rate: '150.0000', uom: 'VIAL', lot: 'LOT-ZOE-OXY-01' },
        { itemCode: 'MED-IVERMECTIN', qty: '1000.0000', rate: '280.0000', uom: 'VIAL', lot: 'LOT-ZOE-IVER-01' },
        { itemCode: 'MED-TYLOSIN', qty: '1000.0000', rate: '350.0000', uom: 'PACK', lot: 'LOT-ZOE-TYL-01' },
        { itemCode: 'VAC-PARVO-LEPTO', qty: '2500.0000', rate: '85.0000', uom: 'DOSE', lot: 'LOT-ZOE-PARVO-01' },
        { itemCode: 'VAC-PRRS-MLV', qty: '2500.0000', rate: '120.0000', uom: 'DOSE', lot: 'LOT-ZOE-PRRS-01' },
      ];

      for (let i = 0; i < grn2Lines.length; i++) {
        const line = grn2Lines[i];
        const itId = itemMap.get(line.itemCode)!;
        const lineId = randomUUID();
        const amt = (Number(line.qty) * Number(line.rate)).toFixed(4);

        await db.insert(schema.goodsReceiptLine).values({
          line_id: lineId,
          receipt_id: grn2Id,
          line_no: i + 1,
          item_id: itId,
          quantity: line.qty,
          uom: line.uom,
          rate: line.rate,
          amount: amt,
          lot_no: line.lot,
          remarks: 'Vet inventory verified and refrigerated',
        });

        // Post to Inventory Ledger
        await db.insert(schema.inventoryLedger).values({
          ledger_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          item_id: itId,
          item_code: line.itemCode,
          item_description: line.itemCode,
          document_type: 'GOODS_RECEIPT',
          document_no: 'GRN-2026-0002',
          document_line_id: lineId,
          posting_date: '2026-07-05',
          entry_type: 'POSITIVE',
          transaction_type: 'PURCHASE',
          quantity: line.qty,
          remaining_quantity: line.qty,
          uom: line.uom,
          rate: line.rate,
          amount: amt,
          lot_no: line.lot,
          warehouse_id: warehouseId,
          nob_id: nobId,
          lob_id: lobId,
          created_by: userId,
        });
      }
    }

    // 14. Finance General Ledger Journals & Cost Center Postings
    console.log('   - Seeding Finance GL Journals...');
    const glAccounts = await db.select().from(schema.glAccountMaster).where(eq(schema.glAccountMaster.company_id, companyId));
    const glMap = new Map(glAccounts.map((a) => [a.account_code, a.gl_account_id]));

    // Ensure all required GL Accounts exist (Full Sheet 13 Piggery Standard Chart of Accounts)
    const standardAccounts = [
      // Assets
      { code: '1000', name: 'Cash and Bank Clearing', type: 'ASSET' },
      { code: '1110', name: 'Primary Operating Bank Account', type: 'ASSET' },
      { code: '1200', name: 'Accounts Receivable — Customer Trade', type: 'ASSET' },
      { code: '1300', name: 'Feed and Raw Material Inventory', type: 'ASSET' },
      { code: '1310', name: 'Veterinary Medicines & Vaccines Inventory', type: 'ASSET' },
      { code: '1320', name: 'Boar Semen Inventory', type: 'ASSET' },
      { code: '1330', name: 'Farm Consumables & Supplies Inventory', type: 'ASSET' },
      { code: '1400', name: 'Work in Progress — Batch Production WIP', type: 'ASSET' },
      { code: '1410', name: 'Biological Asset — Sow & Gilt Breeding Herd', type: 'ASSET' },
      { code: '1419', name: 'Accumulated Amortisation — Sow Herd', type: 'ASSET' },
      { code: '1420', name: 'Biological Asset — Boar Breeding Herd', type: 'ASSET' },
      { code: '1429', name: 'Accumulated Amortisation — Boar Herd', type: 'ASSET' },
      { code: '1430', name: 'Inventory — Commercial Piglets & Growers', type: 'ASSET' },
      { code: '1440', name: 'Biological Asset — Cattle & Other Livestock', type: 'ASSET' },
      { code: '1500', name: 'Farm Machinery and Equipment', type: 'ASSET' },
      { code: '1510', name: 'Sheds and Farm Infrastructure', type: 'ASSET' },
      // Legacy compatibility codes
      { code: '1010', name: 'Raw Material Inventory', type: 'ASSET' },
      { code: '1020', name: 'Work in Progress Inventory', type: 'ASSET' },
      { code: '1030', name: 'Finished Goods Inventory', type: 'ASSET' },
      { code: '1050', name: 'Biological Assets — Pre-mature', type: 'ASSET' },
      { code: '1060', name: 'Biological Assets — Mature', type: 'ASSET' },

      // Liabilities
      { code: '2000', name: 'Accounts Payable — Vendor Ledger', type: 'LIABILITY' },
      { code: '2010', name: 'Trade Payables Clearing Account', type: 'LIABILITY' },
      { code: '2100', name: 'Accrued Farm Wages & Payroll Clearing', type: 'LIABILITY' },
      { code: '2200', name: 'Accrued Operating & Vet Expenses', type: 'LIABILITY' },

      // Equity
      { code: '3000', name: 'Shareholder Capital', type: 'EQUITY' },
      { code: '3100', name: 'Retained Earnings', type: 'EQUITY' },

      // Revenue / Income
      { code: '4000', name: 'Meat & Pork Output Sales Revenue', type: 'INCOME' },
      { code: '4010', name: 'Breeding Animal Sales Revenue', type: 'INCOME' },
      { code: '4020', name: 'Semen Dose Sales Revenue', type: 'INCOME' },
      { code: '4200', name: 'Fair Value Gain on Biological Assets', type: 'INCOME' },

      // Cost of Goods Sold & Expenses
      { code: '5010', name: 'Mortality Loss', type: 'EXPENSE' },
      { code: '5020', name: 'Feed & Overhead Expense', type: 'EXPENSE' },
      { code: '5100', name: 'Direct Feed Material COGS', type: 'EXPENSE' },
      { code: '5110', name: 'Direct Veterinary Medicines & Vaccines', type: 'EXPENSE' },
      { code: '5120', name: 'Direct AI Breeding & Semen Cost', type: 'EXPENSE' },
      { code: '5130', name: 'Direct Farm Labour Wages', type: 'EXPENSE' },
      { code: '5140', name: 'Equipment Hire & Farm Utilities', type: 'EXPENSE' },
      { code: '5200', name: 'Fair Value Loss on Biological Assets', type: 'EXPENSE' },
      { code: '5300', name: 'Mortality Loss Expense', type: 'EXPENSE' },
      { code: '5400', name: 'Stock Adjustment & Shrinkage Loss', type: 'EXPENSE' },
      { code: '5500', name: 'Amortisation Expense — Biological Assets', type: 'EXPENSE' },
      { code: '5600', name: 'Farm Maintenance & Facility Repairs', type: 'EXPENSE' },
      { code: '5700', name: 'General & Administrative Expenses', type: 'EXPENSE' },
      { code: '5800', name: 'Depreciation Expense — Equipment & Sheds', type: 'EXPENSE' },
    ];
    for (const acc of standardAccounts) {
      let [existingAcc] = await db.select().from(schema.glAccountMaster).where(and(eq(schema.glAccountMaster.company_id, companyId), eq(schema.glAccountMaster.account_code, acc.code))).limit(1);
      let gId = existingAcc?.gl_account_id;
      if (!existingAcc) {
        gId = randomUUID();
        await db.insert(schema.glAccountMaster).values({
          gl_account_id: gId,
          tenant_id: tenantId,
          company_id: companyId,
          account_code: acc.code,
          account_name: acc.name,
          account_type: acc.type,
        });
      }
      glMap.set(acc.code, gId!);
    }

    // Seed Automated GL Posting Setup Rules (Sheet 13)
    console.log('   - Seeding Automated GL Posting Setup Rules...');
    const postingRules = [
      { type: 'GRN', debit: '1300', credit: '2010', desc: 'Feed & Material GRN Inbound' },
      { type: 'GRN_MEDICINE', debit: '1310', credit: '2010', desc: 'Meds & Vaccine GRN Inbound' },
      { type: 'GRN_ANIMAL', debit: '1410', credit: '2000', desc: 'Breeding Herd Capital Acquisition' },
      { type: 'FEED_CONSUMPTION', debit: '1400', credit: '1300', desc: 'Batch Feed Consumption (WIP)' },
      { type: 'MEDICATION_CONSUMPTION', debit: '1400', credit: '1310', desc: 'Batch Medication Administration' },
      { type: 'FARROWING_OUTPUT', debit: '1430', credit: '1400', desc: 'Farrowing Output Piglets Capitalisation' },
      { type: 'WEANING_TRANSITION', debit: '1430', credit: '1400', desc: 'Weaning Phase Output Capitalisation' },
      { type: 'SEMEN_COLLECTION', debit: '1320', credit: '1400', desc: 'Boar Semen Dose Collection' },
      { type: 'MORTALITY', debit: '5300', credit: '1400', desc: 'Batch Piglet/Grower Mortality Loss' },
      { type: 'AMORTISATION', debit: '5500', credit: '1419', desc: 'Sow Breeding Herd Monthly Amortisation' },
      { type: 'STOCK_ADJUSTMENT', debit: '5400', credit: '1300', desc: 'Inventory Shrinkage / Variance' },
      { type: 'TRANSFER_SHIPMENT', debit: '1400', credit: '1400', desc: 'Batch Animal Transfer Out' },
      { type: 'TRANSFER_RECEIPT', debit: '1400', credit: '1400', desc: 'Batch Animal Transfer In' },
      { type: 'SALE', debit: '1200', credit: '4000', desc: 'Commercial Pork / Animal Sales' },
    ];

    for (const rule of postingRules) {
      const [existingRule] = await db
        .select()
        .from(schema.glMappingMaster)
        .where(
          and(
            eq(schema.glMappingMaster.company_id, companyId),
            eq(schema.glMappingMaster.transaction_type, rule.type)
          )
        )
        .limit(1);

      if (!existingRule) {
        await db.insert(schema.glMappingMaster).values({
          mapping_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          nob_id: nobId,
          lob_id: lobId,
          transaction_type: rule.type,
          debit_gl_account_id: glMap.get(rule.debit) || null,
          credit_gl_account_id: glMap.get(rule.credit) || null,
          is_active: true,
        });
      }
    }

    const journals = [
      {
        no: 'JRN-2026-0001',
        date: '2026-07-01',
        desc: 'Inventory Inbound Feed Procurement (GRN-2026-0001)',
        costCenter: 'CC-FEEDMILL',
        debitAcc: '1010',
        creditAcc: '2010',
        amount: '848500.0000',
      },
      {
        no: 'JRN-2026-0002',
        date: '2026-07-05',
        desc: 'Veterinary Medicines & Vaccine Inventory Procurement (GRN-2026-0002)',
        costCenter: 'CC-ADMIN',
        debitAcc: '1010',
        creditAcc: '2010',
        amount: '46100.0000',
      },
      {
        no: 'JRN-2026-0003',
        date: '2026-07-10',
        desc: 'Capitalisation of Swine Breeding Herd Bio Assets (15 Head)',
        costCenter: 'CC-BREEDING',
        debitAcc: '1060',
        creditAcc: '1000',
        amount: '399500.0000',
      },
      {
        no: 'JRN-2026-0004',
        date: '2026-07-31',
        desc: 'Monthly Bio Asset Amortisation for Breeding Sow Herd (July 2026)',
        costCenter: 'CC-BREEDING',
        debitAcc: '5100',
        creditAcc: '1060',
        amount: '11100.0000',
      },
      {
        no: 'JRN-2026-0005',
        date: '2026-08-14',
        desc: 'Grower Herd Feed Consumption Allocation (30-day feeding cycle)',
        costCenter: 'CC-GROWER',
        debitAcc: '1050',
        creditAcc: '1010',
        amount: '58305.0000',
      },
    ];

    for (const j of journals) {
      let [existingJrn] = await db.select().from(schema.journalHeader).where(and(eq(schema.journalHeader.company_id, companyId), eq(schema.journalHeader.journal_no, j.no))).limit(1);
      if (!existingJrn) {
        const jId = randomUUID();
        await db.insert(schema.journalHeader).values({
          journal_id: jId,
          tenant_id: tenantId,
          company_id: companyId,
          journal_no: j.no,
          posting_date: j.date,
          source: 'SYSTEM',
          description: j.desc,
          status: 'POSTED',
          total_debit: j.amount,
          total_credit: j.amount,
          posted_at: `${j.date} 18:00:00`,
          posted_by: userId,
          created_by: userId,
        });

        // Debit Line
        await db.insert(schema.journalLine).values({
          line_id: randomUUID(),
          journal_id: jId,
          line_no: 1,
          gl_account_id: glMap.get(j.debitAcc)!,
          cost_center_id: costCenterMap.get(j.costCenter),
          debit_amount: j.amount,
          credit_amount: '0.0000',
          description: `${j.desc} - Debit`,
          nob_id: nobId,
          lob_id: lobId,
        });

        // Credit Line
        await db.insert(schema.journalLine).values({
          line_id: randomUUID(),
          journal_id: jId,
          line_no: 2,
          gl_account_id: glMap.get(j.creditAcc)!,
          cost_center_id: costCenterMap.get(j.costCenter),
          debit_amount: '0.0000',
          credit_amount: j.amount,
          description: `${j.desc} - Credit`,
          nob_id: nobId,
          lob_id: lobId,
        });
      }
    }

    // 15. Tagged Swine Animals (15 Head)
    console.log('   - Seeding Tagged Swine Animals (15 Head)...');
    const animalConfigs = [
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
      { code: 'PIG-2026-0011', type: 'GILT', breed: yorkshire, gender: 'F', tag: 'GLT-YK-011', rfid: '982000412880011', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GROW-01', status: 'ACTIVE' },
      { code: 'PIG-2026-0012', type: 'GILT', breed: landrace, gender: 'F', tag: 'GLT-LR-012', rfid: '982000412880012', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GROW-01', status: 'ACTIVE' },
      { code: 'PIG-2026-0013', type: 'GILT', breed: largeWhite, gender: 'F', tag: 'GLT-LW-013', rfid: '982000412880013', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GROW-01', status: 'ACTIVE' },
      { code: 'PIG-2026-0014', type: 'GILT', breed: duroc, gender: 'F', tag: 'GLT-DR-014', rfid: '982000412880014', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GROW-01', status: 'ACTIVE' },
      { code: 'PIG-2026-0015', type: 'GILT', breed: yorkshire, gender: 'F', tag: 'GLT-YK-015', rfid: '982000412880015', stage: 'GILT_GROWER', parity: 0, born: 0, weaned: 0, cost: '18000.0000', loc: 'PEN-GROW-01', status: 'ACTIVE' },
    ];
    const animalMap = new Map<string, string>();

    for (const a of animalConfigs) {
      let [existingAnimal] = await db.select().from(schema.animalRegister).where(and(eq(schema.animalRegister.company_id, companyId), eq(schema.animalRegister.animal_code, a.code))).limit(1);
      let aId = existingAnimal?.animal_id;
      if (!existingAnimal) {
        aId = randomUUID();
        const stage = stageByCode.get(a.stage);
        const locId = penMap.get(a.loc)!;
        const itId = a.type === 'BOAR' ? itemMap.get('BIO-SWINE-BOAR')! : a.type === 'GILT' ? itemMap.get('BIO-SWINE-GILT')! : itemMap.get('BIO-SWINE-SOW')!;

        await db.insert(schema.animalRegister).values({
          animal_id: aId,
          tenant_id: tenantId,
          company_id: companyId,
          nob_id: nobId,
          lob_id: lobId,
          animal_code: a.code,
          animal_type: a.type,
          breed_id: a.breed.breed_id,
          gender: a.gender,
          entry_type: 'PURCHASED',
          entry_date: '2026-01-10',
          item_id: itId,
          ear_tag: a.tag,
          rfid_tag: a.rfid,
          acquisition_cost: a.cost,
          total_opening_asset_value: a.cost,
          book_value: a.cost,
          current_bio_asset_value: a.cost,
          parity_count: a.parity,
          total_piglets_born_live: a.born,
          total_piglets_weaned: a.weaned,
          current_stage_id: stage?.stage_id,
          current_location_id: locId,
          status: a.status,
          is_active: true,
          created_by: userId,
        });
      }
      animalMap.set(a.code, aId!);
    }

    // 16. Active Medication Log with Withdrawal Period
    const sickSowId = animalMap.get('PIG-2026-0008')!;
    const medPenicillinId = itemMap.get('MED-PENICILLIN')!;
    let [existingMedLog] = await db.select().from(schema.animalMedicationLog).where(and(eq(schema.animalMedicationLog.company_id, companyId), eq(schema.animalMedicationLog.animal_id, sickSowId))).limit(1);
    if (!existingMedLog) {
      await db.insert(schema.animalMedicationLog).values({
        log_id: randomUUID(),
        tenant_id: tenantId,
        company_id: companyId,
        animal_id: sickSowId,
        item_id: medPenicillinId,
        administered_date: '2026-08-16',
        dose_qty: '15.0000',
        uom: 'ML',
        administered_by: 'Dr. Rajesh Sharma (Vet)',
        notes: 'Treated for respiratory distress. 10-day slaughter withdrawal active until 2026-08-26.',
        created_by: userId,
      });
    }

    // 17. Reproduction Lifecycles (Mating, Farrowing & Semen Collections)
    console.log('   - Seeding Reproduction Lifecycles (Mating, Litters, Semen Batches)...');
    const sow1Id = animalMap.get('PIG-2026-0001')!;
    const sow2Id = animalMap.get('PIG-2026-0002')!;
    const sow3Id = animalMap.get('PIG-2026-0003')!;
    const sow4Id = animalMap.get('PIG-2026-0004')!;
    const sow5Id = animalMap.get('PIG-2026-0005')!;
    const sow6Id = animalMap.get('PIG-2026-0006')!;
    const boar9Id = animalMap.get('PIG-2026-0009')!;
    const boar10Id = animalMap.get('PIG-2026-0010')!;

    const matingEvents = [
      { sowId: sow1Id, boarId: boar9Id, type: 'AI', date: '2026-07-05', expFarr: '2026-10-27', pregDate: '2026-08-02', result: 'CONFIRMED', parity: 2 },
      { sowId: sow4Id, boarId: boar10Id, type: 'NATURAL_MATING', date: '2026-06-01', expFarr: '2026-09-23', pregDate: '2026-06-29', result: 'CONFIRMED', parity: 4 },
      { sowId: sow6Id, boarId: boar9Id, type: 'AI', date: '2026-07-28', expFarr: '2026-11-19', pregDate: '2026-08-25', result: 'CONFIRMED', parity: 1 },
      { sowId: sow3Id, boarId: boar10Id, type: 'AI', date: '2026-08-14', expFarr: '2026-12-06', pregDate: '2026-09-11', result: 'PENDING', parity: 1 },
    ];
    for (const m of matingEvents) {
      let [existingBreed] = await db.select().from(schema.breedingRecord).where(and(eq(schema.breedingRecord.company_id, companyId), eq(schema.breedingRecord.sow_animal_id, m.sowId), eq(schema.breedingRecord.mating_date, m.date))).limit(1);
      if (!existingBreed) {
        await db.insert(schema.breedingRecord).values({
          breeding_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          sow_animal_id: m.sowId,
          boar_animal_id: m.boarId,
          mating_type: m.type,
          mating_date: m.date,
          expected_farrowing_date: m.expFarr,
          preg_check_date: m.pregDate,
          preg_check_method: 'ULTRASOUND',
          pregnancy_confirmed: m.result === 'CONFIRMED',
          conception_result: m.result,
          parity_number: m.parity,
          created_by: userId,
        });
      }
    }

    const farrowingEvents = [
      { sowId: sow2Id, farrDate: '2026-07-29', total: 14, live: 13, still: 1, mum: 0, avgWt: '1.450', totWt: '18.850', weanDate: '2026-08-26', weanCnt: 12, weanWt: '7.600', parity: 3 },
      { sowId: sow5Id, farrDate: '2026-08-05', total: 13, live: 12, still: 0, mum: 1, avgWt: '1.400', totWt: '16.800', weanDate: '2026-09-02', weanCnt: 12, weanWt: '7.200', parity: 2 },
    ];
    for (const f of farrowingEvents) {
      let [existingFarr] = await db.select().from(schema.farrowingRecord).where(and(eq(schema.farrowingRecord.company_id, companyId), eq(schema.farrowingRecord.sow_animal_id, f.sowId), eq(schema.farrowingRecord.farrowing_date, f.farrDate))).limit(1);
      if (!existingFarr) {
        await db.insert(schema.farrowingRecord).values({
          farrow_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          sow_animal_id: f.sowId,
          farrowing_date: f.farrDate,
          piglets_born_total: f.total,
          piglets_born_live: f.live,
          piglets_stillborn: f.still,
          piglets_mummified: f.mum,
          avg_birth_weight_kg: f.avgWt,
          total_litter_weight_kg: f.totWt,
          farrowing_status: 'NORMAL',
          weaning_date: f.weanDate,
          piglets_weaned: f.weanCnt,
          avg_weaning_weight_kg: f.weanWt,
          parity_number: f.parity,
          created_by: userId,
        });
      }
    }

    const semenBatches = [
      { boarId: boar9Id, date: '2026-08-01', doses: '45.00', feed: '180.0000', drug: '40.0000', amort: '150.0000', ohead: '80.0000', tot: '450.0000', rate: '10.000000', used: '35.00', sold: '10.00' },
      { boarId: boar10Id, date: '2026-08-08', doses: '40.00', feed: '160.0000', drug: '30.0000', amort: '140.0000', ohead: '70.0000', tot: '400.0000', rate: '10.000000', used: '30.00', sold: '10.00' },
    ];
    for (const sb of semenBatches) {
      let [existingSemen] = await db.select().from(schema.semenBatch).where(and(eq(schema.semenBatch.company_id, companyId), eq(schema.semenBatch.boar_animal_id, sb.boarId), eq(schema.semenBatch.collection_date, sb.date))).limit(1);
      if (!existingSemen) {
        await db.insert(schema.semenBatch).values({
          semen_batch_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          boar_animal_id: sb.boarId,
          collection_date: sb.date,
          doses_collected: sb.doses,
          feed_cost_period: sb.feed,
          drug_cost_period: sb.drug,
          amortisation_period: sb.amort,
          overhead_cost_period: sb.ohead,
          running_cost_period: sb.tot,
          unit_cost_per_dose: sb.rate,
          doses_used_internal: sb.used,
          doses_sold: sb.sold,
          created_by: userId,
        });
      }
    }

    // 18. Piggery Production Batches with Multi-Day Daily Data Entries
    console.log('   - Seeding Production Batches with Multi-Day Daily Transaction Streams...');
    const batches = [
      {
        no: 'PIG-BAT-2026-0001',
        breed: yorkshire,
        costing: 'BIO_ASSET',
        stage: 'DRY_SOW_GESTATION',
        shedCode: 'SHED-GEST-01',
        penCode: 'PEN-GEST-A1',
        start: '2026-07-01',
        end: '2026-10-25',
        qty: '20.0000',
        status: 'ACTIVE',
        schedulerCode: 'SCHED-PIG-GEST-114',
        remarks: 'Yorkshire Parity 1-3 Breeding Gestation Cohort Alpha',
      },
      {
        no: 'PIG-BAT-2026-0002',
        breed: landrace,
        costing: 'BIO_ASSET',
        stage: 'LACTATION',
        shedCode: 'SHED-FARR-02',
        penCode: 'PEN-FARR-01',
        start: '2026-07-28',
        end: '2026-08-28',
        qty: '25.0000',
        status: 'ACTIVE',
        schedulerCode: 'SCHED-PIG-FARR-28',
        remarks: 'Farrowing Nursing Sows and Piglet Cohort Bravo',
      },
      {
        no: 'PIG-BAT-2026-0003',
        breed: duroc,
        costing: 'STANDARD',
        stage: 'CB_GROWER',
        shedCode: 'SHED-GROW-03',
        penCode: 'PEN-GROW-01',
        start: '2026-07-15',
        end: '2026-11-15',
        qty: '120.0000',
        status: 'ACTIVE',
        schedulerCode: 'SCHED-PIG-GROW-60',
        remarks: 'Commercial Finisher Porker Cohort 101 (Multi-day FCR tracked)',
      },
      {
        no: 'PIG-BAT-2026-0004',
        breed: duroc,
        costing: 'STANDARD',
        stage: 'SLAUGHTER',
        shedCode: 'SHED-GROW-03',
        penCode: 'PEN-FIN-02',
        start: '2026-03-01',
        end: '2026-07-15',
        qty: '100.0000',
        status: 'CLOSED',
        schedulerCode: 'SCHED-PIG-FIN-90',
        remarks: 'Harvested Finished Porkers Q2 Batch (Completed & Variance posted)',
      },
    ];

    for (const b of batches) {
      let [existingBatch] = await db.select().from(schema.batchHeader).where(and(eq(schema.batchHeader.company_id, companyId), eq(schema.batchHeader.batch_no, b.no))).limit(1);
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
          costing_method: b.costing,
          current_stage_code: b.stage,
          stage_id: stage?.stage_id,
          shed_id: shedMap.get(b.shedCode)!,
          location_id: penMap.get(b.penCode)!,
          start_date: b.start,
          expected_end_date: b.end,
          opening_quantity: b.qty,
          closing_quantity: b.status === 'CLOSED' ? '98.0000' : b.qty,
          uom: 'HEAD',
          status: b.status,
          remarks: b.remarks,
          created_by: userId,
        });

        if (b.costing === 'BIO_ASSET') {
          const bioStage = b.stage === 'DRY_SOW_GESTATION' || b.stage === 'LACTATION' ? 'MATURE' : 'PREMATURE';
          await db.insert(schema.batchBioAssetState).values({
            state_id: randomUUID(),
            batch_id: batId,
            stage: bioStage,
            current_quantity: b.qty,
            nca_book_value: bioStage === 'MATURE' ? (Number(b.qty) * 28000).toFixed(4) : '0.0000',
          });
        } else {
          await db.insert(schema.batchStandard).values({
            standard_id: randomUUID(),
            batch_id: batId,
            std_output_quantity: b.qty,
            std_output_cost_per_unit: '12500.000000',
            std_overhead_rate_per_unit: '500.000000',
          });
        }

        // 18.1 Multi-Day Entries for Gestation Batch (30 days of Gestation Feed)
        if (b.no === 'PIG-BAT-2026-0001') {
          const gestFeedId = itemMap.get('FEED-GEST-SOW')!;
          for (let d = 1; d <= 30; d++) {
            const dayStr = d < 10 ? `0${d}` : `${d}`;
            const qty = '48.0000'; // 20 sows * 2.4 kg
            const amt = (48 * 28).toFixed(4); // ₹28/kg = ₹1,344
            await db.insert(schema.batchTransaction).values({
              transaction_id: randomUUID(),
              batch_id: batId,
              transaction_date: `2026-07-${dayStr}`,
              transaction_type: 'CONSUMPTION',
              item_id: gestFeedId,
              quantity: qty,
              uom: 'KG',
              rate: '28.000000',
              amount: amt,
              remarks: `Daily gestation mash ration Day ${d}`,
              created_by: userId,
            });
          }
        }

        // 18.2 Multi-Day Entries for Nursery Piglet Batch (21 days of Creep Feed + Day 3 Iron)
        if (b.no === 'PIG-BAT-2026-0002') {
          const creepFeedId = itemMap.get('FEED-CREEP-PRE')!;
          const ironMedId = itemMap.get('MED-IRON-DEX')!;

          // Iron Dextran Injection Day 3
          await db.insert(schema.batchTransaction).values({
            transaction_id: randomUUID(),
            batch_id: batId,
            transaction_date: '2026-07-31',
            transaction_type: 'CONSUMPTION',
            item_id: ironMedId,
            quantity: '50.0000', // 25 piglets * 2ml
            uom: 'ML',
            rate: '1.800000',
            amount: '90.0000',
            remarks: 'Day 3 Anemia Prevention Iron Dextran 2ml IM per piglet',
            created_by: userId,
          });

          // 21 days creep feed consumption ramp
          for (let d = 1; d <= 21; d++) {
            const dayMonth = d <= 3 ? `2026-07-${28 + d}` : `2026-08-${d - 3 < 10 ? `0${d - 3}` : `${d - 3}`}`;
            const dailyKg = (3.5 + d * 0.45).toFixed(2);
            const amt = (Number(dailyKg) * 55).toFixed(4);
            await db.insert(schema.batchTransaction).values({
              transaction_id: randomUUID(),
              batch_id: batId,
              transaction_date: dayMonth,
              transaction_type: 'CONSUMPTION',
              item_id: creepFeedId,
              quantity: dailyKg,
              uom: 'KG',
              rate: '55.000000',
              amount: amt,
              remarks: `Nursing piglet pre-starter creep feed Day ${d}`,
              created_by: userId,
            });
          }
        }

        // 18.3 Multi-Day Entries for Commercial Grower Batch (30 days feed + 1 mortality + 4 weight weigh-ins)
        if (b.no === 'PIG-BAT-2026-0003') {
          const weanFeedId = itemMap.get('FEED-WEAN-GROW')!;
          for (let d = 1; d <= 30; d++) {
            const dayMonth = d <= 16 ? `2026-07-${14 + d}` : `2026-08-${d - 16 < 10 ? `0${d - 16}` : `${d - 16}`}`;
            const headCount = d >= 8 ? 119 : 120;
            const perPigKg = 1.2 + d * 0.045; // 1.25kg rising to 2.55kg
            const totalKg = (headCount * perPigKg).toFixed(2);
            const amt = (Number(totalKg) * 34.5).toFixed(4);

            await db.insert(schema.batchTransaction).values({
              transaction_id: randomUUID(),
              batch_id: batId,
              transaction_date: dayMonth,
              transaction_type: 'CONSUMPTION',
              item_id: weanFeedId,
              quantity: totalKg,
              uom: 'KG',
              rate: '34.500000',
              amount: amt,
              remarks: `Grower feed consumption Day ${d} (${headCount} head @ ${perPigKg.toFixed(2)} kg/head)`,
              created_by: userId,
            });
          }

          // Mortality on Day 8
          await db.insert(schema.batchTransaction).values({
            transaction_id: randomUUID(),
            batch_id: batId,
            transaction_date: '2026-07-22',
            transaction_type: 'MORTALITY',
            quantity: '1.0000',
            uom: 'HEAD',
            remarks: 'Natural acute mortality in grower pen',
            created_by: userId,
          });

          // Weekly Weight Weigh-in Logs on Days 7, 14, 21, 28
          const weighIns = [
            { date: '2026-07-21', avgWt: '28.50', totWt: '3420.00', gain: '0.62' },
            { date: '2026-07-28', avgWt: '33.20', totWt: '3950.80', gain: '0.67' },
            { date: '2026-08-04', avgWt: '38.60', totWt: '4593.40', gain: '0.77' },
            { date: '2026-08-11', avgWt: '44.50', totWt: '5295.50', gain: '0.84' },
          ];
          for (const wi of weighIns) {
            await db.insert(schema.batchTransaction).values({
              transaction_id: randomUUID(),
              batch_id: batId,
              transaction_date: wi.date,
              transaction_type: 'WEIGHT_ENTRY',
              quantity: wi.avgWt,
              uom: 'KG',
              remarks: `Weekly weight check: Avg ${wi.avgWt} kg/head (Total ${wi.totWt} kg, ADG ${wi.gain} kg/day)`,
              created_by: userId,
            });
          }
        }

        // 18.4 Closed Finisher Batch Output Sale Transaction
        if (b.no === 'PIG-BAT-2026-0004') {
          const finisherBioId = itemMap.get('BIO-SWINE-FINISHER')!;
          await db.insert(schema.batchTransaction).values({
            transaction_id: randomUUID(),
            batch_id: batId,
            transaction_date: '2026-07-15',
            transaction_type: 'OUTPUT',
            item_id: finisherBioId,
            quantity: '98.0000',
            uom: 'HEAD',
            rate: '12400.000000',
            amount: '1215200.0000',
            remarks: 'Final harvest of finished market porkers sold to Apex Meat Processors',
            created_by: userId,
          });
        }
      }
    }

    // 19. Seed Realistic Batch KPI Alerts & Deviation Logs
    console.log('   - Seeding Batch KPI Alerts & Deviation Logs...');
    const allBatches = await db.select().from(schema.batchHeader).where(eq(schema.batchHeader.company_id, companyId));
    const batchMap = new Map(allBatches.map((b) => [b.batch_no, b]));

    const growerBatch = batchMap.get('PIG-BAT-2026-0003');
    const gestBatch = batchMap.get('PIG-BAT-2026-0001');
    const farrBatch = batchMap.get('PIG-BAT-2026-0002');
    const finBatch = batchMap.get('PIG-BAT-2026-0004');

    // Get all scheduler parameter lines for linking
    const allSpls = await db.select().from(schema.schedulerParameterLine);
    const splBySchedAndParam = new Map(
      allSpls.map((spl) => [`${spl.scheduler_id}_${spl.parameter_id}`, spl.spl_id])
    );

    const growerFeedParamId = parameterMap.get('PARAM-FEED-GROW');
    const gestFeedParamId = parameterMap.get('PARAM-FEED-GEST');
    const mortParamId = parameterMap.get('PARAM-MORT-PIG');
    const tempParamId = parameterMap.get('PARAM-TEMP-PIG');
    const porkOutputParamId = parameterMap.get('PARAM-PORK-OUTPUT');

    const seedAlerts = [
      {
        batch: growerBatch,
        splId: growerBatch && growerFeedParamId ? splBySchedAndParam.get(`${growerBatch.scheduler_id}_${growerFeedParamId}`) : null,
        severity: 'CRITICAL',
        title: 'Grower Feed Intake Above KPI (+28.4% deviation)',
        message: 'Daily feed consumption of 308.20 kg exceeded the scheduled benchmark standard of 240.00 kg (critical tolerance breach +20.00%).',
        paramName: 'Grower Feed Consumption',
        kpiMode: 'PCT',
        expected: '240.0000',
        actual: '308.2000',
        devAmount: '68.2000',
        devPct: '28.42',
        kpiMin: '216.0000',
        kpiMax: '264.0000',
        isRead: false,
        readBy: null,
        readAt: null,
      },
      {
        batch: gestBatch,
        splId: gestBatch && gestFeedParamId ? splBySchedAndParam.get(`${gestBatch.scheduler_id}_${gestFeedParamId}`) : null,
        severity: 'WARNING',
        title: 'Gestation Feed Intake Below Benchmark (-14.0% deviation)',
        message: 'Daily ration intake of 41.28 kg was logged vs target benchmark 48.00 kg (outside -10.00% benchmark range).',
        paramName: 'Gestation Feed Intake',
        kpiMode: 'PCT',
        expected: '48.0000',
        actual: '41.2800',
        devAmount: '-6.7200',
        devPct: '-14.00',
        kpiMin: '43.2000',
        kpiMax: '52.8000',
        isRead: false,
        readBy: null,
        readAt: null,
      },
      {
        batch: farrBatch,
        splId: farrBatch && mortParamId ? splBySchedAndParam.get(`${farrBatch.scheduler_id}_${mortParamId}`) : null,
        severity: 'CRITICAL',
        title: 'Pre-Weaning Piglet Mortality Limit Exceeded',
        message: 'Acute mortality of 2 piglets exceeded the standard benchmark limit (maximum standard 0 head/day).',
        paramName: 'Pre-Weaning Piglet Mortality',
        kpiMode: 'VALUE',
        expected: '0.0000',
        actual: '2.0000',
        devAmount: '2.0000',
        devPct: '200.00',
        kpiMin: '0.0000',
        kpiMax: '0.0000',
        isRead: false,
        readBy: null,
        readAt: null,
      },
      {
        batch: growerBatch,
        splId: growerBatch && tempParamId ? splBySchedAndParam.get(`${growerBatch.scheduler_id}_${tempParamId}`) : null,
        severity: 'WARNING',
        title: 'Shed Temperature Above Benchmark (+28.3% deviation)',
        message: 'Afternoon environmental sensor recorded 29.5°C against standard maximum threshold of 26.0°C.',
        paramName: 'Shed Ambient Temperature',
        kpiMode: 'VALUE',
        expected: '23.0000',
        actual: '29.5000',
        devAmount: '6.5000',
        devPct: '28.26',
        kpiMin: '20.0000',
        kpiMax: '26.0000',
        isRead: true,
        readBy: userId,
        readAt: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      },
      {
        batch: finBatch,
        splId: finBatch && porkOutputParamId ? splBySchedAndParam.get(`${finBatch.scheduler_id}_${porkOutputParamId}`) : null,
        severity: 'WARNING',
        title: 'Carcass Harvest Yield Below Benchmark (-6.2% deviation)',
        message: 'Average dressed pork carcass weight was 79.7 kg/head against target 85.0 kg/head.',
        paramName: 'Dressed Pork Carcass Yield',
        kpiMode: 'PCT',
        expected: '85.0000',
        actual: '79.7000',
        devAmount: '-5.3000',
        devPct: '-6.24',
        kpiMin: '80.7500',
        kpiMax: '89.2500',
        isRead: true,
        readBy: userId,
        readAt: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      },
    ];

    for (const a of seedAlerts) {
      if (!a.batch?.batch_id) continue;
      const [existingAlert] = await db
        .select()
        .from(schema.notificationAlertLog)
        .where(
          and(
            eq(schema.notificationAlertLog.company_id, companyId),
            eq(schema.notificationAlertLog.batch_id, a.batch.batch_id),
            eq(schema.notificationAlertLog.title, a.title)
          )
        )
        .limit(1);

      if (!existingAlert) {
        await db.insert(schema.notificationAlertLog).values({
          alert_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          lob_id: lobId,
          batch_id: a.batch.batch_id,
          spl_id: a.splId || null,
          alert_type: 'KPI_DEVIATION',
          severity: a.severity,
          title: a.title,
          message: a.message,
          parameter_name: a.paramName,
          kpi_mode: a.kpiMode,
          expected_value: a.expected,
          actual_value: a.actual,
          deviation_amount: a.devAmount,
          deviation_pct: a.devPct,
          kpi_min: a.kpiMin,
          kpi_max: a.kpiMax,
          is_read: a.isRead,
          read_by: a.readBy,
          read_at: a.readAt,
        });
      }
    }

    console.log('\n✅ Piggery comprehensive master & operational dataset successfully seeded!');
    console.log('===========================================================');
    console.log(`- 6 Cost Centers (Farms, Breeding, Farrowing, Grower, Feedmill, Admin)`);
    console.log(`- 9 Item Categories & 8 Item Attributes`);
    console.log(`- 24 Comprehensive Item Masters (Feeds, Meds, Vaccines, Bio Assets)`);
    console.log(`- 5 Medicines Master Profiles with Composition, Dosage & Withdrawal`);
    console.log(`- 4 Complete Feed Formulas with Multi-Ingredient Inclusion %`);
    console.log(`- 10 Production Parameters (Feeds, Mortality, Water, Temp, Weight, Output)`);
    console.log(`- 4 Production Schedulers (Gestation 114d, Farrowing 28d, Grower 60d, Finisher 90d) with KPI Lines`);
    console.log(`- 2 Goods Receipts & FIFO Inbound Inventory Ledger Postings`);
    console.log(`- 5 Finance GL Double-Entry Journal Postings with Cost Centers`);
    console.log(`- 15 Tagged Swine Herd Animals with RFIDs & Book Values`);
    console.log(`- 4 Mating Records, 2 Farrowing Litters & 2 Boar Semen Batches`);
    console.log(`- 4 Production Batches Linked to Schedulers with 30-Day Multi-Entry Streams`);
    console.log(`- 5 KPI Deviation Alert Logs across Gestation, Farrowing, Grower & Finisher Batches\n`);
  } finally {
    await pool.end();
  }
}

// Direct execution support
if (require.main === module) {
  void seedPiggeryData().catch((err) => {
    console.error('❌ Piggery seed failed:', err);
    process.exitCode = 1;
  });
}
