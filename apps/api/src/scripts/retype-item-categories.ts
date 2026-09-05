/**
 * Retypes the 7 Apex demo items whose item_type/category currently hold
 * CATEGORY-shaped values (FEED / MEDICINE / VACCINE) instead of the client's
 * intended taxonomy: item_type like CONSUMABLE, category like Feed/Medicine,
 * sub_category like the feed type or Vaccine. See item-8-report.md for the
 * two open calls this mapping makes that the user has not yet confirmed:
 *   1. Vaccine becomes a SUB-category of Medicine, not its own category.
 *   2. All seven become CONSUMABLE, even though raw maize/soya stay
 *      RAW_MATERIAL elsewhere — this script does not touch those.
 *
 * DRY RUN BY DEFAULT. Prints every row it would change, old value -> new
 * value, including any category rows it would create. Pass --apply to
 * actually write (inside a transaction, scoped to the Apex company only).
 *
 * Targets the local dev tenant (tenant_devco) / APEXBREED company only —
 * this is demo/dev data, not a generic migration.
 */
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

const DB_HOST = process.env.DATABASE_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DATABASE_PORT || 3306);
const DB_USER = process.env.DATABASE_USERNAME || 'root';
const DB_PASSWORD = process.env.DATABASE_PASSWORD || '';
const TENANT_DB = process.env.RETYPE_TENANT_DB || 'tenant_devco';
const COMPANY_CODE = 'APEXBREED';

type ItemPlan = {
  item_code: string;
  target_item_type: string;
  target_category_key: 'FEED' | 'MEDICINE';
  target_sub_category_name: string | null;
};

const ITEM_PLANS: ItemPlan[] = [
  { item_code: 'FEED_START', target_item_type: 'CONSUMABLE', target_category_key: 'FEED', target_sub_category_name: 'Starter' },
  { item_code: 'FEED_GROW', target_item_type: 'CONSUMABLE', target_category_key: 'FEED', target_sub_category_name: 'Grower-Finisher' },
  { item_code: 'FEED_GEST', target_item_type: 'CONSUMABLE', target_category_key: 'FEED', target_sub_category_name: 'Gestation' },
  { item_code: 'FEED_LACT', target_item_type: 'CONSUMABLE', target_category_key: 'FEED', target_sub_category_name: 'Lactation' },
  { item_code: 'DEWORM', target_item_type: 'CONSUMABLE', target_category_key: 'MEDICINE', target_sub_category_name: null },
  { item_code: 'IRON', target_item_type: 'CONSUMABLE', target_category_key: 'MEDICINE', target_sub_category_name: null },
  { item_code: 'VACCINE', target_item_type: 'CONSUMABLE', target_category_key: 'MEDICINE', target_sub_category_name: 'Vaccine' },
];

// Sub-category name -> the category_code this script assigns it when it has
// to create the row (dry run only prints this; --apply generates it inside
// the transaction so it can reference the real parent id).
const SUB_CATEGORY_CODE: Record<string, string> = {
  Starter: 'FEED-STARTER',
  'Grower-Finisher': 'FEED-GROWFIN',
  Gestation: 'FEED-GESTATION',
  Lactation: 'FEED-LACTATION',
  Vaccine: 'MED-VACCINE',
};

interface CategoryRow extends mysql.RowDataPacket {
  category_id: string;
  category_code: string;
  category_name: string;
  parent_category_id: string | null;
  item_type: string | null;
  company_id: string | null;
}

interface ItemRow extends mysql.RowDataPacket {
  item_id: string;
  item_code: string;
  item_name: string;
  item_type: string;
  category_id: string | null;
  category: string | null;
  sub_category: string | null;
  company_id: string | null;
}

