/** Real MySQL/service verification; all writes, audit rows and counters roll back. */
import mysql, { RowDataPacket } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { ClsService } from 'nestjs-cls';
import * as schema from '../core/database/schema';
import { MASTER_CODE_UNIQUE_KEYS } from '../core/database/master-code-uniqueness';
import { ReasonService } from '../modules/master-data/reason/reason.service';
import { NumberSeriesService } from '../modules/system/number-series/number-series.service';
import { AuditLogService } from '../modules/system/audit-log/audit-log.service';
import { NobLobResolutionService } from '../modules/core/operational-area/nob-lob-resolution.service';
import { isDuplicateEntry } from '../common/filters/http-exception.filter';

async function run() {
  if (process.argv.length > 2) throw new Error('This verifier accepts no flags and never commits.');
  const db = await mysql.createConnection({ host: '127.0.0.1', user: 'root', database: 'tenant_devco' });
  try {
    const [companies] = await db.query<RowDataPacket[]>('SELECT tenant_id,company_id,company_code FROM company_master');
    assert.equal(companies.length, 1); assert.equal(companies[0].company_code, 'APEXBREED');
    const { tenant_id: tenant, company_id: company } = companies[0];
    const snapshot = async () => {
      const state: unknown[] = [];
      for (const table of ['reason_master', 'no_series_master', 'audit_log']) state.push((await db.query('SELECT * FROM `' + table + '` ORDER BY 1'))[0]);
      return JSON.stringify(state);
    };
    const before = await snapshot();
    const rollback = new Error('EXPECTED_ROLLBACK');
    const checks: string[] = [];
    const orm = drizzle(db, { schema, mode: 'default' });
    try {
      await orm.transaction(async (tx) => {
        const context = new Map<string, unknown>([['tenantDb', tx]]);
        const cls = { get: (key: string) => context.get(key) } as ClsService;
        const audit = new AuditLogService(cls);
        const numbers = new NumberSeriesService(cls, audit, new NobLobResolutionService(cls));
        const reasons = new ReasonService(cls, audit, numbers);
        for (const kind of ['TENANT', 'COMPANY', 'OPERATIONAL'] as const) {
          const scope = kind === 'TENANT' ? null : company;
          context.set('masterScope', { kind, tenantId: tenant, companyId: scope });
          const dto = { company_id: scope || undefined, reason_name: 'Rollback-only QA reason', category: 'CULL' as const, applicable_stages: ['GILT_REARING'], mandatory_weight: true };
          const automatic = await reasons.create(dto, tenant);
          assert.match(automatic.reason_code, /^RSN-\d{3}$/);
          await assert.rejects(() => reasons.create({ ...dto, reason_code: automatic.reason_code }, tenant), /already exists/);
          const manual = await reasons.create({ ...dto, reason_code: 'QA-' + randomUUID().slice(0, 8) }, tenant);
          assert.match(manual.reason_code, /^QA-/);
          const edited = await reasons.update(manual.reason_id, { reason_name: 'Rollback-only edited reason', mandatory_weight: false }, tenant);
          assert.equal(edited.reason_name, 'Rollback-only edited reason'); assert.equal(edited.mandatory_weight, false);
          assert.equal((await reasons.setActive(manual.reason_id, false, tenant)).is_active, false);
          await assert.rejects(() => reasons.create({ ...dto, reason_code: manual.reason_code }, tenant), /already exists/);
          assert.equal((await reasons.setActive(manual.reason_id, true, tenant)).is_active, true);
          assert((await reasons.findAll({ stageCode: 'GILT_REARING', category: 'CULL', isActive: true }, tenant)).some((r) => r.reason_id === automatic.reason_id));
          assert(!(await reasons.findAll({ stageCode: 'GESTATION' }, tenant)).some((r) => r.reason_id === automatic.reason_id));
          await assert.rejects(() => reasons.create({ ...dto, applicable_stages: ['NONEXISTENT_STAGE'] }, tenant), /Select active stages/);
          if (kind === 'COMPANY') {
            context.set('masterScope', { kind: 'TENANT', tenantId: tenant, companyId: null });
            await assert.rejects(() => reasons.findOne(automatic.reason_id, tenant), /not available/);
          }
          checks.push(`${kind}: automatic/manual create, edit, deactivate, restore, duplicate prevention, category/stage filters`);
        }
        // Attempt real conflicting inserts with fresh UUIDs, including NULL
        // company templates. MySQL must reject the identity, not merely the API.
        for (const table of [...Object.keys(MASTER_CODE_UNIQUE_KEYS), 'reason_master']) {
          const [columns] = await db.query<RowDataPacket[]>('SELECT COLUMN_NAME name,COLUMN_KEY kind FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND EXTRA NOT LIKE ? ORDER BY ORDINAL_POSITION', [table, '%GENERATED%']);
          const primary = columns.find((c) => c.kind === 'PRI')!.name;
          const names = columns.map((c) => '`' + c.name + '`').join(',');
          const selects = columns.map((c) => c.name === primary ? '?' : '`' + c.name + '`').join(',');
          for (const scope of [null, company]) {
            let [row] = await db.query<RowDataPacket[]>('SELECT `' + primary + '` id FROM `' + table + '` WHERE company_id <=> ? LIMIT 1', [scope]);
            if (!row.length) {
              // Empty template catalogs are valid. Copy a DB-only fixture into
              // this transaction, then roll it back with all other test writes.
              const [source] = await db.query<RowDataPacket[]>('SELECT `' + primary + '` id FROM `' + table + '` LIMIT 1');
              assert(source.length, `Missing ${table} test fixture`);
              const id = randomUUID();
              const args: unknown[] = [];
              const seedSelect = columns.map((c) => {
                if (c.name === primary || c.name === 'company_id') { args.push(c.name === primary ? id : scope); return '?'; }
                return '`' + c.name + '`';
              }).join(',');
              await db.execute('INSERT INTO `' + table + '` (' + names + ') SELECT ' + seedSelect + ' FROM `' + table + '` WHERE `' + primary + '`=?', [...args, source[0].id]);
              row = [{ id } as RowDataPacket];
            }
            await assert.rejects(() => db.execute('INSERT INTO `' + table + '` (' + names + ') SELECT ' + selects + ' FROM `' + table + '` WHERE `' + primary + '`=?', [randomUUID(), row[0].id]), isDuplicateEntry);
          }
          checks.push(`${table}: database blocks duplicate company AND tenant-template codes`);
        }
        throw rollback;
      });
    } catch (error) { if (error !== rollback) throw error; }
    assert.equal(await snapshot(), before, 'Verification changed persisted records, counters or audit logs.');
    console.log(JSON.stringify({ checks, rolledBack: true, persistedRecordsCountersAndAuditUnchanged: true }, null, 2));
  } finally { await db.end(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
