/** Demo-only, idempotent repair of the existing Apex presentation fixtures.
 * Defaults to dry-run. Preserves IDs and codes so animals/batches keep their
 * references. Never run against client production data. */
import mysql from 'mysql2/promise';
import { existsSync } from 'node:fs';

async function run() {
  const apply = process.argv.includes('--apply');
  const backup = process.argv.find((arg) => arg.startsWith('--backup='))?.slice(9);
  if (apply && (!backup || !existsSync(backup))) throw new Error('Apply requires an existing --backup SQL file.');
  const connection = await mysql.createConnection({ host: '127.0.0.1', user: 'root', database: 'tenant_devco' });
  try {
    await connection.beginTransaction();
    const [companies] = await connection.query<mysql.RowDataPacket[]>("SELECT company_id FROM company_master WHERE company_code = 'APEXBREED'");
    if (companies.length !== 1) throw new Error('Expected exactly one demo Apex company.');
    const company = companies[0].company_id;
    const [areas] = await connection.query<mysql.RowDataPacket[]>("SELECT nob_id, lob_id FROM operational_area_master WHERE company_id = ? AND area_code = 'APEX-BREED-01'", [company]);
    if (areas.length !== 1) throw new Error('Expected the Apex piggery demo area.');
    const { nob_id: nob, lob_id: lob } = areas[0];
    const codes = ['FARM-APEX-01', 'SHED-GEST-01', 'SHED-FARR-02', 'PEN-GEST-A1', 'PEN-AI-B2', 'PEN-BOAR-C1', 'PEN-QUAR-01', 'PEN-FARR-01', 'PEN-WEAN-02'];
    const [locations] = await connection.query<mysql.RowDataPacket[]>('SELECT * FROM location_master WHERE company_id = ? AND location_code IN (?)', [company, codes]);
    if (locations.length !== codes.length) throw new Error('Expected all nine known demo locations, with no duplicate codes.');
    const byId = new Map(locations.map((row) => [row.location_id, row]));
    for (const row of locations) {
      const parentId = row.location_type === 'PEN' ? row.shed_id : row.location_type === 'SHED' ? row.farm_id : null;
      const parent = parentId ? byId.get(parentId) : undefined;
      if (parentId && !parent) throw new Error(`Missing seeded parent for ${row.location_code}.`);
      console.log(`${row.location_code} -> ${parent?.location_code || '(farm root)'}; active; piggery`);
      if (!apply) continue;
      await connection.query("UPDATE location_master SET parent_location_id = ?, is_active = 1, deleted_at = NULL, status = 'ACTIVE', nob_id = ?, lob_id = ?, location_address = COALESCE(location_address, 'Demo farm complex, Karnal, Haryana, India'), updated_at = CURRENT_TIMESTAMP WHERE location_id = ? AND company_id = ?", [parentId, nob, lob, row.location_id, company]);
      if (row.location_type === 'FARM' || row.location_type === 'SHED') {
        const table = row.location_type === 'FARM' ? 'farm_master' : 'shed_master';
        const key = row.location_type === 'FARM' ? 'farm_id' : 'shed_id';
        await connection.query(`UPDATE ${table} SET is_active = 1, deleted_at = NULL, status = 'ACTIVE', nob_id = ?, lob_id = ?, updated_at = CURRENT_TIMESTAMP WHERE ${key} = ? AND company_id = ?`, [nob, lob, row.location_id, company]);
      }
    }
    if (apply) await connection.commit(); else await connection.rollback();
    console.log(apply ? 'APPLIED: nine demo locations repaired; IDs/codes preserved.' : 'DRY RUN: no data changed.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { await connection.end(); }
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; });
