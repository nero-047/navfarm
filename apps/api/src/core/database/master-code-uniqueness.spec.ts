import { getTableName } from 'drizzle-orm';
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
  it('keeps functional SQL expressions unquoted in the reviewed migrations', () => {
    for (const name of ['0067_stale_scorpion.sql', '0068_serious_the_watchers.sql']) {
      const sql = readFileSync(resolve(__dirname, '../../drizzle/tenant', name), 'utf8');
      expect(sql).not.toContain('`(coalesce(');
      expect(sql).toContain("(coalesce(`company_id`, ''))");
    }
  });
});
