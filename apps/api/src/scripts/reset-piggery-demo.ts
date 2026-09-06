/** Explicit local demo reset. A dry run is read-only; --verify performs the
 * complete reset/seed in a transaction and rolls it back. --apply commits.
 * Authentication, organization, area assignments and global taxonomy survive. */
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { and, eq, getTableColumns, getTableName, inArray, sql } from 'drizzle-orm';
import { AnyMySqlTable, getTableConfig } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'node:crypto';
import { statSync } from 'node:fs';
import * as s from '../core/database/schema';
import { MASTER_TABLES } from '../common/master-data-scope';
import { copyCompanyMasterTemplates } from '../modules/core/company/copy-master-templates';
import { SYSTEM_STAGE_SEED, SYSTEM_LOCATION_TYPE_SEED } from '../core/database/system-master-data-seed';

const apply = process.argv.includes('--apply');
const verify = process.argv.includes('--verify');
const backup = process.argv.find((arg) => arg.startsWith('--backup='))?.slice(9);
const rollback = new Error('VERIFICATION_ROLLBACK');
const demo = { demo_seed: true, source: 'piggery-master-presentation-2026-09-05', not_client_production_data: true };
const tables = (Object.values(s) as unknown[]).filter((t): t is AnyMySqlTable => { try { return !!getTableConfig(t as AnyMySqlTable).name; } catch { return false; } });

