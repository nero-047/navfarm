/** Approved local demo numbering additions only. Default is read-only;
 * --verify inserts and rolls back; --apply commits. Existing rows, counters,
 * codes and inactive/deleted configurations are never overwritten. */
import mysql, { RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

const definitions = [
  ['UOM', 'UOM', 'Unit of Measure Code'],
  ['STAGE', 'STG', 'Stage Code'],
  ['ITEM_TYPE', 'ITYPE', 'Item Type Code'],
  ['ITEM_CATEGORY', 'CAT', 'Item Category Code'],
  ['SPECIES', 'SPC', 'Species Code'],
  ['LOCATION_TYPE', 'LTYPE', 'Location Type Code'],
  ['ITEM_ATTRIBUTE', 'ATTR', 'Item Attribute Code'],
  ['GL_ACCOUNT', 'GL', 'GL Account Code (reserved; BC-owned catalog)'],
  ['COST_CENTER', 'CC', 'Cost Center Code'],
  // The three join masters. Each already had a company-scoped series row and no
  // tenant-scoped one, while every series above has both — and resolveSeriesFor
  // matches scope exactly (companyCondition: eq when a company is given, IS NULL
  // when not). So a conversion or mapping created at tenant scope found no
  // series and stored a NULL code, while the form said "Follow number series"
  // and promised a code allocated on save. Every row in both tables carried a
  // NULL code as a result: uom_conversion 7 of 7, gl_mapping 18 of 18.
  ['UOM_CONVERSION', 'CONV', 'UOM Conversion Code'],
  ['GL_MAPPING', 'GLMAP', 'GL Mapping Code'],
  ['BREED_LIFECYCLE_STAGE', 'BLS', 'Breed Lifecycle Stage Code'],
] as const;

async function run() {
  const apply = process.argv.includes('--apply');
  const verify = process.argv.includes('--verify');
  if (process.argv.slice(2).some((arg) => !['--apply', '--verify'].includes(arg)) || (apply && verify)) {
    throw new Error('Use no flags (read-only), --verify, or --apply.');
  }
  const db = await mysql.createConnection({ host: '127.0.0.1', user: 'root', database: 'tenant_devco' });
  try {
    const [[lock]] = await db.query<RowDataPacket[]>("SELECT GET_LOCK('navfarm-demo-master-series', 5) acquired");
    if (Number(lock.acquired) !== 1) throw new Error('Another numbering configuration run is active.');
    await db.beginTransaction();
    const [companies] = await db.query<RowDataPacket[]>('SELECT tenant_id,company_id,company_code FROM company_master');
    if (companies.length !== 1 || companies[0].company_code !== 'APEXBREED') throw new Error('Expected only the approved Apex demo company.');
    const { tenant_id: tenantId, company_id: companyId } = companies[0];
    const [before] = await db.query<RowDataPacket[]>('SELECT * FROM no_series_master ORDER BY series_id');
    const additions: Array<{ scope: string; series: string; prefix: string }> = [];
    const preserved: Array<{ scope: string; series: string }> = [];
    for (const scope of [null, companyId]) {
      for (const [series, prefix, name] of definitions) {
        const existing = before.filter((row) => row.tenant_id === tenantId && row.company_id === scope && row.series_code === series);
        if (existing.length > 1) throw new Error(`Duplicate series configuration: ${scope || 'TENANT'}/${series}`);
        if (existing.length) { preserved.push({ scope: scope || 'TENANT', series }); continue; }
        additions.push({ scope: scope || 'TENANT', series, prefix });
        if (apply || verify) await db.execute(
          'INSERT INTO no_series_master (series_id,tenant_id,company_id,series_code,series_name,document_type,prefix,`separator`,seq_length,current_seq,reset_frequency,allow_manual,is_active,extension_config) VALUES (?,?,?,?,?,?,?,\'-\',3,0,\'NEVER\',1,1,?)',
          [randomUUID(), tenantId, scope, series, name, series, prefix, JSON.stringify({ source: 'user-approved-demo-prefixes-2026-09-06', reserved_bc_owned: series === 'GL_ACCOUNT' })],
        );
      }
    }
    const [after] = await db.query<RowDataPacket[]>('SELECT * FROM no_series_master ORDER BY series_id');
    for (const old of before) {
      if (JSON.stringify(after.find((row) => row.series_id === old.series_id)) !== JSON.stringify(old)) throw new Error('An existing series changed; rolling back.');
    }
    if (after.length !== before.length + ((apply || verify) ? additions.length : 0)) throw new Error('Unexpected series count; rolling back.');
    console.log(JSON.stringify({ database: 'tenant_devco', mode: apply ? 'APPLY' : verify ? 'VERIFY' : 'READ ONLY', additions, preserved, existingSeriesUnchanged: before.length }, null, 2));
    if (apply) { await db.commit(); console.log('Committed only missing series. No master records or existing counters changed.'); }
    else { await db.rollback(); console.log('No changes committed.'); }
  } catch (error) { await db.rollback(); throw error; }
  finally { await db.end(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