async function run() {
  const apply = process.argv.includes('--apply');
  const connection = await mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: TENANT_DB });

  try {
    await connection.beginTransaction();

    const [companies] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT company_id FROM company_master WHERE company_code = ?',
      [COMPANY_CODE],
    );
    if (companies.length !== 1) throw new Error(`Expected exactly one '${COMPANY_CODE}' company in ${TENANT_DB}.`);
    const companyId: string = companies[0].company_id;
    console.log(`Company: ${COMPANY_CODE} (${companyId}) in ${TENANT_DB}\n`);

    const [items] = await connection.query<ItemRow[]>(
      'SELECT item_id, item_code, item_name, item_type, category_id, category, sub_category, company_id FROM item_master WHERE company_id = ? AND item_code IN (?)',
      [companyId, ITEM_PLANS.map((p) => p.item_code)],
    );
    if (items.length !== ITEM_PLANS.length) {
      throw new Error(`Expected all ${ITEM_PLANS.length} Apex demo items; found ${items.length}.`);
    }
    const itemByCode = new Map(items.map((row) => [row.item_code, row]));

    // Resolve (or plan to create) the two top-level categories. "Feed" reuses
    // the existing FEED/"Pig Feed" category already referenced by these items
    // — renaming it isn't requested, so category_name is left alone and only
    // item_type is (re)assigned. "Medicine" does not exist anywhere in this
    // tenant (verified: no category named Medicine, Apex-scoped or global) so
    // it must be created new — this is one of the two unconfirmed calls.
    const [feedRows] = await connection.query<CategoryRow[]>(
      "SELECT * FROM item_category_master WHERE company_id = ? AND category_code = 'FEED' AND deleted_at IS NULL LIMIT 1",
      [companyId],
    );
    if (feedRows.length !== 1) throw new Error("Expected an existing 'FEED' category for Apex to reuse as the Feed category.");
    const feedCategory = feedRows[0];

    const [medicineRows] = await connection.query<CategoryRow[]>(
      "SELECT * FROM item_category_master WHERE company_id = ? AND category_name = 'Medicine' AND deleted_at IS NULL LIMIT 1",
      [companyId],
    );
    const existingMedicineCategory = medicineRows[0] as CategoryRow | undefined;

    console.log('── Category changes ──────────────────────────────────────');
    console.log(
      `[UPDATE] category '${feedCategory.category_code}' / '${feedCategory.category_name}' (${feedCategory.category_id}): ` +
      `item_type ${JSON.stringify(feedCategory.item_type)} -> "CONSUMABLE"  (reused as the Feed category, name unchanged)`,
    );

    let medicineCategoryId: string;
    if (existingMedicineCategory) {
      medicineCategoryId = existingMedicineCategory.category_id;
      console.log(
        `[UPDATE] category '${existingMedicineCategory.category_code}' / '${existingMedicineCategory.category_name}' (${medicineCategoryId}): ` +
        `item_type ${JSON.stringify(existingMedicineCategory.item_type)} -> "CONSUMABLE"`,
      );
    } else {
      medicineCategoryId = randomUUID();
      console.log(
        `[CREATE] category 'MEDICINE' / 'Medicine' (${medicineCategoryId}): item_type=CONSUMABLE, parent=none, company=${COMPANY_CODE}`,
      );
    }

    // Sub-categories: children of Feed (Starter/Grower-Finisher/Gestation/Lactation)
    // and one child of Medicine (Vaccine). Search for an existing child with a
    // matching name before assuming a create is needed.
    const subCategoryIds = new Map<string, string>(); // name -> category_id (existing or newly planned)
    const neededSubNames = Array.from(new Set(ITEM_PLANS.map((p) => p.target_sub_category_name).filter((n): n is string => !!n)));
    for (const name of neededSubNames) {
      const parentId = name === 'Vaccine' ? medicineCategoryId : feedCategory.category_id;
      const parentLabel = name === 'Vaccine' ? 'Medicine' : `'${feedCategory.category_code}'`;
      let existingChild: CategoryRow | undefined;
      if (name !== 'Vaccine' || existingMedicineCategory) {
        const [rows] = await connection.query<CategoryRow[]>(
          'SELECT * FROM item_category_master WHERE company_id = ? AND parent_category_id = ? AND category_name = ? AND deleted_at IS NULL LIMIT 1',
          [companyId, parentId, name],
        );
        existingChild = rows[0];
      }
      if (existingChild) {
        subCategoryIds.set(name, existingChild.category_id);
        console.log(`[UPDATE] sub-category '${existingChild.category_code}' / '${name}' (${existingChild.category_id}): item_type -> "CONSUMABLE" (already a child of ${parentLabel})`);
      } else {
        const newId = randomUUID();
        subCategoryIds.set(name, newId);
        console.log(`[CREATE] sub-category '${SUB_CATEGORY_CODE[name]}' / '${name}' (${newId}): parent=${parentLabel}, item_type=CONSUMABLE, company=${COMPANY_CODE}`);
      }
    }

    console.log('\n── Item changes ──────────────────────────────────────────');
    for (const plan of ITEM_PLANS) {
      const row = itemByCode.get(plan.item_code)!;
      const targetCategoryId = plan.target_category_key === 'FEED' ? feedCategory.category_id : medicineCategoryId;
      const targetCategoryLabel = plan.target_category_key === 'FEED' ? feedCategory.category_name : 'Medicine';
      const targetSubCode = plan.target_sub_category_name ? SUB_CATEGORY_CODE[plan.target_sub_category_name] : null;

      console.log(`${row.item_code}  "${row.item_name}"  (${row.item_id})`);
      console.log(`  item_type:    "${row.item_type}" -> "${plan.target_item_type}"`);
      console.log(`  category_id:  ${row.category_id} -> ${targetCategoryId}  ("${row.category}" -> "${targetCategoryLabel}")`);
      console.log(`  sub_category: ${JSON.stringify(row.sub_category)} -> ${targetSubCode ? `"${targetSubCode}"` : 'null (none)'}`);

      if (apply) {
        await connection.query(
          'UPDATE item_master SET item_type = ?, category_id = ?, category = ?, sub_category = ?, updated_at = CURRENT_TIMESTAMP WHERE item_id = ?',
          [plan.target_item_type, targetCategoryId, targetCategoryLabel, targetSubCode, row.item_id],
        );
      }
    }

    if (apply) {
      await connection.query('UPDATE item_category_master SET item_type = ?, updated_at = CURRENT_TIMESTAMP WHERE category_id = ?', ['CONSUMABLE', feedCategory.category_id]);
      if (existingMedicineCategory) {
        await connection.query('UPDATE item_category_master SET item_type = ?, updated_at = CURRENT_TIMESTAMP WHERE category_id = ?', ['CONSUMABLE', medicineCategoryId]);
      } else {
        await connection.query(
          'INSERT INTO item_category_master (category_id, tenant_id, company_id, category_code, category_name, parent_category_id, item_type, is_active, status) ' +
          'SELECT ?, tenant_id, ?, ?, ?, NULL, ?, 1, ?  FROM item_category_master WHERE category_id = ? LIMIT 1',
          [medicineCategoryId, companyId, 'MEDICINE', 'Medicine', 'CONSUMABLE', 'ACTIVE', feedCategory.category_id],
        );
      }
      for (const name of neededSubNames) {
        const id = subCategoryIds.get(name)!;
        const parentId = name === 'Vaccine' ? medicineCategoryId : feedCategory.category_id;
        const [existsRows] = await connection.query<mysql.RowDataPacket[]>('SELECT 1 FROM item_category_master WHERE category_id = ?', [id]);
        if (existsRows.length) {
          await connection.query('UPDATE item_category_master SET item_type = ?, updated_at = CURRENT_TIMESTAMP WHERE category_id = ?', ['CONSUMABLE', id]);
        } else {
          await connection.query(
            'INSERT INTO item_category_master (category_id, tenant_id, company_id, category_code, category_name, parent_category_id, item_type, is_active, status) ' +
            'SELECT ?, tenant_id, ?, ?, ?, ?, ?, 1, ?  FROM item_category_master WHERE category_id = ? LIMIT 1',
            [id, companyId, SUB_CATEGORY_CODE[name], name, parentId, 'CONSUMABLE', 'ACTIVE', feedCategory.category_id],
          );
        }
      }
    }

    if (apply) {
      await connection.commit();
      console.log('\nAPPLIED.');
    } else {
      await connection.rollback();
      console.log('\nDRY RUN: no data changed. Pass --apply to write these changes.');
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