async function run() {
  if (apply && (!backup || !statSync(backup).isFile() || statSync(backup).size < 10000)) throw new Error('Apply requires a nonempty verified SQL backup.');
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'tenant_devco' });
  const db = drizzle(pool, { schema: s, mode: 'default' });
  const preserved = new Set([s.operationalAreaMaster, s.operationalAreaSettings, s.userOperationalAreaAssignment]);
  const cleared = new Set<AnyMySqlTable>([...Object.values(MASTER_TABLES), s.qcParameterMaster]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const table of tables) if (!cleared.has(table) && !preserved.has(table as any) && getTableConfig(table).foreignKeys.some((fk) => cleared.has(fk.reference().foreignTable))) {
      cleared.add(table); changed = true;
    }
  }
  // No account, company or security table may be reached by the closure.
  if ([...cleared].some((t) => /^(company_|user_|role_|tenant_|operational_area_)/.test(getTableName(t)))) throw new Error('Reset closure reached preserved organization/security data.');
  const before: Record<string, number> = {};
  try {
    const companies = await db.select().from(s.companyMaster);
    if (companies.length !== 2 || !companies.every((c) => ['APEXBREED', 'HIGHLAND'].includes(c.company_code))) throw new Error('Expected exactly the two known local demo companies.');
    const tenant = companies[0].tenant_id;
    if (!companies.every((c) => c.tenant_id === tenant)) throw new Error('Unexpected tenant mixture.');
    const [nob] = await db.select().from(s.nobMaster).where(eq(s.nobMaster.nob_code, 'LIVESTOCK'));
    const [lob] = await db.select().from(s.lobMaster).where(eq(s.lobMaster.lob_code, 'LVS_PIGGERY'));
    if (!nob || !lob) throw new Error('Piggery taxonomy is missing.');
    for (const table of cleared) {
      const [row] = await db.select({ count: sql<number>`count(*)` }).from(table);
      before[getTableName(table)] = Number(row.count);
    }
    console.log(JSON.stringify({ database: 'tenant_devco', mode: apply ? 'APPLY' : verify ? 'VERIFY AND ROLLBACK' : 'DRY RUN', rowsToClear: before }));
    if (!apply && !verify) return;
    await db.transaction(async (tx) => {
      // Break only nullable master links, including the area's optional farm.
      // Foreign-key checks remain enabled throughout; no TRUNCATE or DDL.
      for (const table of tables) {
        const values: Record<string, null> = {};
        for (const fk of getTableConfig(table).foreignKeys) if (cleared.has(fk.reference().foreignTable)) {
          for (const col of fk.reference().columns) if (!col.notNull) values[col.name] = null;
        }
        if (Object.keys(values).length) await tx.update(table).set(values);
      }
      const pending = [...cleared];
      while (pending.length) {
        const index = pending.findIndex((parent) => !pending.some((child) => child !== parent && getTableConfig(child).foreignKeys.some((fk) => fk.reference().foreignTable === parent && fk.reference().columns.some((c) => c.notNull))));
        if (index < 0) throw new Error('Required cyclic dependency prevents a safe reset.');
        await tx.delete(pending.splice(index, 1)[0]);
      }
      await tx.delete(s.auditLog).where(inArray(s.auditLog.entity_name, [...cleared].map(getTableName)));

      const add = async (table: AnyMySqlTable, data: Record<string, any>, company: string | null = null) => {
        const columns = getTableColumns(table);
        const primary = Object.keys(columns).find((k) => columns[k].primary)!;
        const row: Record<string, any> = { [primary]: randomUUID(), ...(columns.tenant_id ? { tenant_id: tenant } : {}), ...data };
        if (columns.company_id) row.company_id = company;
        if (columns.extension_config) row.extension_config = { ...demo, ...data.extension_config };
        for (const key of Object.keys(row)) if (!columns[key]) throw new Error(`Unknown seed field ${getTableName(table)}.${key}`);
        await tx.insert(table).values(row);
        return row[primary] as string;
      };
      const domain = { nob_id: nob.nob_id, lob_id: lob.lob_id };
      for (const [code, name, type, places] of [
        ['KG', 'Kilogram', 'WEIGHT', 3], ['GRAM', 'Gram', 'WEIGHT', 0], ['TONNE', 'Metric Tonne', 'WEIGHT', 3],
        ['HEAD', 'Head (livestock count)', 'COUNT', 0], ['DOSE', 'Dose', 'COUNT', 0], ['BAG', 'Feed Bag', 'COUNT', 0],
        ['LITER', 'Litre', 'VOLUME', 3], ['ML', 'Millilitre', 'VOLUME', 0], ['HOUR', 'Hour', 'TIME', 2], ['SQM', 'Square metre', 'AREA', 2],
      ] as const) await add(s.uomMaster, { uom_code: code, uom_name: name, uom_type: type, decimal_places: places, is_base_uom: ['KG', 'HEAD', 'LITER', 'HOUR', 'SQM'].includes(code) });
      for (const [from, to, factor] of [['GRAM', 'KG', '0.001'], ['TONNE', 'KG', '1000'], ['ML', 'LITER', '0.001']]) await add(s.uomConversionMaster, { from_uom: from, to_uom: to, conversion_factor: factor, effective_from: '2026-01-01' });
      const locationTypes = SYSTEM_LOCATION_TYPE_SEED.filter((t) => t.type_code !== 'CAGE');
      for (const row of locationTypes) await add(s.locationTypeMaster, { ...row, is_system: false });
      for (const code of ['RAW_MATERIAL', 'FEED', 'MEDICINE', 'VACCINE', 'LIVING_ASSET', 'FINISHED_GOOD', 'CONSUMABLE']) await add(s.itemTypeMaster, { type_code: code, type_name: code.replaceAll('_', ' '), code_prefix: code });
      const categories: Record<string, string> = {};
      for (const [code, name] of [['FEED', 'Pig Feed'], ['RAW', 'Feed Ingredients'], ['HEALTH', 'Animal Health'], ['LIVESTOCK', 'Pigs'], ['OUTPUT', 'Piggery Outputs']]) categories[code] = await add(s.itemCategoryMaster, { category_code: code, category_name: name });
      const species = await add(s.speciesMaster, { species_code: 'PIG', species_name: 'Domestic Pig' });
      const accountIds: Record<string, string> = {};
      for (const [code, name, type] of [
        ['1000', 'Bank', 'ASSET'], ['1100', 'Feed and Medicine Inventory', 'ASSET'], ['1200', 'Production Work in Progress', 'ASSET'],
        ['1300', 'Breeding Biological Assets', 'ASSET'], ['2100', 'Trade Payables', 'LIABILITY'], ['3000', 'Opening Equity', 'EQUITY'],
        ['4000', 'Piggery Sales', 'INCOME'], ['5000', 'Feed and Animal Health Expense', 'EXPENSE'], ['5100', 'Farm Labour Expense', 'EXPENSE'],
        ['5200', 'Mortality Loss', 'EXPENSE'], ['5300', 'Depreciation and Amortisation', 'EXPENSE'], ['5400', 'Production Variances', 'EXPENSE'],
      ]) accountIds[code] = await add(s.glAccountMaster, { account_code: code, account_name: name, account_type: type });
      for (const [code, name] of [['BREEDING', 'Breeding and Gestation'], ['FARROWING', 'Farrowing and Nursery'], ['GROWOUT', 'Grow-out'], ['FEEDMILL', 'Feed Mill']]) await add(s.costCenterMaster, { cost_center_code: code, cost_center_name: name, cost_center_type: 'DEPARTMENT' });
      // ANIMAL_PIGGERY must match the Animal Register template's format exactly
      // (PIG-YYYY-SEQ, per system-master-data-seed.ts's SYSTEM_NO_SERIES_SEED) —
      // every other series here is a plain PREFIX-NNN with no date segment.
      for (const [code, prefix] of [['ITEM', 'ITM'], ['SUPPLIER', 'SUP'], ['CUSTOMER', 'CUS'], ['RESOURCE', 'RES'], ['BREED', 'BRD'], ['DISEASE', 'DIS'], ['FEED_FORMULA', 'FORM'], ['BATCH', 'BATCH'], ['ANIMAL_PIGGERY', 'PIG'], ...locationTypes.map((t) => [`LOCATION_${t.type_code}`, t.code_prefix])]) await add(s.noSeriesMaster, { series_code: code, series_name: `${code.replaceAll('_', ' ')} numbering`, document_type: code.startsWith('LOCATION_') ? 'LOCATION' : code === 'ANIMAL_PIGGERY' ? 'ANIMAL' : code, prefix, date_format: code === 'ANIMAL_PIGGERY' ? 'YYYY' : null, separator: '-', seq_length: code === 'ANIMAL_PIGGERY' ? 4 : 3, reset_frequency: 'NEVER', allow_manual: true, ...domain });
      const items: Record<string, string> = {};
      const itemRows = [
        ['MAIZE', 'Maize grain', 'RAW_MATERIAL', 'RAW', 'KG', '24'], ['SOYMEAL', 'Soybean meal', 'RAW_MATERIAL', 'RAW', 'KG', '42'], ['PREMIX', 'Pig feed mineral premix', 'RAW_MATERIAL', 'RAW', 'KG', '95'],
        ['FEED_GEST', 'Sow gestation feed', 'FEED', 'FEED', 'KG', '28'], ['FEED_LACT', 'Sow lactation feed', 'FEED', 'FEED', 'KG', '32'], ['FEED_START', 'Piglet starter feed', 'FEED', 'FEED', 'KG', '38'], ['FEED_GROW', 'Grower-finisher feed', 'FEED', 'FEED', 'KG', '29'],
        ['IRON', 'Piglet iron supplement', 'MEDICINE', 'HEALTH', 'ML', '3'], ['DEWORM', 'Swine dewormer', 'MEDICINE', 'HEALTH', 'ML', '4'], ['VACCINE', 'Swine vaccine (demo reference)', 'VACCINE', 'HEALTH', 'DOSE', '65'],
        ['GILT', 'Replacement gilt', 'LIVING_ASSET', 'LIVESTOCK', 'HEAD', '0'], ['SOW', 'Breeding sow', 'LIVING_ASSET', 'LIVESTOCK', 'HEAD', '0'], ['BOAR', 'Breeding boar', 'LIVING_ASSET', 'LIVESTOCK', 'HEAD', '0'], ['PIGLET', 'Weaned piglet', 'LIVING_ASSET', 'LIVESTOCK', 'HEAD', '0'],
        ['MARKET_PIG', 'Market hog', 'FINISHED_GOOD', 'OUTPUT', 'HEAD', '0'], ['SEMEN', 'Boar semen dose', 'FINISHED_GOOD', 'OUTPUT', 'DOSE', '0'],
      ];
      for (const [code, name, type, category, unit, cost] of itemRows) items[code] = await add(s.itemMaster, {
        item_code: code, item_name: name, item_type: type, category_id: categories[category],
        uom_primary: unit, valuation_method: type === 'LIVING_ASSET' ? 'BIO_ASSET' : 'FIFO',
        is_biological_asset: type === 'LIVING_ASSET',
        // Zero is a software-test placeholder, never a verified product withdrawal period.
        ...(['MEDICINE', 'VACCINE'].includes(type) ? { withdrawal_days: 0, extension_config: { warning: 'Demo only: replace withdrawal period with the licensed product label before live use.' } } : {}),
        standard_cost: cost, inventory_gl_account: accountIds[type === 'LIVING_ASSET' ? '1300' : '1100'],
        cogs_gl_account: accountIds['5000'], ...domain,
      });
      const protein = await add(s.itemAttributeMaster, { attribute_code: 'CRUDE_PROTEIN', attribute_name: 'Crude Protein (%)', data_type: 'NUMBER', unit: '%' });
      await add(s.itemAttributeValues, { item_id: items.FEED_GEST, attribute_id: protein, attribute_value: '14' });
      const stageIds: Record<string, string> = {};
      for (const definition of SYSTEM_STAGE_SEED) {
        const { next_stage_code, alt_next_stage_code, ...row } = definition;
        if (row.stage_code === 'QUARANTINE') { row.typical_duration_days = 28; row.auto_move_on_day = 28; }
        stageIds[row.stage_code] = await add(s.stageMaster, { ...row, ...domain });
      }
      for (const row of SYSTEM_STAGE_SEED) await tx.update(s.stageMaster).set({ next_stage_id: row.next_stage_code ? stageIds[row.next_stage_code] : null, alt_next_stage_id: row.alt_next_stage_code ? stageIds[row.alt_next_stage_code] : null }).where(eq(s.stageMaster.stage_id, stageIds[row.stage_code]));
      for (const [code, name] of [['LARGE_WHITE', 'Large White'], ['LANDRACE', 'Landrace'], ['DUROC', 'Duroc'], ['YORKSHIRE', 'Yorkshire']]) {
        const breed = await add(s.breedMaster, { breed_code: code, breed_name: name, species_id: species, species: 'PIG', breed_type: 'MEAT', gestation_days: 116, lactation_days: 28, productive_life_months: 36, avg_litter_size_born: '11.5', avg_litter_size_weaned: '10', avg_weaning_weight_kg: '7', farrowing_rate_pct: '85', avg_fcr: '2.8', ...domain });
        for (const [stage, feed, days, qty, weight] of [['GESTATION', 'FEED_GEST', 116, '2.5', '180'], ['LACTATION', 'FEED_LACT', 28, '5', '170']] as const) await add(s.breedLifecycleStages, { breed_id: breed, stage_id: stageIds[stage], calc_unit: 'DAY', period_from: 1, period_to: days, feed_item_id: items[feed], feed_qty_per_head_per_day_kg: qty, std_body_weight_kg: weight, season_type: 'ALL', notes: 'Demo benchmark for software testing; confirm farm-specific standards before live use.' });
      }
      for (const [code, name] of [['ASF', 'African swine fever'], ['PRRS', 'Porcine reproductive and respiratory syndrome'], ['SCOUR', 'Piglet diarrhoea']]) await add(s.diseaseMaster, { disease_code: code, disease_name: name, treatment_guideline: 'Demo reference only. Follow the farm veterinarian’s approved protocol.' });
      const formula = await add(s.feedFormulaMaster, { formula_code: 'GESTATION_MIX', formula_name: 'Gestation feed demo recipe', target_item_id: items.FEED_GEST, batch_size: '1000', batch_unit: 'KG', description: 'Illustrative software-test BOM, not an approved animal ration.' });
      for (const [code, qty] of [['MAIZE', 700], ['SOYMEAL', 250], ['PREMIX', 50]] as const) await add(s.feedFormulaIngredients, { formula_id: formula, item_id: items[code], quantity: String(qty), unit: 'KG', inclusion_pct: String(qty / 10) });
      for (const [code, name] of [['SUP-001', 'Demo Grain and Feed Supply'], ['SUP-002', 'Demo Swine Health Supply'], ['SUP-003', 'Demo Farm Equipment Services']]) await add(s.supplierMaster, { supplier_code: code, supplier_name: name, email: `${code.toLowerCase()}@example.invalid` });
      await add(s.customerMaster, { customer_code: 'CUS-001', customer_name: 'Demo Pork Processing Buyer', mobile: 'DEMO-NOT-CONTACTABLE', email: 'buyer@example.invalid' });
      for (const [code, name, type, rate] of [['RES-001', 'Farm attendant', 'MANPOWER', '150'], ['RES-002', 'Veterinary service', 'MANPOWER', '500'], ['RES-003', 'Feed mixer', 'EQUIPMENT', '250'], ['RES-004', 'Farm utility supply', 'UTILITY', '100']]) await add(s.resourceMaster, { resource_code: code, resource_name: name, resource_type: type, unit: 'HOUR', cost_rate: rate, gl_cost_account: accountIds['5100'], ...domain });
      for (const [event, debit, credit] of [['PURCHASE', '1100', '2100'], ['CONSUMPTION', '5000', '1100'], ['BATCH_INPUT', '1200', '1100'], ['BATCH_CONSUMPTION', '1200', '1100'], ['BATCH_OUTPUT', '1100', '1200'], ['MORTALITY', '5200', '1200'], ['OVERHEAD', '1200', '2100'], ['BIO_ACQUISITION', '1300', '2100'], ['BIO_AMORTIZATION', '5300', '1300']]) await add(s.glMappingMaster, { transaction_type: event, debit_gl_account_id: accountIds[debit], credit_gl_account_id: accountIds[credit], ...domain });

      for (const company of companies) {
        const cid = company.company_id;
        await copyCompanyMasterTemplates(tx, tenant, cid);
        // Copied manual fixture codes already occupy these counter suffixes.
        for (const [code, count] of [['SUPPLIER', 3], ['CUSTOMER', 1], ['RESOURCE', 4], ['LOCATION_FARM', 1]] as const) await tx.update(s.noSeriesMaster).set({ current_seq: count }).where(and(eq(s.noSeriesMaster.company_id, cid), eq(s.noSeriesMaster.series_code, code)));
        const farm = await add(s.farmMaster, { farm_code: 'FARM-001', farm_name: `${company.company_code} Demo Piggery Farm`, farm_type: 'LIVESTOCK', capacity: 200, ...domain }, cid);
        await add(s.locationMaster, { location_id: farm, location_code: 'FARM-001', location_name: `${company.company_code} Demo Piggery Farm`, location_type: 'FARM', location_level: 1, farm_id: farm, location_address: 'Demo farm campus — replace before production', max_capacity: '200', capacity_uom: 'HEAD', ...domain }, cid);
        const sheds: string[] = [];
        for (const [index, name] of ['Breeding and Gestation House', 'Farrowing and Nursery House', 'Grow-out House'].entries()) {
          const code = `FARM-001/SHED-00${index + 1}`;
          const shed = await add(s.shedMaster, { farm_id: farm, shed_code: code, shed_name: name, shed_type: index === 0 ? 'GESTATION' : index === 1 ? 'FARROWING' : 'GROWER', capacity: 60, ...domain }, cid);
          sheds.push(shed);
          await add(s.locationMaster, { location_id: shed, location_code: code, location_name: name, location_type: 'SHED', location_level: 2, parent_location_id: farm, farm_id: farm, shed_id: shed, max_capacity: '60', capacity_uom: 'HEAD', location_address: 'Demo farm campus', ...domain }, cid);
          for (let pen = 1; pen <= 2; pen++) await add(s.locationMaster, { location_code: `${code}/PEN-00${pen}`, location_name: `${name} — Pen ${pen}`, location_type: 'PEN', location_level: 3, parent_location_id: shed, farm_id: farm, shed_id: shed, max_capacity: '30', capacity_uom: 'HEAD', location_address: 'Demo farm campus', downtime_days_required: 14, ...domain }, cid);
        }
        for (const type of ['STORE', 'SILO']) {
          const code = `FARM-001/${type}-001`;
          const warehouse = await add(s.warehouseMaster, { warehouse_code: code, warehouse_name: type === 'STORE' ? 'Feed and Health Store' : 'Bulk Feed Silo', warehouse_type: type, farm_id: farm }, cid);
          await add(s.locationMaster, { location_id: warehouse, location_code: code, location_name: type === 'STORE' ? 'Feed and Health Store' : 'Bulk Feed Silo', location_type: type, storage_type: type, location_level: 2, parent_location_id: farm, farm_id: farm, warehouse_id: warehouse, max_capacity: '5000', capacity_uom: 'KG', location_address: 'Demo farm campus', ...(type === 'SILO' ? { silo_capacity_kg: '5000', silo_reorder_days: 3 } : {}), ...domain }, cid);
        }
        await tx.update(s.operationalAreaMaster).set({ farm_id: farm }).where(eq(s.operationalAreaMaster.company_id, cid));
        const [feed] = await tx.select().from(s.itemMaster).where(and(eq(s.itemMaster.company_id, cid), eq(s.itemMaster.item_code, 'FEED_GEST')));
        await add(s.parameterMaster, { parameter_code: 'FEED_DAILY', parameter_name: 'Daily gestation feed', parameter_type: 'CONSUMPTION', item_id: feed.item_id, default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: '2.5', ...domain }, cid);
        await add(s.parameterMaster, { parameter_code: 'BODY_WEIGHT', parameter_name: 'Live body weight', parameter_type: 'OBSERVATION', default_uom: 'KG', qty_method: 'MANUAL_AT_ENTRY', ...domain }, cid);
        await add(s.qcParameterMaster, { param_code: 'FEED_MOISTURE', param_name: 'Feed moisture demo check', param_type: 'NUMERIC', uom: '%', min_value: '0', max_value: '13', lob_id: lob.lob_id, pass_criteria: 'Illustrative test threshold; confirm approved QC specification.' }, cid);
        console.log(`Seeded ${company.company_code}: independent masters, 1 farm, 3 houses, 6 pens, store and silo. Transaction history starts empty.`);
      }
      // Check every declared FK, including preserved records, before committing.
      for (const table of tables) for (const fk of getTableConfig(table).foreignKeys) {
        const ref = fk.reference();
        if (!cleared.has(table) && !cleared.has(ref.foreignTable)) continue;
        const child = getTableName(table), parent = getTableName(ref.foreignTable);
        const join = ref.columns.map((c, i) => `c.\`${c.name}\` = p.\`${ref.foreignColumns[i].name}\``).join(' AND ');
        const present = ref.columns.map((c) => `c.\`${c.name}\` IS NOT NULL`).join(' AND ');
        const [rows] = await tx.execute(sql.raw(`SELECT COUNT(*) AS broken FROM \`${child}\` c LEFT JOIN \`${parent}\` p ON ${join} WHERE ${present} AND p.\`${ref.foreignColumns[0].name}\` IS NULL`));
        if (Number((rows as any)[0].broken)) throw new Error(`Broken reference ${child} -> ${parent}`);
      }
      console.log('Foreign-key integrity verified with checks enabled.');
      if (!apply) throw rollback;
    });
    console.log('RESET COMMITTED. Recover the previous dataset from the supplied SQL backup.');
  } catch (error) {
    if (error === rollback) console.log('VERIFIED AND ROLLED BACK: original database unchanged.');
    else throw error;
  } finally { await pool.end(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
