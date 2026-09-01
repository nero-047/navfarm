import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/mysql2';
import { and, eq, isNull } from 'drizzle-orm';
import * as mysql from 'mysql2/promise';
import * as schema from '../core/database/schema';

/**
 * Fills the master-data and configuration tables that no earlier seed touches,
 * for BOTH companies, so no screen in the console renders an empty state.
 *
 * Every section is independently idempotent (select before insert) and wrapped
 * so one section failing does not abort the rest — rerun freely.
 */

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const ssl = process.env.DATABASE_SSL === 'true'
  ? { minVersion: 'TLSv1.2' as const, rejectUnauthorized: true }
  : undefined;
const tenantCode = process.env.DEV_TENANT_CODE || 'devco';
const dbName = `tenant_${tenantCode}`;

const d4 = (n: number) => n.toFixed(4);

export async function seedDemoGaps() {
  const pool = mysql.createPool({ host, port, user, password, database: dbName, ssl });
  const db = drizzle(pool, { schema, mode: 'default' });

  const run = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`  ✓ ${label}`);
    } catch (err) {
      console.error(`  ✗ ${label}: ${err instanceof Error ? err.message : err}`);
    }
  };

  try {
    const companies = await db.select().from(schema.companyMaster);
    if (companies.length === 0) throw new Error(`No companies in ${dbName}.`);
    const apex = companies.find((c) => c.company_code === 'APEXBREED') || companies[0];
    const high = companies.find((c) => c.company_code === 'HIGHLAND') || companies[1] || companies[0];
    const tenantId = apex.tenant_id;

    const [nob] = await db.select().from(schema.nobMaster).where(eq(schema.nobMaster.nob_code, 'LIVESTOCK')).limit(1);
    const [lob] = await db.select().from(schema.lobMaster).where(eq(schema.lobMaster.lob_code, 'LVS_PIGGERY')).limit(1);
    const nobId = nob?.nob_id ?? null;
    const lobId = lob?.lob_id ?? null;

    const [admin] = await db.select().from(schema.userMaster).where(eq(schema.userMaster.email, 'admin@apexagri.local')).limit(1);
    const by = admin?.user_id ?? null;

    const itemsFor = async (companyId: string) =>
      new Map(
        (await db.select().from(schema.itemMaster).where(eq(schema.itemMaster.company_id, companyId)))
          .map((i) => [i.item_code, i.item_id] as const)
      );
    const apexItems = await itemsFor(apex.company_id);
    const highItems = await itemsFor(high.company_id);

    const perCompany = [
      { c: apex, items: apexItems, tag: 'APX' },
      { c: high, items: highItems, tag: 'HGH' },
    ];

    console.log('\n🧩 Filling master-data gaps...');

    /* ── Suppliers ─────────────────────────────────────────────────────── */
    await run('Suppliers', async () => {
      for (const { c, tag } of perCompany) {
        const rows = [
          { code: `SUP-${tag}-001`, name: 'Nutrimix Feed Industries Pvt Ltd', type: 'FEED', email: 'sales@nutrimix.example', phone: '+91 98200 11223', city: 'Pune', state: 'Maharashtra', terms: 'NET30', credit: 1500000 },
          { code: `SUP-${tag}-002`, name: 'VetCare Pharmaceuticals', type: 'MEDICINE', email: 'orders@vetcare.example', phone: '+91 98200 44556', city: 'Hyderabad', state: 'Telangana', terms: 'NET15', credit: 500000 },
          { code: `SUP-${tag}-003`, name: 'AgriEquip Machinery & Spares', type: 'EQUIPMENT', email: 'support@agriequip.example', phone: '+91 98200 77889', city: 'Ludhiana', state: 'Punjab', terms: 'NET45', credit: 800000 },
          { code: `SUP-${tag}-004`, name: 'Premier Swine Genetics Import', type: 'LIVESTOCK', email: 'genetics@premierswine.example', phone: '+91 98200 33445', city: 'Bengaluru', state: 'Karnataka', terms: 'ADVANCE', credit: 2500000 },
        ];
        for (const r of rows) {
          const [x] = await db.select().from(schema.supplierMaster)
            .where(and(eq(schema.supplierMaster.company_id, c.company_id), eq(schema.supplierMaster.supplier_code, r.code))).limit(1);
          if (x) continue;
          await db.insert(schema.supplierMaster).values({
            supplier_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id,
            supplier_code: r.code, supplier_name: r.name, email: r.email, phone: r.phone,
            tax_number: `27AABCU${Math.floor(1000 + Math.random() * 8999)}M1Z5`, payment_terms: r.terms,
            address_line1: 'Plot 14, Industrial Estate', city: r.city, state: r.state, country: 'India', pincode: '411019',
            vendor_type: r.type, is_approved: true, approved_by: by, credit_limit: d4(r.credit),
            is_active: true, created_by: by,
          });
        }
      }
    });

    /* ── Customers ─────────────────────────────────────────────────────── */
    await run('Customers', async () => {
      for (const { c, tag } of perCompany) {
        const rows = [
          { code: `CUS-${tag}-001`, name: 'Apex Meat Processors Pvt Ltd', mobile: '+91 99300 10101', city: 'Mumbai', credit: 2000000 },
          { code: `CUS-${tag}-002`, name: 'Golden Pork Retail Chain', mobile: '+91 99300 20202', city: 'Pune', credit: 900000 },
          { code: `CUS-${tag}-003`, name: 'Highland Hotels & Catering', mobile: '+91 99300 30303', city: 'Goa', credit: 450000 },
        ];
        for (const r of rows) {
          const [x] = await db.select().from(schema.customerMaster)
            .where(and(eq(schema.customerMaster.company_id, c.company_id), eq(schema.customerMaster.customer_code, r.code))).limit(1);
          if (x) continue;
          await db.insert(schema.customerMaster).values({
            customer_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id,
            customer_code: r.code, customer_name: r.name, mobile: r.mobile,
            email: `${r.code.toLowerCase()}@buyers.example`,
            tax_number: `27AACCG${Math.floor(1000 + Math.random() * 8999)}K1Z2`,
            credit_limit: d4(r.credit), address_line1: 'Unit 8, Cold Chain Park', city: r.city,
            state: 'Maharashtra', country: 'India', pincode: '400072', is_active: true, created_by: by,
          });
        }
      }
    });

    /* ── Diseases ──────────────────────────────────────────────────────── */
    await run('Diseases', async () => {
      const rows = [
        { code: 'DIS-PRRS', name: 'Porcine Reproductive & Respiratory Syndrome', sci: 'Betaarterivirus suid', sym: 'Late-term abortion, stillbirths, respiratory distress in piglets, fever.', tx: 'No specific antiviral. Vaccinate breeding herd, strict biosecurity, all-in/all-out flow.' },
        { code: 'DIS-ASF', name: 'African Swine Fever', sci: 'Asfarviridae ASFV', sym: 'High fever, skin haemorrhage, sudden death, near 100% mortality.', tx: 'Notifiable. No vaccine or treatment — culling and movement control.' },
        { code: 'DIS-SWINEFLU', name: 'Swine Influenza', sci: 'Influenza A virus', sym: 'Coughing, nasal discharge, fever, sudden onset across the pen.', tx: 'Supportive care, NSAIDs, antibiotics for secondary infection. Vaccinate sows pre-farrow.' },
        { code: 'DIS-ILEITIS', name: 'Porcine Proliferative Enteropathy (Ileitis)', sci: 'Lawsonia intracellularis', sym: 'Loose dark faeces, poor growth, sudden death in finishers.', tx: 'Tylosin or tiamulin in feed/water. Oral vaccine available.' },
        { code: 'DIS-MASTITIS', name: 'Mastitis-Metritis-Agalactia (MMA)', sci: 'Coliform complex', sym: 'Hot swollen udder, no milk let-down, sow off-feed post-farrow.', tx: 'Antibiotics plus oxytocin. Improve farrowing-crate hygiene.' },
        { code: 'DIS-ERYSIP', name: 'Swine Erysipelas', sci: 'Erysipelothrix rhusiopathiae', sym: 'Diamond-shaped skin lesions, fever, joint swelling.', tx: 'Penicillin responds rapidly. Vaccinate breeding stock twice yearly.' },
      ];
      for (const { c } of perCompany) {
        for (const r of rows) {
          const [x] = await db.select().from(schema.diseaseMaster)
            .where(and(eq(schema.diseaseMaster.company_id, c.company_id), eq(schema.diseaseMaster.disease_code, r.code))).limit(1);
          if (x) continue;
          await db.insert(schema.diseaseMaster).values({
            disease_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id,
            disease_code: r.code, disease_name: r.name, scientific_name: r.sci,
            symptoms: r.sym, treatment_guideline: r.tx, is_active: true, created_by: by,
          });
        }
      }
    });

    /* ── Medicines (rides on the MED-* items each company already has) ──── */
    await run('Medicines', async () => {
      const profile: Record<string, { comp: string; dose: string; wd: number; route: string }> = {
        'MED-IRON-DEX': { comp: 'Iron dextran 200 mg/ml', dose: '2 ml IM at day 3 of age', wd: 0, route: 'INTRAMUSCULAR' },
        'MED-OXYTOCIN': { comp: 'Oxytocin 10 IU/ml', dose: '1-2 ml IM during farrowing, max 2 doses', wd: 0, route: 'INTRAMUSCULAR' },
        'MED-PENICILLIN': { comp: 'Procaine penicillin G 300,000 IU/ml', dose: '1 ml per 10 kg BW for 3-5 days', wd: 14, route: 'INTRAMUSCULAR' },
        'MED-IVERMECTIN': { comp: 'Ivermectin 1% w/v', dose: '1 ml per 33 kg BW subcutaneous', wd: 28, route: 'SUBCUTANEOUS' },
        'MED-TYLOSIN': { comp: 'Tylosin phosphate 100 g/kg', dose: '100 g per tonne of feed for 21 days', wd: 7, route: 'ORAL_IN_FEED' },
      };
      for (const { c, items } of perCompany) {
        for (const [code, p] of Object.entries(profile)) {
          const itemId = items.get(code);
          if (!itemId) continue;
          const [x] = await db.select().from(schema.medicineMaster)
            .where(and(eq(schema.medicineMaster.company_id, c.company_id), eq(schema.medicineMaster.item_id, itemId))).limit(1);
          if (x) continue;
          await db.insert(schema.medicineMaster).values({
            medicine_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id, item_id: itemId,
            composition: p.comp, dosage_guideline: p.dose, withdrawal_period_days: p.wd,
            route_of_administration: p.route, is_active: true, created_by: by,
          });
        }
      }
    });

    /* ── Resources + maintenance log ───────────────────────────────────── */
    await run('Resources & maintenance', async () => {
      for (const { c, tag } of perCompany) {
        const rows = [
          { code: `RES-${tag}-LAB01`, name: 'Farm Operations Crew (6 hands)', type: 'LABOUR', sub: 'PERMANENT', rate: 550, unit: 'HOUR', cap: 6, desig: 'Stockperson' },
          { code: `RES-${tag}-LAB02`, name: 'Veterinary Officer', type: 'LABOUR', sub: 'CONTRACT', rate: 1800, unit: 'HOUR', cap: 1, desig: 'Veterinarian' },
          { code: `RES-${tag}-EQ01`, name: 'Feed Mill & Pellet Line', type: 'EQUIPMENT', sub: 'FIXED', rate: 950, unit: 'HOUR', cap: 2, make: 'Buhler', model: 'MDDK-1000' },
          { code: `RES-${tag}-EQ02`, name: 'High-Pressure Washer', type: 'EQUIPMENT', sub: 'PORTABLE', rate: 180, unit: 'HOUR', cap: 1, make: 'Karcher', model: 'HD 6/15' },
          { code: `RES-${tag}-VH01`, name: 'Livestock Transport Truck', type: 'VEHICLE', sub: 'OWNED', rate: 42, unit: 'KM', cap: 40, make: 'Tata', model: 'LPT 1109' },
          { code: `RES-${tag}-UTIL01`, name: 'Grid Electricity Supply', type: 'UTILITY', sub: 'METERED', rate: 9.2, unit: 'KWH', cap: 1000 },
        ];
        for (const r of rows) {
          let [x] = await db.select().from(schema.resourceMaster)
            .where(and(eq(schema.resourceMaster.company_id, c.company_id), eq(schema.resourceMaster.resource_code, r.code))).limit(1);
          if (!x) {
            const id = randomUUID();
            await db.insert(schema.resourceMaster).values({
              resource_id: id, tenant_id: tenantId, company_id: c.company_id, nob_id: nobId, lob_id: lobId,
              resource_code: r.code, resource_name: r.name, resource_type: r.type, resource_sub_type: r.sub,
              capacity: d4(r.cap), unit: r.unit, capacity_uom: r.unit, cost_rate: d4(r.rate),
              asset_make: (r as any).make ?? null, asset_model: (r as any).model ?? null,
              designation: (r as any).desig ?? null,
              purchase_date: r.type === 'LABOUR' ? null : '2025-04-12',
              maintenance_frequency_days: r.type === 'LABOUR' ? null : 90,
              last_maintenance_date: r.type === 'LABOUR' ? null : '2026-06-15',
              next_maintenance_date: r.type === 'LABOUR' ? null : '2026-09-13',
              maintenance_cost_per_service: r.type === 'LABOUR' ? null : d4(4500),
              maintenance_vendor: r.type === 'LABOUR' ? null : 'AgriEquip Machinery & Spares',
              is_active: true, created_by: by,
            });
            [x] = [{ resource_id: id } as any];
          }
          if (r.type === 'LABOUR' || r.type === 'UTILITY') continue;
          const [log] = await db.select().from(schema.resourceMaintenanceLog)
            .where(eq(schema.resourceMaintenanceLog.resource_id, x!.resource_id)).limit(1);
          if (log) continue;
          for (const m of [
            { date: '2026-03-15', type: 'PREVENTIVE', desc: 'Quarterly service — bearings, belts, calibration.', cost: 4500 },
            { date: '2026-06-15', type: 'PREVENTIVE', desc: 'Quarterly service — filters replaced, alignment checked.', cost: 4800 },
          ]) {
            await db.insert(schema.resourceMaintenanceLog).values({
              log_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id,
              resource_id: x!.resource_id, maintenance_date: m.date, maintenance_type: m.type,
              description: m.desc, cost: d4(m.cost), performed_by: 'AgriEquip Machinery & Spares',
              created_by: by,
            });
          }
        }
      }
    });

    /* ── Point labour/power parameters at the resources that price them ──── */
    await run('Link overhead parameters to resources', async () => {
      // parameter_master.resource_id is what getDataEntry() reads to price an
      // overhead line. Without it the labour row showed a rate of nothing and
      // the screen costed six hours at six rupees.
      for (const { c, tag } of perCompany) {
        const resources = new Map(
          (await db.select().from(schema.resourceMaster).where(eq(schema.resourceMaster.company_id, c.company_id)))
            .map((r) => [r.resource_code, r.resource_id] as const)
        );
        const links: Array<[string, string]> = [
          ['PARAM-LABOUR-PIG', `RES-${tag}-LAB01`],
          ['PARAM-POWER-PIG', `RES-${tag}-UTIL01`],
        ];
        for (const [paramCode, resourceCode] of links) {
          const resourceId = resources.get(resourceCode);
          if (!resourceId) continue;
          await db.update(schema.parameterMaster)
            .set({ resource_id: resourceId })
            .where(and(
              eq(schema.parameterMaster.company_id, c.company_id),
              eq(schema.parameterMaster.parameter_code, paramCode),
            ));
        }
      }
    });

    /* ── Feed formulas + ingredients ───────────────────────────────────── */
    await run('Feed formulas', async () => {
      for (const { c, items } of perCompany) {
        const targets = [...items.keys()].filter((k) => k.startsWith('FEED-'));
        for (const targetCode of targets) {
          const targetId = items.get(targetCode)!;
          const code = `FRM-${targetCode.replace('FEED-', '')}`;
          const [x] = await db.select().from(schema.feedFormulaMaster)
            .where(and(eq(schema.feedFormulaMaster.company_id, c.company_id), eq(schema.feedFormulaMaster.formula_code, code))).limit(1);
          if (x) continue;
          const formulaId = randomUUID();
          await db.insert(schema.feedFormulaMaster).values({
            formula_id: formulaId, tenant_id: tenantId, company_id: c.company_id,
            formula_code: code, formula_name: `${targetCode} — 1 tonne mix sheet`,
            target_item_id: targetId, batch_size: d4(1000), batch_unit: 'KG',
            description: 'Least-cost ration sheet. Percentages are as-fed inclusion on a 1,000 kg batch.',
            is_active: true, created_by: by,
          });
          const rawCandidates = ['RAW-MAIZE-CORN', 'RAW-SOYA-MEAL', 'RAW-WHEAT-BRAN', 'RAW-SWINE-PREMIX'];
          const mix = [
            { code: 'RAW-MAIZE-CORN', pct: 58 },
            { code: 'RAW-SOYA-MEAL', pct: 24 },
            { code: 'RAW-WHEAT-BRAN', pct: 15 },
            { code: 'RAW-SWINE-PREMIX', pct: 3 },
          ].filter((m) => items.has(m.code));
          const usable = mix.length ? mix : rawCandidates.filter((r) => items.has(r)).map((r) => ({ code: r, pct: 25 }));
          for (const m of usable) {
            await db.insert(schema.feedFormulaIngredients).values({
              ingredient_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id,
              formula_id: formulaId, item_id: items.get(m.code)!,
              quantity: d4(1000 * (m.pct / 100)), unit: 'KG',
              inclusion_pct: m.pct.toFixed(2), loss_pct: '1.50', is_active: true, created_by: by,
            });
          }
        }
      }
    });

    /* ── Item attributes + values ──────────────────────────────────────── */
    await run('Item attributes', async () => {
      const attrs = [
        { code: 'ATTR-CP', name: 'Crude Protein', type: 'NUMBER', unit: '%', variant: false },
        { code: 'ATTR-ME', name: 'Metabolisable Energy', type: 'NUMBER', unit: 'kcal/kg', variant: false },
        { code: 'ATTR-FORM', name: 'Physical Form', type: 'LIST', unit: null, variant: true, list: ['MASH', 'PELLET', 'CRUMBLE'] },
        { code: 'ATTR-BAGSZ', name: 'Bag Size', type: 'LIST', unit: 'KG', variant: true, list: ['25', '50'] },
      ];
      const attrIds = new Map<string, string>();
      for (const a of attrs) {
        const [x] = await db.select().from(schema.itemAttributeMaster)
          .where(and(eq(schema.itemAttributeMaster.tenant_id, tenantId), eq(schema.itemAttributeMaster.attribute_code, a.code))).limit(1);
        if (!x) {
          const id = randomUUID();
          await db.insert(schema.itemAttributeMaster).values({
            attribute_id: id, tenant_id: tenantId, nob_id: nobId, lob_id: lobId,
            attribute_code: a.code, attribute_name: a.name, data_type: a.type,
            list_values: (a as any).list ?? null, unit: a.unit, is_mandatory: false,
            affects_costing: false, is_variant: a.variant, is_active: true, created_by: by,
          });
          attrIds.set(a.code, id);
        } else {
          attrIds.set(a.code, x.attribute_id);
        }
      }
      const values: Record<string, Record<string, string>> = {
        'FEED-GEST-SOW': { 'ATTR-CP': '14.0', 'ATTR-ME': '3050', 'ATTR-FORM': 'MASH', 'ATTR-BAGSZ': '50' },
        'FEED-LACT-SOW': { 'ATTR-CP': '18.0', 'ATTR-ME': '3250', 'ATTR-FORM': 'PELLET', 'ATTR-BAGSZ': '50' },
        'FEED-CREEP-PRE': { 'ATTR-CP': '22.0', 'ATTR-ME': '3450', 'ATTR-FORM': 'CRUMBLE', 'ATTR-BAGSZ': '25' },
        'FEED-WEAN-GROW': { 'ATTR-CP': '19.0', 'ATTR-ME': '3300', 'ATTR-FORM': 'PELLET', 'ATTR-BAGSZ': '50' },
        'FEED-FINISHER': { 'ATTR-CP': '16.0', 'ATTR-ME': '3200', 'ATTR-FORM': 'PELLET', 'ATTR-BAGSZ': '50' },
      };
      for (const { items } of perCompany) {
        for (const [itemCode, vals] of Object.entries(values)) {
          const itemId = items.get(itemCode);
          if (!itemId) continue;
          for (const [attrCode, v] of Object.entries(vals)) {
            const attributeId = attrIds.get(attrCode);
            if (!attributeId) continue;
            const [x] = await db.select().from(schema.itemAttributeValues)
              .where(and(eq(schema.itemAttributeValues.item_id, itemId), eq(schema.itemAttributeValues.attribute_id, attributeId))).limit(1);
            if (x) continue;
            await db.insert(schema.itemAttributeValues).values({
              value_id: randomUUID(), item_id: itemId, attribute_id: attributeId, attribute_value: v,
            });
          }
        }
      }
    });

    /* ── UOM conversions ───────────────────────────────────────────────── */
    await run('UOM conversions', async () => {
      const rows = [
        { from: 'TON', to: 'KG', f: 1000 },
        { from: 'BAG', to: 'KG', f: 50 },
        { from: 'KG', to: 'GRAM', f: 1000 },
        { from: 'LTR', to: 'ML', f: 1000 },
        { from: 'DOSE', to: 'ML', f: 80 },
        // Medicines are bought and priced by the vial/pack but dosed in ml or
        // grams; without these the data-entry screen charged a whole vial per ml.
        { from: 'VIAL', to: 'ML', f: 100 },
        { from: 'PACK', to: 'GRAM', f: 100 },
      ];
      for (const { c } of perCompany) {
        for (const r of rows) {
          const [x] = await db.select().from(schema.uomConversionMaster)
            .where(and(
              eq(schema.uomConversionMaster.company_id, c.company_id),
              eq(schema.uomConversionMaster.from_uom, r.from),
              eq(schema.uomConversionMaster.to_uom, r.to),
            )).limit(1);
          if (x) continue;
          await db.insert(schema.uomConversionMaster).values({
            conversion_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id,
            from_uom: r.from, to_uom: r.to, conversion_factor: r.f.toFixed(6),
            effective_from: '2026-01-01', is_active: true, created_by: by,
          });
        }
      }
    });

    /* ── Company profile: address, contacts, fiscal, modules ───────────── */
    await run('Company profiles', async () => {
      const [country] = await db.select().from(schema.countryMaster).limit(1);
      const [state] = await db.select().from(schema.stateProvince).limit(1);
      for (const { c, tag } of perCompany) {
        const [addr] = await db.select().from(schema.companyAddress).where(eq(schema.companyAddress.company_id, c.company_id)).limit(1);
        if (!addr && country && state) {
          await db.insert(schema.companyAddress).values({
            address_id: randomUUID(), company_id: c.company_id, address_type: 'REGISTERED',
            address_label: 'Head Office', line1: `${tag === 'APX' ? 'Survey 118, Nucleus Farm Road' : 'Plot 42, Grow-Finish Complex'}`,
            line2: 'Taluka Haveli', city: tag === 'APX' ? 'Pune' : 'Kolhapur',
            state_id: state.state_id, country_id: country.country_id, pincode: tag === 'APX' ? '412115' : '416003',
            gps_latitude: tag === 'APX' ? '18.516700' : '16.705000',
            gps_longitude: tag === 'APX' ? '73.856300' : '74.243300',
            is_primary: true, is_active: true,
          });
        }
        const [ct] = await db.select().from(schema.companyContacts).where(eq(schema.companyContacts.company_id, c.company_id)).limit(1);
        if (!ct) {
          for (const p of [
            { type: 'PRIMARY', name: tag === 'APX' ? 'Dr. Arjun Sharma' : 'Vikram Singh', desig: 'Company Administrator', email: tag === 'APX' ? 'arjun.sharma@apexagri.local' : 'vikram.singh@highlandpork.local', primary: true },
            { type: 'FINANCE', name: 'Priya Deshmukh', desig: 'Finance Controller', email: `finance.${tag.toLowerCase()}@navfarm.local`, primary: false },
            { type: 'VETERINARY', name: 'Dr. Sanjay Kulkarni', desig: 'Consulting Veterinarian', email: `vet.${tag.toLowerCase()}@navfarm.local`, primary: false },
          ]) {
            await db.insert(schema.companyContacts).values({
              contact_id: randomUUID(), company_id: c.company_id, contact_type: p.type,
              full_name: p.name, designation: p.desig, email: p.email,
              phone_primary: '+91 98220 10000', receives_alerts: true, receives_reports: p.type !== 'VETERINARY',
              is_primary: p.primary, is_active: true,
            });
          }
        }
        const [fy] = await db.select().from(schema.companyFiscal).where(eq(schema.companyFiscal.company_id, c.company_id)).limit(1);
        if (!fy) {
          await db.insert(schema.companyFiscal).values({
            fiscal_id: randomUUID(), company_id: c.company_id, fiscal_year_format: 'APR-MAR',
            fiscal_start_month: 4, fiscal_start_day: 1, fiscal_end_day: 31, current_fiscal_year: '2026-2027',
            period_type: 'MONTHLY', accounting_standard: 'IND_AS', depreciation_method: 'SLM',
            inventory_valuation: 'FIFO', gst_filing_frequency: 'MONTHLY', tax_audit_applicable: true,
            decimal_places: 2, is_active: true,
          });
        }
        const [mod] = await db.select().from(schema.companyModules).where(eq(schema.companyModules.company_id, c.company_id)).limit(1);
        if (!mod) {
          for (const code of ['PRODUCTION', 'INVENTORY', 'FINANCE', 'LIVESTOCK', 'MASTER_DATA', 'TRACEABILITY', 'APPROVALS', 'NOTIFICATIONS']) {
            await db.insert(schema.companyModules).values({
              module_id: randomUUID(), company_id: c.company_id, module_code: code,
              is_active: true, activated_on: '2026-01-01', activated_by: by, license_expiry: '2027-03-31',
            });
          }
        }
      }
    });

    /* ── Notification channels ─────────────────────────────────────────── */
    await run('Notification channels', async () => {
      for (const { c, tag } of perCompany) {
        const [x] = await db.select().from(schema.notificationConfig).where(eq(schema.notificationConfig.company_id, c.company_id)).limit(1);
        if (x) continue;
        await db.insert(schema.notificationConfig).values({
          notif_id: randomUUID(), company_id: c.company_id, channel: 'EMAIL', is_enabled: true,
          smtp_host: 'smtp.mailtrap.io', smtp_port: 2525, smtp_user: 'navfarm-demo',
          from_email: `alerts.${tag.toLowerCase()}@navfarm.local`, from_name: 'NAVFarm Alerts',
          test_status: 'PASSED', test_sent_at: '2026-08-20 09:00:00', is_active: true,
        });
        await db.insert(schema.notificationConfig).values({
          notif_id: randomUUID(), company_id: c.company_id, channel: 'IN_APP', is_enabled: true, is_active: true,
        });
      }
    });

    /* ── Operational area settings ─────────────────────────────────────── */
    await run('Operational area settings', async () => {
      const areas = await db.select().from(schema.operationalAreaMaster);
      for (const a of areas) {
        const [x] = await db.select().from(schema.operationalAreaSettings)
          .where(eq(schema.operationalAreaSettings.area_id, a.area_id)).limit(1);
        if (x) continue;
        await db.insert(schema.operationalAreaSettings).values({
          setting_id: randomUUID(), tenant_id: tenantId, company_id: a.company_id, area_id: a.area_id,
          costing_method: 'STANDARD', default_feed_uom: 'KG', mortality_threshold_pct: '2.00',
          temp_threshold_min: '18.00', temp_threshold_max: '28.00',
          auto_approve_ration_under_qty: d4(100), created_by: by,
        });
      }
    });

    /* ── Animal medication log ─────────────────────────────────────────── */
    await run('Animal medication log', async () => {
      for (const { c, items } of perCompany) {
        const animals = await db.select().from(schema.animalRegister)
          .where(eq(schema.animalRegister.company_id, c.company_id)).limit(8);
        const med = items.get('MED-IVERMECTIN') || items.get('MED-PENICILLIN') || items.get('MED-TYLOSIN');
        if (!med || animals.length === 0) return;
        for (const [i, a] of animals.entries()) {
          const [x] = await db.select().from(schema.animalMedicationLog)
            .where(eq(schema.animalMedicationLog.animal_id, a.animal_id)).limit(1);
          if (x) continue;
          await db.insert(schema.animalMedicationLog).values({
            log_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id,
            animal_id: a.animal_id, item_id: med,
            administered_date: `2026-08-${String(5 + (i % 20)).padStart(2, '0')}`,
            dose_qty: d4(4), uom: 'ML', administered_by: 'Dr. Sanjay Kulkarni',
            notes: 'Routine endo/ecto-parasite control. Withdrawal period recorded against the item.',
            created_by: by,
          });
        }
      }
    });

    console.log('\n🐖 Filling operational gaps...');

    /* ── Highland grow-finish herd: stages, pens, tail-enders ──────────── */
    await run('Highland herd stages & pens', async () => {
      const stages = new Map(
        (await db.select().from(schema.stageMaster)).map((st) => [st.stage_code, st.stage_id] as const)
      );
      const pens = new Map(
        (await db.select().from(schema.locationMaster).where(eq(schema.locationMaster.company_id, high.company_id)))
          .map((l) => [l.location_code, l.location_id] as const)
      );
      const batches = await db.select().from(schema.batchHeader).where(eq(schema.batchHeader.company_id, high.company_id));
      const grower = batches.find((b) => b.batch_no === 'PIG-BAT-2026-0101');
      const finisher = batches.find((b) => b.batch_no === 'PIG-BAT-2026-0102');
      if (!grower) return;

      const animals = await db.select().from(schema.animalRegister)
        .where(eq(schema.animalRegister.company_id, high.company_id));

      // Most of the cohort is on the grow-out floor. A few are held back: two
      // in the nursery pen still at QUARANTINE (light tail-enders that never
      // made weight), and two already drafted to the finisher pen ahead of the
      // rest. Same batch, three stages, three pens.
      animals.forEach(() => undefined);
      for (const [i, a] of animals.entries()) {
        let stage = 'CB_GROWER';
        let pen = 'PEN-GROW-02';
        let batchId = grower.batch_id;
        if (i % 6 === 0) { stage = 'QUARANTINE'; pen = 'PEN-QUAR-02'; }
        else if (i % 6 === 1) { stage = 'SLAUGHTER'; pen = 'PEN-FIN-03'; if (finisher) batchId = finisher.batch_id; }
        await db.update(schema.animalRegister).set({
          current_stage_id: stages.get(stage),
          current_location_id: pens.get(pen) ?? a.current_location_id,
          current_batch_id: batchId,
        }).where(eq(schema.animalRegister.animal_id, a.animal_id));
      }
    });

    /* ── Batch input / output lines ────────────────────────────────────── */
    await run('Batch input & output lines', async () => {
      for (const { c, items } of perCompany) {
        const batches = await db.select().from(schema.batchHeader).where(eq(schema.batchHeader.company_id, c.company_id));
        // Deterministic pick — Map order depends on insert order, and these rates
        // feed the standard-cost baseline computed at the end of this script.
        const codesSorted = [...items.entries()].sort(([a], [b2]) => a.localeCompare(b2));
        const feed = codesSorted.find(([k]) => k.startsWith('FEED-'))?.[1];
        const bio = (codesSorted.find(([k]) => k === 'BIO-SWINE-PIGLET')
          ?? codesSorted.find(([k]) => k.startsWith('BIO-SWINE-')))?.[1];
        const rateOf = async (itemId: string) => {
          const [it] = await db.select().from(schema.itemMaster).where(eq(schema.itemMaster.item_id, itemId)).limit(1);
          return Number(it?.standard_cost ?? 0);
        };
        const [wh] = await db.select().from(schema.warehouseMaster).where(eq(schema.warehouseMaster.company_id, c.company_id)).limit(1);
        for (const b of batches) {
          const [hasIn] = await db.select().from(schema.batchInputLine).where(eq(schema.batchInputLine.batch_id, b.batch_id)).limit(1);
          if (!hasIn && bio) {
            await db.insert(schema.batchInputLine).values({
              line_id: randomUUID(), batch_id: b.batch_id, line_no: 1, item_id: bio,
              quantity: b.opening_quantity, uom: 'HEAD', rate: (await rateOf(bio)).toFixed(6),
              amount: d4(Number(b.opening_quantity) * (await rateOf(bio))),
            });
          }
          if (!hasIn && feed) {
            await db.insert(schema.batchInputLine).values({
              line_id: randomUUID(), batch_id: b.batch_id, line_no: 2, item_id: feed,
              quantity: d4(Number(b.opening_quantity) * 45), uom: 'KG', rate: (await rateOf(feed)).toFixed(6),
              amount: d4(Number(b.opening_quantity) * 45 * (await rateOf(feed))),
            });
          }
          // Output lines are written by batch close(). Only a batch that already
          // closed should carry them — seeding them onto an ACTIVE batch would
          // show harvested output for a batch that has not been harvested.
          const [hasOut] = await db.select().from(schema.batchOutputLine).where(eq(schema.batchOutputLine.batch_id, b.batch_id)).limit(1);
          if (!hasOut && bio && b.status === 'CLOSED') {
            await db.insert(schema.batchOutputLine).values({
              line_id: randomUUID(), batch_id: b.batch_id, item_id: bio, output_type: 'MAIN',
              cost_split_pct: '100.00', quantity: b.closing_quantity ?? b.opening_quantity, uom: 'HEAD',
              computed_cost: d4(Number(b.closing_quantity ?? b.opening_quantity) * 28500),
              unit_cost: '28500.000000', warehouse_id: wh?.warehouse_id ?? null,
            });
          }
        }
      }
    });

    /* ── Bio-asset ledger (feeds Finance ▸ Bio-Asset Reconciliation) ───── */
    await run('Bio-asset ledger', async () => {
      for (const { c, items } of perCompany) {
        const [existing] = await db.select().from(schema.bioAssetLedger)
          .where(eq(schema.bioAssetLedger.company_id, c.company_id)).limit(1);
        if (existing) continue;
        const bio = [...items.entries()].find(([k]) => k.startsWith('BIO-SWINE-'))?.[1];
        if (!bio) continue;
        const batches = await db.select().from(schema.batchHeader).where(eq(schema.batchHeader.company_id, c.company_id));
        for (const b of batches) {
          const qty = Number(b.opening_quantity);
          const rows = [
            { type: 'ACQUISITION', date: b.start_date, qty, amount: qty * 26000, doc: `ACQ-${b.batch_no}` },
            { type: 'APPRECIATION', date: '2026-08-01', qty: 0, amount: qty * 1200, doc: `APP-${b.batch_no}` },
            { type: 'AMORTISATION', date: '2026-08-31', qty: 0, amount: -(qty * 450), doc: `AMT-${b.batch_no}` },
          ];
          for (const r of rows) {
            await db.insert(schema.bioAssetLedger).values({
              entry_id: randomUUID(), tenant_id: tenantId, company_id: c.company_id,
              bio_asset_item_id: bio, entry_type: r.type, document_no: r.doc,
              posting_date: r.date, asset_tracking_type: 'BATCH', batch_no: b.batch_no,
              stage: b.current_stage_code, status: 'POSTED', quantity: d4(r.qty),
              cost_amount: d4(r.amount), cost_amount_each_unit: qty ? d4(r.amount / qty) : '0.0000',
              costing_method: b.costing_method, nob_id: nobId, lob_id: lobId,
              batch_id: b.batch_id, created_by: by,
            });
          }
        }
      }
    });

    /* ── Notification log & per-user preferences ───────────────────────── */
    await run('Notification log & preferences', async () => {
      for (const { c, tag } of perCompany) {
        const [x] = await db.select().from(schema.notificationLog).where(eq(schema.notificationLog.company_id, c.company_id)).limit(1);
        if (!x) {
          const msgs = [
            { to: `alerts.${tag.toLowerCase()}@navfarm.local`, ch: 'EMAIL', msg: 'Feed consumption 14% below plan on PIG-BAT-2026-0001, day 46.', status: 'SENT', at: '2026-08-15 07:30:00' },
            { to: `alerts.${tag.toLowerCase()}@navfarm.local`, ch: 'EMAIL', msg: 'Mortality threshold breached: 2 head recorded against a 1% limit.', status: 'SENT', at: '2026-08-16 06:05:00' },
            { to: 'ops-team', ch: 'IN_APP', msg: 'Goods receipt GRN-2026-APX-0002 posted to the inventory ledger.', status: 'SENT', at: '2026-08-02 11:20:00' },
            { to: `alerts.${tag.toLowerCase()}@navfarm.local`, ch: 'EMAIL', msg: 'Scheduled vaccination due in 3 days for the gestation cohort.', status: 'FAILED', at: '2026-08-28 09:00:00', err: 'SMTP 421 — upstream throttled, will retry.' },
          ];
          for (const m of msgs) {
            await db.insert(schema.notificationLog).values({
              log_id: randomUUID(), company_id: c.company_id, recipient: m.to, channel: m.ch,
              message: m.msg, status: m.status, error_message: (m as any).err ?? null, sent_at: m.at,
            });
          }
        }
      }
      const users = await db.select().from(schema.userMaster);
      for (const u of users) {
        const [x] = await db.select().from(schema.userNotificationPref).where(eq(schema.userNotificationPref.user_id, u.user_id)).limit(1);
        if (x) continue;
        for (const cat of ['KPI_BREACH', 'MORTALITY', 'APPROVALS', 'INVENTORY', 'SCHEDULE']) {
          await db.insert(schema.userNotificationPref).values({
            pref_id: randomUUID(), user_id: u.user_id, category: cat,
            email_enabled: cat !== 'INVENTORY', in_app_enabled: true,
          });
        }
      }
    });

    /* ── Company currency & language configuration ─────────────────────── */
    await run('Company currency & language', async () => {
      const currencies = await db.select().from(schema.currencyMaster);
      const languages = await db.select().from(schema.languageMaster);
      for (const { c } of perCompany) {
        const [cc] = await db.select().from(schema.companyCurrencyConfig).where(eq(schema.companyCurrencyConfig.company_id, c.company_id)).limit(1);
        if (!cc) {
          for (const [i, cur] of currencies.entries()) {
            await db.insert(schema.companyCurrencyConfig).values({
              curr_config_id: randomUUID(), company_id: c.company_id, currency_id: cur.currency_id,
              is_base: i === 0, is_reporting: i === 0, display_order: i + 1,
            });
          }
        }
        const [lc] = await db.select().from(schema.companyLanguageConfig).where(eq(schema.companyLanguageConfig.company_id, c.company_id)).limit(1);
        if (!lc) {
          for (const [i, lang] of languages.entries()) {
            await db.insert(schema.companyLanguageConfig).values({
              config_id: randomUUID(), company_id: c.company_id, lang_id: lang.lang_id,
              is_default: i === 0, is_enabled: true, set_by: by, set_at: '2026-01-01 00:00:00',
            });
          }
        }
      }
    });

    /* ── Vaccination & medication protocols per breed lifecycle stage ─────── */
    await run('Vaccination & medication protocols', async () => {
      // breed_lifecycle_stages has carried vaccination_protocol and
      // medication_protocol as JSON columns since the schema was written, and
      // all 44 rows were null — the health screen had nothing to read.
      // Standard commercial swine programme, keyed by stage.
      const byStage: Record<string, { vaccination: unknown[]; medication: unknown[] }> = {
        QUARANTINE: {
          vaccination: [
            { vaccine: 'Erysipelas', day: 7, route: 'INTRAMUSCULAR', dose: '2 ml' },
            { vaccine: 'Classical Swine Fever', day: 14, route: 'INTRAMUSCULAR', dose: '2 ml' },
          ],
          medication: [
            { medicine: 'Ivermectin 1%', day: 3, route: 'SUBCUTANEOUS', dose: '1 ml/33 kg', withdrawal_days: 28 },
          ],
        },
        GILT_GROWER: {
          vaccination: [
            { vaccine: 'Parvovirus + Leptospirosis', day: 42, route: 'INTRAMUSCULAR', dose: '2 ml' },
            { vaccine: 'Parvovirus booster', day: 63, route: 'INTRAMUSCULAR', dose: '2 ml' },
          ],
          medication: [
            { medicine: 'Ivermectin 1%', day: 56, route: 'SUBCUTANEOUS', dose: '1 ml/33 kg', withdrawal_days: 28 },
          ],
        },
        FLUSH_SERVICE: {
          vaccination: [{ vaccine: 'Erysipelas booster', day: 3, route: 'INTRAMUSCULAR', dose: '2 ml' }],
          medication: [],
        },
        DRY_SOW_GESTATION: {
          vaccination: [
            { vaccine: 'E. coli / Clostridium (pre-farrow 1)', day: 84, route: 'INTRAMUSCULAR', dose: '2 ml' },
            { vaccine: 'E. coli / Clostridium (pre-farrow 2)', day: 98, route: 'INTRAMUSCULAR', dose: '2 ml' },
          ],
          medication: [
            { medicine: 'Ivermectin 1%', day: 100, route: 'SUBCUTANEOUS', dose: '1 ml/33 kg', withdrawal_days: 28 },
          ],
        },
        FARROWING: {
          vaccination: [],
          medication: [
            { medicine: 'Oxytocin', day: 1, route: 'INTRAMUSCULAR', dose: '1-2 ml, max 2 doses', withdrawal_days: 0 },
          ],
        },
        LACTATION: {
          vaccination: [{ vaccine: 'Mycoplasma (piglets)', day: 21, route: 'INTRAMUSCULAR', dose: '1 ml' }],
          medication: [
            { medicine: 'Iron Dextran (piglets)', day: 3, route: 'INTRAMUSCULAR', dose: '2 ml', withdrawal_days: 0 },
          ],
        },
        WEANING: {
          vaccination: [{ vaccine: 'Circovirus (PCV2)', day: 1, route: 'INTRAMUSCULAR', dose: '1 ml' }],
          medication: [],
        },
        CB_GROWER: {
          vaccination: [{ vaccine: 'Mycoplasma booster', day: 14, route: 'INTRAMUSCULAR', dose: '2 ml' }],
          medication: [
            { medicine: 'Tylosin (in feed)', day: 21, route: 'ORAL_IN_FEED', dose: '100 g/tonne, 21 days', withdrawal_days: 7 },
          ],
        },
        BOAR_AI: {
          vaccination: [{ vaccine: 'Erysipelas (6-monthly)', day: 1, route: 'INTRAMUSCULAR', dose: '2 ml' }],
          medication: [],
        },
      };

      const stages = await db.select().from(schema.stageMaster);
      const codeById = new Map(stages.map((st) => [st.stage_id, st.stage_code] as const));

      const rows = await db.select().from(schema.breedLifecycleStages);
      for (const row of rows) {
        if (row.vaccination_protocol || row.medication_protocol) continue;
        const code = codeById.get(row.stage_id);
        const protocol = code ? byStage[code] : undefined;
        if (!protocol) continue;
        await db.update(schema.breedLifecycleStages)
          .set({
            vaccination_protocol: protocol.vaccination.length ? protocol.vaccination : null,
            medication_protocol: protocol.medication.length ? protocol.medication : null,
          })
          .where(eq(schema.breedLifecycleStages.lifecycle_id, row.lifecycle_id));
      }
    });

    /* ── Scope batches and animals to their operational area ──────────────── */
    await run('Link batches & animals to their operational area', async () => {
      // Every area-scoped screen filters on this. batch_header.operational_area_id
      // was never set, so the Batch Transfers list — which filters transfers by
      // the source batch's area — matched nothing and rendered "No animal
      // transfers recorded yet." over a transfer that was really there.
      for (const { c } of perCompany) {
        const [area] = await db.select().from(schema.operationalAreaMaster)
          .where(eq(schema.operationalAreaMaster.company_id, c.company_id)).limit(1);
        if (!area) continue;
        await db.update(schema.batchHeader)
          .set({ operational_area_id: area.area_id })
          .where(and(
            eq(schema.batchHeader.company_id, c.company_id),
            isNull(schema.batchHeader.operational_area_id),
          ));
        await db.update(schema.animalRegister)
          .set({ operational_area_id: area.area_id })
          .where(and(
            eq(schema.animalRegister.company_id, c.company_id),
            isNull(schema.animalRegister.operational_area_id),
          ));
      }
    });

    /* ── Per-stage operational logs (medicine, labour, overheads, weights) ─ */
    await run('Batch operational logs', async () => {
      // The records screen derives each tab from batch_transaction:
      //   medicine  → CONSUMPTION on a medicine item (ML/DOSES or med-ish text)
      //   labour    → OVERHEAD with uom HRS
      //   overheads → OVERHEAD, any other uom
      //   weights   → OBSERVATION in KG mentioning weight
      //   notes     → OBSERVATION, anything else
      // Only feed and mortality were ever seeded, so five of the eight tabs
      // read "0" on every batch and MED COST showed ₹0.
      const onDay = (start: string, day: number) => {
        const d = new Date(`${start}T00:00:00`);
        d.setDate(d.getDate() + day - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      const dayOf = (start: string, date: string) =>
        Math.floor((new Date(`${date}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1;

      for (const { c, items } of perCompany) {
        const batches = await db.select().from(schema.batchHeader).where(eq(schema.batchHeader.company_id, c.company_id));
        const medItem = items.get('MED-IVERMECTIN') || items.get('MED-PENICILLIN') || items.get('MED-TYLOSIN') || items.get('MED-IRON-DEX');

        for (const b of batches) {
          const start = String(b.start_date).slice(0, 10);
          const logs = await db.select().from(schema.batchStageLog).where(eq(schema.batchStageLog.batch_id, b.batch_id));
          const sorted = [...logs].sort((x, y) => String(x.transferred_at).localeCompare(String(y.transferred_at)));

          // Day-of-batch boundaries for each stage the batch occupied.
          const bounds: Array<{ code: string; from: number; to: number }> = [];
          const first = sorted[0]?.from_stage_code || b.current_stage_code;
          let cursorFrom = 1;
          for (const entry of sorted) {
            const at = dayOf(start, String(entry.transferred_at).slice(0, 10));
            bounds.push({ code: bounds.length === 0 ? String(first) : bounds[bounds.length - 1].code, from: cursorFrom, to: at - 1 });
            bounds[bounds.length - 1].code = bounds.length === 1 ? String(first) : bounds[bounds.length - 1].code;
            cursorFrom = at;
          }
          // Rebuild codes cleanly: first leg is where it started, then each to_stage.
          const codes = [String(first), ...sorted.map((e) => e.to_stage_code)];
          const endDay = Math.max(
            cursorFrom + 20,
            dayOf(start, String(b.actual_end_date || b.expected_end_date || onDay(start, cursorFrom + 30)).slice(0, 10))
          );
          const windows = codes.map((code, i) => ({
            code,
            from: i === 0 ? 1 : dayOf(start, String(sorted[i - 1].transferred_at).slice(0, 10)),
            to: i < sorted.length ? dayOf(start, String(sorted[i].transferred_at).slice(0, 10)) - 1 : endDay,
          }));

          const head = Number(b.opening_quantity) || 1;

          for (const w of windows) {
            const span = Math.max(1, w.to - w.from);
            const at = (frac: number) => onDay(start, Math.min(w.to, w.from + Math.round(span * frac)));
            const label = w.code.replace(/_/g, ' ').toLowerCase();

            const rows: Array<{ type: string; item: string | null; qty: number; uom: string; rate: number; date: string; note: string }> = [
              // Clinical detail (dose, route, vet, withdrawal) lives in the remark —
              // this is the format the health register parses back out.
              medItem ? { type: 'CONSUMPTION', item: medItem, qty: head * 2, uom: 'ML', rate: 3.4, date: at(0.2), note: `Ivermectin 1% — Routine strategic deworming during ${label} (${head * 2} ml, Subcutaneous, vet: Dr. A. Menon, withdrawal 28d)` } : null,
              medItem ? { type: 'CONSUMPTION', item: medItem, qty: head, uom: 'ML', rate: 3.4, date: at(0.7), note: `Ivermectin 1% — Follow-up clinical treatment during ${label} (${head} ml, Subcutaneous, vet: Dr. A. Menon, withdrawal 28d)` } : null,
              { type: 'OVERHEAD', item: null, qty: 6, uom: 'HRS', rate: 550, date: at(0.15), note: `Labour — daily stockperson hours, ${label}` },
              { type: 'OVERHEAD', item: null, qty: 4, uom: 'HRS', rate: 550, date: at(0.6), note: `Labour — pen washdown and biosecurity, ${label}` },
              { type: 'OVERHEAD', item: null, qty: 320, uom: 'KWH', rate: 9.2, date: at(0.35), note: `Electricity — ventilation and lighting, ${label}` },
              { type: 'OVERHEAD', item: null, qty: 85, uom: 'LTR', rate: 96, date: at(0.8), note: `Diesel — standby generator and feed cart, ${label}` },
              { type: 'OBSERVATION', item: null, qty: 96.5, uom: 'KG', rate: 0, date: at(0.25), note: `Average body weight sampling — ${label}, 10-head sample` },
              { type: 'OBSERVATION', item: null, qty: 104.2, uom: 'KG', rate: 0, date: at(0.75), note: `Average body weight sampling — ${label}, follow-up` },
              { type: 'OBSERVATION', item: null, qty: 22.4, uom: '°C', rate: 0, date: at(0.4), note: `Barn temperature check — within the 18–28 °C band for ${label}` },
              { type: 'OBSERVATION', item: null, qty: 58, uom: '%', rate: 0, date: at(0.55), note: `Relative humidity reading during ${label}` },
            ].filter(Boolean) as any[];

            for (const r of rows) {
              const [x] = await db.select().from(schema.batchTransaction)
                .where(and(
                  eq(schema.batchTransaction.batch_id, b.batch_id),
                  eq(schema.batchTransaction.transaction_date, r.date),
                  eq(schema.batchTransaction.remarks, r.note),
                )).limit(1);
              if (x) continue;
              await db.insert(schema.batchTransaction).values({
                transaction_id: randomUUID(), batch_id: b.batch_id, transaction_date: r.date,
                transaction_type: r.type, item_id: r.item, quantity: d4(r.qty), uom: r.uom,
                rate: r.rate.toFixed(6), amount: d4(r.qty * r.rate), remarks: r.note, created_by: by,
              });
            }
          }
        }
      }
    });

    /* ── Standard-cost baselines for STANDARD batches ──────────────────── */
    // batch_standard is what BatchService.close() reconciles a STANDARD batch
    // against: actual cost in must equal standard output value out plus the
    // variances it derives, or the close is rejected. That makes the baseline
    // impossible to hand-write against seed data that several sections
    // contribute transactions to — so derive it from the actuals that ended up
    // in the batch, keeping the standards deliberately tighter than reality so
    // the close posts real (unfavourable) price, usage, output and overhead
    // variances rather than a row of zeroes.
    await run('Standard-cost baselines (batch_standard + consumption lines)', async () => {
      const stdBatches = (await db.select().from(schema.batchHeader))
        .filter((b) => b.costing_method === 'STANDARD');

      for (const b of stdBatches) {
        const txns = await db.select().from(schema.batchTransaction)
          .where(eq(schema.batchTransaction.batch_id, b.batch_id));
        const inputs = await db.select().from(schema.batchInputLine)
          .where(eq(schema.batchInputLine.batch_id, b.batch_id));

        const openingQty = Number(b.opening_quantity);
        const endDate = b.actual_end_date ?? b.expected_end_date;
        if (!endDate || openingQty <= 0) continue;
        const durationDays = Math.max(1, Math.round(
          (new Date(endDate).getTime() - new Date(b.start_date).getTime()) / 86_400_000
        ));

        const deaths = txns.filter((t) => t.transaction_type === 'MORTALITY')
          .reduce((sum, t) => sum + Number(t.quantity || 0), 0);
        const closeQty = Math.max(0, openingQty - deaths);
        const inputTotal = inputs.reduce((sum, l) => sum + Number(l.amount || 0), 0);
        const actualOverhead = txns.filter((t) => t.transaction_type === 'OVERHEAD')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

        // Every consumed item needs a standard line — close() treats an
        // unmatched consumption as unreconciled cost and refuses to close.
        const byItem = new Map<string, { qty: number; amount: number }>();
        for (const t of txns) {
          if (t.transaction_type !== 'CONSUMPTION' || !t.item_id) continue;
          const e = byItem.get(t.item_id) ?? { qty: 0, amount: 0 };
          e.qty += Number(t.quantity || 0);
          e.amount += Math.abs(Number(t.amount || 0));
          byItem.set(t.item_id, e);
        }

        const r6 = (n: number) => Number(n.toFixed(6));
        const r8 = (n: number) => Number(n.toFixed(8));

        let stdMaterial = 0;
        const stdLines: Array<{ item_id: string; std_qty_per_unit_per_day: number; std_rate: number }> = [];
        for (const [itemId, actual] of byItem) {
          if (actual.qty <= 0) continue;
          const actualRate = actual.amount / actual.qty;
          // 2% under the rate actually paid and 3% under the quantity actually
          // used: an achievable budget, so both variances land unfavourable.
          const stdRate = r6(actualRate * 0.98);
          const stdQtyPerUnitPerDay = r8((actual.qty * 0.97) / (openingQty * durationDays));
          stdMaterial += stdRate * (stdQtyPerUnitPerDay * openingQty * durationDays);
          stdLines.push({ item_id: itemId, std_qty_per_unit_per_day: stdQtyPerUnitPerDay, std_rate: stdRate });
        }

        const stdOverheadRate = closeQty > 0 ? r6((actualOverhead * 0.95) / closeQty) : 0;
        const stdOutputQty = openingQty; // standard assumes no mortality loss
        // Solved, not guessed: this is the value that makes
        // actual cost = standard output value + variances hold exactly.
        const stdOutputCostPerUnit = r6(
          (inputTotal + stdMaterial + stdOverheadRate * closeQty) / stdOutputQty
        );

        const [existing] = await db.select().from(schema.batchStandard)
          .where(eq(schema.batchStandard.batch_id, b.batch_id)).limit(1);
        const values = {
          std_output_quantity: d4(stdOutputQty),
          std_output_cost_per_unit: stdOutputCostPerUnit.toFixed(6),
          std_overhead_rate_per_unit: stdOverheadRate.toFixed(6),
        };
        if (existing) {
          await db.update(schema.batchStandard).set(values)
            .where(eq(schema.batchStandard.standard_id, existing.standard_id));
        } else {
          await db.insert(schema.batchStandard).values({
            standard_id: randomUUID(), batch_id: b.batch_id, created_by: by, ...values,
          });
        }

        for (const line of stdLines) {
          const [hasLine] = await db.select().from(schema.batchStandardConsumptionLine)
            .where(and(
              eq(schema.batchStandardConsumptionLine.batch_id, b.batch_id),
              eq(schema.batchStandardConsumptionLine.item_id, line.item_id),
            )).limit(1);
          const lineValues = {
            std_qty_per_unit_per_day: line.std_qty_per_unit_per_day.toFixed(8),
            std_rate: line.std_rate.toFixed(6),
          };
          if (hasLine) {
            await db.update(schema.batchStandardConsumptionLine).set(lineValues)
              .where(eq(schema.batchStandardConsumptionLine.line_id, hasLine.line_id));
          } else {
            await db.insert(schema.batchStandardConsumptionLine).values({
              line_id: randomUUID(), batch_id: b.batch_id, item_id: line.item_id, ...lineValues,
            });
          }
        }
      }
    });

    console.log('\n🎉 Master-data gap fill complete.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  void seedDemoGaps().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
