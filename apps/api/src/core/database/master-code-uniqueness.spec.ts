import { getTableColumns, getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/mysql-core';
import { MASTER_TABLES } from '../../common/master-data-scope';
import { MASTER_CODE_UNIQUE_KEYS } from './master-code-uniqueness';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('master identity race protection', () => {
  it.each(Object.keys(MASTER_CODE_UNIQUE_KEYS))('%s declares its scoped unique index', (name) => {
    const table = Object.values(MASTER_TABLES).find((entry) => getTableName(entry) === name)!;
    expect(table).toBeDefined();
    const index = getTableConfig(table).indexes.find((entry) => entry.config.name === `uq_${name}_scope_code`);
    expect(index?.config.unique).toBe(true);
  });
  // These four gained a code column while the client's numbering conventions are
  // still outstanding, so the column is nullable. They must carry the same scoped
  // unique index as every other master, but must NOT join MASTER_CODE_UNIQUE_KEYS:
  // its two consumers assume a NOT NULL code and a company_id column.
  it.each([
    ['uom_conversion_master', 'conversion_code'],
    ['gl_mapping_master', 'mapping_code'],
    ['breed_lifecycle_stages', 'lifecycle_code'],
  ])('%s guards its nullable %s without joining the NOT NULL registry', (name, column) => {
    const table = Object.values(MASTER_TABLES).find((entry) => getTableName(entry) === name)!;
    const columns = getTableColumns(table) as Record<string, { notNull: boolean }>;
    expect(columns[column]).toBeDefined();
    expect(columns[column].notNull).toBe(false);
    const index = getTableConfig(table).indexes.find((entry) => entry.config.name === `uq_${name}_scope_code`);
    expect(index?.config.unique).toBe(true);
    expect(MASTER_CODE_UNIQUE_KEYS[name]).toBeUndefined();
  });

  it('keeps functional SQL expressions unquoted in the reviewed migrations', () => {
    for (const name of ['0067_stale_scorpion.sql', '0068_serious_the_watchers.sql', '0069_green_human_robot.sql']) {
      const sql = readFileSync(resolve(__dirname, '../../drizzle/tenant', name), 'utf8');
      expect(sql).not.toContain('`(coalesce(');
      expect(sql).toContain("(coalesce(`company_id`, ''))");
    }
  });
});
