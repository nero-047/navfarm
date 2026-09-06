/** Repair only the orphaned child rows left by the authorized Highland demo
 * deletion. Defaults to read-only; --verify rolls back; --apply requires backup. */
import mysql, { RowDataPacket } from 'mysql2/promise';
import { statSync } from 'node:fs';

const targets: Record<string, Array<[string, string, string]>> = {
  breed_lifecycle_stages: [['breed_id', 'breed_master', 'breed_id'], ['feed_item_id', 'item_master', 'item_id'], ['stage_id', 'stage_master', 'stage_id']],
  item_attribute_values: [['attribute_id', 'item_attribute_master', 'attribute_id'], ['item_id', 'item_master', 'item_id']],
  role_permissions: [['role_id', 'role_master', 'role_id']],
  user_notification_pref: [['user_id', 'user_master', 'user_id']],
  user_role_assignment: [['role_id', 'role_master', 'role_id'], ['user_id', 'user_master', 'user_id']],
  user_session: [['user_id', 'user_master', 'user_id']],
};
const quote = (name: string) => '`' + name.replaceAll('`', '``') + '`';

async function run() {
  const apply = process.argv.includes('--apply');
  const verify = process.argv.includes('--verify');
  const backup = process.argv.find((arg) => arg.startsWith('--backup='))?.slice(9);
  if (apply && (!backup || !statSync(backup).isFile() || statSync(backup).size < 10000)) throw new Error('A nonempty SQL recovery backup is required.');
  const db = await mysql.createConnection({ host: '127.0.0.1', user: 'root', database: 'tenant_devco' });
  try {
    const [companies] = await db.query<RowDataPacket[]>('SELECT company_code FROM company_master');
    if (companies.length !== 1 || companies[0].company_code !== 'APEXBREED') throw new Error('Expected only the remaining Apex demo company.');
    await db.beginTransaction();
    const counts: Record<string, number> = {};
    for (const [table, refs] of Object.entries(targets)) {
      const predicate = refs.map(([column, parent, key]) => `c.${quote(column)} IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ${quote(parent)} p WHERE p.${quote(key)}=c.${quote(column)})`).map((p) => `(${p})`).join(' OR ');
      const [[row]] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) n FROM ${quote(table)} c WHERE ${predicate}`);
      counts[table] = Number(row.n);
      if (apply || verify) await db.query(`DELETE c FROM ${quote(table)} c WHERE ${predicate}`);
    }
    console.log(JSON.stringify({ database: 'tenant_devco', mode: apply ? 'APPLY' : verify ? 'VERIFY' : 'READ ONLY', orphanRows: counts }));
    if (apply || verify) {
      const [refs] = await db.query<RowDataPacket[]>("SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='tenant_devco' AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION");
      const groups = new Map<string, RowDataPacket[]>();
      for (const ref of refs) {
        const key = `${ref.TABLE_NAME}:${ref.CONSTRAINT_NAME}`;
        groups.set(key, [...(groups.get(key) || []), ref]);
      }
      for (const columns of groups.values()) {
        const ref = columns[0];
        const join = columns.map((c) => `c.${quote(c.COLUMN_NAME)}=p.${quote(c.REFERENCED_COLUMN_NAME)}`).join(' AND ');
        const present = columns.map((c) => `c.${quote(c.COLUMN_NAME)} IS NOT NULL`).join(' AND ');
        const [[row]] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) n FROM ${quote(ref.TABLE_NAME)} c LEFT JOIN ${quote(ref.REFERENCED_TABLE_NAME)} p ON ${join} WHERE ${present} AND p.${quote(ref.REFERENCED_COLUMN_NAME)} IS NULL`);
        if (Number(row.n)) throw new Error(`Unresolved orphan: ${ref.TABLE_NAME} -> ${ref.REFERENCED_TABLE_NAME}; no changes committed.`);
      }
      console.log(`Verified ${groups.size} foreign-key relationships; checks stayed enabled.`);
    }
    if (apply) { await db.commit(); console.log('Orphan repair committed. Existing Apex and tenant records preserved.'); }
    else { await db.rollback(); console.log('No changes committed.'); }
  } catch (error) { await db.rollback(); throw error; }
  finally { await db.end(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
